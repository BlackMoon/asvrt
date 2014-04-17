/* *************************************************************
* Слой доступа к базе данных
* ************************************************************** */
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Odbc;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web.Configuration;
using asv.Helpers;
using asv.Security;
using asv.Models;
using PetaPoco.Internal;

namespace asv.Managers
{
    public class DataManager
    {
        public int ConnTimeout = 300;               // 5 мин              
        public long TotalItems;

        public MemberPrincipal Person;

        public DataManager()
        {
            Configuration cfg = WebConfigurationManager.OpenWebConfiguration("~");
            AppSettingsSection ass = cfg.AppSettings;

            string key = "ConnTimeout";
            if (ass.Settings[key] != null)
                ConnTimeout = Misc.GetConfigValue(ass.Settings[key].Value, 50);           
        }
         
        private IDictionary<string, object> DataToExpando(OdbcDataReader reader)
        {
            int i, ix = 0;
            IDictionary<string, object> eo = new Dictionary<string, object>();
            
            Regex rx = new Regex(@"expr(\d+)", RegexOptions.Compiled | RegexOptions.IgnoreCase);
            Group g;
            Match m;            
            
            string key;
            for (i = 0; i < reader.FieldCount; i++)
            {   
                key = reader.GetName(i).ToLower();
                
                m = rx.Match(key);
                if (m.Success)
                {
                    g = m.Groups[1];
                    ix = Math.Max(ix, Convert.ToInt32(g.Value));
                }

                if (eo.ContainsKey(key))                
                    key = "expr" + ++ix;

                eo.Add(key, reader[i]);
            }

            return eo;
        }

        /// <summary>
        /// Возвращает поля таблицы
        /// </summary>
        /// <param name="con">ODBC соединение</param>
        /// <param name="table">Таблица</param>
        /// <param name="schema">Схема</param>
        /// <param name="drv">Драйвер</param>
        /// <param name="needTp">Возвращать тип поля</param>
        /// <returns>Список полей</returns>
        public IEnumerable<Field> GetFields(OdbcConnection con, string table, string schema, eDriverType drv, bool needTp = true)
        {
            OdbcCommand com = new OdbcCommand();
            com.Connection = con;
            com.CommandTimeout = ConnTimeout;
            com.Parameters.AddWithValue("@var", table);            

            string cmdText = null;
            switch (drv)
            {
                case eDriverType.DriverCaché:
                    cmdText = @"SELECT (CASE WHEN p.SqlFieldName = '%%OID' THEN 'ID' ELSE p.SqlFieldName END) name, (CASE WHEN p.Name = '%%OID' THEN 1 ELSE i.primarykey END) pk, 
                                (CASE WHEN p.Type = '%Library.Boolean' THEN 0
                                      WHEN p.Type = '%Library.Date' THEN 1
                                      WHEN p.Type = '%Library.Time' THEN 1
                                      WHEN p.Type = '%Library.TimeStamp' THEN 1
                                      WHEN p.Type = '%Library.BigInt' THEN 2
                                      WHEN p.Type = '%Library.Decimal' THEN 2
                                      WHEN p.Type = '%Library.Double' THEN 2
                                      WHEN p.Type = '%Library.Float' THEN 2
                                      WHEN p.Type = '%Library.Integer' THEN 2
                                      WHEN p.Type = '%Library.Numeric' THEN 2
                                      WHEN p.Type = '%Library.Smallint' THEN 2 
                                      WHEN p.Type = '%Library.TinyInt' THEN 2
                                      ELSE 3                                
                                END) tp 
                                FROM %Dictionary.CompiledProperty p LEFT JOIN %Dictionary.IndexDefinition i ON (i.Parent = p.Parent AND i.Data = p.Name)  
                                WHERE (p.private = 1 OR p.storable = 1) AND p.parent = ? ORDER BY pk DESC, name";
                    break;
                case eDriverType.DriverDB2:
                    cmdText = @"SELECT COLNAME name, (CASE WHEN KEYSEQ = 0 THEN NULL ELSE KEYSEQ END) pk, 
                                (CASE WHEN TYPENAME = 'DATE' THEN 1 
                                      WHEN TYPENAME = 'DATETIME' THEN 1   
                                      WHEN TYPENAME = 'TIMESTAMP' THEN 1 
                                      WHEN TYPENAME = 'BIGINT' THEN 2 
                                      WHEN TYPENAME = 'DECFLOAT' THEN 2 
                                      WHEN TYPENAME = 'DECIMAL' THEN 2 
                                      WHEN TYPENAME = 'DOUBLE' THEN 2                                       
                                      WHEN TYPENAME = 'INT' THEN 2 
                                      WHEN TYPENAME = 'INTEGER' THEN 2 
                                      WHEN TYPENAME = 'NUMERIC' THEN 2 
                                      WHEN TYPENAME = 'REAL' THEN 2                                       
                                      WHEN TYPENAME = 'SMALLINT' THEN 2 
                                      ELSE 3
                                END) tp FROM syscat.columns WHERE tabname = ?";

                    if (!string.IsNullOrEmpty(schema))
                    {
                        cmdText += " AND tabschema = ?";
                        com.Parameters.AddWithValue("@var", schema);
                    }
                    cmdText += " ORDER BY pk, name";

                    break;
            }
            com.CommandText = cmdText;
            
            eNodeType nt;
            OdbcDataReader reader = com.ExecuteReader();
            while (reader.Read())
            {                
                nt = (reader["pk"] == DBNull.Value) ? eNodeType.NodeField : eNodeType.NodePrimaryKey;                
                TableField tf = new TableField(reader["name"], nt);

                if (needTp)
                    tf.Ft = (eFieldType)reader["tp"];

                yield return tf;
            }

            reader.Close();
        }

