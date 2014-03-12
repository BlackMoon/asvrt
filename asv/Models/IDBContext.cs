using PetaPoco;

namespace asv.Models
{
    interface IDBContext
    {
        Database Database { get; }

        int CreateUser(Person person, int authorId);

        Person GetUser(int id);

        int UpdateUser(int id, Person person, string editor);
    }
}
