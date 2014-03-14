using System.Web;
using System.Web.Mvc;
using asv.Models;

namespace asv.Security
{
    public class GrantAttribute : BaseAttribute
    {
        protected override bool AuthorizeCore(HttpContextBase httpContext)
        {
            bool isAutorized = base.AuthorizeCore(httpContext);
            if (!isAutorized)
            {
                string unit = null;
                MemberPrincipal user = (MemberPrincipal)httpContext.User;
                
                // проверка автора
                string action = httpContext.Request.RequestContext.RouteData.Values["action"].ToString();
                switch (action)
                {
                    case "deletequery":
                    case "getquery":
                    case "updatequery":
                        unit = "query";
                        break;
                    case "deletetpl":
                    case "gettpl":
                    case "updatetpl":
                        unit = "template";
                        break;
                }

                if (unit != null)
                {
                    int id;
                    if (int.TryParse(httpContext.Request.Params["id"], out id))
                    {
                        IDBContext dbContext = new DBContext();
                        return dbContext.IsAuthor(unit, id, user.Id);
                    }                    
                }
            }
            return isAutorized;
        }

    }
}