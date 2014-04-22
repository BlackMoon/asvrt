using System;
using System.Web.Security;
using System.Collections.Generic;
using asv.Models;
using Newtonsoft.Json;
using PetaPoco;

namespace asv.Security
{   
    public class MembershipPerson : MembershipUser
    {   
        public int IsAdmin { get; set; }       
        public int ServerLogin { get; set; }
        
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
                {
                    Userdb auth = Bases.Find(b => b.Auth == 1);
                    if (auth != null)
                        schema = auth.Conn;
                }

                return schema;
            }
        }

        public List<Userdb> Bases { get; set; }
        public List<string> Roles { get; set; }
        
        public MembershipPerson() { }

        public MembershipPerson(string providerName, string name, object providerUserKey, bool isApproved, DateTime lastLoginDate)
            : base(providerName, name, providerUserKey, null, null, null, isApproved, false, DateTime.MinValue, lastLoginDate, DateTime.Now, DateTime.MinValue, DateTime.MinValue)
        {
        }
    }
}