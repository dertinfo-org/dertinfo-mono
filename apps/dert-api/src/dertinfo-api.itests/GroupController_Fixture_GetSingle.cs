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
        // Auth0ForcedId values in tests/e2e/shared-state/system-basic/groups.json.
        private const int SimpsonGroupId = 1;
        private const int FlandersGroupId = 2;
        private const string GroupMemberPersona = "group-member";

        public GroupController_Fixture_GetSingle() : base()
        {
        }

        [Theory]
        [InlineData("GET", SimpsonGroupId, "The Simpsons", "family.jpg")]
        public async Task Get_Single_Group_Where_User_Has_Permission_Returns_Requested_Group(
            string verb,
            int groupId,
            string groupName,
            string imageFile)
        {
            if (this._client == null && this._server == null)
            {
                await base.InitialiseApplicationHostAndClient();
            }

            var request = new HttpRequestMessage(new HttpMethod(verb), $"/api/group/{groupId}");
            request = base.ApplyAuthorisation(request, GroupMemberPersona);

            var response = await _client.SendAsync(request);
            var group = await base.ReadResponseContent(response);

            response.EnsureSuccessStatusCode();
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal(groupId, group.Id);
            Assert.Equal(groupName, group.GroupName);
            Assert.Contains(imageFile, group.GroupPictureUrl);
        }

        [Theory]
        [InlineData("GET", FlandersGroupId)]
        public async Task Get_Single_Group_Where_User_Is_Not_A_Member_Is_Forbidden(string verb, int groupId)
        {
            if (this._client == null && this._server == null)
            {
                await base.InitialiseApplicationHostAndClient();
            }

            var request = new HttpRequestMessage(new HttpMethod(verb), $"/api/group/{groupId}");
            request = base.ApplyAuthorisation(request, GroupMemberPersona);

            var response = await _client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }
    }
}
