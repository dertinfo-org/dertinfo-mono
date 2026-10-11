using DertInfo.Api.AuthorisationPolicies.Base;
using DertInfo.CrossCutting.Configuration;
using DertInfo.Models.Database;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;

namespace DertInfo.Api.AuthorisationPolicies.ResourceBased
{
    /// <summary>
    /// Published ticket catalogue. Attendance counts and takings are not on this payload.
    /// The route has an event id and no group id, so any group administrator may read it.
    /// </summary>
    public class EventGetPublishedActivitiesPolicy
    {
        public static string PolicyName { get { return "EventGetPublishedActivitiesPolicy"; } }
    }

    public class EventGetPublishedActivitiesRequirement : IClaimRequirement
    {
    }

    public class EventGetPublishedActivitiesHandler : ResourceClaimHandler<EventGetPublishedActivitiesRequirement, Event>
    {
        public EventGetPublishedActivitiesHandler(IDertInfoConfiguration configuration) : base(configuration)
        { }

        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, EventGetPublishedActivitiesRequirement requirement, Event resource)
        {
            var hasEventAdminClaimForEvent = this.TestClaim(context.User, "https://dertinfo.co.uk/eventadmin", resource.Id);
            var hasSuperAdminClaim = this.TestClaim(context.User, "https://dertinfo.co.uk/superadmin", true);
            var hasGroupAdminClaim = this.ClaimExists(context.User, "https://dertinfo.co.uk/groupadmin");

            if (hasSuperAdminClaim || hasEventAdminClaimForEvent || hasGroupAdminClaim)
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
