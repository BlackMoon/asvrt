
namespace asv.Models
{
    public class SettingsModel
    {
        /// <summary>
        /// Время ожидания соединения
        /// </summary>             
        public int ConnTimeout { get; set; }
        /// <summary>
        /// Колв-о записей на странице
        /// </summary>         
        public int ItemsPerPage { get; set; }
        public int MaxInvalidPasswordAttempts { get; set; }
        public int MinRequiredPasswordLength { get; set; }
        public int MinRequiredUsernameLength { get; set; }
        public int PasswordAnswerAttemptLockoutDuration { get; set; }
        public int SaltLength { get; set; }
    }
}