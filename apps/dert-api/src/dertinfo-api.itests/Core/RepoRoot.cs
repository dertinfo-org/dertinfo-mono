using Microsoft.Extensions.Configuration;
using System;
using System.IO;

namespace DertInfo.Api.ITests.Core
{
    public static class RepoRoot
    {
        public static string Find()
        {
            var fromEnvironment = Environment.GetEnvironmentVariable("DERTINFO_REPO_ROOT");
            if (!string.IsNullOrWhiteSpace(fromEnvironment) && File.Exists(Path.Combine(fromEnvironment, "dertinfo.sln")))
            {
                return fromEnvironment;
            }

            var directory = new DirectoryInfo(AppContext.BaseDirectory);
            while (directory != null)
            {
                if (File.Exists(Path.Combine(directory.FullName, "dertinfo.sln")))
                {
                    return directory.FullName;
                }

                directory = directory.Parent;
            }

            throw new InvalidOperationException("Could not find dertinfo.sln above the test assembly. Set DERTINFO_REPO_ROOT.");
        }
    }

    public sealed class TestAppSettings
    {
        public string Domain { get; set; }
        public string Audience { get; set; }

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
