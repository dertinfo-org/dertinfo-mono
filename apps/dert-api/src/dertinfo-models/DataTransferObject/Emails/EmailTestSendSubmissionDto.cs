namespace DertInfo.Models.DataTransferObject.Emails
{
    public class EmailTestSendSubmissionDto
    {
        public string FromAddress { get; set; } = string.Empty;

        public string FromName { get; set; } = string.Empty;

        public string ToAddress { get; set; } = string.Empty;

        public string Subject { get; set; } = string.Empty;

        public string HtmlBody { get; set; } = string.Empty;
    }
}
