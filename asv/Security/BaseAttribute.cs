using System.Web.Mvc;

namespace asv.Security
{
    public class BaseAttribute : AuthorizeAttribute
    {
        protected override void HandleUnauthorizedRequest(AuthorizationContext filterContext)
        {
            base.HandleUnauthorizedRequest(filterContext);
            filterContext.Controller.TempData["AttrMessage"] = "Нет доступа";
        }
    }
}