using System;
using System.Collections.Generic;
using System.Security.Principal;

namespace asv.Managers.Security
{
    public class MemberPrincipal : GenericPrincipal
    {
        public int Id { get; set; }
        public int IsAdmin { get; set; }
        public bool ServerLogin { get; set; }
        public string Login { get; set; }
        public string Lastname { get; set; }
        public string Firstname { get; set; }
        public string Middlename { get; set; }
        public string Fio { get; set; }
        public string Dept { get; set; }                
        public string Schema { get; set; }
        public string Theme { get; set; }                

        public MemberPrincipal(IIdentity identity, string[] roles) : base(identity, roles) { }
    }
}