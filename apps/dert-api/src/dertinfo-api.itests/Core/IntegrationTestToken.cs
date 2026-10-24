using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Security.Claims;
using System.Text;

namespace DertInfo.Api.ITests.Core
{
    /// <summary>
    /// Signs an access token for <see cref="IntegrationTestPersonas"/>. The issuer matches Auth0:Domain
    /// so the API's claim checks accept it. Only the integration-test host trusts <see cref="SigningKey"/>.
    /// </summary>
    public static class IntegrationTestToken
    {
        public const string SigningKeyText = "integration-test-signing-key-32b!";
        public const string NameIdentifierClaimType = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

        public static SymmetricSecurityKey SigningKey { get; } =
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SigningKeyText));

        public static string Create(string personaId)
        {
            var settings = TestAppSettings.Load();
            var persona = IntegrationTestPersonas.Get(personaId);
            var claims = new List<Claim>
            {
                new Claim("sub", persona.Email),
                new Claim(NameIdentifierClaimType, persona.Email),
            };

            AddIdClaims(claims, "https://dertinfo.co.uk/eventadmin", persona.EventAdmin);
            AddIdClaims(claims, "https://dertinfo.co.uk/groupadmin", persona.GroupAdmin);
            AddIdClaims(claims, "https://dertinfo.co.uk/groupmember", persona.GroupMember);
            AddIdClaims(claims, "https://dertinfo.co.uk/venueadmin", persona.VenueAdmin);
            if (persona.IsSuperAdmin)
            {
                claims.Add(new Claim("https://dertinfo.co.uk/superadmin", "true"));
            }

            var handler = new JwtSecurityTokenHandler();
            handler.OutboundClaimTypeMap.Clear();
            var token = new JwtSecurityToken(
                issuer: $"https://{settings.Domain}/",
                audience: settings.Audience,
                claims: claims,
                notBefore: DateTime.UtcNow.AddMinutes(-1),
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: new SigningCredentials(SigningKey, SecurityAlgorithms.HmacSha256));

            return handler.WriteToken(token);
        }

        private static void AddIdClaims(List<Claim> claims, string claimType, IReadOnlyList<string> ids)
        {
            if (ids == null)
            {
                return;
            }

            foreach (var id in ids)
            {
                if (!string.IsNullOrWhiteSpace(id))
                {
                    claims.Add(new Claim(claimType, id));
                }
            }
        }
    }

    public sealed class TestAppSettings
    {
        public string Domain { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;

        public static TestAppSettings Load()
        {
            var contentRoot = Path.GetDirectoryName(typeof(TestAppSettings).Assembly.Location)
                ?? Directory.GetCurrentDirectory();
            var configuration = new ConfigurationBuilder()
                .SetBasePath(contentRoot)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
                .Build();

            var domain = configuration["Auth0:Domain"];
            var audience = configuration["Auth0:Audience"];
            if (string.IsNullOrWhiteSpace(domain) || string.IsNullOrWhiteSpace(audience))
            {
                throw new InvalidOperationException("The test appsettings.json must set Auth0:Domain and Auth0:Audience.");
            }

            return new TestAppSettings
            {
                Domain = domain,
                Audience = audience,
            };
        }
    }
}
