using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Configuration;
using System.Web.Mvc;
using System.Web.Security;
using System.Xml.Linq;
using asv.Helpers;
using asv.Security;
using asv.Models;
using PetaPoco;
using System.Collections.Specialized;
using System.IO;

namespace asv.Controllers
{
    //[AdminAuthorize]
    public class AdminController : BaseController
    {   
        private const string _logfile = "user.log";

        public JsonNetResult DeleteAlias(int id)
        {
            byte result = 1;
            string msg = null;

            try
            {
                db.Delete<Alias>("WHERE parentid = @0", id);
                db.Delete<Alias>("WHERE id = @0", id);      

                Response.RemoveOutputCacheItem("/Admin/GetAlias");
                Response.RemoveOutputCacheItem("/Admin/GetAliases");
                Response.RemoveOutputCacheItem("/Main/GetTables");
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg };
            return jr;
        }

        public JsonNetResult DeleteCatalog(int id)
        {
            byte result = 1;
            string msg = null;

            try
            {
                db.Delete<Node>("WHERE catalogid = @0", id);
                db.Delete<Catalog>("WHERE id = @0", id);

                Response.RemoveOutputCacheItem("/Admin/GetSection");
                Response.RemoveOutputCacheItem("/Admin/GetSections");
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg };
            return jr;
        }

        public JsonNetResult DeleteConn(string name)
        {
            byte result = 1;
            string msg = null;

            try            
            {
                db.Delete<Userdb>("WHERE conn = @0", name);                       
                db.Delete<Connection>("WHERE name = @0", name);                       
                
                Response.RemoveOutputCacheItem("/Admin/GetConn");
                Response.RemoveOutputCacheItem("/Admin/GetConns");

                Configuration cfg = WebConfigurationManager.OpenWebConfiguration("~");
                ConnectionStringsSection css = (ConnectionStringsSection)cfg.GetSection("connectionStrings");
                css.ConnectionStrings.Remove(name);
                
                cfg.Save(ConfigurationSaveMode.Modified); 
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg };
            return jr;
        }

        public JsonNetResult DeleteFunc(int id)
        {
            byte result = 1;
            string msg = null;

            try            
            {
                db.Delete<FParam>("WHERE fnid = @0", id);                       
                db.Delete<UFunc>("WHERE fnid = @0", id);                       
                db.Delete<Func>("WHERE id = @0", id);                       
                
                Response.RemoveOutputCacheItem("/Admin/GetFunc");
                Response.RemoveOutputCacheItem("/Admin/GetFuncs");                
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg };
            return jr;        
        }

        public JsonNetResult DeleteUser(int id)
        {
            byte result = 1;
            string msg = null;

            try
            {
                Membership.Provider.DeleteUser(id);
         
                Response.RemoveOutputCacheItem("/Admin/GetUser");
                Response.RemoveOutputCacheItem("/Admin/GetUsers");
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg };
            return jr;
        }

