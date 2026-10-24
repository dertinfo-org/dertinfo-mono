using DertInfo.Api.ITests.Core;
using DertInfo.Models.DataTransferObject;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Xunit;

namespace DertInfo.Api.ITests
{
    public class GroupController_Fixture_GetAll: IntergrationTestBase<GroupDto>
    {
        public GroupController_Fixture_GetAll() : base()
        {
            
        }

        [Theory]
        [InlineData("GET")]
        public async Task Get_Groups_With_No_Token_Is_Unauthorised(string verb)
        {
            if (this._client == null && this._server == null)
            {
                await base.InitialiseApplicationHostAndClient();
            }

            // Arrange
            var request = new HttpRequestMessage(new HttpMethod(verb), "/api/group");
            // note - client already knows base url as created from the server

            // Act
            var response = await _client.SendAsync(request);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [RequiresBearerTokenTheory]
        [InlineData("GET")]
        public async Task Get_Groups_With_Valid_Token_Is_Reports_OK(string verb)
        {
            if (this._client == null && this._server == null)
            {
                await base.InitialiseApplicationHostAndClient();
            }

            // Arrange
            var request = new HttpRequestMessage(new HttpMethod(verb), "/api/group");
            request = base.ApplyAuthorisation(request);

            // Act
            var response = await _client.SendAsync(request);

            // Assert
            response.EnsureSuccessStatusCode();
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }
}
