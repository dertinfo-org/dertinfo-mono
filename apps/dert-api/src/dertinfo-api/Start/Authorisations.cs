using DertInfo.Api.AuthorisationPolicies.ClaimsBased;
using DertInfo.Api.AuthorisationPolicies.ResourceBased;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DertInfo.Api.Start
{
    public static class Authorisations
    {
        public static void Apply(IServiceCollection services, IConfiguration configuration)
        {
            // Add Authentication
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;

            }).AddJwtBearer(options =>
            {
                // The token was created by this authority | tenant in auth0
                options.Authority = $"https://{configuration["Auth0:Domain"]}/"; //https://dertinfodev.eu.auth0.com/
                // The token was created to be able to talk to me.
                options.Audience = configuration["Auth0:Audience"]; // "api.dev.dertinfo.co.uk";
            });

            // Authorization
            services.AddAuthorization(options =>
            {
                options.AddPolicy("SuperAdminOnly", policy => policy.RequireClaim("isSuperAdmin", "true"));
                options.AddPolicy("IsGroupAdmin", policy => policy.RequireClaim("groupadmin"));
                options.AddPolicy("IsEventAdmin", policy => policy.RequireClaim("eventadmin"));
                options.AddPolicy("IsGroupMember", policy => policy.RequireClaim("groupmember"));
                options.AddPolicy("IsVenueAdmin", policy => policy.RequireClaim("venueadmin"));
                options.AddPolicy(AttendanceChangeActivitiesPolicy.PolicyName, policy => policy.Requirements.Add(new AttendanceChangeActivitiesRequirement()));
                options.AddPolicy(CompetitionAddDancePolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionAddDanceRequirement()));
                options.AddPolicy(CompetitionAddJudgePolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionAddJudgeRequirement()));
                options.AddPolicy(CompetitionAddVenuePolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionAddVenueRequirement()));
                options.AddPolicy(CompetitionChangeJudgesPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionChangeJudgesRequirement()));
                options.AddPolicy(CompetitionChangeVenuesPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionChangeVenuesRequirement()));
                options.AddPolicy(CompetitionGenerateDancesPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionGenerateDancesRequirement()));
                options.AddPolicy(CompetitionGetDancesPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionGetDancesRequirement()));
                options.AddPolicy(CompetitionGetEntrantsPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionGetEntrantsRequirement()));
                options.AddPolicy(CompetitionGetEntryAttributesPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionGetEntryAttributesRequirement()));
                options.AddPolicy(CompetitionGetFullCollatedResultsPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionGetFullCollatedResultsRequirement()));
                options.AddPolicy(CompetitionGetJudgesPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionGetJudgesRequirement()));
                options.AddPolicy(CompetitionGetSummaryPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionGetSummaryRequirement()));
                options.AddPolicy(CompetitionGetSettingsPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionGetSettingsRequirement()));
                options.AddPolicy(CompetitionGetScoringInfoPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionGetScoringInfoRequirement()));
                options.AddPolicy(CompetitionGetVenuesPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionGetVenuesRequirement()));
                options.AddPolicy(CompetitionResetPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionResetRequirement()));
                options.AddPolicy(CompetitionPopulateEntrantsPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionPopulateEntrantsRequirement()));
                options.AddPolicy(CompetitionUpdateEntrantAttributesPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionUpdateEntrantAttributesRequirement()));
                options.AddPolicy(CompetitionUpdateJudgePolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionUpdateJudgeRequirement()));
                options.AddPolicy(CompetitionUpdateSettingsPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionUpdateSettingsRequirement()));
                options.AddPolicy(CompetitionUpdateScoringInfoPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionUpdateScoringInfoRequirement()));
                options.AddPolicy(CompetitionUpdateVenuePolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionUpdateVenueRequirement()));
                options.AddPolicy(CompetitionViewReportsPolicy.PolicyName, policy => policy.Requirements.Add(new CompetitionViewReportsRequirement()));
                options.AddPolicy(DodAdministratorOnlyPolicy.PolicyName, policy => policy.Requirements.Add(new DodAdministratorOnlyRequirement()));
                options.AddPolicy(GroupAdministratorOnlyPolicy.PolicyName, policy => policy.Requirements.Add(new GroupAdministratorOnlyRequirement()));
                options.AddPolicy(GroupMemberPolicy.PolicyName, policy => policy.Requirements.Add(new GroupMemberRequirement()));
                options.AddPolicy(EventAdministratorOnlyPolicy.PolicyName, policy => policy.Requirements.Add(new EventAdministratorOnlyRequirement()));
                options.AddPolicy(EventGetActivitiesPolicy.PolicyName, policy => policy.Requirements.Add(new EventGetActivitiesRequirement()));
                options.AddPolicy(EventGetPublishedActivitiesPolicy.PolicyName, policy => policy.Requirements.Add(new EventGetPublishedActivitiesRequirement()));
                options.AddPolicy(InvoiceGetHistoryPolicy.PolicyName, policy => policy.Requirements.Add(new InvoiceGetHistoryRequirement()));
                options.AddPolicy(InvoiceSetPaidPolicy.PolicyName, policy => policy.Requirements.Add(new InvoiceSetPaidRequirement()));
                options.AddPolicy(LookupJudgesPolicy.PolicyName, policy => policy.Requirements.Add(new LookupJudgesRequirement()));
                options.AddPolicy(LookupVenuesPolicy.PolicyName, policy => policy.Requirements.Add(new LookupVenuesRequirement()));
                options.AddPolicy(PaperworkGetScoreSheetsPolicy.PolicyName, policy => policy.Requirements.Add(new PaperworkGetScoreSheetsRequirement()));
                options.AddPolicy(PaperworkGetSignInSheetsPolicy.PolicyName, policy => policy.Requirements.Add(new PaperworkGetSignInSheetsRequirement()));
                options.AddPolicy(RegistrationAddMemberPolicy.PolicyName, policy => policy.Requirements.Add(new RegistrationAddMemberRequirement()));
                options.AddPolicy(RegistrationAddTeamPolicy.PolicyName, policy => policy.Requirements.Add(new RegistrationAddTeamRequirement()));
                options.AddPolicy(RegistrationConfirmPolicy.PolicyName, policy => policy.Requirements.Add(new RegistrationConfirmRequirement()));
                options.AddPolicy(RegistrationGetActivitiesPolicy.PolicyName, policy => policy.Requirements.Add(new RegistrationGetActivitiesRequirement()));
                options.AddPolicy(RegistrationGetContactInfoPolicy.PolicyName, policy => policy.Requirements.Add(new RegistrationGetContactInfoRequirement()));
                options.AddPolicy(RegistrationRemoveMemberPolicy.PolicyName, policy => policy.Requirements.Add(new RegistrationRemoveMemberRequirement()));
                options.AddPolicy(RegistrationRemoveTeamPolicy.PolicyName, policy => policy.Requirements.Add(new RegistrationRemoveTeamRequirement()));
                options.AddPolicy(RegistrationSubmitPolicy.PolicyName, policy => policy.Requirements.Add(new RegistrationSubmitRequirement()));
                options.AddPolicy(RegistrationViewMemberPolicy.PolicyName, policy => policy.Requirements.Add(new RegistrationViewMemberRequirement()));
                options.AddPolicy(RegistrationViewOverviewsPolicy.PolicyName, policy => policy.Requirements.Add(new RegistrationViewOverviewsRequirement()));
                options.AddPolicy(RegistrationViewTeamPolicy.PolicyName, policy => policy.Requirements.Add(new RegistrationViewTeamRequirement()));
                options.AddPolicy(SuperAdministratorOnlyPolicy.PolicyName, policy => policy.Requirements.Add(new SuperAdministratorOnlyRequirement()));
                options.AddPolicy(TeamGetResultsPolicy.PolicyName, policy => policy.Requirements.Add(new TeamGetResultsRequirement()));
            });

            // We require this service in the authorisation handlers in order that we can access the route data.
            services.AddTransient<IHttpContextAccessor, HttpContextAccessor>();

            services.AddSingleton<IAuthorizationHandler, AttendanceChangeActivitiesHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionAddDanceHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionAddJudgeHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionAddVenueHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionChangeJudgesHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionChangeVenuesHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionGenerateDancesHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionGetDancesHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionGetEntrantsHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionGetEntryAttributesHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionGetFullCollatedResultsHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionGetJudgesHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionGetSummaryHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionGetSettingsHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionGetScoringInfoHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionGetVenuesHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionResetHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionPopulateEntrantsHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionUpdateEntrantAttributesHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionUpdateJudgeHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionUpdateSettingsHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionUpdateScoringInfoHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionUpdateVenueHandler>();
            services.AddSingleton<IAuthorizationHandler, CompetitionViewReportsHandler>();
            services.AddSingleton<IAuthorizationHandler, DodAdministratorOnlyHandler>();
            services.AddSingleton<IAuthorizationHandler, GroupAdministratorOnlyHandler>();
            services.AddSingleton<IAuthorizationHandler, GroupAdministratorOnlyHandler>();
            services.AddSingleton<IAuthorizationHandler, GroupMemberHandler>();
            services.AddSingleton<IAuthorizationHandler, EventAdministratorOnlyHandler>();
            services.AddSingleton<IAuthorizationHandler, EventGetActivitiesHandler>();
            services.AddSingleton<IAuthorizationHandler, EventGetPublishedActivitiesHandler>();
            services.AddSingleton<IAuthorizationHandler, InvoiceGetHistoryHandler>();
            services.AddSingleton<IAuthorizationHandler, InvoiceSetPaidHandler>();
            services.AddSingleton<IAuthorizationHandler, LookupJudgesHandler>();
            services.AddSingleton<IAuthorizationHandler, LookupVenuesHandler>();
            services.AddSingleton<IAuthorizationHandler, PaperworkGetScoreSheetsHandler>();
            services.AddSingleton<IAuthorizationHandler, PaperworkGetSignInSheetsHandler>();
            services.AddSingleton<IAuthorizationHandler, RegistrationViewTeamHandler>();
            services.AddSingleton<IAuthorizationHandler, RegistrationAddMemberHandler>();
            services.AddSingleton<IAuthorizationHandler, RegistrationAddTeamHandler>();
            services.AddSingleton<IAuthorizationHandler, RegistrationConfirmHandler>();
            services.AddSingleton<IAuthorizationHandler, RegistrationGetActivitiesHandler>();
            services.AddSingleton<IAuthorizationHandler, RegistrationGetContactInfoHandler>();
            services.AddSingleton<IAuthorizationHandler, RegistrationRemoveMemberHandler>();
            services.AddSingleton<IAuthorizationHandler, RegistrationRemoveTeamHandler>();
            services.AddSingleton<IAuthorizationHandler, RegistrationSubmitHandler>();
            services.AddSingleton<IAuthorizationHandler, RegistrationViewMemberHandler>();
            services.AddSingleton<IAuthorizationHandler, RegistrationViewOverviewsHandler>();
            services.AddSingleton<IAuthorizationHandler, SuperAdministratorOnlyHandler>();
            services.AddSingleton<IAuthorizationHandler, TeamGetResultsHandler>();

        }
    }
}