        public FileResult ExportLogs()
        {
            Response.AddHeader("Content-Disposition", "attachment; filename=\"" + _logfile + "\"");
            return File(Server.MapPath(@"~\" + _logfile), "text/plain");
        }

        [OutputCache(Duration = 120, VaryByParam = "id")]
        public JsonNetResult GetAlias(int id)
        {
            byte result = 1;
            string msg = null;

            Alias alias = null;
            try
            {
                List<Alias> aliases = db.Fetch<Alias, Alias, Alias>(new AliasRelator().Map, "SELECT a.id, f.id, f.name, f.remark FROM qb_aliases a LEFT JOIN qb_aliases f ON f.parentid = a.id WHERE a.id = @0", id);

                if (aliases.Count > 0)
                    alias = aliases[0];
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, alias = alias };
            return jr;
        }

        [OutputCache(Duration = 120, VaryByParam = "page;limit;query")]
        public JsonNetResult GetAliases(int page, int limit, string query)
        {
            byte result = 1;
            string msg = null;

            long total = 0;
            List<dynamic> aliases = new List<dynamic>();            
            try
            {                
                string sql = "SELECT a.id, a.name, a.remark FROM qb_aliases a WHERE a.parentid IS NULL";
                if (!string.IsNullOrEmpty(query))
                    sql += " AND (" + Misc.FilterField("a.name", query) + " OR " + Misc.FilterField1("a.remark", query) + ")";
                sql += " ORDER BY a.name";

                Page<dynamic> p = db.Page<dynamic>(page, limit, sql);
                total = p.TotalItems;
                aliases = p.Items;
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, data = aliases, total = total };
            return jr;
        }
        
        [OutputCache(Duration = 120, VaryByParam = "id")]
        public JsonNetResult GetCatalog(int id)
        {
            byte result = 1;
            string msg = null;

            Catalog catalog = null;
            try
            {
                List<Catalog> catalogs = db.Fetch<Catalog, Node, Catalog>(new CatalogRelator().Map, 
                    "SELECT c.id, n.id, n.name, n.internalid, IFNULL(n.parentid, '') parentid, n.leaf FROM qb_catalogs c LEFT JOIN qb_nodes n ON n.catalogid = c.id WHERE c.id = @0 ORDER BY n.leaf, n.name", id);
                
                if (catalogs.Count > 0) {
                    catalog = catalogs[0];

                    if (catalog.Nodes != null && catalog.Nodes.Count > 0)
                    {
                        List<Node> nodes = catalog.Nodes;
                        catalog.Nodes = Misc.GetNodes(nodes, "");
                    }
                }
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, catalog = catalog };
            return jr;
        }
        
        [OutputCache(Duration = 120, VaryByParam = "page;limit;query")]
        public JsonNetResult GetCatalogs(int page, int limit, string query)
        {
            byte result = 1;
            string msg = null;

            long total = 0;
            List<dynamic> funcs = new List<dynamic>();
            try
            {
                string sql = "SELECT c.id, c.name, c.conn FROM qb_catalogs c";

                if (!string.IsNullOrEmpty(query))
                    sql += " WHERE " + Misc.FilterField1("c.name", query);
                sql += " ORDER BY c.name";

                Page<dynamic> p = db.Page<dynamic>(page, limit, sql);
                total = p.TotalItems;
                funcs = p.Items;
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, data = funcs, total = total };
            return jr;
        }

        [OutputCache(Duration = 120, VaryByParam = "name")]
        public JsonNetResult GetConn(string name)
        {
            byte result = 1;
            string msg = null;

            Connection conn = null;
            try
            {
                conn = db.Single<Connection>("SELECT c.name, c.driver, c.hidesys FROM qb_connections c WHERE c.name = @0", name);
                ConnectionStringSettings css = ConfigurationManager.ConnectionStrings[name];
                if (css != null)
                {
                    string v = null;
                    string[] items = System.Text.RegularExpressions.Regex.Split(css.ConnectionString, @";(\s)?");                    
                    
                    // SERVER
                    v = Array.Find<string>(items, pair => { return pair.StartsWith("SERVER=", StringComparison.CurrentCultureIgnoreCase) || pair.StartsWith("HOSTNAME=", StringComparison.CurrentCultureIgnoreCase); });
                    if (!string.IsNullOrEmpty(v))
                        conn.Server = v.Split('=')[1];

                    // PORT
                    v = Array.Find<string>(items, pair => { return pair.StartsWith("PORT=", StringComparison.CurrentCultureIgnoreCase); });
                    if (!string.IsNullOrEmpty(v))
                        conn.Port = Convert.ToInt32(v.Split('=')[1]);

                    // DATABASE
                    v = Array.Find<string>(items, pair => { return pair.StartsWith("DATABASE=", StringComparison.CurrentCultureIgnoreCase); });
                    if (!string.IsNullOrEmpty(v))
                        conn.Database = v.Split('=')[1];

                    // CURRENTSCHEME
                    v = Array.Find<string>(items, pair => { return pair.StartsWith("CURRENTSCHEME=", StringComparison.CurrentCultureIgnoreCase); });
                    if (!string.IsNullOrEmpty(v))
                        conn.Schema = v.Split('=')[1];

                    // UID
                    v = Array.Find<string>(items, pair => { return pair.StartsWith("UID=", StringComparison.CurrentCultureIgnoreCase); });
                    if (!string.IsNullOrEmpty(v))
                        conn.Uid = v.Split('=')[1];

                    // PWD
                    v = Array.Find<string>(items, pair => { return pair.StartsWith("PWD=", StringComparison.CurrentCultureIgnoreCase); });
                    if (!string.IsNullOrEmpty(v))
                        conn.Pwd = v.Split('=')[1];                    
                }            
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }
            
            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, conn = conn };
            return jr;
        }

        [OutputCache(Duration = 120, VaryByParam = "page;limit")]
        public JsonNetResult GetConns(int page, int limit)
        {
            byte result = 1;
            string msg = null;

            List<dynamic> conns = new List<dynamic>();            
            try
            {
                conns = db.Fetch<dynamic>("SELECT c.name, c.driver FROM qb_connections c ORDER BY c.name");                
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, data = conns };
            return jr;
        }

        [OutputCache(Duration = 120, VaryByParam = "id")]
        public JsonNetResult GetFunc(int id)
        {
            byte result = 1;
            string msg = null;

            Func func = null;
            try
            {
                List<Func> funcs = db.Fetch<Func, FParam, Func>(new FuncRelator().Map, "SELECT f.id, f.body, p.id, p.descr, p.ft FROM qb_functions f LEFT JOIN qb_fparams p ON p.fnid = f.id WHERE f.id = @0", id);

                if (funcs.Count > 0)
                    func = funcs[0];
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, func = func };
            return jr;
        }

        [OutputCache(Duration = 120, VaryByParam = "page;limit;query")]
        public JsonNetResult GetFuncs(int page, int limit, string query)
        {
            byte result = 1;
            string msg = null;

            long total = 0;
            List<dynamic> funcs = new List<dynamic>();
            try
            {
                // pages from view without alias
                string sql = "SELECT id, name, args FROM qb_vfunctions";

                if (!string.IsNullOrEmpty(query))
                    sql += " WHERE " + Misc.FilterField1("name", query);
                sql += " ORDER BY name";

                Page<dynamic> p = db.Page<dynamic>(page, limit, sql);
                total = p.TotalItems;
                funcs = p.Items;
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, data = funcs, total = total };
            return jr;
        }

        public JsonNetResult GetLogs(int page, int limit)
        {
            byte result = 1;
            string msg = null;


            long total = 0;
            IList<LogModel> logs = new List<LogModel>();
            try
            {                
                // read from tail
                IEnumerable<string> lines = System.IO.File.ReadLines(Server.MapPath(@"~\" + _logfile)).Reverse();
                total = lines.Count();

                foreach (string line in lines.Skip((page - 1) * limit).Take(limit))
                {
                    logs.Add(new LogModel { Event = line });
                }
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, data = logs, total = total };

            return jr;
        }


        [OutputCache(Duration = 120, VaryByParam = "none")]
        public JsonNetResult GetSettings()
        {
            byte result = 1;
            string msg = null;

            // web.config
            Configuration cfg = WebConfigurationManager.OpenWebConfiguration("~");
            AppSettingsSection ass = cfg.AppSettings;
            
            SettingsModel sm = new SettingsModel();

            MembershipSection ms = (MembershipSection)cfg.GetSection("system.web/membership");
            ProviderSettings ps = ms.Providers["AccessMembershipProvider"];

            string key = "maxInvalidPasswordAttempts";
            if (ps.Parameters[key] != null)
                sm.MaxInvalidPasswordAttempts = Misc.GetConfigValue(ps.Parameters[key], 5);

            key = "passwordAnswerAttemptLockoutDuration";
            if (ps.Parameters[key] != null)
                sm.PasswordAnswerAttemptLockoutDuration = Misc.GetConfigValue(ps.Parameters[key], 10);

            key = "saltLength";
            if (ps.Parameters[key] != null)
                sm.SaltLength = Misc.GetConfigValue(ps.Parameters[key], 16); 

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, settings = sm };
            return jr;
        }

        [OutputCache(Duration = 120, VaryByParam = "name;drv;page;limit;query")]
        public JsonNetResult GetTables(string name, eDriverType drv, int page, int limit, string query)
        {
            byte result = 1;
            string msg = null;

            long total = 0;

            List<dynamic> tables = new List<dynamic>();
            try
            {
                // поиск по алиасу (qb_aliases)
                List<string> tnames = null;
                if (!string.IsNullOrEmpty(query))
                    tnames = db.Fetch<string>("SELECT a.name FROM qb_aliases a WHERE " + Misc.FilterField1("a.remark", query));

                // поиск по имени таблицы
                asv.Managers.DataManager dm = new asv.Managers.DataManager();
                tables = dm.GetSData(name, drv, page, limit, query, tnames).ToList();
                total = dm.TotalItems;

                tnames = tables.ConvertAll<string>(new Converter<dynamic, string>(t => { return t["name"]; }));

                string sql = "SELECT a.name key, a.remark value FROM qb_aliases a WHERE a.parentid IS NULL";
                if (tnames.Count > 0)
                    sql += " AND a.name IN ('" + string.Join("', '", tnames) + "')";

                string key = null;
                IDictionary<string, string> aliases = db.Fetch<Pair<string, string>>(sql).ToDictionary(i => i.Key, i => i.Value);

                foreach (IDictionary<string, object> t in tables)
                {
                    key = t["name"].ToString();

                    if (aliases.ContainsKey(key))
                        t["rem"] = aliases[key];
                }
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, data = tables, total = total };
            return jr;
        }

        [OutputCache(Duration = 120, VaryByParam = "id")]
        public JsonNetResult GetUser(int id)
        {
            byte result = 1;
            string msg = null;

            Person user = null;            
            try
            {
                user = Membership.Provider.GetUser(id);
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, user = user };
            return jr;
        }

        [OutputCache(Duration = 120, VaryByParam = "page;limit;query")]
        public JsonNetResult GetUsers(int page, int limit, string query)
        {
            byte result = 1;
            string msg = null;

            long total = 0;
            IEnumerable<Person> users = new List<Person>();
            try
            {
                users = Membership.Provider.FindUsersByName(query, page, limit, out total);
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, data = users, total = total };
            return jr;
        }       

        [HttpPost]
        public ActionResult ImportAliases(HttpPostedFileBase file)
        {
            byte result = 1;
            string msg = null;            
            
            try
            {
                asv.Managers.ReportManager rm = new asv.Managers.ReportManager(null);                

                int id, n = 0;
                foreach (Alias a in rm.ImportAliases(file.InputStream))
                {
                    System.Diagnostics.Debug.WriteLine(a.Name);
                    if (db.Exists<Alias>("name = @0 AND parentid IS NULL", a.Name))
                        id = db.ExecuteScalar<int>("SELECT IFNULL(a.id, 0) FROM qb_aliases a WHERE a.name = @0 AND a.parentid IS NULL", a.Name);                    
                    else
                        id = db.ExecuteScalar<int>("INSERT INTO qb_aliases(name, remark) VALUES(@0, @1);\nSELECT last_insert_rowid();", a.Name, a.Remark);

                    foreach (Alias f in a.Fields)
                    {
                        db.Execute("INSERT OR REPLACE INTO qb_aliases(name, remark, parentid) VALUES(@0, @1, @2)", f.Name, f.Remark, id);
                    }

                    n++;
                    System.Diagnostics.Debug.WriteLine(n);
                }
                msg = n.ToString();
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            string json = Newtonsoft.Json.JsonConvert.SerializeObject(new { success = result, message = msg });
            return Content(json);       // for IE            
        }

        [HttpPost]
        public ActionResult ImportUsers(int serverlogin, string conn, HttpPostedFileBase file)
        {
            byte result = 1;
            string msg = null;

            Person p = null;            
            Userdb udb = null;

            if (serverlogin == 1)
            {
                udb = new Userdb();
                udb.Auth = 1;
                udb.Conn = conn;
            }

            try
            {
                int n = 0;
                string fio = null;

                AccessMembershipProvider ap = (AccessMembershipProvider)Membership.Provider;
                XDocument xd = XDocument.Load(file.InputStream);
                
                foreach (var u in xd.Descendants("Users"))
                {
                    p = new Person();
                    p.Bases = new List<Userdb>();
                    p.IsApproved = 1;

                    p.Login = u.Element("Name").Value;
                    System.Diagnostics.Debug.WriteLine(p.Login);

                    fio = u.Element("FullName").Value;
                    if (!string.IsNullOrEmpty(fio))
                    {
                        int pos = fio.IndexOf(' ');
                        if (pos != -1)
                        {
                            p.LastName = fio.Substring(0, pos++);

                            string[] arr = fio.Substring(pos).Split(new char [] {'.', ' '}, StringSplitOptions.RemoveEmptyEntries);
                            if (arr.Length > 0)
                            {
                                p.FirstName = arr[0];

                                if (arr.Length > 1)
                                    p.MiddleName = arr[1];
                            }
                        }
                        else 
                            p.LastName = p.FirstName = fio;                        
                    }

                    if (serverlogin == 1)
                    {
                        p.ServerLogin = 1;
                        p.Bases.Add(udb);
                    }
                    else
                        p.Password = "123456";

                    p.Id = db.SingleOrDefault<int>("SELECT u.id FROM qb_users u WHERE u.login = @0", p.Login);

                    if (p.Id != 0)
                        Membership.Provider.UpdateUser(p.Id, p);
                    else
                        Membership.Provider.CreateUserAndAccount(p);

                    n++;
                    System.Diagnostics.Debug.WriteLine(n);                    
                }
                msg = n.ToString();

                Response.RemoveOutputCacheItem("/Admin/GetUser");
                Response.RemoveOutputCacheItem("/Admin/GetUsers"); 
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            string json = Newtonsoft.Json.JsonConvert.SerializeObject(new { success = result, message = msg });
            return Content(json);       
        }

        [HttpPost]
        public JsonNetResult TestConn(string conStr)
        {
            byte result = 1;
            string msg = null;
            
            try
            {
                using (System.Data.Odbc.OdbcConnection con = new System.Data.Odbc.OdbcConnection(conStr))
                {                    
                    con.Open();
                    con.Close();
                }
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }            

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg };
            return jr;
        }

        public JsonNetResult UpdateAlias(string json)
        {
            byte result = 1;
            string msg = null;

            Alias a = Newtonsoft.Json.JsonConvert.DeserializeObject<Alias>(json);

            long? id = null;
            try
            {   
                if (a.Id == 0)
                {
                    if (db.Exists<Alias>("name = @0 AND parentid IS NULL", a.Name))
                        throw new Exception("Псевдоним суже существует");

                    id = (long)db.Insert(a);
                }
                else
                {
                    db.Update<Alias>("SET name = @1, remark = @2 WHERE id = @0;DELETE FROM qb_aliases WHERE parentid = @0;", a.Id, a.Name, a.Remark);                    
                    Response.RemoveOutputCacheItem("/Admin/GetAlias");
                }            

                // добавить 
                foreach (Alias f in a.Fields)
                {                    
                    db.Execute("INSERT INTO qb_aliases(name, remark, parentid) VALUES(@0, @1, @2)", f.Name, f.Remark, a.Id);                    
                }   

                Response.RemoveOutputCacheItem("/Admin/GetAliases");
                Response.RemoveOutputCacheItem("/Main/GetTables");
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, id = id };
            return jr;
        }

        public JsonNetResult UpdateCatalog(string json)
        {
            byte result = 1;
            string msg = null;

            Catalog c = Newtonsoft.Json.JsonConvert.DeserializeObject<Catalog>(json);

            long? id = null;
            try
            {
                if (db.Exists<Catalog>("conn = @0 AND id != @1", c.Conn, c.Id)) throw new Exception("Для базы <b>" + c.Conn + "</b> каталог уже существует.");

                if (c.Id == 0)                
                    id = (long)db.Insert(c);                

                else
                {
                    db.Update<Catalog>("SET name = @1, conn = @2 WHERE id = @0;DELETE FROM qb_nodes WHERE catalogid = @0", c.Id, c.Name, c.Conn);
                    Response.RemoveOutputCacheItem("/Admin/GetCatalog");
                }

                // добавить
                foreach (Node n in c.Nodes)
                {
                    db.Execute("INSERT INTO qb_nodes(name, internalid, parentid, leaf, catalogid) VALUES(@0, @1, @2, @3, @4)", n.Name, n.Internalid, n.Parentid, n.Leaf, c.Id);
                }

                Response.RemoveOutputCacheItem("/Admin/GetCatalogs");
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, id = id };
            return jr;
        }

        public JsonNetResult UpdateConn(Connection conn)
        {
            byte result = 1;
            string msg = null;
            
            try
            {                
                db.Execute("INSERT OR REPLACE INTO qb_connections(name, driver, hidesys) VALUES(@0, @1, @2)", conn.Name, conn.Driver, conn.HideSys);                
                
                Response.RemoveOutputCacheItem("/Admin/GetConn");                    
                Response.RemoveOutputCacheItem("/Admin/GetConns");

                string conStr = null;
                switch (conn.Driver)
                {
                    case eDriverType.DriverCaché:
                        conStr = "DRIVER={InterSystems ODBC};";
                        break;
                    case eDriverType.DriverDB2:
                        conStr = "DRIVER={IBM DB2 ODBC DRIVER};PROTOCOL=TCPIP;";
                        break;
                }

                // SERVER
                if (!string.IsNullOrEmpty(conn.Server))                                
                    conStr += (conn.Driver == eDriverType.DriverCaché ? "SERVER=" : "HOSTNAME=") + conn.Server + ";";               

                // PORT
                if (conn.Port > 0)
                    conStr += "PORT=" + conn.Port + ";";

                // DATABASE
                if (!string.IsNullOrEmpty(conn.Database))
                    conStr += "DATABASE=" + conn.Database + ";";

                // SCHEME UpperCase
                if (!string.IsNullOrEmpty(conn.Schema))
                    conStr += "CURRENTSCHEME=" + conn.Schema.ToUpper() + ";";

                // UID
                if (!string.IsNullOrEmpty(conn.Uid))
                    conStr += "UID=" + conn.Uid + ";";

                // PWD
                if (!string.IsNullOrEmpty(conn.Pwd))
                    conStr += "PWD=" + conn.Pwd + ";";

                Configuration cfg = WebConfigurationManager.OpenWebConfiguration("~");
                ConnectionStringsSection css = (ConnectionStringsSection)cfg.GetSection("connectionStrings");

                ConnectionStringSettings cs = css.ConnectionStrings[conn.Name];
                if (cs != null)                
                    cs.ConnectionString = conStr;
                else
                {
                    cs = new ConnectionStringSettings(conn.Name, conStr);
                    css.ConnectionStrings.Add(cs);
                }
                cfg.Save(ConfigurationSaveMode.Modified);              
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg };
            return jr;
        }

        public JsonNetResult UpdateFunc(string json)
        {
            byte result = 1;
            string msg = null;

            Func f = Newtonsoft.Json.JsonConvert.DeserializeObject<Func>(json);

            long? id = null;
            try
            {
                if (f.Id == 0)                
                    id = (long)db.Insert(f);                       
                
                else
                {
                    db.Update<Func>("SET name = @1, body = @2 WHERE id = @0;DELETE FROM qb_fparams WHERE fnid = @0;", f.Id, f.Name, f.Body);                     
                    Response.RemoveOutputCacheItem("/Admin/GetFunc");
                }

                // добавить
                foreach (FParam p in f.Params)
                {
                    db.Execute("INSERT INTO qb_fparams(descr, ft, fnid) VALUES(@0, @1, @2)", p.Descr, p.Ft, f.Id);
                }   

                Response.RemoveOutputCacheItem("/Admin/GetFuncs");
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, id = id };
            return jr;
        }

        public JsonNetResult UpdateSettings(SettingsModel sm)
        {
            byte result = 1;
            string msg = null;
                        
            try
            {
                Configuration cfg = WebConfigurationManager.OpenWebConfiguration("~");
                AppSettingsSection ass = cfg.AppSettings;

                string key = "ConnTimeout",
                       val = sm.ConnTimeout.ToString();

                if (ass.Settings[key] != null)
                    ass.Settings[key].Value = val;
                else
                    ass.Settings.Add(key, val);

                key = "ItemsPerPage";
                val = sm.ItemsPerPage.ToString();

                if (ass.Settings[key] != null)
                    ass.Settings[key].Value = val;
                else
                    ass.Settings.Add(key, val);

                if (ass.Settings[key] != null)
                    ass.Settings[key].Value = val;
                else
                    ass.Settings.Add(key, val);

                MembershipSection ms = (MembershipSection)cfg.GetSection("system.web/membership");
                ProviderSettings ps = ms.Providers["AccessMembershipProvider"];

                key = "maxInvalidPasswordAttempts";
                val = sm.MaxInvalidPasswordAttempts.ToString();
                ps.Parameters[key] = val;

                key = "minRequiredPasswordLength";
                val = sm.MinRequiredPasswordLength.ToString();
                ps.Parameters[key] = val;

                key = "minRequiredUsernameLength";
                val = sm.MinRequiredUsernameLength.ToString();
                ps.Parameters[key] = val;

                key = "passwordAnswerAttemptLockoutDuration";
                val = sm.PasswordAnswerAttemptLockoutDuration.ToString();
                ps.Parameters[key] = val;

                key = "saltLength";
                val = sm.SaltLength.ToString();
                ps.Parameters[key] = val;

                // update provider 
                AccessMembershipProvider provider = (AccessMembershipProvider)Membership.Provider;
                provider.InitConfig(ps.Parameters as NameValueCollection); 

                cfg.Save(ConfigurationSaveMode.Modified);

                Response.RemoveOutputCacheItem("/Admin/GetSettings");
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }


            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg };
            return jr;
        }

        public JsonNetResult UpdateUser(Person value)
        {
            byte result = 1;
            string msg = null;

            int id = 0;
            try
            {
                if (!ModelState.IsValid)
                    throw new Exception(string.Join(", ", ModelState.Values.SelectMany(x => x.Errors).Select(x => x.ErrorMessage)));

                // isApproved = 1 - locked
                value.IsApproved = 1 - value.IsApproved;
                if (value.Id != 0)
                {
                    Membership.Provider.UpdateUser(value.Id, value);
                    Response.RemoveOutputCacheItem("/Admin/GetUser");        
                }
                else
                    id = (int)Membership.Provider.CreateUserAndAccount(value);

                Response.RemoveOutputCacheItem("/Admin/GetUsers");
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, id = id };
            return jr;
        }
    }
}
