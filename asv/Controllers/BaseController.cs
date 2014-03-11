using System.Web.Mvc;
using asv.Security;
using PetaPoco;

namespace asv.Controllers
{
    public class BaseController : Controller
    {
        protected Database db;        

        public BaseController()
        {
            db = new Database("adminDB");
            db.EnableAutoSelect = false;
        }

        protected virtual new MemberPrincipal User
        {
            get { return (MemberPrincipal)base.User; }
        }      
    }
}
