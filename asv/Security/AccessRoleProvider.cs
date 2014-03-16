using System;
using System.Collections.Specialized;
using System.Web;
using System.Web.Security;
using asv.Helpers;
using asv.Models;

namespace asv.Security
{
    public class AccessRoleProvider : RoleProvider
    {
        private string _connectionStringName;        

        internal virtual PetaPoco.Database ConnectToDatabase()
        {
            return new DBContext(_connectionStringName).Database;
        }

        public override void Initialize(string name, NameValueCollection config)
        {
            if (config == null)
                throw new ArgumentNullException("config");

            if (string.IsNullOrEmpty(name))
                name = "AccessRoleProvider";

            base.Initialize(name, config);

            _connectionStringName = Misc.GetConfigValue(config["connectionStringName"], "");         
        }


        public override void AddUsersToRoles(string[] usernames, string[] roleNames)
        {
            throw new System.NotImplementedException();
        }

        public override string ApplicationName
        {
            get
            {
                throw new System.NotImplementedException();
            }
            set
            {
                throw new System.NotImplementedException();
            }
        }

        public override void CreateRole(string roleName)
        {
            throw new System.NotImplementedException();
        }

        public override bool DeleteRole(string roleName, bool throwOnPopulatedRole)
        {
            throw new System.NotImplementedException();
        }

        public override string[] FindUsersInRole(string roleName, string usernameToMatch)
        {
            throw new System.NotImplementedException();
        }

        public override string[] GetAllRoles()
        {
            throw new System.NotImplementedException();
        }

        public override string[] GetRolesForUser(string username)
        {
            string [] roles = new string[]{};

            MembershipPerson user = (MembershipPerson)HttpContext.Current.Cache[username];
            if (user != null && user.Roles != null)
                roles = user.Roles.ToArray();
            else
            {
                using (var db = ConnectToDatabase())
                {
                    string sroles = db.SingleOrDefault<string>("SELECT u.roles from qb_users u WHERE u.id = @0", user.ProviderUserKey);
                    if (!string.IsNullOrEmpty(sroles))
                        roles = sroles.Split(new char[] { ',' });
                }
            }
            return roles;
        }

        public override string[] GetUsersInRole(string roleName)
        {
            throw new System.NotImplementedException();
        }

        public override bool IsUserInRole(string username, string roleName)
        {
            throw new System.NotImplementedException();
        }

        public override void RemoveUsersFromRoles(string[] usernames, string[] roleNames)
        {
            throw new System.NotImplementedException();
        }

        public override bool RoleExists(string roleName)
        {
            throw new System.NotImplementedException();
        }
    }
}