using System.ComponentModel.DataAnnotations;
namespace asv.Models
{
    public class LogOnModel
    {   
        [Required]
        public string Login { get; set; }
        [Required]
        public string Password { get; set; }
        public bool RememberMe { get; set; }
    }   
}
