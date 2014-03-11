using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text.RegularExpressions;
using NPOI.HSSF.UserModel;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;
using asv.Security;
using asv.Helpers;
using asv.Models;
using PetaPoco;

namespace asv.Managers
{
    enum eOfficeFormat
    {
        OfficeXls,
        OfficeXml
    }
    
    // контейнер координат - (P1 - 1я стр., P2 - последняя стр., S - лист, R1 - 1й ряд, R2 - посл. ряд)
    class ComplexRows
    {        
        public int P1 { get; set; }
        public int P2 { get; set; }        
        public int R1 { get; set; }        
        public int R2 { get; set; }
        public string S { get; private set; }        

        public ComplexRows(string s)
        {
            S = s;
        }
    }    

    public class ReportManager
    {
        private const int XLSMAXROWS = 50000;

        private Database db;
        private MemberPrincipal person;
        private eOfficeFormat repFormat;
        private string repPath;

        private IDictionary<string, object> simpleParams = new Dictionary<string, object>();

        public IList<UParam> userParams = new List<UParam>();

        public ReportManager(string path)
        {
            db = new Database("adminDB");
            db.EnableAutoSelect = false;

            repPath = path + @"\";                     
        }
       
        public string ExportReport(string name, eDriverType drv, string sql, object [] args, string qname, string group, string subgroup, MemberPrincipal person)
        {
            this.person = person;
            GenerateParams(qname, group, subgroup);

            int cn = 0, rn = 4, sn = 0;

            IWorkbook wb = new HSSFWorkbook();            
            ISheet sheet = wb.CreateSheet("Лист" + sn++);
            IRow row = null;

            sheet.SetColumnWidth(cn, 6144);            

            #region header cell style
            IFont hf = wb.CreateFont();
            hf.FontHeightInPoints = 18;
            hf.Boldweight = (short)FontBoldWeight.BOLD;

            ICellStyle hs = wb.CreateCellStyle();
            hs.SetFont(hf);
            #endregion            

            #region border cell style
            ICellStyle bs = wb.CreateCellStyle();
            bs.BorderLeft = bs.BorderRight = bs.BorderTop = bs.BorderBottom = BorderStyle.THIN;
            #endregion

            #region table header cell style
            IFont tf = wb.CreateFont();
            tf.Boldweight = (short)FontBoldWeight.BOLD;

            ICellStyle ts = wb.CreateCellStyle();
            ts.CloneStyleFrom(bs);
            ts.Alignment = HorizontalAlignment.CENTER;
            ts.FillPattern = FillPatternType.SOLID_FOREGROUND;
            ts.FillForegroundColor = NPOI.HSSF.Util.HSSFColor.PALE_BLUE.index;
            ts.SetFont(tf);           
            #endregion

            #region cell style
            ICellStyle cs = wb.CreateCellStyle();
            cs.CloneStyleFrom(bs);
            cs.WrapText = true;
            #endregion

            ICell cell = sheet.CreateRow(0).CreateCell(0);
            cell.CellStyle = hs;
            cell.SetCellValue(qname);

            row = sheet.CreateRow(2);
            row.CreateCell(0).SetCellValue("Подготовил:");
            row.CreateCell(1).SetCellValue(person.Fio);

            row = sheet.CreateRow(3);
            row.CreateCell(0).SetCellValue("Дата:");
            row.CreateCell(1).SetCellValue(DateTime.Now.ToString("dd.MM.yyyy HH:mm"));

            string v = null;
            foreach (UParam p in userParams)
            {   
                v = !string.IsNullOrEmpty(p.Descr) ? p.Descr : p.Field;

                row = sheet.CreateRow(rn++);
                row.CreateCell(0).SetCellValue(v);
                row.CreateCell(1).SetCellValue(p.Def);
            }

            // 1 пустой ряд
            rn++;

            DataManager dm = new DataManager();            
            dm.Person = person;

            dynamic q;
            List<dynamic> data = dm.GetQData(name, drv, sql, args).ToList();
            int total = (int)dm.TotalItems;

            if (total > 0)
            {

                int i, j,
                    sheets = total / XLSMAXROWS,
                    rem = total % XLSMAXROWS;

                for (i = 0; i < sheets; ++i)
                {
                    // заголовок
                    q = data[0];

                    row = sheet.CreateRow(rn++);
                    cn = 0;
                    foreach (string key in q.Keys)
                    {
                        sheet.SetColumnWidth(cn, 6144);

                        cell = row.CreateCell(cn++);
                        cell.CellStyle = ts;
                        cell.SetCellValue(key);
                    }

                    for (j = 0; j < XLSMAXROWS; ++j)
                    {
                        q = data[i * XLSMAXROWS + j];

                        row = sheet.CreateRow(rn++);
                        cn = 0;

                        foreach (object val in q.Values)
                        {
                            cell = row.CreateCell(cn++);
                            cell.CellStyle = cs;

                            if (val is DateTime)
                                cell.SetCellValue(((DateTime)val).ToShortDateString());
                            else if (val is Double)
                                cell.SetCellValue((Double)val);
                            else if (val is Int16)
                                cell.SetCellValue((Int16)val);
                            else if (val is Int32)
                                cell.SetCellValue((Int32)val);
                            else if (val is Int64)
                                cell.SetCellValue((Int64)val);
                            else if (val is byte[])
                                cell.SetCellValue(Convert.ToBase64String((byte[])val));
                            else
                                cell.SetCellValue(val.ToString());
                        }
                    }

                    sheet = wb.CreateSheet("Лист" + sn++);

                    rn = 0;
                }

                // последние ряды, если есть

                // заголовки
                q = data[0];

                row = sheet.CreateRow(rn++);
                cn = 0;
                foreach (string key in q.Keys)
                {
                    sheet.SetColumnWidth(cn, 6144);

                    cell = row.CreateCell(cn++);
                    cell.CellStyle = ts;
                    cell.SetCellValue(key);
                }

                for (j = 0; j < rem; ++j)
                {
                    q = data[i * XLSMAXROWS + j];

                    row = sheet.CreateRow(rn++);
                    cn = 0;

                    foreach (object val in q.Values)
                    {
                        cell = row.CreateCell(cn++);
                        cell.CellStyle = cs;

                        if (val is DateTime)
                            cell.SetCellValue(((DateTime)val).ToShortDateString());
                        else if (val is Double)
                            cell.SetCellValue((Double)val);
                        else if (val is Int16)
                            cell.SetCellValue((Int16)val);
                        else if (val is Int32)
                            cell.SetCellValue((Int32)val);
                        else if (val is Int64)
                            cell.SetCellValue((Int64)val);
                        else if (val is byte[])
                            cell.SetCellValue(Convert.ToBase64String((byte[])val));
                        else
                            cell.SetCellValue(val.ToString());
                    }
                }
            }

            string path = "export_" + person.Id + ".xls";            
            using (FileStream fs = new FileStream(repPath + path , FileMode.Create))
            {
                wb.Write(fs);
            }

            return path;
        }

