using System.Collections.Generic;
using System.Linq;

namespace DertInfo.Api.ITests.Core
{
    /// <summary>
    /// Rows inserted for the API integration tests. Cases compare a response with these records.
    /// </summary>
    public static class IntegrationTestData
    {
        public const string GroupImageContainer = "groupimages";
        public const string EventImageContainer = "eventimages";

        public static IReadOnlyList<Event> Events { get; } = new[]
        {
            new Event
            {
                Id = 1,
                Name = "City Zoo Gathering",
                ImageFile = "giraffe.jpg",
                Synopsis = "A day riding a giraffe at the city zoo",
                ContactName = "Event Keeper",
                ContactEmail = "event-admin-1@dertinfo.co.uk",
                ContactTelephone = "01234567891",
                Town = "Springfield",
                Postcode = "SP1 1AA",
                RegistrationOpen = new System.DateTime(2026, 1, 1),
                RegistrationClose = new System.DateTime(2027, 5, 1),
                Start = new System.DateTime(2027, 6, 1),
                End = new System.DateTime(2027, 6, 2),
                TemplateType = 1,
                Activities = new[]
                {
                    new Activity { AudienceTypeId = 1, Title = "Adult Giraffe Ride", Description = "A ticket for an adult to ride a giraffe", Price = 15m, IsDefault = true },
                    new Activity { AudienceTypeId = 1, Title = "Child Giraffe Ride", Description = "A ticket for a child to ride a giraffe", Price = 8m, IsDefault = false },
                    new Activity { AudienceTypeId = 2, Title = "Carry a Giraffe", Description = "A team carries a giraffe across the zoo", Price = 20m, IsDefault = false },
                },
            },
        };

        public static IReadOnlyList<Group> Groups { get; } = new[]
        {
            new Group
            {
                Id = 1,
                Name = "The Simpsons",
                ImageFile = "family.jpg",
                Bio = "The family from Springfield",
                Town = "Springfield",
                Postcode = "SP1 1AA",
                ContactName = "Homer Simpson",
                ContactEmail = "group-admin-1@dertinfo.co.uk",
                ContactNumber = "01234567890",
                Pin = "1001",
                Members = new[]
                {
                    new Member { Name = "Homer Simpson", MemberType = 1, Email = "group-member-1@dertinfo.co.uk" },
                    new Member { Name = "Marge Simpson", MemberType = 2 },
                },
                Teams = new[]
                {
                    new Team { Name = "Springfield", Bio = "A team from Springfield" },
                },
            },
            new Group
            {
                Id = 2,
                Name = "The Flanders",
                ImageFile = "family.jpg",
                Bio = "The neighbours from Evergreen Terrace",
                Town = "Springfield",
                Postcode = "SP1 2BB",
                ContactName = "Ned Flanders",
                ContactEmail = "group-admin-2@dertinfo.co.uk",
                ContactNumber = "01234567892",
                Pin = "1002",
                Members = new[]
                {
                    new Member { Name = "Ned Flanders", MemberType = 1, Email = "group-admin-2@dertinfo.co.uk" },
                    new Member { Name = "Maude Flanders", MemberType = 2 },
                },
                Teams = new[]
                {
                    new Team { Name = "Leftorium", Bio = "The shop team from Springfield" },
                },
            },
        };

        public static IReadOnlyList<Group> GroupsFor(IntegrationTestPersonas.Persona persona)
        {
            var claimed = ClaimedGroupIds(persona);
            return Groups.Where(group => claimed.Contains(group.Id)).ToList();
        }

        public static IReadOnlyList<Group> GroupsOutside(IntegrationTestPersonas.Persona persona)
        {
            var claimed = ClaimedGroupIds(persona);
            return Groups.Where(group => !claimed.Contains(group.Id)).ToList();
        }

        private static HashSet<int> ClaimedGroupIds(IntegrationTestPersonas.Persona persona)
        {
            var claimed = new HashSet<int>();
            foreach (var value in persona.GroupAdmin.Concat(persona.GroupMember))
            {
                if (int.TryParse(value, out var id))
                {
                    claimed.Add(id);
                }
            }

            return claimed;
        }

        public sealed class Event
        {
            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
            public string ImageFile { get; set; } = string.Empty;
            public string Synopsis { get; set; } = string.Empty;
            public string ContactName { get; set; } = string.Empty;
            public string ContactEmail { get; set; } = string.Empty;
            public string ContactTelephone { get; set; } = string.Empty;
            public string Town { get; set; } = string.Empty;
            public string Postcode { get; set; } = string.Empty;
            public System.DateTime RegistrationOpen { get; set; }
            public System.DateTime RegistrationClose { get; set; }
            public System.DateTime Start { get; set; }
            public System.DateTime End { get; set; }
            public int TemplateType { get; set; }
            public IReadOnlyList<Activity> Activities { get; set; } = System.Array.Empty<Activity>();
        }

        public sealed class Activity
        {
            public int AudienceTypeId { get; set; }
            public string Title { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public bool IsDefault { get; set; }
        }

        public sealed class Group
        {
            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
            public string ImageFile { get; set; } = string.Empty;
            public string Bio { get; set; } = string.Empty;
            public string Town { get; set; } = string.Empty;
            public string Postcode { get; set; } = string.Empty;
            public string ContactName { get; set; } = string.Empty;
            public string ContactEmail { get; set; } = string.Empty;
            public string ContactNumber { get; set; } = string.Empty;
            public string Pin { get; set; } = string.Empty;
            public IReadOnlyList<Member> Members { get; set; } = System.Array.Empty<Member>();
            public IReadOnlyList<Team> Teams { get; set; } = System.Array.Empty<Team>();
        }

        public sealed class Member
        {
            public string Name { get; set; } = string.Empty;
            public int MemberType { get; set; }
            public string Email { get; set; } = string.Empty;
        }

        public sealed class Team
        {
            public string Name { get; set; } = string.Empty;
            public string Bio { get; set; } = string.Empty;
        }
    }
}
