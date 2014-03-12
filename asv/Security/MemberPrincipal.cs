using System;
using System.Security.Principal;
using System.Web.Security;

namespace asv.Security
{
    public class MemberPrincipal : RolePrincipal
    {
        public int Id { get; set; }
        public int IsAdmin { get; set; }
        public int ServerLogin { get; set; }

        public string Lastname { get; set; }
        public string Firstname { get; set; }
        public string Middlename { get; set; }
        public string Fio { get; set; }
        public string Schema { get; set; }
        public string Theme { get; set; }

        public MemberPrincipal(string username)
            : base(new GenericIdentity(username))
        {
        }        
    }

}