using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

namespace DertInfo.Api.ITests.Core
{
    public class IntergrationTestBase<O>
    {
        private const string bearerToken = "[PLACE A FUNCTIONAL BEARER TOKEN HERE TO RUN TESTS]";
        protected HttpClient _client;
        protected IHost _server;


        public IntergrationTestBase()
        {
        }

        public async Task InitialiseHelloWorldHostAndClient()
        {
            var hostBuilder = new HostBuilder()
                .ConfigureWebHost(webHost => {
                    webHost.UseTestServer();
                    webHost.Configure(app => app.Run(async ctx =>
                        await ctx.Response.WriteAsync("Hello World!")));
                });

            // Build and start the IHost
            this._server = await hostBuilder.StartAsync();

            // Create an HttpClient to send requests to the TestServer
            this._client = this._server.GetTestClient();
        }

        public async Task InitialiseApplicationHostAndClient()
        {
            // A bare HostBuilder does not load appsettings.json or environment variables.
            // CI sets SqlConnection__* on the process; those override the placeholders in appsettings.json.
            // Startup.Configure migrates on launch, so the host does not start until SQL accepts that login.
            var contentRoot = Path.GetDirectoryName(typeof(IntergrationTestBase<O>).Assembly.Location)
                ?? Directory.GetCurrentDirectory();
            var environmentName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
                ?? Environments.Development;

            var hostBuilder = new HostBuilder()
                .UseContentRoot(contentRoot)
                .UseEnvironment(environmentName)
                .ConfigureAppConfiguration((_, config) =>
                {
                    config.SetBasePath(contentRoot);
                    config.AddJsonFile("appsettings.json", optional: false, reloadOnChange: false);
                    config.AddEnvironmentVariables();
                })
                .ConfigureWebHost(webHost =>
                {
                    webHost.UseTestServer();
                    webHost.UseContentRoot(contentRoot);
                    webHost.UseEnvironment(environmentName);
                    webHost.UseStartup<DertInfo.Api.Startup>();
                });

            // Build and start the IHost
            this._server = await hostBuilder.StartAsync();

            // Create an HttpClient to send requests to the TestServer
            this._client = this._server.GetTestClient();
        }

        protected HttpRequestMessage ApplyAuthorisation(HttpRequestMessage request)
        {
            var token = string.Format("Bearer {0}", ResolveBearerToken());
            request.Headers.Add("Authorization", token);
            return request;
        }

        protected async Task<O> ReadResponseContent(HttpResponseMessage response)
        {
            string responseContent = await response.Content.ReadAsStringAsync();
            O myObject = JsonConvert.DeserializeObject<O>(responseContent, GetSerialiserSettings());
            return myObject;
        }

        public static string ResolveBearerToken()
        {
            var fromEnvironment = Environment.GetEnvironmentVariable("INTEGRATION_TEST_BEARER_TOKEN");
            if (!string.IsNullOrWhiteSpace(fromEnvironment))
            {
                return fromEnvironment;
            }

            return bearerToken;
        }

        protected static JsonSerializerSettings GetSerialiserSettings()
        {
            return new JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver(),
                DateFormatString = "yyyy-MM-ddTHH:mm:ss",
                Formatting = Formatting.None
            };
        }
    }
}
