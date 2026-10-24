using DertInfo.Api.ITests.Core;
using DertInfo.Models.DataTransferObject;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Xunit;

namespace DertInfo.Api.ITests
{
    [Collection(IntegrationCollection.Name)]
    public class GroupController_Fixture_GetAll : IntergrationTestBase<GroupDto>
    {
        // Auth0ForcedId in tests/e2e/shared-state/system-basic/groups.json.
        // The group-member persona in tests/e2e/shared-data/auth0-personas.json claims group 1 only.
        private const int SimpsonGroupId = 1;
        private const string GroupMemberPersona = "group-member";

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

            var request = new HttpRequestMessage(new HttpMethod(verb), "/api/group");

            var response = await _client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Theory]
        [InlineData("GET")]
        public async Task Get_Groups_With_Valid_Token_Is_Reports_OK(string verb)
        {
            if (this._client == null && this._server == null)
            {
                await base.InitialiseApplicationHostAndClient();
            }

            var request = new HttpRequestMessage(new HttpMethod(verb), "/api/group");
            request = base.ApplyAuthorisation(request, GroupMemberPersona);

            var response = await _client.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();
            var groups = JsonConvert.DeserializeObject<List<GroupDto>>(body, GetSerialiserSettings());

            response.EnsureSuccessStatusCode();
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var group = Assert.Single(groups);
            Assert.Equal(SimpsonGroupId, group.Id);
            Assert.Equal("The Simpsons", group.GroupName);
            Assert.Contains("family.jpg", group.GroupPictureUrl);
        }
    }
}