        /// <summary>
        /// Формирование списка простых параметров отчета
        /// </summary>
        /// <param name="qname">Имя запроса</param>
        /// <param name="group">Группа запроса</param>
        /// <param name="subgroup">Подгруппа запроса</param>
        protected virtual void GenerateParams(string qname, string group, string subgroup)
        {
            simpleParams.Add("Дата", DateTime.Now);
            simpleParams.Add("Запрос.Имя", qname);
            simpleParams.Add("Запрос.Группа", group);
            simpleParams.Add("Запрос.Подгруппа", subgroup);
            simpleParams.Add("Пользователь.ФИО", person.Fio);
            simpleParams.Add("Пользователь.Фамилия", person.Lastname);
            simpleParams.Add("Пользователь.Имя", person.Firstname);
            simpleParams.Add("Пользователь.Отчество", person.Middlename);

            int i;
            string v;
            foreach (UParam p in userParams)
            {
                i = 0;
                v = "Параметр." + p.Field;
                while (simpleParams.ContainsKey(v))
                {
                    v = "Параметр." + p.Field + i;
                }
                simpleParams.Add(v, p.Def);
            }
        }

        /// <summary>
        /// Формирование отчета
        /// </summary>
        /// <param name="name">Имя соединения</param>
        /// <param name="drv">Драйвер соединения</param>
        /// <param name="qname">Имя запроса</param>
        /// <param name="group">Группа запроса</param>
        /// <param name="subgroup">Подгруппа запроса</param>
        /// <param name="sql">SQL запроса</param>        
        /// <param name="repId">ID отчета</param>
        /// <param name="person">Текущий пользователь</param>
        /// <returns>Путь формированного файла-отчета</returns>
        public string GenerateReport(string name, asv.Models.eDriverType drv,  string sql, object [] args, string qname, string group, string subgroup, int repId, MemberPrincipal person)
        {
            this.person = person;
            GenerateParams(qname, group, subgroup);

            string cv = null, 
                   tplPath = GetTemplate(repId), 
                   ext = Path.GetExtension(tplPath),
                   path = Path.GetFileNameWithoutExtension(tplPath) + "_" + person.Id + ext,
                   newPath = repPath + repId + @"\" + path;

            Type t = typeof(HSSFWorkbook);            
            if (ext == ".xlsx")
            {
                repFormat = eOfficeFormat.OfficeXml;
                t = typeof(XSSFWorkbook);
            }

            FileStream fs = new FileStream(repPath + repId + @"\" + tplPath, FileMode.Open, FileAccess.Read);                        
            IWorkbook wb = (IWorkbook)Activator.CreateInstance(t, new object[] {fs});
            fs.Close();

            bool isComplex = false;            

            ICell cell = null;
            IRow row = null;
            ISheet sheet = null;

            ComplexRows compl = null;
            IList<ComplexRows> complrows = new List<ComplexRows>();

            Regex rx = new Regex(@"#Запрос,?\s?(\d+)*-?\s?(\d+)*", RegexOptions.Compiled | RegexOptions.IgnoreCase);            
            Match m;

            IEnumerator cells, rows, sheets = wb.GetEnumerator();

            while (sheets.MoveNext())
            {
                sheet = (ISheet)sheets.Current;
                
                rows = sheet.GetEnumerator();
                while (rows.MoveNext())
                {
                    row = (IRow)rows.Current;

                    cells = row.GetEnumerator();
                    while (cells.MoveNext())
                    {
                        cell = (ICell)cells.Current;
                        try
                        {
                            cv = cell.StringCellValue;
                            m = rx.Match(cv);
                            if (m.Success)
                            {
                                isComplex = true;
                                compl = new ComplexRows(sheet.SheetName);                                
                                compl.R1 = row.RowNum;                                                               

                                compl.P1 = Misc.GetConfigValue(m.Groups[1].Value, -1);
                                compl.P2 = Misc.GetConfigValue(m.Groups[2].Value, -1);

                                break;
                            }
                            else if (cv.StartsWith("#Конец_Запрос", StringComparison.CurrentCultureIgnoreCase))
                            {
                                compl.R2 = row.RowNum;
                                complrows.Add(compl);

                                isComplex = false;
                                break;
                            }
                            else if (!isComplex)
                                InsertParam(cell);                                    
                        }
                        catch
                        {
                        }                          
                    }
                }
            }
            
            // комплексные параметры
            DataManager dm = new DataManager();
            dm.Person = person;

            List<dynamic> complexParams;
                        
            dynamic data;
            int i, len, offset = 0, rn, total;

            string sn = string.Empty;
            foreach (ComplexRows cr in complrows)
            {
                if (!sn.Equals(cr.S))
                {                    
                    sheet = wb.GetSheet(cr.S);                    
                    sn = cr.S;

                    offset = 0;
                }

                // запрос
                complexParams = dm.GetQData(name, drv, sql, args, cr.P1, Math.Max(cr.P1, cr.P2), dm.ItemsPerPage).ToList();
                len = complexParams.Count() - 1;
                total = cr.R2 - cr.R1 - 1;

                cr.R1 += offset;                            
                                
                if (cr.R2 == sheet.LastRowNum)
                    sheet.CreateRow(cr.R2 + 1);

                // удалить ряд 'Запрос' --> смещение -1   
                sheet.ShiftRows(cr.R1 + 1, sheet.LastRowNum, -1);
                
                // удалить ряд 'Конец_Запрос' --> смещение -1   
                sheet.ShiftRows(cr.R2, sheet.LastRowNum, -1);                   
                
                for (i = 0; i < len; ++i)
                {
                    data = complexParams[i];
                    for (rn = 0; rn < total; ++rn)
                    {                        
                        sheet.CopyRow(cr.R1, cr.R1 + total);
                        row = sheet.GetRow(cr.R1);

                        cells = row.GetEnumerator();
                        while (cells.MoveNext())
                        {
                            cell = (ICell)cells.Current;                        
                            InsertParam(cell, data);    
                        }

                        cr.R1++;
                    }                    
                }
                
                // последние ряд(ы), если есть
                if (len > -1)
                {
                    data = complexParams[i];
                    for (rn = 0; rn < total; ++rn)
                    {
                        row = sheet.GetRow(cr.R1);
                        cells = row.GetEnumerator();
                        while (cells.MoveNext())
                        {
                            cell = (ICell)cells.Current;
                            InsertParam(cell, data);
                        }

                        cr.R1++;
                    }
                }

                offset += len * total - 2;
            }
            
            switch (repFormat){
                case eOfficeFormat.OfficeXls:
                    HSSFFormulaEvaluator.EvaluateAllFormulaCells(wb);
                    break;
                case eOfficeFormat.OfficeXml:
                    XSSFFormulaEvaluator.EvaluateAllFormulaCells(wb);
                    break;
            }
            
            fs = new FileStream(repPath + repId + @"\" + path, FileMode.Create, FileAccess.Write);
            wb.Write(fs);
            fs.Close();            

            return path;
        }

        public string GetTemplate(int id)
        {
            dynamic tpl = db.Single<dynamic>("SELECT t.fname, t.version FROM qb_templates t WHERE t.id = @0", id);
            string tplPath = repPath + id + @"\", path = tpl.fname;

            try
            {
                using (TextReader tr = File.OpenText(tplPath + "ver"))
                {
                    string line = tr.ReadLine();

                    if (Convert.ToInt32(line) != tpl.version) throw new Exception();
                    if (!File.Exists(tplPath + tpl.fname)) throw new FileNotFoundException();
                }
            }
            catch
            {
                LoadFileFromDB(id, tpl.fname);
            }

            return path;
        }

        public IEnumerable<Alias> ImportAliases(Stream stream)
        {
            //FileStream fs = new FileStream(System.Web.HttpContext.Current.Server.MapPath(@"~\scheme0.xls"), FileMode.Open, FileAccess.Read);
            IWorkbook wb = new HSSFWorkbook(stream);
            //fs.Close();

            ICell cell, cell1;
            IRow row;
            ISheet sheet;

            IEnumerator rows, sheets = wb.GetEnumerator();

            string cv, cv1;
            Alias alias = null, alias1;
            while (sheets.MoveNext())
            {
                sheet = (ISheet)sheets.Current;

                rows = sheet.GetEnumerator();
                while (rows.MoveNext())
                {
                    row = (IRow)rows.Current;

                    cell = row.GetCell(0);
                    cv = cell.StringCellValue;

                    if (!string.IsNullOrEmpty(cv))
                    {
                        if (cv.StartsWith("ASV_"))
                        {
                            if (alias != null)
                                yield return alias;

                            alias = new Alias();
                            alias.Name = cv;
                            alias.Fields = new List<Alias>();

                            row = sheet.GetRow(row.RowNum + 2);
                            if (row != null)
                            {
                                cell = row.GetCell(0);

                                if (cell != null)
                                    alias.Remark = cell.StringCellValue;
                            }

                        }
                        else if (!cv.StartsWith("^") && !cv.StartsWith("Наименование"))
                        {
                            cell1 = row.GetCell(1);
                            if (cell1 != null)
                            {
                                cv1 = cell1.StringCellValue;

                                alias1 = new Alias();
                                alias1.Name = cv;
                                alias1.Remark = cv1;

                                alias.Fields.Add(alias1);
                            }
                        }
                    }
                }
                yield return alias;
            }            
        }

        private void InsertParam(ICell cell, IDictionary<string, object> repParams = null)
        {
            object val;
            string pref = "$", v = cell.StringCellValue.ToLower();

            if (repParams == null)
                repParams = simpleParams;
            else
                pref += "_";

            foreach (KeyValuePair<string, object> kvp in repParams)
            {
                if (v == pref + kvp.Key.ToLower())
                {
                    val = kvp.Value;

                    if (val is DateTime)
                        cell.SetCellValue((DateTime)val);
                    else if (val is Double)
                        cell.SetCellValue((Double)val);
                    else if (val is Int16)
                        cell.SetCellValue((Int16)val);
                    else if (val is Int32)
                        cell.SetCellValue((Int32)val);
                    else if (val is Int64)
                        cell.SetCellValue((Int64)val);
                    else if (val is byte[])
                        cell.SetCellValue(Convert.ToBase64String((byte[])val));
                    else
                        cell.SetCellValue(val.ToString());

                    break;
                }
            }
        }

        private void LoadFileFromDB(int id, string fname)
        {
            dynamic tpl = db.Single<dynamic>("SELECT t.id, t.data, t.version FROM qb_templates t WHERE t.id = @0", id);

            string tplPath = repPath + @"\" + tpl.id + @"\";
            Directory.CreateDirectory(tplPath);
            
            FileStream fs = File.Create(tplPath + fname);
            MemoryStream ms = new MemoryStream(tpl.data);
            using (GZipStream gzs = new GZipStream(ms, CompressionMode.Decompress))
            {
                gzs.CopyTo(fs);
                fs.Close();
            }

            using (TextWriter tw = File.CreateText(tplPath + "ver"))
            {   
                tw.WriteLine(tpl.version);
                tw.Close();
            }            
        }        
    }
}