        public IEnumerable<ForeignKey> GetFKeys(OdbcConnection con, string table, string schema, eDriverType drv)
        {
            OdbcCommand com = new OdbcCommand();
            com.Connection = con;
            com.CommandTimeout = ConnTimeout;
            com.Parameters.AddWithValue("@var", table);            

            string cmdText = null;
            switch (drv)
            {
                case eDriverType.DriverCaché:
                    cmdText = @"SELECT f.Name, c.SqlQualifiedNameQ reftabname, f.ReferencedClass refod, f.Properties fkcolnames, 'ID' pkcolnames, '' refschema FROM %Dictionary.ForeignKeyDefinition f
                        JOIN %Dictionary.CompiledClass c on c.Id = f.ReferencedClass WHERE f.Parent->ID = ?
                        UNION ALL SELECT p.Name, c.SqlQualifiedNameQ reftabname, p.Type refod, p.Name fkcolnames, NVL(p.Inverse, 'ID') pkcolnames, '' refschema FROM %Dictionary.CompiledProperty p
                        JOIN %Dictionary.CompiledClass c on (c.Id = p.Type AND c.ClassType='persistent') WHERE p.Parent->ID = ? AND p.Storable = 1 AND (p.RelationShip = 1 OR NOT p.Type %STARTSWITH '%')";
                    
                    com.Parameters.AddWithValue("@var", table);            

                    break;
                case eDriverType.DriverDB2:
                    cmdText = "SELECT CONSTNAME name, TRIM(FK_COLNAMES) fkcolnames, TRIM(PK_COLNAMES) pkcolnames, REFTABNAME, TRIM(tabschema) refschema, '' refod FROM syscat.references WHERE tabname = ?";

                    if (!string.IsNullOrEmpty(schema))
                    {
                        cmdText += " AND tabschema = ?";
                        com.Parameters.AddWithValue("@var", schema);
                    }
                    cmdText += " ORDER BY constname";

                    break;
            }
            com.CommandText = cmdText;

            OdbcDataReader reader = com.ExecuteReader();

            while (reader.Read())
            {
                ForeignKey fk = new ForeignKey(reader["name"], reader["reftabname"], reader["fkcolnames"], reader["pkcolnames"]);
               
                fk.RefOd = reader["refod"].ToString();               
                fk.RefSchema = reader["refschema"].ToString();

                yield return fk;
            }
            reader.Close();
        }

        private IEnumerable<Field> GetIndexes(OdbcConnection con, string table, string schema, eDriverType drv)
        {
            OdbcCommand com = new OdbcCommand();            
            com.Connection = con;
            com.CommandTimeout = ConnTimeout;
            com.Parameters.AddWithValue("@var", table);

            string cmdText = null;
            switch (drv)
            {
                case eDriverType.DriverCaché:
                    cmdText = "SELECT Name, CAST(PrimaryKey AS INT) pk FROM %Dictionary.IndexDefinition WHERE parent->Id = ? ORDER BY pk DESC";
                    break;
                case eDriverType.DriverDB2:
                    cmdText = "SELECT CONSTNAME name, (CASE WHEN TYPE = 'P' THEN 1 END) pk FROM syscat.tabconst WHERE type IN ('P', 'U') AND tabname = ?";

                    if (!string.IsNullOrEmpty(schema))
                    {
                        cmdText += " AND tabschema = ?";
                        com.Parameters.AddWithValue("@var", schema);
                    }
                    cmdText += " ORDER BY type";

                    break;
            }
            com.CommandText = cmdText;

            OdbcDataReader reader = com.ExecuteReader();
            while (reader.Read())
            {
                Field f = new Field(reader["name"], reader["pk"].Equals(1) ? eNodeType.NodePrimaryKey : eNodeType.NodeField);
                f.Leaf = 1;

                yield return f;
            }

            reader.Close();
        }

