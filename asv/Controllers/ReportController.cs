using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SQLite;
using System.IO.Compression;
using System.IO;
using System.Web;
using System.Web.Mvc;
using asv.Helpers;
using asv.Managers;
using asv.Models;
using PetaPoco;
using asv.Security;
using log4net;

namespace asv.Controllers
{   
    public class ReportController : BaseController
    {
        private const string REPORTSPATH = "Reports";
        private static readonly ILog log = MvcApplication.log; 

        [GrantAttribute(Roles = "ERASER")]
        public JsonNetResult DeleteTpl(int id)
        {
            byte result = 1;
            string msg = null;

            try
            {
                db.Delete<Template>("WHERE id = @0", id);
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

        [GrantAttribute(Roles = "EDITOR, READER")]
        public JsonNetResult Export(string name, eDriverType drv, string sql, string json, int? id, string qname, string group, string subgroup, int userdefined)
        {
            byte result = 1;
            string msg = null;

            List<UParam> pars = Newtonsoft.Json.JsonConvert.DeserializeObject<List<UParam>>(json);                

            string path = null;
            try
            {
                string query = " (" + qname + ")";
                if (id != null)
                    query = " №" + id + query;

                log.Info("Пользователь " + User.Identity.Name + ". Экспорт запроса -" + query);

                ReportManager rm = new ReportManager(System.Web.HttpContext.Current.Server.MapPath(@"\" + REPORTSPATH));
                rm.userParams = pars;

                string[] args = null;
                if (userdefined == 0)
                {                    
                    args = pars.ConvertAll<string>(new Converter<UParam, string>(p => { return p.Def; })).ToArray();
                }
                
                path = REPORTSPATH + "/" + rm.ExportReport(name, drv, sql, args, qname, group, subgroup, User);
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, link = path };
            return jr;
        }
        
        [Authorize]
        public JsonNetResult GetReport(string name, eDriverType drv, string sql, string json, int repId, int? id, string qname, string group, string subgroup, int userdefined)
        {
            byte result = 1;
            string msg = null;

            List<UParam> pars = Newtonsoft.Json.JsonConvert.DeserializeObject<List<UParam>>(json);   

            string path = null;
            try
            {
                string query = " (" + qname + ")";
                if (id != null)
                    query = " №" + id + query;

                log.Info("Пользователь " + User.Identity.Name + ". Экспорт запроса -" + query);

                ReportManager rm = new ReportManager(System.Web.HttpContext.Current.Server.MapPath(@"\" + REPORTSPATH));
                rm.userParams = pars;

                string[] args = null;
                if (userdefined == 0)
                {
                    args = pars.ConvertAll<string>(new Converter<UParam, string>(p => { return p.Def; })).ToArray();
                }
                
                path = REPORTSPATH + "/" + repId + "/" + rm.GenerateReport(name, drv, sql, args, qname, group, subgroup, repId, User);                
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, link = path };
            return jr;
        }

        [GrantAttribute(Roles = "EDITOR, READER")]
        public JsonNetResult GetTpl(int id)
        {
            byte result = 1;
            string msg = null;

            string path = null;
            try
            {
                ReportManager rm = new ReportManager(System.Web.HttpContext.Current.Server.MapPath(@"\" + REPORTSPATH));
                path = REPORTSPATH + "/" + id + "/" + rm.GetTemplate(id);
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, link = path };
            return jr;       
        }
      
        [Authorize]
        public JsonNetResult GetTemplates(int page, int limit, string query)
        {
            byte result = 1;
            string msg = null;

            List<dynamic> tpls = new List<dynamic>();
            long total = 0;
            try
            {
                string sql = "SELECT t.id, t.name, t.fname, t.usercreate authorid, CEILING(t.sz / 1024.0) sz FROM qb_templates t",
                       where = "";

                if (!(User.IsInRole("READER") || User.IsInRole("EDITOR") || User.IsInRole("ERASER")))
                    where += " t.usercreate = @0";

                if (!string.IsNullOrEmpty(query))
                    where += " AND (" + Misc.FilterField1("t.name", query) + " OR " + Misc.FilterField1("t.fname", query) + ")";

                if (where.Length > 0)
                    sql += " WHERE " + where;

                sql += " ORDER BY t.name";

                Page<dynamic> p = db.Page<dynamic>(page, limit, sql, User.Id);
                total = p.TotalItems;
                tpls = p.Items;
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, data = tpls, total = total };
            return jr;
        }
      
        [HttpPost]
        [GrantAttribute(Roles = "AUTHOR, EDITOR")]
        public ActionResult UpdateTpl(int? id, string name, HttpPostedFileBase file)
        {
            byte result = 1;
            string msg = null;

            int sz = 0;
            try
            {
                string fname = null;
                SQLiteParameter data = null;

                if (file != null && file.ContentLength > 0)
                {
                    sz = file.ContentLength;
                    fname = Path.GetFileName(file.FileName);

                    MemoryStream ms = new MemoryStream();
                    using (GZipStream gzs = new GZipStream(ms, CompressionMode.Compress, true))
                    {
                        file.InputStream.CopyTo(gzs);
                    }

                    data = new SQLiteParameter("data", DbType.Binary);
                    data.Value = ms.ToArray();
                }

                if (id != null)
                {
                    db.Execute("UPDATE qb_templates SET name = @1, fname = IFNULL(@2, fname), sz = (CASE @3 WHEN 0 THEN sz ELSE @3 END), data = IFNULL(@4, data), version = version + 1 WHERE id = @0", id, name, fname, sz, data);
                    id = null;
                }
                else
                    id = db.ExecuteScalar<int>("INSERT INTO qb_templates(name, fname, sz, data, usercreate) VALUES(@0, @1, @2, @3, @4);\nSELECT last_insert_rowid();",
                        name, fname, sz, data, User.Id);
            }
            catch (Exception e)
            {
                msg = e.Message;
                result = 0;
            }
            
            string json = Newtonsoft.Json.JsonConvert.SerializeObject(new { success = result, message = msg, id = id, sz = Math.Ceiling(sz / 1024.0) });            
            return Content(json);
        }
    }
}
