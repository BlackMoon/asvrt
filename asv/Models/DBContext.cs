using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Web.Helpers;
using System.Web.Security;
using asv.Security;
using PetaPoco;

namespace asv.Models
{
    public class DBContext : IDBContext, IDisposable
    {
        private const string    _connectionStringName = "adminDB";

        private Database _database;

        public Database Database
        {
            get
            {
                return _database;
            }
        }

        public DBContext() : this(_connectionStringName) { }

        public DBContext(string connectionStringName)
        {
            _database = new Database(connectionStringName);
            _database.EnableAutoSelect = false;
        }

        public int CreateUser(Person person, int authorId)
        {   
            string roles = string.Join(",", person.Roles);
            int id = _database.Execute("INSERT INTO qb_users(login, lastname, firstname, middlename, isadmin, isapproved, comment, roles, serverlogin, theme) VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9); \nSELECT last_insert_rowid();", 
                person.Login, person.LastName, person.FirstName, person.MiddleName, person.IsAdmin, person.IsApproved, person.Comment, roles, person.ServerLogin, person.Theme);

            Debug.WriteLine(_database.LastSQL);

            // membership            
            int saltLength = (Membership.Provider as AccessMembershipProvider).SaltLength;
            string salt = Crypto.GenerateSalt(saltLength);
            string password = Crypto.Hash(person.Password + "{" + salt + "}");

            _database.Execute("INSERT INTO membership(userid, password, salt) VALUES(@0, @1, @2)", id, password, salt);
            Debug.WriteLine(_database.LastSQL);            

            // user bases
            int ix = 0;
            List<string> keys = new List<string>();
            List<object> vals = new List<object>();

            foreach (Userdb udb in person.Bases)
            {
                keys.Add("@" + string.Join(", @", new int[] { ix, ix + 1, ix + 2 }));
                vals.AddRange(new object[] { udb.Conn, udb.Auth, person.Id });
                ix += 3;
            }

            string sql = "INSERT INTO qb_bases(conn, auth, usercreate) VALUES (" + string.Join(")", keys);
            _database.Execute(sql, vals);
            Debug.WriteLine(_database.LastSQL);
            
            return id;
        }

        public Person GetUser(int id)
        {
            Person user = null;

            List<Person> users = _database.Fetch<Person, Userdb, Person>(new PersonRelator().Map, @"SELECT u.id, u.comment, u.serverlogin, u.theme, b.conn, b.auth FROM qb_users u 
                                                                                                    LEFT JOIN qb_bases b ON b.usercreate = u.id WHERE u.id = @0", id);
            if (users.Count > 0)            
                user = users[0];

            return user;            
        }

        public int UpdateUser(int id, Person person, string editor)
        {
            string roles = null;            
            if (person.Roles != null)
                roles = string.Join(",", person.Roles);

            _database.Update<Person>(@"SET login = @1, lastname = @2, firstname = @3, middlename = @4, isadmin = @5, isapproved = @6, comment = @7, roles = @8, serverlogin = @9, theme = @10 WHERE id = @0;
                                       DELETE FROM qb_bases WHERE usercreate = @0;",
               id, person.Login, person.LastName, person.FirstName, person.MiddleName, person.IsAdmin, person.IsApproved, person.Comment, roles, person.ServerLogin, person.Theme);

            Debug.WriteLine(_database.LastSQL);

            // password & salt
            string password = null, salt = null;
            if (!string.IsNullOrEmpty(person.Password))
            {
                int saltLength = (Membership.Provider as AccessMembershipProvider).SaltLength;
                salt = Crypto.GenerateSalt(saltLength);
                password = Crypto.Hash(person.Password + "{" + salt + "}");

                _database.Execute("UPDATE membership SET password = @1, salt = @2 WHERE userid = @0", id, password, salt);
            }
            Debug.WriteLine(_database.LastSQL);

            // user bases
            int ix = 0;            
            List<string> keys = new List<string>();            
            List<object> vals = new List<object>();

            foreach (Userdb udb in person.Bases)
            {
                keys.Add("@" + string.Join(", @", new int[]{ ix, ix + 1, ix + 2 }));
                vals.AddRange(new object[] { udb.Conn, udb.Auth, person.Id });
                ix += 3;
            }

            string sql = "INSERT INTO qb_bases(conn, auth, usercreate) VALUES (" + string.Join("), (", keys) + ")";
            _database.Execute(sql, vals.ToArray());

            Debug.WriteLine(_database.LastSQL);
            
            return 1;
        }

        public void Dispose()
        {
            _database.Dispose();
        }
    }
}