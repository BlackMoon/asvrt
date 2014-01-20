﻿using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web.Mvc;
using System.Web.Routing;
using asv.Helpers;
using asv.Managers;
using asv.Models;

namespace asv.Controllers
{
    public class MainController : BaseController
    {
        private DataManager dm = new DataManager();

        protected override void Initialize(RequestContext requestContext)
        {            
            base.Initialize(requestContext);
            
            if (Request.IsAuthenticated)
                dm.Person = User;            
        }
        
        public ActionResult Index()
        {
            ViewBag.ConnTimeout = dm.ConnTimeout;
            ViewBag.ItemsPerPage = dm.ItemsPerPage;            
            
            return View();
        }        

        public JsonNetResult DeleteBase(string conn)
        {
            byte result = 1;
            string msg = null;

            try
            {
                db.Execute("DELETE FROM qb_bases WHERE conn = @0 AND usercreate = @1", conn, User.Id);
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

        public JsonNetResult DeleteQuery(int id)
        {
            byte result = 1;
            string msg = null;

            try
            {               
                db.Delete<Query>("WHERE id = @0", id);
                db.Delete<Param>("WHERE queryid = @0", id);
                db.Delete<Relation>("WHERE queryid = @0", id);
                db.Delete<Table>("WHERE queryid = @0", id);
                db.Delete<UFunc>("WHERE queryid = @0", id);
                db.Delete<UParam>("WHERE queryid = @0", id);
                
                Response.RemoveOutputCacheItem("/Main/GetQuery");
                Response.RemoveOutputCacheItem("/Main/GetQueries");
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

        /// <summary>
        /// Выполнить запрос
        /// </summary>
        /// <param name="name">Имя соединения</param>
        /// <param name="sql">SQL тело запроса</param>
        /// <param name="drv">Драйвер соединения</param>
        /// <param name="page">Страница</param>
        /// <param name="limit">Кол-во записей на странице</param>
        /// <returns>JSON</returns>
        //[OutputCache(Duration = 120, VaryByParam = "name;drv;sql;args;page;limit")]
        public JsonNetResult Execute(string name, eDriverType drv, string sql, object [] args, int page, int limit)
        {
            byte result = 1;
            string msg = null;

            long total = 0;
            List<dynamic> rows = new List<dynamic>();
            try
            {
                rows = dm.GetQData(name, drv, sql, args, page, page, limit).ToList();
                total = dm.TotalItems;
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }                           

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, data = rows, total = total };
            return jr;
        }       
       
        // список доступных соединений пользователя
        [OutputCache(Duration = 120, VaryByParam = "none")]
        public JsonNetResult GetConns()
        {
            byte result = 1;
            string msg = null;

            List<dynamic> conns = new List<dynamic>();
            try
            {
                conns = db.Fetch<dynamic>("SELECT c.name, c.driver, IFNULL(c.schema, '') schema FROM qb_connections c ORDER BY c.name");
                // TODO +проверка на видимость у пользователя
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

        public JsonNetResult GetObjs(eNodeType? nt, eDriverType? drv, string name, string schema)
        {
            byte result = 1;
            string msg = null;

            List<dynamic> nodes = new List<dynamic>();
            try
            {
                // table
                if (nt != null)
                {
                    switch (nt.Value)
                    {
                        case eNodeType.NodeScheme:
                            nodes = dm.GetSData(name, drv.Value).ToList();                            
                            break;
                        case eNodeType.NodeTable:
                            nodes = dm.GetTData(schema, name, drv.Value).ToList();
                            break;
                    }
                }
                else
                {
                    // from view without alias
                    foreach (var q in db.Query<dynamic>("SELECT name, drv FROM qb_vschemas WHERE usercreate = @0", User.Id))
                    {
                        q.nt = eNodeType.NodeScheme;
                        nodes.Add(q);
                    }
                }
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, data = nodes };
            return jr;
        }

        [OutputCache(Duration = 120, VaryByParam = "id")]
        public JsonNetResult GetQuery(int id)
        {
            byte result = 1;
            string msg = null;

            Query q = null;
            try
            {
                List<Query> queries = db.Fetch<Query, Param, Query>(new QueryRelator().Map,
                    @"SELECT q.id, q.sql, q.db2mode, q.useleftjoin, q.userdefined, p.id, p.field, p.formula, p.alias, p.schema, p.tbl, p.tabix, p.out, p.aggr, p.ord, p.ft, p.oper, p.uor, p.userp, p.descr, p.def, p.oper1, p.uor1, p.userp1, p.descr1, p.def1, p.filter2, p.uor2 FROM qb_queries q                      
                    LEFT JOIN qb_params p ON p.queryid = q.id WHERE q.id = @0", id);

                if (queries.Count > 0)
                {
                    q = queries[0];
                    // from view without alias
                    q.Funcs = db.Fetch<UFunc>(@"SELECT id, fnid, body, name, args, out, alias, filter, oper, def, uor, ord, dir 
                            FROM qb_vufunctions WHERE queryid = @0", id);

                    q.Relations = db.Fetch<Relation>("SELECT r.id, r.tab, r.od, r.schema, r.field, r.reftab, r.refod, r.refschema, r.reffield FROM qb_relations r WHERE r.queryid = @0 ORDER BY r.field", id);
                    q.Reports = db.Fetch<Template>("SELECT t.id, t.name FROM qb_reports r JOIN qb_templates t ON t.id = r.tplid WHERE r.queryid = @0 ORDER BY t.name", id);
                    q.Tables = db.Fetch<Table>("SELECT t.id, t.name, t.od, t.schema, t.collapsed, a.remark FROM qb_tables t LEFT JOIN qb_aliases a ON a.name = t.name WHERE t.queryid = @0", id);                    
                    q.UParams = db.Fetch<UParam>("SELECT u.id, u.field, u.ft, u.descr, u.def FROM qb_uparams u WHERE u.queryid = @0", id);
                }
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, query = q };
            return jr;
        }

        [OutputCache(Duration = 120, VaryByParam="none")]
        public JsonNetResult GetQueries()
        {
            byte result = 1;
            string msg = null;

            List<dynamic> queries = new List<dynamic>();
            try
            {    
                queries = db.Fetch<dynamic>("SELECT q.id, q.name, q.conn, q.grp, q.drv FROM qb_vqueries q ORDER BY q.name");
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, data = queries };
            return jr;
        }

        [OutputCache(Duration = 120, VaryByParam = "name;drv;table;od")]
        public JsonNetResult GetTable(string name, eDriverType drv, string table, string od)
        {
            byte result = 1;
            string msg = null;

            Table sqltable = new Table();

            ConnectionStringSettings css = ConfigurationManager.ConnectionStrings[name];
            if (css != null)
            {
                string[] items = System.Text.RegularExpressions.Regex.Split(css.ConnectionString, @";(\s)?");

                string schema = null,
                       v = Array.Find<string>(items, pair => { return pair.StartsWith("CURRENTSCHEME=", StringComparison.CurrentCultureIgnoreCase); });

                if (!string.IsNullOrEmpty(v))
                    schema = v.Split('=')[1];

                if (drv == eDriverType.DriverDB2)
                    od = table;                   

                using (System.Data.Odbc.OdbcConnection con = new System.Data.Odbc.OdbcConnection(css.ConnectionString))
                {
                    try
                    {
                        con.Open();

                        Field field;
                        List<Field> fields = new List<Field>();                        
                        foreach (TableField f in dm.GetFields(con, od, schema, drv))
                        {   
                            try
                            {                               
                                f.Remark = db.ExecuteScalar<string>("SELECT f.remark FROM qb_aliases a JOIN qb_aliases f ON f.parentid = a.id " + 
                                    "WHERE UPPER(a.name) = @0 AND UPPER(f.name) = @1", table.ToUpper(), f.Name.ToUpper());
                            }
                            catch
                            {
                            }
                            fields.Add(f);
                        }
                        
                        IList<ForeignKey> fkeys = new List<ForeignKey>();
                        foreach (ForeignKey k in dm.GetFKeys(con, od, schema, drv))
                        {
                            field = fields.Find(f => f.Name.Equals(k.Name));

                            if (field != null)
                                field.Nt = eNodeType.NodeForeignKey;
                            else
                                fields.Add(new TableField(k.Name, eNodeType.NodeForeignKey));

                            fkeys.Add(k);
                        }

                        sqltable.Fields = fields;
                        sqltable.FKeys = fkeys;                          

                        con.Close();
                    }
                    catch (Exception e)
                    {
                        msg = e.Message;
                        result = 0;
                    }
                }
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, table = sqltable };
            return jr;
        }

        [OutputCache(Duration = 120, VaryByParam="name;drv")]
        public JsonNetResult GetTables(string name, eDriverType drv)
        {
            byte result = 1;
            string msg = null;

            List<Node> nodes = new List<Node>();
            try
            {
                // список таблиц
                List<dynamic> tables = dm.GetSData(name, drv).ToList();                
                
                // разделы                
                string sql = @"SELECT n.id, (CASE WHEN n.leaf == 0 THEN '' ELSE n.name END) name, n.internalid, IFNULL(n.parentid, '') parentid, n.leaf, (CASE WHEN n.leaf == 1 THEN a.remark ELSE n.name END) rem 
                               FROM qb_catalogs c JOIN qb_nodes n ON n.catalogid = c.id LEFT JOIN qb_aliases a ON a.name = n.name WHERE c.conn = @0 ORDER BY n.leaf, n.name";

                nodes = db.Fetch<Node>(sql, name);                
                List<Node> leafs = nodes.FindAll(nd => nd.Leaf == 1);                

                int i = 0, ix;
                string key = null;
                Node node = null;
                IDictionary<string, object> t;
                IList<Node> tmps;
                
                while (i < tables.Count)
                {
                    t = tables[i];
                    key = t["name"].ToString();

                    tmps = leafs.FindAll(nd => nd.Name == key);
                    if (tmps.Count > 0)
                    {
                        foreach (Node nd in tmps)
                        {
                            switch (drv)
                            {
                                case eDriverType.DriverCaché:
                                    nd.Od = t["od"].ToString();
                                    break;
                                case eDriverType.DriverDB2:
                                    nd.Schema = t["schema"].ToString();
                                    break;
                            }
                        }
                        tables.RemoveAt(i);
                    }                    
                    else
                        i++;
                }  

                if (nodes.Count > 0)
                {
                    List<Node> nds = nodes;
                    nodes = Misc.GetNodes(nodes, "");
                }

                int hidesys = db.ExecuteScalar<int>("SELECT c.hidesys FROM qb_connections c WHERE c.name = @0", name);
                if (hidesys == 0 || User.IsAdmin == 1)
                {
                    // алиасы
                    sql = "SELECT a.name key, a.remark value FROM qb_aliases a WHERE a.parentid IS NULL";
                    IDictionary<string, string> aliases = db.Fetch<Pair<string, string>>(sql).ToDictionary(o => o.Key, o => o.Value);
                
                    foreach (IDictionary<string, object> tb in tables)
                    {
                        key = tb["name"].ToString();
                        
                        ix = leafs.FindIndex(nd => nd.Name == key);
                        if (ix == -1)
                        {
                            node = new Node();
                            node.Name = key;
                            node.Leaf = 1;
                            switch (drv)
                            {
                                case eDriverType.DriverCaché:
                                    node.Od = tb["od"].ToString();
                                    break;
                                case eDriverType.DriverDB2:
                                    node.Schema = tb["schema"].ToString();
                                    break;
                            }

                            if (aliases.ContainsKey(key))
                                node.Rem = aliases[key];

                            nodes.Add(node);
                        }                       
                    }
                }                
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, data = nodes };
            return jr;
        }       

        public JsonNetResult UpdateQuery(string json)
        {
            byte result = 1;
            string msg = null;

            Query q = Newtonsoft.Json.JsonConvert.DeserializeObject<Query>(json);

            int? id = null;
            try
            {
                if (q.Id != 0)
                {
                    db.Execute(@"UPDATE qb_queries SET name = @1, grp = @2, subgrp = @3, sql = @4, db2mode = @5, useleftjoin = @6, userdefined = @7 WHERE id = @0;
                                DELETE FROM qb_params WHERE queryid = @0;DELETE FROM qb_relations WHERE queryid = @0;DELETE FROM qb_reports WHERE queryid = @0;
                                DELETE FROM qb_tables WHERE queryid = @0;DELETE FROM qb_ufunctions WHERE queryid = @0;DELETE FROM qb_uparams WHERE queryid = @0;",
                        q.Id, q.Name, q.Group, q.Subgroup, q.Sql, q.Db2Mode, q.UseLeftJoin, q.UserDefined);
                    
                    Response.RemoveOutputCacheItem("/Main/GetQuery");    
                }
                else
                    id = q.Id = db.ExecuteScalar<int>("INSERT INTO qb_queries(name, conn, grp, subgrp, sql, useleftjoin, usercreate) VALUES(@0, @1, @2, @3, @4, @5, @6);\nSELECT last_insert_rowid();",
                        q.Name, q.Conn, q.Group, q.Subgroup, q.Sql, q.UseLeftJoin, User.Id);

                // tables insert first
                foreach (Table t in q.Tables)
                {
                    db.Execute("INSERT INTO qb_tables(queryid, name, od, schema, collapsed) VALUES(@0, @1, @2, @3, @4)", q.Id, t.Name, t.Od, t.Schema, t.Collapsed);
                }

                // params
                foreach (Param p in q.Params)
                {
                    db.Execute(@"INSERT INTO qb_params(queryid, field, formula, alias, schema, tbl, tabix, out, aggr, ord, ft, oper, uor, userp, descr, def, oper1, uor1, userp1, descr1, def1, filter2, uor2) 
                    VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18, @19, @20, @21, @22)", 
                        q.Id, p.Field, p.Formula, p.Alias, p.Schema, p.Tbl, p.Tabix, p.Out, p.Aggr, p.Ord, p.Ft, p.Oper, p.Uor, p.Userp, p.Descr, p.Def, p.Oper1, p.Uor1, p.Userp1, p.Descr1, p.Def1, p.Filter2, p.Uor2);
                }

                // relations
                foreach (Relation r in q.Relations)
                {
                    db.Execute("INSERT INTO qb_relations(queryid, tab, od, schema, field, reftab, refod, refschema, reffield) VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8)", 
                        q.Id, r.Tab, r.Od, r.Schema, r.Field, r.RefTab, r.RefOd, r.RefSchema, r.RefField);
                }

                // reports
                foreach (Template r in q.Reports)
                {
                    db.Execute("INSERT INTO qb_reports(queryid, tplid) VALUES(@0, @1)", q.Id, r.Id);
                }

                // user functions
                foreach (UFunc f in q.Funcs)
                {
                    db.Execute("INSERT INTO qb_ufunctions(queryid, fnid, body, args, out, alias, filter, oper, def, uor, ord, dir) VALUES(@0, (CASE WHEN @1 = 0 THEN NULL ELSE @1 END), @2, @3, @4, @5, @6, @7, @8, @9, @10, @11)", 
                        q.Id, f.FnId, f.Body, f.Args, f.Out, f.Alias, f.Filter, f.Oper, f.Def, f.Uor, f.Ord, f.Dir);
                }

                // user params
                foreach (UParam u in q.UParams)
                {
                    db.Execute("INSERT INTO qb_uparams(queryid, field, ft, descr, def) VALUES(@0, @1, @2, @3, @4)", q.Id, u.Field, u.Ft, u.Descr, u.Def);
                }

                Response.RemoveOutputCacheItem("/Main/GetQueries");    
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