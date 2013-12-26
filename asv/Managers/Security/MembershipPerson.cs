using System;
using System.Web.Security;
using System.Collections.Generic;
using asv.Models;
using Newtonsoft.Json;
using PetaPoco;

namespace asv.Managers.Security
{
    [TableName("qb_bases")]
    public class Userdb
    {
        public int Auth { get; set; }        
        public string Conn { get; set; }        
    }

    [Serializable]
    [TableName("qb_users")]
    [PrimaryKey("id")]    
    public class MembershipPerson : MembershipUser, IKey
    {        
        public int Id { get; set; }        
        public int IsAdmin { get; set; }
        [Column("isapproved")]
        public int Locked { get; set; }
        public int ServerLogin { get; set; }

        public string Login { get; set; }        
        public string Password { get; set; }
        public string Salt { get; set; }        
        public string Lastname { get; set; }        
        public string Firstname { get; set; }        
        public string Middlename { get; set; }
<<<<<<< HEAD
=======
        public string Dept { get; set; }                                        // код департамента АСВ
>>>>>>> 4c1b310c125b24e32aff61490787cac0feb17dd8
        public string Theme { get; set; }
        [ResultColumn]
        public IList<Userdb> Bases { get; set; }

        [Ignore]
        [JsonIgnore]
        public string Fio
        {
            get
            {
                string fio = Lastname + " " + Firstname[0] + ".";
                
                if (!string.IsNullOrEmpty(Middlename))
                    fio += " " + Middlename[0] + ".";
                
                return fio;
            }
        }

        [Ignore]
        [JsonIgnore]
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

        [Ignore]
        [JsonIgnore]
        public override DateTime CreationDate {
            get { return base.CreationDate;  }
        }

        [Ignore]
        [JsonIgnore]
        public override DateTime LastActivityDate { get; set; }

        [Ignore]
        [JsonIgnore]
        public override DateTime LastLockoutDate {
            get { return base.LastLockoutDate;  }
        }

        [Ignore]
        [JsonIgnore]
        public override DateTime LastLoginDate { get; set; }

        [Ignore]
        [JsonIgnore]
        public override DateTime LastPasswordChangedDate {
            get { return base.LastPasswordChangedDate;  }
        }

        [Ignore]
        [JsonIgnore]
        public override bool IsApproved 
        {
            get { return base.IsApproved;  }
            set { IsApproved = value;  } 
        }

        [Ignore]
        [JsonIgnore]
        public override bool IsOnline {
            get { return base.IsOnline; } 
        }

        [Ignore]
        [JsonIgnore]
        public override bool IsLockedOut
        {
            get { return base.IsLockedOut; }
        }

        [Ignore]
        public override string Email { get; set; }
        
        [Ignore]
        public override string PasswordQuestion {
            get { return base.PasswordQuestion;  }
        }

        [Ignore]
        [JsonIgnore]
        public override string ProviderName { 
            get { return base.ProviderName; } 
        }

        [Ignore]
        [JsonIgnore]
        public override object ProviderUserKey {
            get { return base.ProviderUserKey; }
        }

        [Ignore]
        [JsonIgnore]
        public override string UserName {
            get { return base.UserName; }
        }

        public MembershipPerson() { }

        public MembershipPerson(string providerName, int id, string login, string lastName, string firstName, string middleName, bool isApproved, bool isAdmin, bool serverLogin, string comment)
            : base(providerName, login, id, null, null, comment, isApproved, false, DateTime.MinValue, DateTime.MinValue, DateTime.Now, DateTime.MinValue, DateTime.MinValue) {

            Id = id;
            Login = login;
            Lastname = lastName;
            Firstname = firstName;
            Middlename = middleName;    
                
            IsAdmin = isAdmin ? 1 : 0;
            Locked = isApproved ? 0 : 1;
            ServerLogin = serverLogin ? 1 : 0;
        }
    }
}