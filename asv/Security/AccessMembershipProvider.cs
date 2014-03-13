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
using System.Text.RegularExpressions;

namespace asv.Security
{
    public class AccessMembershipProvider : MembershipProvider
    {
        private int         _maxInvalidPasswordAttempts;
        private int         _minRequiredPasswordLength;
        private int         _minRequiredUsernameLength;
        private int         _passwordAnswerAttemptLockoutDuration;
        private int         _saltLength;

        private string      _connectionStringName;        
        
        private Database    _db;

        internal virtual PetaPoco.Database ConnectToDatabase()
        {
            return new DBContext(_connectionStringName).Database;
        }

        public void InitConfig(NameValueCollection config)
        {
            _maxInvalidPasswordAttempts = Misc.GetConfigValue(config["maxInvalidPasswordAttempts"], 5);
            _minRequiredPasswordLength = Misc.GetConfigValue(config["minRequiredPasswordLength"], 7);
            _minRequiredUsernameLength = Misc.GetConfigValue(config["minRequiredUsernameLength"], 7);
            _passwordAnswerAttemptLockoutDuration = Misc.GetConfigValue(config["passwordAnswerAttemptLockoutDuration"], 10);
            _saltLength = Misc.GetConfigValue(config["saltLength"], 16);
        }

        public override void Initialize(string name, NameValueCollection config)
        {
            if (config == null)
                throw new ArgumentNullException("config");

            if (String.IsNullOrEmpty(name))
                name = "AccessMembershipProvider";
            
            base.Initialize(name, config);

            _connectionStringName = Misc.GetConfigValue(config["connectionStringName"], "");
            InitConfig(config);
            
            _db = new Database(_connectionStringName);
            _db.EnableAutoSelect = false;
        }