        /// <summary>
        /// Возвращает результат запроса
        /// </summary>
        /// <param name="name">Имя соединения</param>
        /// <param name="sql">Текст запроса</param>
        /// <param name="drv">Драйвер соединения</param>
        /// <param name="fromPage">Страница с (если указана -1 выбираются все записи)</param>
        /// <param name="toPage">Страница по</param>
        /// <param name="limit">Записей на странице</param>
        /// <returns>IEnumerable</returns>
        public IEnumerable<dynamic> GetQData(string name, eDriverType drv, string sql, object [] args, int limit = -1)
        {   
            ConnectionStringSettings css = ConfigurationManager.ConnectionStrings[name];
            
            if (css != null)
            {   
                string conStr = css.ConnectionString;
                
                // авторизация на сервере
                if (Person.ServerLogin == 1)
                {                    
                    string passw = null;
                    
                    string[] tokens = Person.Identity.Name.Split(':');
                    if (tokens.Length == 2)                    
                        passw = tokens[1];

                    conStr = Misc.ConnCredentials(css.ConnectionString, Person.Identity.Name, passw);
                };

                OdbcConnection con = new OdbcConnection(conStr);                
                con.Open();

                if (limit != -1)
                {
                    switch (drv)
                    {
                        case eDriverType.DriverCaché:
                            sql = sql.Insert(6, " TOP " + limit);
                            break;
                        case eDriverType.DriverDB2:
                            sql = sql.TrimEnd(';') + " FETCH FIRST " + limit + " ROWS ONLY;";
                            break;
                    }
                }

                OdbcCommand com = new OdbcCommand(sql, con);
                com.CommandTimeout = ConnTimeout;
                
                if (args != null)
                {
                    for (int i = 0; i < args.Length; ++i)
                    {
                        com.Parameters.AddWithValue("@" + i + 1, args[i]);
                    }
                }

                OdbcDataReader reader = com.ExecuteReader();
                while (reader.Read())
                {
                    yield return DataToExpando(reader);
                }
                reader.Close();

                con.Close();                
            }
        }
        
