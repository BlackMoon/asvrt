using System.Web;
using System.Web.Mvc;

namespace asv.Security
{
    public class AdminAuthorize : AuthorizeAttribute
    {
        protected override bool AuthorizeCore(HttpContextBase httpContext)
        {
            bool isAutorized = base.AuthorizeCore(httpContext);
            if (isAutorized)
            {
                MemberPrincipal user = (MemberPrincipal)httpContext.User;
                return user.IsAdmin == 1;
            }
            return isAutorized;
        }
    }
}