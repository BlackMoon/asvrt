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
    
    // контейнер координат - (P1 - 1я запись, P2 - последняя запись, S - лист, R1 - 1й ряд, R2 - посл. ряд)
    class ComplexRows
    {        
        public int P1 { get; set; }
        public int P2 { get; set; }        
        public int R1 { get; set; }        
        public int R2 { get; set; }
        public string S { get; private set; }

        public int TotalRows
        {
            get
            {
                return R2 - R1 - 1;
            }
        }

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
            hf.Boldweight = (short)FontBoldWeight.Bold;

            ICellStyle hs = wb.CreateCellStyle();
            hs.SetFont(hf);
            #endregion            

            #region border cell style
            ICellStyle bs = wb.CreateCellStyle();
            bs.BorderLeft = bs.BorderRight = bs.BorderTop = bs.BorderBottom = BorderStyle.Thin;
            #endregion

            #region table header cell style
            IFont tf = wb.CreateFont();
            tf.Boldweight = (short)FontBoldWeight.Bold;

            ICellStyle ts = wb.CreateCellStyle();
            ts.CloneStyleFrom(bs);
            ts.Alignment = HorizontalAlignment.Center;
            ts.FillPattern = FillPattern.SolidForeground;
            ts.FillForegroundColor = NPOI.HSSF.Util.HSSFColor.PaleBlue.Index;
            ts.SetFont(tf);           
            #endregion

            #region cell style
            ICellStyle cs = wb.CreateCellStyle();
            cs.CloneStyleFrom(bs);
            cs.WrapText = true;
            #endregion

            #region date cell style
            ICellStyle ds1 = wb.CreateCellStyle();
            ds1.DataFormat = wb.CreateDataFormat().GetFormat("d.mm.yyyy hh:mm");

            ICellStyle ds2 = wb.CreateCellStyle();
            ds2.CloneStyleFrom(cs);
            ds2.DataFormat = (short)BuiltinFormats.GetBuiltinFormat("m/d/yy");
            #endregion

            ICell cell = sheet.CreateRow(0).CreateCell(0);
            cell.CellStyle = hs;
            cell.SetCellValue(qname);

            row = sheet.CreateRow(2);
            row.CreateCell(0).SetCellValue("Подготовил:");
            row.CreateCell(1).SetCellValue(person.Fio);

            row = sheet.CreateRow(3);
            row.CreateCell(0).SetCellValue("Дата:");
            
            cell = row.CreateCell(1);
            cell.CellStyle = ds1;
            cell.SetCellValue(DateTime.Now);

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
            List<dynamic> data = dm.GetQData(name, drv, sql, args, -1).ToList();
            int total = data.Count();

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
                            {                                
                                cell.CellStyle = ds2;
                                cell.SetCellValue((DateTime)val);
                            }
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
                        {
                            cell.CellStyle = ds2;
                            cell.SetCellValue((DateTime)val);
                        }
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

            #region запрос
            DataManager dm = new DataManager();
            dm.Person = person;

            List<dynamic> complexParams = dm.GetQData(name, drv, sql, args, -1).ToList();
            #endregion
                        
            dynamic data;
            int i, len = complexParams.Count() - 1, 
                rn, total;

            string sn = string.Empty;
            foreach (ComplexRows cr in complrows)
            {
                if (!sn.Equals(cr.S))
                {                    
                    sheet = wb.GetSheet(cr.S);                    
                    sn = cr.S;                    
                }
                
                total = cr.TotalRows;
                                
                if (cr.R2 == sheet.LastRowNum)
                    sheet.CreateRow(cr.R2 + 1);

                // удалить ряд 'Запрос' --> смещение -1   
                sheet.RemoveRow(sheet.GetRow(cr.R1));
                sheet.ShiftRows(cr.R1, sheet.LastRowNum, -1);
                
                // удалить ряд 'Конец_Запрос' --> смещение -1
                cr.R2--;
                sheet.RemoveRow(sheet.GetRow(cr.R2));
                sheet.ShiftRows(cr.R2, sheet.LastRowNum, -1);

                if (cr.P2 == -1)
                    cr.P2 = len;
                
                for (i = cr.P1; i < cr.P2 - 1; ++i)
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

                // последний ряд
                data = complexParams[i];
                row = sheet.GetRow(cr.R1);

                cells = row.GetEnumerator();
                while (cells.MoveNext())
                {
                    cell = (ICell)cells.Current;
                    InsertParam(cell, data);
                }  
                
                //TODO
                break;
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