        /// <summary>
        /// Структура соединения
        /// </summary>
        /// <param name="name">имя соединения</param>
        /// <param name="drv">драйвер соединения</param>
        /// <param name="page">страница с (если указана -1 выбираются все записи)</param>
        /// <param name="limit">записей на странице</param>
        /// <param name="query">фильтр</param>
        /// <param name="tables">список доп. таблиц для фильтра</param>
        /// <returns></returns>
        public IEnumerable<dynamic> GetSData(string name, eDriverType drv, int page = -1, int limit = -1, string query = null, IList<string> tables = null)
        {
            List<dynamic> nodes = new List<dynamic>();

            ConnectionStringSettings css = ConfigurationManager.ConnectionStrings[name];
            if (css != null)
            {      
                OdbcConnection con = new OdbcConnection(css.ConnectionString);
                OdbcCommand com = new OdbcCommand();
                OdbcDataReader reader = null;
                
                con.Open();

                com.Connection = con;
                com.CommandTimeout = ConnTimeout;

                bool uor = false;
                string cmdText = null;
                IList<string> filters = new List<string>(); ;               

                switch (drv)
                {
                    case eDriverType.DriverCaché:
                        cmdText = "SELECT Id od, SqlQualifiedNameQ name FROM %Dictionary.CompiledClass WHERE ClassType = 'persistent' AND System = 0";

                        if (!string.IsNullOrEmpty(query))
                        {
                            cmdText += " AND " + Misc.FilterField("SqlqualifiedNameQ", query);
                            uor = true;
                        }

                        if (tables != null && tables.Count > 0)
                        {
                            cmdText += uor ? " OR " : " AND ";                            
                            foreach (string t in tables)
                            {
                                filters.Add("SqlqualifiedNameQ = '" + t + "'");
                            }
                            cmdText += string.Join(" OR ", filters);
                        }
                        cmdText += " ORDER BY name";

                        break;
                    case eDriverType.DriverDB2:
                        cmdText = "SELECT tabname name, TRIM(tabschema) schema FROM syscat.tables WHERE type = 'T'";

                        if (!string.IsNullOrEmpty(query))
                        {
                            cmdText += " AND " + Misc.FilterField("tabname", query);
                            uor = true;
                        }

                        if (tables != null && tables.Count > 0)
                        {
                            cmdText += uor ? " OR " : " AND ";
                            foreach (string t in tables)
                            {
                                filters.Add("tabname = '" + t + "'");
                            }
                            cmdText += string.Join(" OR ", filters);
                        }
                        
                        string[] items = System.Text.RegularExpressions.Regex.Split(css.ConnectionString, @";(\s)?");

                        string db = null, v = Array.Find<string>(items, pair => { return pair.StartsWith("CURRENTSCHEME=", StringComparison.CurrentCultureIgnoreCase); });
                        if (!string.IsNullOrEmpty(v))
                            db = v.Split('=')[1];

                        if (!string.IsNullOrEmpty(db))
                        {
                            cmdText += " AND tabschema = ?";
                            com.Parameters.AddWithValue("@var", db);
                        }
                        cmdText += " ORDER BY tabname";

                        break;
                }

                if (page != - 1){
                    // Split the SQL
                    PagingHelper.SQLParts parts;
                    if (!PagingHelper.SplitSQL(cmdText, out parts))
                        throw new Exception("Unable to parse SQL statement for paged query");

                    com.CommandText = parts.sqlCount;                    

                    TotalItems = Convert.ToInt64(com.ExecuteScalar());   

                    string sqlPage = null;
                    int skip = (page - 1) * limit, 
                        take = skip + limit;

                    switch (drv)
                    {
                        case eDriverType.DriverCaché:                            
                            parts.sqlSelectRemoved = parts.sqlSelectRemoved.Replace(parts.sqlOrderBy, string.Empty);
                            sqlPage = "SELECT TOP " + limit + " od, name, %vid FROM (SELECT " + parts.sqlSelectRemoved + ") WHERE %vid > " + skip + " AND %vid <= " + take + " ORDER BY name";
                            break;
                        case eDriverType.DriverDB2:
                            sqlPage = "SELECT name FROM (SELECT ROW_NUMBER() OVER (ORDER BY tabname) rn, " + parts.sqlSelectRemoved + ") WHERE rn >" + skip + " AND rn <=" + take + ";";                            
                            break;
                    }
                 
                    com.CommandText = sqlPage;
                }
                else 
                    com.CommandText = cmdText;              
                
                reader = com.ExecuteReader();
                while (reader.Read())
                {
                    var data = DataToExpando(reader);
                    data["nt"] = eNodeType.NodeTable;
                    yield return data;                    
                }

                reader.Close();
            }
        }

        /// <summary>
        /// Струтктура таблицы
        /// </summary>
        /// <param name="name">имя соединения</param>
        /// <param name="table">имя таблицы</param>
        /// <param name="drv">драйвер соединения</param>
        /// <param name="idx">выводить список индексов</param>
        /// <returns>List</returns>
        public List<dynamic> GetTData(string name, string table, eDriverType drv)
        {
            List<dynamic> nodes = new List<dynamic>();
            ConnectionStringSettings css = ConfigurationManager.ConnectionStrings[name];
            if (css != null)
            {
                string[] items = System.Text.RegularExpressions.Regex.Split(css.ConnectionString, @";(\s)?");

                string schema = null,
                       v = Array.Find<string>(items, pair => { return pair.StartsWith("CURRENTSCHEME=", StringComparison.CurrentCultureIgnoreCase); });

                if (!string.IsNullOrEmpty(v))
                    schema = v.Split('=')[1];

                // caché default schema
                if (drv == eDriverType.DriverCaché && table.StartsWith("SQLUser."))
                    table = table.Replace("SQLUser.", "User.");  

                OdbcConnection con = new OdbcConnection(css.ConnectionString);                
                con.Open();   

                // поля
                IList<Field> fields = new List<Field>();
                foreach (Field f in GetFields(con, table, schema, drv, false))
                {
                    f.Leaf = 1;
                    fields.Add(f);
                }
                nodes.Add(new { name = "Поля", nt = eNodeType.NodeFolder, data = fields });

                // индексы                
                nodes.Add(new { name = "Индексы", nt = eNodeType.NodeFolder, data = GetIndexes(con, table, schema, drv).ToList() });

                // внешние ключи                
                IList<Field> fkeys = new List<Field>();
                foreach (ForeignKey f in GetFKeys(con, table, schema, drv))
                {
                    f.Leaf = 1;
                    fkeys.Add(f);
                }
                nodes.Add(new { name = "Внешние ключи", nt = eNodeType.NodeFolder, data = fkeys });

                con.Close();
            }

            return nodes;
        }        
    }
}