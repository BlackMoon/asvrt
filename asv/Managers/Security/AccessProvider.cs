using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Web.Security;
using asv.Models;
using asv.Helpers;
using PetaPoco;
using System.Web.Helpers;
using System.Configuration;
using System.Web.Caching;
using System.Web;

namespace asv.Managers.Security
{
    public class AccessProvider : MembershipProvider
    {
        private int         _minRequiredPasswordLength;
        private string      _connectionStringName;
        private string      _syslogin = "system";
        private Database    _db;

        public override void Initialize(string name, NameValueCollection config)
        {
            if (config == null)
                throw new ArgumentNullException("config");

            if (String.IsNullOrEmpty(name))
                name = "AccessProvider";
            
            base.Initialize(name, config);

            _connectionStringName = Misc.GetConfigValue(config["connectionStringName"], "");
            _minRequiredPasswordLength = Misc.GetConfigValue(config["minRequiredPasswordLength"], 6);
            
            _db = new Database(_connectionStringName);
            _db.EnableAutoSelect = false;
        }

        public override string ApplicationName
        {
            get
            {
                throw new NotImplementedException();
            }
            set
            {
                throw new NotImplementedException();
            }
        }

        public override bool ChangePassword(string username, string oldPassword, string newPassword)
        {
            throw new NotImplementedException();
        }

        public override bool ChangePasswordQuestionAndAnswer(string username, string password, string newPasswordQuestion, string newPasswordAnswer)
        {
            throw new NotImplementedException();
        }

        public long CreateUser(MembershipPerson mp)
        {
            long id = 0;
            // hash with salt (sha-256)
            if (!string.IsNullOrEmpty(mp.Password))
            {
                mp.Salt = Crypto.GenerateSalt(16);
                mp.Password = Crypto.Hash(mp.Password + "{" + mp.Salt + "}", Membership.HashAlgorithmType);
            }
            id = (long)_db.Insert(mp);

            foreach (Userdb udb in mp.Bases)
            {
                _db.Execute("INSERT INTO qb_bases(conn, auth, usercreate) VALUES(@0, @1, @2)", udb.Conn, udb.Auth, id);
            }
            return id;
        }

        public override MembershipUser CreateUser(string username, string password, string email, string passwordQuestion, string passwordAnswer, bool isApproved, object providerUserKey, out MembershipCreateStatus status)
        {
            throw new NotImplementedException();
        }

        public int DeleteUser(int id)
        {
            _db.Delete<Userdb>("WHERE usercreate = @0", id);
            return _db.Delete<MembershipPerson>("WHERE id = @0", id);            
        }

        public override bool DeleteUser(string username, bool deleteAllRelatedData)
        {
            throw new NotImplementedException();
        }

        public override bool EnablePasswordReset
        {
            get { throw new NotImplementedException(); }
        }

        public override bool EnablePasswordRetrieval
        {
            get { throw new NotImplementedException(); }
        }

        public override MembershipUserCollection FindUsersByEmail(string emailToMatch, int pageIndex, int pageSize, out int totalRecords)
        {
            throw new NotImplementedException();
        }

        public override MembershipUserCollection FindUsersByName(string usernameToMatch, int pageIndex, int pageSize, out int totalRecords)
        {
            throw new NotImplementedException();
        }

        public List<dynamic> GetAllUsers(int page, int limit, string query, out long total)
        {            
            // locked = 1 - approved
            string sql = "SELECT u.id, u.login, u.lastname, u.firstname, u.middlename, CAST(1 - u.isapproved AS int) locked, CAST(u.isadmin AS int) isadmin FROM qb_users u WHERE u.login <> '" + _syslogin + "'";
            if (!string.IsNullOrEmpty(query))
                sql += " AND (" + Misc.FilterField("u.login", query) + " OR " + Misc.FilterField1("u.lastname", query) + " OR " + Misc.FilterField1("u.firstname", query) + " OR " + Misc.FilterField1("u.middlename", query) + ")";

            sql += " ORDER BY u.login";

            Page<dynamic> p = _db.Page<dynamic>(page, limit, sql);            
            total = p.TotalItems;
            return p.Items;
        }

        public override MembershipUserCollection GetAllUsers(int page, int limit, out int total)
        {
            throw new NotImplementedException();
        }

        public override int GetNumberOfUsersOnline()
        {
            throw new NotImplementedException();
        }

        public override string GetPassword(string username, string answer)
        {
            throw new NotImplementedException();
        }

        // для principal
        public override MembershipUser GetUser(string username, bool userIsOnline)
        {  
            var person = _db.Single<dynamic>("SELECT u.id, u.login, u.lastname, u.firstname, u.middlename, u.isapproved, u.isadmin, u.comment, u.serverlogin, u.theme FROM qb_users u WHERE u.login = @0", username);

            MembershipPerson mp = new MembershipPerson(this.Name, (int)person.id, username, person.lastname, person.firstname, person.middlename, person.isapproved, person.isadmin, person.serverlogin, person.comment);

            if (mp.ServerLogin == 1)            
                mp.Bases = _db.Fetch<Userdb>("SELECT b.conn, b.auth FROM qb_bases b WHERE b.usercreate = @0 AND b.auth = 1", mp.Id);

            mp.Theme = person.theme;

            return mp;
        }

