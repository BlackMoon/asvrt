using System;
using System.Web.Caching;
using System.Web.Mvc;
using System.Web.Security;
using asv.Managers.Security;
using asv.Models;
using asv.Helpers;
using asv.Managers;

namespace asv.Controllers
{
    public class AccountController : Controller
    {
        [HttpPost]
        public JsonNetResult LogOn(LogOnModel model, string returnUrl)
        {
            byte result = 0;
            string msg = "Неверные логин или пароль!";

            int isAdmin = 0;
            int serverLogin = 0;

            string fio = null;
            string schema = null;
            
            if (Membership.ValidateUser(model.Login, model.Password))
            {
                MembershipPerson mp = (MembershipPerson)Membership.GetUser(model.Login);
                if (mp.IsApproved)
                {
                    HttpContext.Cache.Add(model.Login, mp, null, Cache.NoAbsoluteExpiration, new TimeSpan(0, 20, 0), CacheItemPriority.Normal, null);
                    FormsAuthentication.SetAuthCookie(model.Login + ":" + model.Password, model.RememberMe);

                    isAdmin = mp.IsAdmin;
                    serverLogin = mp.ServerLogin;
                    
                    fio = mp.Fio;
                    schema = mp.Schema;
                    
                    msg = null;
                    result = 1;

                    LogManager.WriteLine("Пользователь " + mp.Login + " (" + (Request.IsLocal ? "127.0.0.1" : Request.UserHostAddress) + "). Вход в систему.");
                }
                else
                    msg = "Пользователь заблокирован";
            }

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, fio = fio, isadmin = isAdmin, serverlogin = serverLogin, schema = schema };
            return jr;
        }

        public JsonNetResult LogOff()
        {
            Response.RemoveOutputCacheItem("/Main/GetTables"); 

            FormsAuthentication.SignOut();
            Session.Abandon();

            // clear cache
            System.Security.Principal.IIdentity identity = User.Identity;
                        
            string[] tokens = identity.Name.Split(':');
            string key = (tokens.Length == 2) ? tokens[0] : identity.Name;
            
            HttpContext.Cache.Remove(key);
            LogManager.WriteLine("Пользователь " + key + ". Выход.");

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = 1 };
            return jr;
        }
    }
}