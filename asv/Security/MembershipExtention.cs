using System;
using System.Web;
using System.Web.Security;
using asv.Models;

namespace asv.Security
{
    public static class MembershipExtention
    {
        public static void OnValidatePassword(ValidatePasswordEventArgs args)
        {
            try
            {
                if (args.Password.Length < Membership.MinRequiredPasswordLength)
                    throw new ArgumentException("Слишком короткий пароль! Минимальная длина пароля - " + Membership.MinRequiredPasswordLength + " символов.");

                if (args.Password == args.UserName)
                    throw new ArgumentException("Пароль не должен совпадать с логином.");
            }
            catch (ArgumentException e)
            {
                args.FailureInformation = e;
                args.Cancel = true;
            }
        }

        public static object CreateUserAndAccount(this MembershipProvider provider, Person person)
        {
            ValidatePasswordEventArgs e = new ValidatePasswordEventArgs(person.Login, person.Password, false);

            // login validate
            if (!string.IsNullOrEmpty(person.Login))
            {
                (Membership.Provider as AccessMembershipProvider).OnValidateUsername(e);

                if (e.Cancel)
                    throw new MembershipCreateUserException(e.FailureInformation.Message);
            }

            // password validate
            if (!string.IsNullOrEmpty(person.Password))
            {
                OnValidatePassword(e);

                if (e.Cancel)
                    throw new MembershipCreateUserException(e.FailureInformation.Message);
            }

            MemberPrincipal user = (MemberPrincipal)HttpContext.Current.User;
            return new DBContext().CreateUser(person, user.Id);
        }

        public static Person GetUser(this MembershipProvider provider, object providerUserKey, bool userIsOnline = false)
        {
            return new DBContext().GetUser((int)providerUserKey);
        }

        public static bool UpdateUser(this MembershipProvider provider, object providerUserKey, Person person)
        {
            ValidatePasswordEventArgs e = new ValidatePasswordEventArgs(person.Login, person.Password, false);

            // login validate
            if (!string.IsNullOrEmpty(person.Login))
            {
                (Membership.Provider as AccessMembershipProvider).OnValidateUsername(e);

                if (e.Cancel)
                    throw new MembershipCreateUserException(e.FailureInformation.Message);
            }

            // password validate
            if (!string.IsNullOrEmpty(person.Password))
            {
                OnValidatePassword(e);

                if (e.Cancel)
                    throw new MembershipCreateUserException(e.FailureInformation.Message);
            }

            MemberPrincipal user = (MemberPrincipal)HttpContext.Current.User;
            int retv = new DBContext().UpdateUser((int)providerUserKey, person, user.Fio);
            return (retv != -1);
        }        
 
    }
}