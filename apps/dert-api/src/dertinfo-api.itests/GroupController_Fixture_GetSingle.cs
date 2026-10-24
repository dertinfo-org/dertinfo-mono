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
    public class GroupController_Fixture_GetSingle : IntergrationTestBase<GroupDto>
    {

        public GroupController_Fixture_GetSingle() : base()
        {

        }

        [RequiresBearerTokenTheory]
        [InlineData("GET", 46)]
        public async Task Get_Single_Group_Where_User_Has_Permission_Returns_Requested_Group(string verb, int groupId)
        {
            if (this._client == null && this._server == null)
            {
                await base.InitialiseApplicationHostAndClient();
            }

            // Arrange
            var request = new HttpRequestMessage(new HttpMethod(verb), $"/api/group/{groupId}");
            request = base.ApplyAuthorisation(request);

            // Act
            var response = await _client.SendAsync(request);
            var group = await base.ReadResponseContent(response);

            // Assert
            response.EnsureSuccessStatusCode();
            Assert.Equal(group.Id, groupId);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        

    }
}
