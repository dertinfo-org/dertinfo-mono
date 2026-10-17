using DertInfo.Models.Database;
using DertInfo.Models.DomainObjects;
using DertInfo.Models.Emails;
using DertInfo.Models.System.Enumerations;
using DertInfo.Repository;
using DertInfo.Services.Entity.Activities;
using DertInfo.Services.Entity.EmailTemplates;
using EnsureThat;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace DertInfo.Services
{
    public interface IRegistrationService
    {
        Task<Registration> Create(Registration registration);
        Task<Registration> GetOverviewForGroup(int registrationId);
        Task<Registration> GetOverviewForEvent(int registrationId);
        Task<ICollection<MemberAttendance>> ListAttendingIndividuals(int registrationId);
        Task<ICollection<TeamAttendance>> ListAttendingTeams(int registrationId);
        Task<Registration> GetForAuthorization(int registrationId);
        Task<MemberAttendance> AddNewMember(Registration registration, GroupMember groupMember);
        Task<MemberAttendance> AddExistingMember(Registration registration, int groupMemberId);
        Task<MemberAttendance> RemoveMemberAttendance(Registration registration, int memberAttendanceId);
        Task<IEnumerable<MemberAttendance>> AddExistingMembers(Registration registration, IEnumerable<int> groupMemberIds);
        Task<TeamAttendance> AddNewTeam(Registration registration, Team team);
        Task<TeamAttendance> AddExistingTeam(Registration registration, int teamId);
        Task<IEnumerable<TeamAttendance>> AddExistingTeams(Registration registration, IEnumerable<int> teamIds);
        Task<TeamAttendance> RemoveTeamAttendance(Registration registration, int teamAttendanceId);
        Task<IEnumerable<MemberAttendance>> RemoveMemberAttendances(Registration registration, int[] memberAttendanceIds);
        Task<IEnumerable<TeamAttendance>> RemoveTeamAttendances(Registration registration, int[] teamAttendanceIds);
        Task<Registration> AcceptSubmission(Registration registration);
        Task HandleEventDeleted(int registrationId);
        Task HandleEventCancelled(int registrationId, EventCancellationOptionsDO options);
        Task HandleGroupDeleted(int registrationId);
        Task<Registration> ConfirmSubmission(Registration registration);
        Task<GroupRegistationConfirmationEmailData> GenerateRegistrationConfirmationEmailData(int registrationId);
        Task<GroupRegistationSubmissionEmailData> GenerateRegistrationSubmissionEmailData(int registrationId);
        Task CloseRegistration(int registrationId);
        Task<ICollection<Registration>> ListForEvent(int eventId);
        Task<ICollection<Registration>> ListForGroup(int groupId);
    }

    public class RegistrationService : IRegistrationService
    {
        IActivityService _activityService;
        IGroupMemberRepository _groupMemberRepository;
        IMemberAttendanceRepository _memberAttendanceRepository;
        IRegistrationEmailDataService _registrationEmailDataService;
        IEventRepository _eventRepository;
        IGroupRepository _groupRepository;
        IRegistrationRepository _registrationRepository;
        ITeamAttendanceRepository _teamAttendanceRepository;
        ITeamRepository _teamRepository;
        IEmailSendingService _emailSendingService;
        IEmailTemplateService _emailTemplateService;
        IPricingService _pricingService;
        IInvoiceService _invoiceService;


        public RegistrationService(
            IActivityService activityService,
            IEmailSendingService emailSendingService,
            IEmailTemplateService emailTemplateService,
            IGroupMemberRepository groupMemberRepository,
            IMemberAttendanceRepository memberAttendanceRepository,
            IEventRepository eventRepository,
            IGroupRepository groupRepository,
            IRegistrationEmailDataService registrationEmailDataService,
            IRegistrationRepository registrationRepository,
            ITeamAttendanceRepository teamAttendanceRepository,
            ITeamRepository teamRepository,
            IPricingService pricingService,
            IInvoiceService invoiceService
            )
        {
            _activityService = activityService;
            _emailSendingService = emailSendingService;
            _emailTemplateService = emailTemplateService;
            _groupMemberRepository = groupMemberRepository;
            _memberAttendanceRepository = memberAttendanceRepository;
            _eventRepository = eventRepository;
            _groupRepository = groupRepository;
            _registrationEmailDataService = registrationEmailDataService;
            _registrationRepository = registrationRepository;
            _teamAttendanceRepository = teamAttendanceRepository;
            _teamRepository = teamRepository;
            _pricingService = pricingService;
            _invoiceService = invoiceService;
        }

        public async Task<MemberAttendance> AddExistingMember(Registration registration, int memberId)
        {
            var member = await _groupMemberRepository.GetById(memberId);

            // Only allow addition if the teams group matches the registrations group
            if (member != null && member.GroupId == registration.GroupId)
            {
                MemberAttendance memberAttendance = new MemberAttendance();
                memberAttendance.GroupMemberId = member.Id;
                memberAttendance.RegistrationId = registration.Id;
                memberAttendance.GroupMember = member;
                memberAttendance.Registration = registration;

                memberAttendance = await this._memberAttendanceRepository.AddOrReinstate(memberAttendance);

                // We now need to attach the default activities
                if (memberAttendance.MemberActivities.Count == 0)
                {
                    var defaultActivitiesForIndividuals = await this._activityService.GetDefaultsForEvent(registration.EventId, ActivityAudienceType.INDIVIDUAL);

                    foreach(var activity in defaultActivitiesForIndividuals)
                    {
                        ActivityMemberAttendance activityMemberAttendance = new ActivityMemberAttendance()
                        {
                            ActivityId = activity.Id,
                            Activity = activity,
                            MemberAttendanceId = memberAttendance.Id,
                            MemberAttendance = memberAttendance,
                        };

                        memberAttendance.MemberActivities.Add(activityMemberAttendance);
                        await this._memberAttendanceRepository.Update(memberAttendance);
                    }
                }

                return memberAttendance;
            }

            throw new ArgumentException("Cannot attach team to registrations where either member does not exist or group does not match");
        }

        public async Task<IEnumerable<MemberAttendance>> AddExistingMembers(Registration registration, IEnumerable<int> memberIds)
        {
            List<MemberAttendance> memberAttendances = new List<MemberAttendance>();
            foreach (var memberId in memberIds)
            {
                memberAttendances.Add(await this.AddExistingMember(registration, memberId));
            }

            return memberAttendances;
        }

        public async Task<TeamAttendance> AddExistingTeam(Registration registration, int teamId)
        {
            var team = await _teamRepository.GetById(teamId);

            // Only allow addition if the teams group matches the registrations group
            if (team != null && team.GroupId == registration.GroupId)
            {
                TeamAttendance teamAttendance = new TeamAttendance();
                teamAttendance.TeamId = team.Id;
                teamAttendance.RegistrationId = registration.Id;
                teamAttendance.Team = team;
                teamAttendance.Registration = registration;

                teamAttendance = await _teamAttendanceRepository.AddOrReinstate(teamAttendance);

                // We now need to attach the default activities
                if (teamAttendance.TeamActivities.Count == 0)
                {
                    var defaultActivitiesForIndividuals = await this._activityService.GetDefaultsForEvent(registration.EventId, ActivityAudienceType.TEAM);

                    foreach (var activity in defaultActivitiesForIndividuals)
                    {
                        ActivityTeamAttendance activityTeamAttendance = new ActivityTeamAttendance()
                        {
                            ActivityId = activity.Id,
                            Activity = activity,
                            TeamAttendanceId = teamAttendance.Id,
                            TeamAttendance = teamAttendance,
                        };

                        teamAttendance.TeamActivities.Add(activityTeamAttendance);
                        await this._teamAttendanceRepository.Update(teamAttendance);
                    }
                }

                return teamAttendance;
            }

            throw new ArgumentException("Cannot attach team to registrations where either team does not exisit or group does not match");
        }

        public async Task<IEnumerable<TeamAttendance>> AddExistingTeams(Registration registration, IEnumerable<int> teamIds)
        {
            List<TeamAttendance> teamAttendances = new List<TeamAttendance>();
            foreach (var teamId in teamIds)
            {
                teamAttendances.Add(await this.AddExistingTeam(registration, teamId));
            }

            return teamAttendances;
        }

        public async Task<MemberAttendance> AddNewMember(Registration registration, GroupMember groupMember)
        {
            // Ensure that the new groupMember is attached to the group assosiated with the registration
            // later - validate that the group member being added does not match with one already present (algorithm unknown)
            groupMember.GroupId = registration.GroupId;
            groupMember.DateJoined = DateTime.Now;
            groupMember = await _groupMemberRepository.Add(groupMember);

            return await this.AddExistingMember(registration, groupMember.Id);
        }

        public async Task<TeamAttendance> AddNewTeam(Registration registration, Team team)
        {
            // Ensure that the new team is attached to the group assosiated with the registration
            team.GroupId = registration.GroupId;
            team = await _teamRepository.Add(team);

            return await this.AddExistingTeam(registration, team.Id);
        }

        public async Task<Registration> Create(Registration registration)
        {
            // Assign The Default Flow State
            registration.FlowState = (int)RegistrationFlowState.New;

            var targetEvent = await _eventRepository.GetById(registration.EventId);
            if (targetEvent == null || !targetEvent.IsConfigured)
            {
                throw new InvalidOperationException("Cannot register for an event that is not configured");
            }

            var targetGroup = await _groupRepository.GetById(registration.GroupId);
            if (targetGroup == null || !targetGroup.IsConfigured)
            {
                throw new InvalidOperationException("Cannot register a group that is not configured");
            }

            // Check for existance of group and event registration
            if (await _registrationRepository.IsAlreadyRegistered(registration.GroupId, registration.EventId))
            {
                throw new InvalidOperationException("Cannot register twice for the same event");
            }

            // Save and return
            registration = await _registrationRepository.Add(registration);

            return registration;
        }

        /// <summary>
        /// Returns the registration object with the minimal fields for completing validation. 
        /// note - this has not been optimised. (or even implemented correctly)
        /// </summary>
        /// <param name="registrationId"></param>
        /// <returns></returns>
        public async Task<Registration> GetForAuthorization(int registrationId)
        {
            return await _registrationRepository.GetById(registrationId);
        }

        /// <summary>
        /// Used to get a augmented registration with all the inforamtion required to create the overview from a event perspective
        /// - this may include ticket limits etc
        /// </summary>
        /// <param name="eventId"></param>
        /// <returns></returns>
        public async Task<Registration> GetOverviewForEvent(int registrationId)
        {
            var registation = await _registrationRepository.GetOverviewByEventPerspective(registrationId);

            return registation;


        }

        /// <summary>
        /// Used to get a augmented registration with all the inforamtion required to create the overview from a group perspective
        /// - this may include recent attendances etc
        /// </summary>
        /// <param name="registrationId"></param>
        /// <returns></returns>
        public async Task<Registration> GetOverviewForGroup(int registrationId)
        {
            var registation = await _registrationRepository.GetOverviewByGroupPerspective(registrationId);

            return registation;
        }

        public async Task<ICollection<MemberAttendance>> ListAttendingIndividuals(int registrationId)
        {
            var memberAttendances = await _registrationRepository.GetMemberAttendances(registrationId);

            return memberAttendances;

        }

        public async Task<ICollection<TeamAttendance>> ListAttendingTeams(int registrationId)
        {
            var teamAttendances = await _registrationRepository.GetTeamAttendances(registrationId);

            return teamAttendances;
        }

        public async Task<IEnumerable<MemberAttendance>> RemoveMemberAttendances(Registration registration, int[] memberAttendanceIds)
        {
            List<MemberAttendance> memberAttendances = new List<MemberAttendance>();
            foreach (var memberAttendanceId in memberAttendanceIds)
            {
                memberAttendances.Add(await this.RemoveMemberAttendance(registration, memberAttendanceId));
            }

            return memberAttendances;
        }

        public async Task<IEnumerable<TeamAttendance>> RemoveTeamAttendances(Registration registration, int[] teamAttendanceIds)
        {
            List<TeamAttendance> teamAttendances = new List<TeamAttendance>();
            foreach (var teamAttendanceId in teamAttendanceIds)
            {
                teamAttendances.Add(await this.RemoveTeamAttendance(registration, teamAttendanceId));
            }

            return teamAttendances;
        }

        public async Task<MemberAttendance> RemoveMemberAttendance(Registration registration, int memberAttendanceId)
        {
            var myMemberAttendance = await _memberAttendanceRepository.MarkDeleted(memberAttendanceId);
            return myMemberAttendance;
        }

        public async Task<TeamAttendance> RemoveTeamAttendance(Registration registration, int teamAttendanceId)
        {
            var myTeamAttendance = await _teamAttendanceRepository.MarkDeleted(teamAttendanceId);
            return myTeamAttendance;
        }

        public async Task<Registration> AcceptSubmission(Registration updatedRegistration)
        {
            var originalRegistration = await _registrationRepository.GetById(updatedRegistration.Id);

            if (originalRegistration == null) { throw new InvalidOperationException("Registration Could Not Be Found"); }

            if (originalRegistration.FlowState != RegistrationFlowState.New && originalRegistration.FlowState != RegistrationFlowState.Submitted)
            {
                throw new InvalidOperationException("Registration Submission is not valid if not new or submitted");
            }

            // Update the status on the registration
            originalRegistration.FlowState = RegistrationFlowState.Submitted;

            await _registrationRepository.Update(originalRegistration);

            // This must come after the save as this call further hydrates the object from context
            await this.SubmitRegistrationSubmissionEmail(originalRegistration);

            return originalRegistration;
        }

        public async Task<Registration> ConfirmSubmission(Registration updatedRegistration)
        {
            var originalRegistration = await _registrationRepository.GetById(updatedRegistration.Id);

            if (originalRegistration == null) { throw new InvalidOperationException("Registration Could Not Be Found"); }

            if (originalRegistration.FlowState != RegistrationFlowState.Submitted && originalRegistration.FlowState != RegistrationFlowState.Confirmed)
            {
                throw new InvalidOperationException("Registration Submission is not valid if not submitted");
            }

            // Create the Invoice for the registration
            await this._invoiceService.CreateInvoiceForRegistration(originalRegistration.Id);

            // Update the status on the registration
            originalRegistration.FlowState = RegistrationFlowState.Confirmed;

            await _registrationRepository.Update(originalRegistration);

            // This must come after the save as this call further hydrates the object from context
            await this.SubmitRegistrationConfirmationEmail(originalRegistration);

            return originalRegistration;
        }

        private async Task SubmitRegistrationSubmissionEmail(Registration registration)
        {
            var emailData = await this.GenerateRegistrationSubmissionEmailData(registration.Id);
            var emailConstructionService = new EmailConstructionService<GroupRegistationSubmissionEmailData>(this._emailTemplateService);
            var emailBody = await emailConstructionService.BuildEmailBody(emailData);

            await this._emailSendingService.SendEmail(emailData, emailBody);

        }

        private async Task SubmitRegistrationConfirmationEmail(Registration registration)
        {
            var emailData = await this.GenerateRegistrationConfirmationEmailData(registration.Id);
            var emailConstructionService = new EmailConstructionService<GroupRegistationConfirmationEmailData>(this._emailTemplateService);
            var emailBody = await emailConstructionService.BuildEmailBody(emailData);

            await this._emailSendingService.SendEmail(emailData, emailBody);
        }

        private async Task SubmitEventCancellationEmail(Registration registration)
        {
            var emailData = await this.GenerateEventCancellationEmailData(registration.Id);
            var emailConstructionService = new EmailConstructionService<EventCancellationEmailData>(this._emailTemplateService);
            var emailBody = await emailConstructionService.BuildEmailBody(emailData);

            await this._emailSendingService.SendEmail(emailData, emailBody);
        }

        private void SubmitRegistrationEventCancelledEmail(Registration registration)
        {
            // todo - build the email submission and send it.
        }

        private void SubmitRegistrationGroupCancelledEmail(Registration registration)
        {
            // todo - build the email submission and send it.
        }

        /// <summary>
        /// Called from the event service when a call to delete the event is recieved.
        /// </summary>
        /// <param name="registration"></param>
        /// <returns></returns>
        public async Task HandleEventDeleted(int registrationId)
        {
            var myRegistration = await this._registrationRepository.GetById(registrationId);
            bool cancelSilently = myRegistration.FlowState == RegistrationFlowState.New || myRegistration.FlowState == RegistrationFlowState.Submitted;

            myRegistration.FlowState = RegistrationFlowState.Cancelled;
            await this._registrationRepository.Update(myRegistration);

            //if (!cancelSilently)
            //{
            //    this.SubmitEventCancellationEmail(myRegistration);
            //}
            
        }

        public async Task HandleEventCancelled(int registrationId, EventCancellationOptionsDO cancellationOptions)
        {
            Ensure.Comparable.IsGt(registrationId, 0);
            Ensure.Any.IsNotNull(cancellationOptions);

            if (cancellationOptions.SendCommunications && cancellationOptions.CommunicateToStates.Count == 0) throw new ArgumentException("If cancellation options is to communicate, communication states must be set");

            var myRegistration = await this._registrationRepository.GetById(registrationId);

            var sendCommunication = cancellationOptions.SendCommunications && cancellationOptions.CommunicateToStates.Contains(myRegistration.FlowState);

            myRegistration.FlowState = RegistrationFlowState.Cancelled;
            await this._registrationRepository.Update(myRegistration);

            if (sendCommunication)
            {
                await this.SubmitEventCancellationEmail(myRegistration);
            }
        }

        /// <summary>
        /// Called from the event service when a call to delete the event is recieved.
        /// </summary>
        /// <param name="registration"></param>
        /// <returns></returns>
        public async Task HandleGroupDeleted(int registrationId)
        {
            var myRegistration = await this._registrationRepository.GetById(registrationId);
            bool isActive = myRegistration.FlowState == RegistrationFlowState.New || myRegistration.FlowState == RegistrationFlowState.Submitted;
            bool isHistorical = myRegistration.FlowState == RegistrationFlowState.Closed || myRegistration.FlowState == RegistrationFlowState.Cancelled;

            if (isActive)
            {
                myRegistration.FlowState = RegistrationFlowState.Cancelled;
                await this._registrationRepository.Update(myRegistration);
            }
            

            if (!isActive && !isHistorical)
            {
                this.SubmitRegistrationGroupCancelledEmail(myRegistration);
            }

        }

        public async Task<GroupRegistationConfirmationEmailData> GenerateRegistrationConfirmationEmailData(int registrationId)
        {
            return await this._registrationEmailDataService.BuildGroupRegistrationConfirmationData(registrationId);
        }

        public async Task<GroupRegistationSubmissionEmailData> GenerateRegistrationSubmissionEmailData(int registrationId)
        {
            return await this._registrationEmailDataService.BuildGroupRegistrationSubmissionData(registrationId);
        }

        public async Task<EventCancellationEmailData> GenerateEventCancellationEmailData(int registrationId)
        {
            return await this._registrationEmailDataService.BuildEventCancellationData(registrationId);
        }

        /// <summary>
        /// This method is used by the event service to close each registration when the event is closed.
        /// </summary>
        /// <param name="registration"></param>
        /// <returns></returns>
        public async Task CloseRegistration(int registrationId)
        {
            var originalRegistration = await _registrationRepository.GetById(registrationId);

            switch (originalRegistration.FlowState)
            {
                case RegistrationFlowState.New:
                case RegistrationFlowState.Submitted:
                    originalRegistration.FlowState = RegistrationFlowState.Cancelled;
                    break;
                case RegistrationFlowState.Confirmed:
                    originalRegistration.FlowState = RegistrationFlowState.Closed;
                    break;
                case RegistrationFlowState.Closed:
                case RegistrationFlowState.Cancelled:
                    break;
            }

            await this._registrationRepository.Update(originalRegistration);
        }

        public async Task<ICollection<Registration>> ListForEvent(int eventId)
        {
            return await _registrationRepository.Find(r => r.EventId == eventId);
        }

        public async Task<ICollection<Registration>> ListForGroup(int groupId)
        {
            return await _registrationRepository.Find(r => r.GroupId == groupId);
        }
    }
}
