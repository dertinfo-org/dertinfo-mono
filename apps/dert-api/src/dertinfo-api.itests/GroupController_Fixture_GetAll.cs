using DertInfo.Api.ITests.Core;
using DertInfo.Models.DataTransferObject;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Xunit;

namespace DertInfo.Api.ITests
{
    [Collection(IntegrationCollection.Name)]
    public class GroupController_Fixture_GetAll : IntergrationTestBase<GroupDto>
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

            var persona = IntegrationTestPersonas.Get(IntegrationTestPersonas.GroupMember);
            var expectedGroups = IntegrationTestData.GroupsFor(persona);
            Assert.NotEmpty(expectedGroups);

            var request = new HttpRequestMessage(new HttpMethod(verb), "/api/group");
            request = base.ApplyAuthorisation(request, IntegrationTestPersonas.GroupMember);

            var response = await _client.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();
            var groups = JsonConvert.DeserializeObject<List<GroupDto>>(body, GetSerialiserSettings());

            response.EnsureSuccessStatusCode();
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotNull(groups);
            Assert.Equal(expectedGroups.Count, groups.Count);
            foreach (var expected in expectedGroups)
            {
                var actual = Assert.Single(groups, group => group.Id == expected.Id);
                Assert.Equal(expected.Name, actual.GroupName);
                Assert.Contains(expected.ImageFile, actual.GroupPictureUrl);
            }
        }
    }
}
