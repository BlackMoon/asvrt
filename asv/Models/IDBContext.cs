using System.Collections.Generic;
using PetaPoco;

namespace asv.Models
{
    interface IDBContext
    {
        Database Database { get; }
        bool IsAuthor(string unit, int id, int userid);

        int CreateUser(Person person, int authorId);
        int DeleteUser(int id);

        Person GetUser(int id);

        int UpdateUser(int id, Person person, string editor);

        IEnumerable<Person> GetUsers(long page, long itemsPerPage, string query, out long total);
    }
}
