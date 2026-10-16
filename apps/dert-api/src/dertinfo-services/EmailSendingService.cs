using DertInfo.CrossCutting.Configuration;
using DertInfo.Models.Emails;
using RestSharp;
using RestSharp.Authenticators;
using SendGrid;
using SendGrid.Helpers.Mail;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DertInfo.Services
{
    public interface IEmailSendingService
    {
        Task SendEmail(EmailBase emailBase, string emailbody);
    }

    public class EmailSendingServiceMailGun : IEmailSendingService
    {
        private readonly string _mailGunApiEndpoint;
        private readonly string _mailGunDefaultFrom;
        private readonly bool _mailGunEnabled;
        private readonly string _mailGunDomain;
        private readonly string _mailGunApiKey;
        
        public EmailSendingServiceMailGun(IDertInfoConfiguration configuration)
        {
            _mailGunApiEndpoint = configuration.Mailgun_ApiEndpoint;
            _mailGunDefaultFrom = configuration.Mailgun_DefaultFrom;
            _mailGunEnabled = configuration.Mailgun_Enabled;
            _mailGunDomain = configuration.Mailgun_Domain;
            _mailGunApiKey = configuration.Mailgun_ApiKey;
        }

        public async Task SendEmail(EmailBase emailBase, string htmlBody)
        {
            if (!_mailGunEnabled)
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(_mailGunDomain) || string.IsNullOrWhiteSpace(_mailGunApiKey))
            {
                throw new InvalidOperationException("Mailgun configuration missing (Mailgun:Domain or Mailgun:ApiKey).");
            }

            var options = new RestClientOptions(this._mailGunApiEndpoint)
            {
                Authenticator = new HttpBasicAuthenticator("api", _mailGunApiKey)
            };

            var client = new RestClient(options);
            var request = new RestRequest($"/v3/{_mailGunDomain}/messages", Method.Post);
            request.AlwaysMultipartFormData = true;

            // Build from address with name
            var fromAddress = string.IsNullOrWhiteSpace(emailBase.FromName)
                ? emailBase.FromAddress
                : $"{emailBase.FromName} <{emailBase.FromAddress}>";
            request.AddParameter("from", fromAddress);

            // Add To addresses
            emailBase.ToAddresses = emailBase.ToAddresses ?? new string[] { };
            if (emailBase.ToAddresses.Length > 0)
            {
                request.AddParameter("to", string.Join(",", emailBase.ToAddresses));
            }

            // Add Cc addresses
            emailBase.CcAddresses = emailBase.CcAddresses ?? new string[] { };
            if (emailBase.CcAddresses.Length > 0)
            {
                request.AddParameter("cc", string.Join(",", emailBase.CcAddresses));
            }

            // Add Bcc addresses
            emailBase.BccAddresses = emailBase.BccAddresses ?? new string[] { };
            if (emailBase.BccAddresses.Length > 0)
            {
                request.AddParameter("bcc", string.Join(",", emailBase.BccAddresses));
            }

            // Add subject and HTML body
            request.AddParameter("subject", emailBase.Subject ?? string.Empty);
            request.AddParameter("html", htmlBody ?? string.Empty);

            // Add attachments if present
            if (emailBase.Attachments != null && emailBase.Attachments.Count > 0)
            {
                foreach (var attachment in emailBase.Attachments)
                {
                    request.AddFile("attachment", attachment.Value, attachment.Key);
                }
            }

            var response = await client.ExecuteAsync(request);

            if (!response.IsSuccessful)
            {
                var detail = string.IsNullOrWhiteSpace(response.Content)
                    ? response.ErrorMessage
                    : response.Content;
                throw new InvalidOperationException($"Mailgun send failed: {(int)response.StatusCode} {response.StatusCode} - {detail}");
            }
        }
    }

    [Obsolete("Send grid no longer offers a free tier that allows a umber of emails per day to allow us to continue to use it.")]
    public class EmailSendingServiceSendGrid : IEmailSendingService
    {
        private string _sendGridApiKey;
        private bool _sendGridEnabled;

        public EmailSendingServiceSendGrid(IDertInfoConfiguration configuration)
        {
            _sendGridApiKey = configuration.SendGrid_ApiKey;
            _sendGridEnabled = configuration.SendGrid_Enabled;
        }

        public async Task SendEmail(EmailBase emailBase, string htmlBody) {

            if (this._sendGridEnabled)
            {
                var apiKey = this._sendGridApiKey;
                var client = new SendGridClient(apiKey);
                var from = new EmailAddress(emailBase.FromAddress, emailBase.FromName);


                List<EmailAddress> tos = new List<EmailAddress>();
                emailBase.ToAddresses = emailBase.ToAddresses ?? new string[] { };
                foreach (string toAddress in emailBase.ToAddresses)
                {
                    tos.Add(new EmailAddress(toAddress));
                }

                emailBase.CcAddresses = emailBase.CcAddresses ?? new string[] { };
                foreach (string ccAddress in emailBase.CcAddresses)
                {
                    tos.Add(new EmailAddress(ccAddress));
                }

                emailBase.BccAddresses = emailBase.BccAddresses ?? new string[] { };
                foreach (string bccAddress in emailBase.BccAddresses)
                {
                    tos.Add(new EmailAddress(bccAddress));
                }


                var subject = emailBase.Subject;
                var htmlContent = htmlBody;

                var msg = MailHelper.CreateSingleEmailToMultipleRecipients(from, tos, subject, null, htmlContent, false);

                var response = await client.SendEmailAsync(msg);
            }
        }
    }
}
