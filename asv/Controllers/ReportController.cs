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

namespace asv.Controllers
{
    [Authorize]
    public class ReportController : BaseController
    {
        private const string REPORTSPATH = "Reports";        
        
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
       
        public JsonNetResult Export(string name, eDriverType drv, string sql, string json, string qname, string group, string subgroup, int userdefined)
        {
            byte result = 1;
            string msg = null;

            List<UParam> pars = Newtonsoft.Json.JsonConvert.DeserializeObject<List<UParam>>(json);                

            string path = null;
            try
            {
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
       
        public JsonNetResult GetReport(string name, eDriverType drv, string sql, string json, int repId, string qname, string group, string subgroup, int userdefined)
        {
            byte result = 1;
            string msg = null;

            List<UParam> pars = Newtonsoft.Json.JsonConvert.DeserializeObject<List<UParam>>(json);   

            string path = null;
            try
            {
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
      
        public JsonNetResult GetTemplates(int page, int limit, string query)
        {
            byte result = 1;
            string msg = null;

            List<dynamic> tpls = new List<dynamic>();
            long total = 0;
            try
            {
                string sql = "SELECT t.id, t.name, t.fname, t.usercreate, CEILING(t.sz / 1024.0) sz FROM qb_templates t WHERE t.usercreate = @0";
                if (!string.IsNullOrEmpty(query))
                    sql += " AND (" + Misc.FilterField("t.name", query) + " OR " + Misc.FilterField("t.fname", query) + ")";

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
