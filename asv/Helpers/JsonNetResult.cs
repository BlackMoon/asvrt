using System;
using System.Web;
using System.Web.Mvc;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;

namespace asv.Helpers
{
    /// <summary>
    /// LowerCase Property Name Converter
    /// </summary>
    public class LowercaseContractResolver : DefaultContractResolver
    {
        protected override string ResolvePropertyName(string propertyName)
        {   
            return propertyName.ToLower().Replace(".", "&#pt;");
        }
    }

    public class TimeConverter : IsoDateTimeConverter
    {
        public TimeConverter() : base()
        {
            DateTimeFormat = "dd.MM.yyyy HH:mm";
        }
    }

    /// <summary>
    /// JsonResult Serialization and Deserialization Assistant Class, using custom DateTime Format
    /// </summary>
    public class JsonNetResult : ActionResult
    {
        public Encoding ContentEncoding { get; set; }
        public string ContentType { get; set; }
        public object Data { get; set; }
        public JsonSerializerSettings SerializerSettings { get; set; }
        public Formatting Formatting { get; set; }

        public JsonNetResult(string format = "dd.MM.yyyy")
        {   
            SerializerSettings = new JsonSerializerSettings { ContractResolver = new LowercaseContractResolver(), DefaultValueHandling = DefaultValueHandling.Ignore, NullValueHandling = NullValueHandling.Ignore };                        
            SerializerSettings.Converters.Add(new IsoDateTimeConverter { DateTimeFormat = format });            
        }

        public override void ExecuteResult(ControllerContext context)
        {
            if (context == null)
                throw new ArgumentNullException("context");
            
            HttpResponseBase resp = context.HttpContext.Response;
            resp.ContentType = string.IsNullOrEmpty(ContentType) ? "application/json" : ContentType;

            if (ContentEncoding != null)
                resp.ContentEncoding = ContentEncoding;

            if (Data != null)
            {
                JsonTextWriter writer = new JsonTextWriter(resp.Output) { Formatting = Formatting };
                JsonSerializer serializer = JsonSerializer.Create(SerializerSettings);
                serializer.Serialize(writer, Data);
                writer.Flush();
            }
        }
    }
}