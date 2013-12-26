using System.Web.Mvc;

namespace asv.Managers.Security
{
    public class AdminAuthorize : AuthorizeAttribute
    {
        public override void OnAuthorization(AuthorizationContext filterContext)
        {
            base.OnAuthorization(filterContext);
            if (filterContext.HttpContext.Request.IsAuthenticated)
            {
                MemberPrincipal user = (MemberPrincipal)filterContext.HttpContext.User;
                if (user.IsAdmin == 0)
                    filterContext.Result = new HttpUnauthorizedResult();
            }
        }
    }
}