        // для формы
        public override MembershipUser GetUser(object providerUserKey, bool userIsOnline)
        {  
            var person = _db.Single<dynamic>("SELECT u.id, u.comment, u.serverlogin, u.theme FROM qb_users u WHERE u.id = @0", providerUserKey);
            
            MembershipPerson mp = new MembershipPerson(this.Name, (int)person.id, null, null, null, null, true, false, person.serverlogin, person.comment);            
            mp.Bases = _db.Fetch<Userdb>("SELECT b.conn, b.auth FROM qb_bases b WHERE b.usercreate = @0", mp.Id);
            mp.Theme = person.theme;

            return mp;
        }

        public override string GetUserNameByEmail(string email)
        {
            throw new NotImplementedException();
        }

        public int LockUser(int id, int locked)
        {
            return _db.Update<MembershipPerson>("SET isapproved = @1 WHERE id = @0", id, locked);
        }

        public override int MaxInvalidPasswordAttempts
        {
            get { throw new NotImplementedException(); }
        }

        public override int MinRequiredNonAlphanumericCharacters
        {
            get { throw new NotImplementedException(); }
        }

        public override int MinRequiredPasswordLength
        {
            get { return _minRequiredPasswordLength; }
        }

        public override int PasswordAttemptWindow
        {
            get { throw new NotImplementedException(); }
        }

        public override MembershipPasswordFormat PasswordFormat
        {
            get { throw new NotImplementedException(); }
        }

        public override string PasswordStrengthRegularExpression
        {
            get { throw new NotImplementedException(); }
        }

        public override bool RequiresQuestionAndAnswer
        {
            get { throw new NotImplementedException(); }
        }

        public override bool RequiresUniqueEmail
        {
            get { throw new NotImplementedException(); }
        }

        public override string ResetPassword(string username, string answer)
        {
            throw new NotImplementedException();
        }

        public override bool UnlockUser(string userName)
        {
            throw new NotImplementedException();
        }

        public void UpdateUser(MembershipPerson mp)
        {
            if (!string.IsNullOrEmpty(mp.Password))
            {
                mp.Salt = Crypto.GenerateSalt(16);
                mp.Password = Crypto.Hash(mp.Password + "{" + mp.Salt + "}", Membership.HashAlgorithmType);
            }

            _db.Update<MembershipPerson>(@"SET login = @1, password = CASE WHEN @2 IS NULL THEN password WHEN @2 = '' THEN password ELSE @2 END, salt = IFNULL(@3, salt), 
                                           lastname = @4, firstname = @5, middlename = @6, isadmin = @7, isapproved = @8, comment = @9, serverlogin = @10, theme = @11 WHERE id = @0;
                                           DELETE FROM qb_bases WHERE usercreate = @0;",
                       mp.Id, mp.Login, mp.Password, mp.Salt, mp.Lastname, mp.Firstname, mp.Middlename, mp.IsAdmin, mp.Locked, mp.Comment, mp.ServerLogin, mp.Theme);

            foreach (Userdb udb in mp.Bases)
            {
                _db.Execute("INSERT INTO qb_bases(conn, auth, usercreate) VALUES(@0, @1, @2)", udb.Conn, udb.Auth, mp.Id);                
            }

            HttpContext.Current.Cache.Remove(mp.Login);
            HttpContext.Current.Cache.Add(mp.Login, mp, null, Cache.NoAbsoluteExpiration, new TimeSpan(0, 20, 0), CacheItemPriority.Normal, null);            
        }

        public override void UpdateUser(MembershipUser user)
        {
            throw new NotImplementedException();
        }

        public override bool ValidateUser(string username, string password)
        {
            bool result = false;
            string msg = null;

            try
            {
                var q = _db.Single<dynamic>("SELECT u.password, u.salt, u.serverlogin, b.conn FROM qb_users u LEFT JOIN qb_bases b ON b.usercreate = u.id AND b.auth = 1 WHERE u.login = @0", username);
                
                // авторизация на сервере
                if (q.serverlogin)
                {
                    ConnectionStringSettings css = ConfigurationManager.ConnectionStrings[q.conn];
                    if (css != null)
                    {                        
                        string conStr = Misc.ConnCredentials(css.ConnectionString, username, password);
                        
                        using (System.Data.Odbc.OdbcConnection con = new System.Data.Odbc.OdbcConnection(conStr))
                        {
                            con.Open();                            
                            con.Close();                           

                            result = true;
                        }
                    }
                }
                else
                    result = (q.password == Crypto.Hash(password + "{" + q.salt + "}", Membership.HashAlgorithmType));
            }
            catch(Exception e)
            {
                msg = e.Message;
            }

            return result;
        }
    }
}