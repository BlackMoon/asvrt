using System.Web;
using System.Web.Mvc;

namespace asv.Security
{
    public class GrantAttribute : BaseAttribute
    {
        protected override bool AuthorizeCore(HttpContextBase httpContext)
        {
            bool isAutorized = base.AuthorizeCore(httpContext);
            if (isAutorized)
            {
                MemberPrincipal user = (MemberPrincipal)httpContext.User;

                /*if (_unitsSplit.Length > 0)
                {
                    // проверка разрешений                    
                    if (_unitsSplit.Any(u => { return user.IsInGrant(u, Perm); }))
                        return true;

                    // проверка автора
                    string action = httpContext.Request.RequestContext.RouteData.Values["action"].ToString();
                    if (action.StartsWith("Delete", StringComparison.CurrentCultureIgnoreCase) || action.StartsWith("Update", StringComparison.CurrentCultureIgnoreCase))
                    {
                        Guid id;
                        if (Guid.TryParse(httpContext.Request.Params["id"], out id))
                        {
                            IDBContext dbContext = new DBContext();
                            return _unitsSplit.All(u => { return dbContext.IsAuthor(u, id, user.Id); });
                        }

                        return false;
                    }
                    // ни одно условие не выполнено
                    isAutorized = false;
                }*/
            }
            return isAutorized;
        }

    }
}