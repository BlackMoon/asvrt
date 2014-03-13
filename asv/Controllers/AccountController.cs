﻿using System;
using System.Linq;
using System.Web.Caching;
using System.Web.Mvc;
using System.Web.Security;
using asv.Security;
using asv.Models;
using asv.Helpers;
using asv.Managers;

namespace asv.Controllers
{
    public class AccountController : Controller
    {
        public JsonNetResult LogOn()
        {
            object msg = TempData["AttrMessage"];

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { message = msg };
            return jr;
        }

        [HttpPost]
        public JsonNetResult LogOn(LogOnModel model)
        {
            byte result = 0;
            string msg = null;

            int id = 0;
            int isAdmin = 0;
            int serverLogin = 0;

            string fio = null;
            string schema = null;
            string[] roles = null;

            if (ModelState.IsValid)
            {
                try
                {
                    if (Membership.ValidateUser(model.Login, model.Password))
                    {
                        MembershipPerson mp = (MembershipPerson)Membership.GetUser(model.Login);

                        HttpContext.Cache.Add(model.Login, mp, null, Cache.NoAbsoluteExpiration, new TimeSpan(0, 20, 0), CacheItemPriority.Normal, null);
                        FormsAuthentication.SetAuthCookie(model.Login + ":" + model.Password, model.RememberMe);

                        id = mp.Id;
                        isAdmin = mp.IsAdmin;
                        serverLogin = mp.ServerLogin;
                        fio = mp.Fio;
                        schema = mp.Schema;
                        
                        if (mp.Roles != null)
                            roles = mp.Roles.ToArray();

                        result = 1;

                        LogManager.WriteLine("Пользователь " + mp.Login + " (" + (Request.IsLocal ? "127.0.0.1" : Request.UserHostAddress) + "). Вход в систему.");
                    }
                    else
                        msg = "Неверные логин или пароль!";

                }
                catch (Exception e)
                {
                    msg = e.Message;  
                }                
            }
            else
                msg = string.Join("<br>", ModelState.Values.SelectMany(x => x.Errors).Select(x => x.ErrorMessage));

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = result, message = msg, id = id, fio = fio, isadmin = isAdmin, serverlogin = serverLogin, schema = schema, roles = roles };
            return jr;
        }

        [Authorize]
        public JsonNetResult LogOff()
        {
            Response.RemoveOutputCacheItem("/Main/GetTables"); 
            FormsAuthentication.SignOut();

            string key = User.Identity.Name;
            HttpContext.Cache.Remove(key);
            LogManager.WriteLine("Пользователь " + key + ". Выход.");

            JsonNetResult jr = new JsonNetResult();
            jr.Data = new { success = 1 };
            return jr;
        }
    }
}