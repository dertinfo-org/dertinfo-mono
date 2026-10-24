using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;

namespace DertInfo.Api.ITests.Core
{
    /// <summary>
    /// Builds an access token from a Playwright persona in tests/e2e/shared-data/auth0-personas.json.
    /// Those files stay in the end-to-end tree until they move to a location shared with these tests.
    /// The issuer matches Auth0:Domain so the API's claim checks accept it. Only the integration-test
    /// host trusts <see cref="SigningKey"/>.
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
            var persona = LoadPersona(personaId);
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
            foreach (var id in ids)
            {
                if (!string.IsNullOrWhiteSpace(id))
                {
                    claims.Add(new Claim(claimType, id));
                }
            }
        }

        private static Persona LoadPersona(string personaId)
        {
            var path = Path.Combine(RepoRoot.Find(), "tests", "e2e", "shared-data", "auth0-personas.json");
            if (!File.Exists(path))
            {
                throw new InvalidOperationException($"Auth0 personas file was not found: {path}");
            }

            var document = JObject.Parse(File.ReadAllText(path));
            var persona = document["personas"]?
                .Children<JObject>()
                .FirstOrDefault(item => item.Value<string>("id") == personaId);
            if (persona == null)
            {
                throw new InvalidOperationException($"Auth0 persona \"{personaId}\" is not in {path}.");
            }

            var metadata = persona["app_metadata"] as JObject ?? new JObject();
            return new Persona
            {
                Email = persona.Value<string>("email") ?? personaId,
                IsSuperAdmin = metadata.Value<bool?>("isSuperAdmin") == true,
                EventAdmin = ReadIds(metadata, "eventadmin"),
                GroupAdmin = ReadIds(metadata, "groupadmin"),
                GroupMember = ReadIds(metadata, "groupmember"),
                VenueAdmin = ReadIds(metadata, "venueadmin"),
            };
        }

        private static IReadOnlyList<string> ReadIds(JObject metadata, string name)
        {
            var token = metadata[name] as JArray;
            if (token == null)
            {
                return Array.Empty<string>();
            }

            return token.Select(item => item.ToString()).Where(value => !string.IsNullOrWhiteSpace(value)).ToList();
        }

        private sealed class Persona
        {
            public string Email { get; set; }
            public bool IsSuperAdmin { get; set; }
            public IReadOnlyList<string> EventAdmin { get; set; }
            public IReadOnlyList<string> GroupAdmin { get; set; }
            public IReadOnlyList<string> GroupMember { get; set; }
            public IReadOnlyList<string> VenueAdmin { get; set; }
        }
    }
}
