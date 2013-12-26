using asv.Models;
using System;
using System.Collections.Generic;

namespace asv.Helpers
{
    public static class Misc
    {   
        public static bool GetConfigValue(string value, bool defaultValue)
        {
            return (string.IsNullOrEmpty(value)) ? defaultValue : Convert.ToBoolean(value);
        }

        public static byte GetConfigValue(string value, byte defaultValue)
        {
            return (string.IsNullOrEmpty(value)) ? defaultValue : Convert.ToByte(value);
        }

        public static int GetConfigValue(string value, int defaultValue)
        {
            return (string.IsNullOrEmpty(value)) ? defaultValue : Convert.ToInt32(value);
        }

        public static string GetConfigValue(string value, string defaultValue)
        {
            return (string.IsNullOrEmpty(value)) ? defaultValue : value;
        }

        /// <summary>
        /// Создание sql конструкции [UPPER(field) LIKE %UPPER(value)%]        
        /// </summary> 
        public static string FilterField(string field, string value)
        {
            return "UPPER(" + field + ") LIKE '%" + value.ToUpper() + "%'";
        }

        /// <summary>
        /// Создание sqlite конструкции [TOUPPER(field) LIKE %UPPER(value)%]
        /// </summary>
        public static string FilterField1(string field, string value)
        {
            return "TOUPPER(" + field + ") LIKE '%" + value.ToUpper() + "%'";
        }

        // замена пользователь/пароль в строке соединения
        public static string ConnCredentials(string conStr, string uid, string pwd)
        {
            int ix = -1;
            string v = null;
            string[] items = System.Text.RegularExpressions.Regex.Split(conStr, @";(\s)?");

            // UID
            ix = Array.FindIndex<string>(items, pair => { return pair.StartsWith("UID=", StringComparison.CurrentCultureIgnoreCase); });
            if (ix != -1)
            {
                v = items[ix];
                v = v.Split('=')[0] + "=" + uid;
                items[ix] = v;
            }

            // PWD
            ix = Array.FindIndex<string>(items, pair => { return pair.StartsWith("PWD=", StringComparison.CurrentCultureIgnoreCase); });
            if (ix != -1)
            {
                v = items[ix];
                v = v.Split('=')[0] + "=" + pwd;
                items[ix] = v;
            }

            return String.Join(";", items);
        }

        public static List<Node> GetNodes(List<Node> nodes, string parentid)
        {
            List<Node> nds = nodes.FindAll(nd => nd.Parentid.Equals(parentid));
            nodes.RemoveAll(nd => nd.Parentid.Equals(parentid));

            foreach (Node n in nds)
            {
                if (n.Leaf == 0)                
                    n.Children = GetNodes(nodes, n.Internalid);
                
                n.Internalid = null;
                n.Parentid = null;
            }
            return nds;
        }
    }
}