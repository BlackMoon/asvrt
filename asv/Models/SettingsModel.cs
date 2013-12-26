using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;

namespace asv.Models
{
    public class SettingsModel
    {
        /// <summary>
        /// Время ожидания соединения
        /// </summary>     
        public int ConnTimeout { get; set; }
        /// <summary>
        /// Колв-о записей на странице
        /// </summary>     
        public int ItemsPerPage { get; set; }        
    }
}