using System;
using Xunit;

namespace DertInfo.Api.ITests.Core
{
    /// <summary>
    /// Runs when INTEGRATION_TEST_BEARER_TOKEN is a real Auth0 access token.
    /// CI does not set that variable. These cases also expect rows that a freshly migrated database does not have.
    /// </summary>
    public sealed class RequiresBearerTokenTheoryAttribute : TheoryAttribute
    {
        public RequiresBearerTokenTheoryAttribute()
        {
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("INTEGRATION_TEST_BEARER_TOKEN")))
            {
                Skip = "Set INTEGRATION_TEST_BEARER_TOKEN to a real Auth0 access token. CI leaves this unset; these cases also need a populated database.";
            }
        }
    }
}
