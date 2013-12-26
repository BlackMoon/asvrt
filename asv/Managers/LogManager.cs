using System;
using System.Diagnostics;

namespace asv.Managers
{
    class LogManager
    {
        public static void WriteLine(string message)
        {
            Trace.WriteLine(message, DateTime.Now.ToString("dd-MM-yyyy HH:mm:ss"));
            Trace.Flush();  
        }
    }
}