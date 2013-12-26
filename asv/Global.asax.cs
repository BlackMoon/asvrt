using System;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using System.Web.Security;
using asv.Managers.Security;
using System.Web.Caching;
using System.IO;

namespace asv
{   
    public class MvcApplication : System.Web.HttpApplication
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
        }

        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapRoute(
                "Default", // Route name
                "{controller}/{action}/{id}", // URL with parameters
                new { controller = "Main", action = "Index", id = UrlParameter.Optional } // Parameter defaults
            );
        }

        protected void Application_AuthenticateRequest(Object sender, EventArgs e)
        {
            HttpCookie authCookie = HttpContext.Current.Request.Cookies[FormsAuthentication.FormsCookieName];
            if (authCookie != null && !string.IsNullOrEmpty(authCookie.Value))
            {
                FormsAuthenticationTicket ticket = FormsAuthentication.Decrypt(authCookie.Value);
                if (ticket != null && !ticket.Expired)
                {
                    string[] tokens = ticket.Name.Split(':');
                    if (tokens.Length == 2)
                    {
                        string login = tokens[0], passwd = tokens[1];

                        MembershipPerson mp = (MembershipPerson)HttpContext.Current.Cache[login];
                        // logged via auth cookie
                        if (mp == null)
                        {
                            // update authcookie & cache
                            if (Membership.ValidateUser(login, passwd))
                            {
                                mp = (MembershipPerson)Membership.GetUser(login);
                                if (mp.IsApproved)
                                {
                                    HttpContext.Current.Cache.Add(login, mp, null, Cache.NoAbsoluteExpiration, new TimeSpan(0, 20, 0), CacheItemPriority.Normal, null);
                                    FormsAuthentication.SetAuthCookie(login + ":" + passwd, ticket.IsPersistent);

                                    asv.Managers.LogManager.WriteLine("Пользователь " + mp.Login + " (" + (Request.IsLocal ? "127.0.0.1" : Request.UserHostAddress) + "). Вход в систему.");
                                }
                                else
                                    FormsAuthentication.SignOut();
                            }
                            else
                                FormsAuthentication.SignOut();
                        }

                        MemberPrincipal user = null;
                        // valid user
                        if (mp != null)
                        {
                            user = new MemberPrincipal(HttpContext.Current.User.Identity, null);
                            user.Id = mp.Id;
                            user.IsAdmin = mp.IsAdmin;
                            user.ServerLogin = mp.ServerLogin == 1 ? true : false;
                            user.Login = mp.UserName;
                            user.Lastname = mp.Lastname;
                            user.Firstname = mp.Firstname;
                            user.Middlename = mp.Middlename;                            
                            user.Fio = mp.Fio;
                            user.Theme = mp.Theme;

                            if (user.ServerLogin)                            
                                user.Schema = mp.Schema;
                        }
                        HttpContext.Current.User = user;
                    }
                }
            }
        }

        protected void Application_Start()
        {
            string repPath = Server.MapPath(@"\Reports");
            Directory.CreateDirectory(repPath);
            
            foreach (string dir in Directory.GetDirectories(repPath))
                Directory.Delete(dir, true);    

            AreaRegistration.RegisterAllAreas();

            RegisterGlobalFilters(GlobalFilters.Filters);
            RegisterRoutes(RouteTable.Routes);

            // Upper for Cyrillic symbols
            System.Data.SQLite.SQLiteFunction.RegisterFunction(typeof(asv.Helpers.UpperFunction)); 
        }
    }
}