        private bool CheckPassword(PetaPoco.Database db, bool serverLogin, int userId, string hashedPassword, string password, string salt)
        {
            bool verificationSucceeded = true;

            // авторизация на сервере
            if (!serverLogin)            
                verificationSucceeded = (hashedPassword != null && hashedPassword == Crypto.Hash(password + "{" + salt + "}"));
            


            if (verificationSucceeded)
            {
                // Reset password failure count on successful credential check
                db.Execute(@"UPDATE membership SET failedpasswordattemptcount = 0 WHERE userid = @0", userId);
            }
            else
            {
                int failures = db.ExecuteScalar<int>("SELECT failedpasswordattemptcount FROM membership WHERE userid = @0", userId);
                if (failures < _maxInvalidPasswordAttempts)
                {
                    db.Execute(@"UPDATE membership SET failedpasswordattemptcount = @1 WHERE userid = @0", userId, failures + 1, DateTime.UtcNow);
                }
            }

            return verificationSucceeded;
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
    
        public override MembershipUser CreateUser(string username, string password, string email, string passwordQuestion, string passwordAnswer, bool isApproved, object providerUserKey, out MembershipCreateStatus status)
        {
            throw new NotImplementedException();
        }

        public int DeleteUser(int id)
        {
            throw new NotImplementedException();           
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
            MembershipPerson mp = null;

            using (var db = ConnectToDatabase())
            {
                Person user = null;
                List<Person> users = db.Fetch<Person, Userdb, Person>(new PersonRelator().Map, @"SELECT u.id, u.lastname, u.firstname, u.middlename, u.isadmin, u.serverlogin, u.theme, b.conn, b.auth FROM qb_users u 
                                                                                                 LEFT JOIN qb_bases b ON b.usercreate = u.id AND b.auth = 1 WHERE u.login = @0", username);
                if (users.Count > 0)
                {
                    user = users[0];

                    mp = new MembershipPerson(this.Name, username, user.Id, true, user.LastLoginDate);
                    mp.IsAdmin = user.IsAdmin;
                    mp.Lastname = user.LastName;
                    mp.Firstname = user.FirstName;
                    mp.Middlename = user.MiddleName;
                    mp.Theme = user.Theme;

                    mp.Fio = user.LastName + " " + user.FirstName[0] + ".";
                    if (!string.IsNullOrEmpty(user.MiddleName))
                        mp.Fio += " " + user.MiddleName[0] + ".";

                    mp.Bases = user.Bases;
                }
            }

            return mp;
        }
        
        public override MembershipUser GetUser(object providerUserKey, bool userIsOnline)
        {
            throw new NotImplementedException();
        }

        public override string GetUserNameByEmail(string email)
        {
            throw new NotImplementedException();
        }

        public override int MaxInvalidPasswordAttempts
        {
            get { return _maxInvalidPasswordAttempts; }
        }

        public override int MinRequiredNonAlphanumericCharacters
        {
            get { throw new NotImplementedException(); }
        }

        public override int MinRequiredPasswordLength
        {
            get { return _minRequiredPasswordLength; }
        }

        public int MinRequiredUsernameLength
        {
            get { return _minRequiredUsernameLength; }
        }

        public override int PasswordAttemptWindow
        {
            get { throw new NotImplementedException(); }
        }

        public int SaltLength
        {
            get { return _saltLength; }
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
            throw new NotImplementedException();
        }

        public override void UpdateUser(MembershipUser user)
        {
            throw new NotImplementedException();
        }

        public override bool ValidateUser(string username, string password)
        {
            if (string.IsNullOrEmpty(username))
                throw new Exception("Требуется поле Логин.");

            if (string.IsNullOrEmpty(password))
                throw new Exception("Требуется поле Пароль.");

            using (var db = ConnectToDatabase())
            {
                var q = db.SingleOrDefault<dynamic>(@"SELECT u.id, u.comment, u.isapproved, u.serverlogin, m.password hash, m.salt, m.islockedout, datetime('now') - m.lastlogindate lockoutduration, b.conn 
                                                      FROM membership m JOIN qb_users u ON u.id = m.userid LEFT JOIN qb_bases b ON b.usercreate = u.id AND b.auth = 1 WHERE u.login = @0", username);
                if (q != null)
                {
                    // заблокирован
                    if (!q.isapproved)
                        throw new Exception("Пользователь заблокирован.<br>" + q.comment);

                    // заблокирован системой
                    if (q.islockedout && q.lockoutduration <= _passwordAnswerAttemptLockoutDuration)
                        throw new Exception(q.comment + ".<br>Повторите попытку позднее");

                    bool verificationSucceeded = false;
                    // авторизация на сервере                    
                    if (q.serverlogin)
                    {
                        try
                        {
                            ConnectionStringSettings css = ConfigurationManager.ConnectionStrings[q.conn];
                            if (css != null)
                            {
                                string conStr = Misc.ConnCredentials(css.ConnectionString, username, password);

                                using (System.Data.Odbc.OdbcConnection con = new System.Data.Odbc.OdbcConnection(conStr))
                                {
                                    con.Open();
                                    con.Close();
                                    verificationSucceeded = true;
                                }
                            }
                        }
                        catch
                        {
                        }
                    }
                    else
                        verificationSucceeded = (q.hash != null && q.hash == Crypto.Hash(password + "{" + q.salt + "}"));


                    return verificationSucceeded;
                }
                else
                    return false;
            }               
        }

        public void OnValidateUsername(ValidatePasswordEventArgs args)
        {
            try
            {
                if (args.UserName.Length < _minRequiredUsernameLength)
                    throw new ArgumentException("Слишком короткий логин! Минимальная длина логина - " + _minRequiredUsernameLength + " символов.");

                Regex rx = new Regex(@"^\w+$");
                if (!rx.IsMatch(args.UserName))
                    throw new ArgumentException("Логин. Можно использовать только буквы латинского алфавита (a–z), цифры и знак подчеркивания(\'_\').");

                if (args.UserName[0] == '_')
                    throw new ArgumentException("Логин. Первый символ должен быть латинской буквой (a–z) или цифрой.");
            }
            catch (ArgumentException e)
            {
                args.FailureInformation = e;
                args.Cancel = true;
            }
        }
    }
}