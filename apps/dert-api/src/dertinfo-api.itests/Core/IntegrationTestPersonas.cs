using System;
using System.Collections.Generic;

namespace DertInfo.Api.ITests.Core
{
    /// <summary>
    /// Claim sets for the integration-test host. The values match the Auth0 personas used by the
    /// website and the app. This copy lives with the API tests so those suites can be removed
    /// without leaving the API tests unable to sign a token.
    /// </summary>
    public static class IntegrationTestPersonas
    {
        public const string GroupMember = "group-member";

        private static readonly Dictionary<string, Persona> Personas = new Dictionary<string, Persona>
        {
            ["event-admin"] = new Persona
            {
                Email = "event-admin-1@dertinfo.co.uk",
                EventAdmin = new[] { "1" },
            },
            ["venue-admin"] = new Persona
            {
                Email = "venue-admin-1@dertinfo.co.uk",
                VenueAdmin = new[] { "1" },
            },
            ["group-admin"] = new Persona
            {
                Email = "group-admin-1@dertinfo.co.uk",
                GroupAdmin = new[] { "1" },
            },
            ["group-admin-2"] = new Persona
            {
                Email = "group-admin-2@dertinfo.co.uk",
                GroupAdmin = new[] { "2" },
            },
            [GroupMember] = new Persona
            {
                Email = "group-member-1@dertinfo.co.uk",
                GroupMember = new[] { "1" },
            },
        };

        public static Persona Get(string personaId)
        {
            if (!Personas.TryGetValue(personaId, out var persona))
            {
                throw new InvalidOperationException($"Integration-test persona \"{personaId}\" is not defined.");
            }

            return persona;
        }

        public sealed class Persona
        {
            public string Email { get; set; } = string.Empty;
            public bool IsSuperAdmin { get; set; }
            public IReadOnlyList<string> EventAdmin { get; set; } = Array.Empty<string>();
            public IReadOnlyList<string> GroupAdmin { get; set; } = Array.Empty<string>();
            public IReadOnlyList<string> GroupMember { get; set; } = Array.Empty<string>();
            public IReadOnlyList<string> VenueAdmin { get; set; } = Array.Empty<string>();
        }
    }
}
