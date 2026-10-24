using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
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
                    // After Startup registers Auth0. This host replaces that metadata with the test signing key.
                    webHost.ConfigureServices((context, services) =>
                    {
                        TrustFabricatedTokens(services, context.Configuration);
                    });
                });

            // Build and start the IHost
            this._server = await hostBuilder.StartAsync();

            // Create an HttpClient to send requests to the TestServer
            this._client = this._server.GetTestClient();
        }

        protected HttpRequestMessage ApplyAuthorisation(HttpRequestMessage request, string personaId)
        {
            var token = string.Format("Bearer {0}", IntegrationTestToken.Create(personaId));
            request.Headers.Add("Authorization", token);
            return request;
        }

        public async Task StopHost()
        {
            _client?.Dispose();
            _client = null;
            if (_server != null)
            {
                await _server.StopAsync();
                _server.Dispose();
                _server = null;
            }
        }

        /// <summary>
        /// The API still points JwtBearer at Auth0. This test host is the only place that trusts
        /// <see cref="IntegrationTestToken"/>. A token signed with that key fails on the real API,
        /// because Auth0's keys do not include it.
        /// </summary>
        private static void TrustFabricatedTokens(IServiceCollection services, IConfiguration configuration)
        {
            var domain = configuration["Auth0:Domain"];
            var audience = configuration["Auth0:Audience"];
            if (string.IsNullOrWhiteSpace(domain) || string.IsNullOrWhiteSpace(audience))
            {
                throw new InvalidOperationException("The test appsettings.json must set Auth0:Domain and Auth0:Audience.");
            }

            var issuer = $"https://{domain}/";
            var metadata = new OpenIdConnectConfiguration
            {
                Issuer = issuer,
            };
            metadata.SigningKeys.Add(IntegrationTestToken.SigningKey);

            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.Authority = null;
                options.MetadataAddress = null;
                options.RequireHttpsMetadata = false;
                options.Audience = audience;
                options.MapInboundClaims = false;
                options.Configuration = metadata;
                options.ConfigurationManager = new StaticConfigurationManager<OpenIdConnectConfiguration>(metadata);
                options.TokenValidationParameters.ValidateIssuer = true;
                options.TokenValidationParameters.ValidIssuer = issuer;
                options.TokenValidationParameters.ValidIssuers = new[] { issuer };
                options.TokenValidationParameters.ValidateAudience = true;
                options.TokenValidationParameters.ValidAudience = audience;
                options.TokenValidationParameters.ValidateIssuerSigningKey = true;
                options.TokenValidationParameters.IssuerSigningKey = IntegrationTestToken.SigningKey;
            });
        }

        protected async Task<O> ReadResponseContent(HttpResponseMessage response)
        {
            string responseContent = await response.Content.ReadAsStringAsync();
            O myObject = JsonConvert.DeserializeObject<O>(responseContent, GetSerialiserSettings());
            return myObject;
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
