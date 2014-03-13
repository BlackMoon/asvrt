using System;
using System.Web.Security;
using System.Collections.Generic;
using asv.Models;
using Newtonsoft.Json;
using PetaPoco;

namespace asv.Security
{   
    public class MembershipPerson : MembershipUser, IKey
    {        
        public int Id { get; set; }        
        public int IsAdmin { get; set; }       
        public int ServerLogin { get; set; }

        public string Login { get; set; }  
        public string Lastname { get; set; }        
        public string Firstname { get; set; }        
        public string Middlename { get; set; }
        public string Fio { get; set; }
        public string Theme { get; set; }

        public string Schema
        {
            get
            {
                string schema = null;
                if (Bases != null && Bases.Count > 0)
                    schema = Bases[0].Conn;

                return schema;
            }
        }

        public IList<Userdb> Bases { get; set; }
        public List<string> Roles { get; set; }
        
        public MembershipPerson() { }

        public MembershipPerson(string providerName, string name, object providerUserKey, bool isApproved, DateTime lastLoginDate)
            : base(providerName, name, providerUserKey, null, null, null, isApproved, false, DateTime.MinValue, lastLoginDate, DateTime.Now, DateTime.MinValue, DateTime.MinValue)
        {
        }
    }
}