/* *************************************************************
* Дополнительные функции SQLite (расширение)
* ************************************************************** */
using System.Data.SQLite;

namespace asv.Helpers
{
    [SQLiteFunction(Name = "TOUPPER", Arguments = 1, FuncType = FunctionType.Scalar)]
    public class UpperFunction : SQLiteFunction
    {
        public override object Invoke(object[] args)
        {
            return args[0].ToString().ToUpper();        
        }
    } 
}