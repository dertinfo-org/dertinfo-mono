using DertInfo.Api.ITests.Core;
using DertInfo.Models.DataTransferObject;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Xunit;

namespace DertInfo.Api.ITests
{
    [Collection(IntegrationCollection.Name)]
    public class GroupController_Fixture_GetSingle : IntergrationTestBase<GroupDto>
    {
        public GroupController_Fixture_GetSingle() : base()
        {
        }

        [Theory]
        [InlineData("GET")]
        public async Task Get_Single_Group_Where_User_Has_Permission_Returns_Requested_Group(string verb)
        {
            if (this._client == null && this._server == null)
            {
                await base.InitialiseApplicationHostAndClient();
            }

            var persona = IntegrationTestPersonas.Get(IntegrationTestPersonas.GroupMember);
            var expectedGroups = IntegrationTestData.GroupsFor(persona);
            Assert.NotEmpty(expectedGroups);

            foreach (var expected in expectedGroups)
            {
                var request = new HttpRequestMessage(new HttpMethod(verb), $"/api/group/{expected.Id}");
                request = base.ApplyAuthorisation(request, IntegrationTestPersonas.GroupMember);

                var response = await _client.SendAsync(request);
                var group = await base.ReadResponseContent(response);

                response.EnsureSuccessStatusCode();
                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
                Assert.Equal(expected.Id, group.Id);
                Assert.Equal(expected.Name, group.GroupName);
                Assert.Contains(expected.ImageFile, group.GroupPictureUrl);
            }
        }

        [Theory]
        [InlineData("GET")]
        public async Task Get_Single_Group_Where_User_Is_Not_A_Member_Is_Forbidden(string verb)
        {
            if (this._client == null && this._server == null)
            {
                await base.InitialiseApplicationHostAndClient();
            }

            var persona = IntegrationTestPersonas.Get(IntegrationTestPersonas.GroupMember);
            var otherGroups = IntegrationTestData.GroupsOutside(persona);
            Assert.NotEmpty(otherGroups);

            foreach (var expected in otherGroups)
            {
                var request = new HttpRequestMessage(new HttpMethod(verb), $"/api/group/{expected.Id}");
                request = base.ApplyAuthorisation(request, IntegrationTestPersonas.GroupMember);

                var response = await _client.SendAsync(request);

                Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
            }
        }
    }
}
