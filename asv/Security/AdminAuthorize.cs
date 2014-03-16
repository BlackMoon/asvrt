using System.Web;

namespace asv.Security
{
    public class AdminAuthorize : BaseAttribute
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