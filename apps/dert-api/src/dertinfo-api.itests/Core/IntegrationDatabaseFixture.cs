using System.Threading.Tasks;
using Xunit;

namespace DertInfo.Api.ITests.Core
{
    /// <summary>
    /// Migrates once, then inserts the API integration seed. Later tests start the API again.
    /// EnsureSeedData leaves that seed in place because system settings and activities already exist.
    /// </summary>
    public sealed class IntegrationDatabaseFixture : IAsyncLifetime
    {
        public async Task InitializeAsync()
        {
            var bootstrap = new IntergrationTestBase<object>();
            await bootstrap.InitialiseApplicationHostAndClient();
            await bootstrap.StopHost();
            IntegrationDatabaseSeed.Apply();
        }

        public Task DisposeAsync()
        {
            return Task.CompletedTask;
        }
    }

    [CollectionDefinition(Name)]
    public sealed class IntegrationCollection : ICollectionFixture<IntegrationDatabaseFixture>
    {
        public const string Name = "DertInfo API integration";
    }
}
