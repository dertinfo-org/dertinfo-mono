using System.Threading.Tasks;
using Xunit;

namespace DertInfo.Api.ITests.Core
{
    /// <summary>
    /// Migrates once, then loads the end-to-end system-basic pack. Later tests start the API again;
    /// EnsureSeedData leaves that pack in place because system settings and activities already exist.
    /// </summary>
    public sealed class IntegrationDatabaseFixture : IAsyncLifetime
    {
        public async Task InitializeAsync()
        {
            var bootstrap = new IntergrationTestBase<object>();
            await bootstrap.InitialiseApplicationHostAndClient();
            await bootstrap.StopHost();
            SharedStateSeed.ApplySystemBasic();
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
