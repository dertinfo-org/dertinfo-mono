using DertInfo.CrossCutting.Auth;
using DertInfo.CrossCutting.Configuration;
using DertInfo.CrossCutting.Connection;
using DertInfo.Models.Database;
using DertInfo.Models.DomainObjects;
using DertInfo.Models.System;
using DertInfo.Models.System.Enumerations;
using DertInfo.Repository;
using DertInfo.Services.Entity.Competitions;
using DertInfo.Services.Entity.EmailTemplates;
using DertInfo.Services.Entity.Images;
using EnsureThat;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DertInfo.Services.Entity.Events
{
    public interface IEventService
    {
        Task<ICollection<Event>> ListByUserForWeb();
        Task<ICollection<Event>> ListByUserForApp();
        Task<ICollection<Event>> ListAvailable();
        Task<ICollection<Event>> ListPromoted();
        Task<ICollection<Event>> ListForShowcase();
        Task<Event> CreateMinimal(Event myEvent);
        Task<Event> Create(Event myEvent, byte[] imageByteArray, string imageExtension, EventTemplateType template);
        Task<Event> GetById(int eventId);
        // Task<Event> GetByUuid(string uuid);
        Task<EventImage> AttachEventImage(int eventId, byte[] imageByteArray, string imageExtension);
        Task<EventImage> DetachEventImage(int eventId, int eventImageId);
        Task SetPrimaryEventImage(int eventId, int eventImageId);
        Task<ICollection<Registration>> GetRegistrations(int eventId);
        Task<ICollection<EventImage>> GetImages(int eventId);
        Task<Event> Configure(Event myEvent, EventTemplateType template);
        Task<EventOverviewDO> GetOverview(int eventId);
        Task<Event> DeleteEvent(int eventId);
        Task<Event> CancelEvent(int eventId, EventCancellationOptionsDO options);
        Task<Event> UpdateOverview(Event updatedEvent);
        Task<Event> UpdateDates(Event updatedEvent);
        Task<ICollection<Activity>> GetIndividualActivities(int eventId);
        Task<ICollection<Activity>> GetTeamActivities(int eventId);
        Task<ICollection<Activity>> GetPublishedIndividualActivities(int eventId);
        Task<ICollection<Activity>> GetPublishedTeamActivities(int eventId);
        Task<Activity> CreateActivity(Activity myActivity);
        Task<Activity> RemoveActivity(int activityId);
        Task<Event> GetForAuthorization(int eventId);
        Task<Event> DetailForShowcase(int eventId);
        Task<ContactInfoDO> GetContactInfo(int eventId);
        Task<IEnumerable<EventCompetitionDO>> GetCompetitions(int eventId);
        Task CloseEvent(int eventId);
    }

    public class EventService : IEventService
    {
        IAuthService _authService;
        IEventTemplateService _eventTemplateService;

        IActivityRepository _activityRepository;
        IBlobStorageRepository _blobStorageRepository;
        ICompetitionService _competitionService;
        IEventRepository _eventRepository;
        IImageRepository _imageRepository;
        IImageService _imageService;
        IRegistrationRepository _registrationRepository;
        IRegistrationService _registrationService;
        IVenueRepository _venueRepository;
        IStorageAccountConnection _storageAccountConnection;
        IDertInfoUser _user;

        public EventService(
            IActivityRepository activityRepository,
            IAuthService authService,
            ICompetitionService competitionService,
        IEventTemplateService eventTemplateService,
            IEventRepository eventRepository,
            IImageRepository imageRepository,
            IImageService imageService,
            IRegistrationRepository registrationRepository,
            IRegistrationService registrationService,
            IVenueRepository venueRepository,

            IBlobStorageRepository blobStorageRepository,
            IDertInfoUser user,
            IStorageAccountConnection storageAccountConnection
            )
        {
            _activityRepository = activityRepository;
            _authService = authService;
            _competitionService = competitionService;
            _eventTemplateService = eventTemplateService;
            _blobStorageRepository = blobStorageRepository;
            _eventRepository = eventRepository;
            _imageRepository = imageRepository;
            _imageService = imageService;
            _registrationRepository = registrationRepository;
            _registrationService = registrationService;
            _venueRepository = venueRepository;
            _storageAccountConnection = storageAccountConnection;
            _user = user;
        }

        public async Task<ICollection<Event>> ListByUserForWeb()
        {
            ICollection<Event> eventsList = new List<Event>();
            List<string> strEventIds = new List<string>();

            if (this._user.IsSuperAdmin)
            {
                eventsList = await _eventRepository.GetAllWithPrimaryImageAndCounts();
                return eventsList;
            }

            // Event Admin gets all events where user is admin
            if (_user.ClaimsEventAdmin != null && _user.ClaimsEventAdmin.Count() > 0)
            {
                string[] eventUuids = this._user.ClaimsEventAdmin.ToArray();
                strEventIds = strEventIds.Union(eventUuids).Distinct().ToList();
            }

            foreach (var strEventId in strEventIds)
            {
                int eventId = int.Parse(strEventId);
                var myEvent = await _eventRepository.GetEventWithPrimaryImageAndCountsById(eventId);
                if (myEvent != null)
                {
                    eventsList.Add(myEvent);
                }
            }

            return eventsList;
        }

        /// <summary>
        /// Should return all the events that the user should have access to in the context of root access.
        /// </summary>
        /// <returns></returns>
        public async Task<ICollection<Event>> ListByUserForApp()
        {
            ICollection<Event> eventsList = new List<Event>();
            List<string> strEventIds = new List<string>();

            if (this._user.IsSuperAdmin)
            {
                eventsList = await _eventRepository.GetAllWithPrimaryImageAndCounts();
                return eventsList;
            }

            // Event Admin gets all events where user is admin
            if (_user.ClaimsEventAdmin != null && _user.ClaimsEventAdmin.Count() > 0)
            {
                string[] eventUuids = this._user.ClaimsEventAdmin.ToArray();
                strEventIds = strEventIds.Union(eventUuids).Distinct().ToList();
            }

            // Venue Admin gets venues that they are admin for
            if (_user.ClaimsVenueAdmin != null && _user.ClaimsVenueAdmin.Count() > 0)
            {
                IEnumerable<int> venueIds = _user.ClaimsVenueAdmin.Select(x => int.Parse(x));

                foreach (var venueId in venueIds)
                {
                    Venue venue = await _venueRepository.GetById(venueId);
                    if (!strEventIds.Contains(venue.EventId.ToString()))
                    {
                        strEventIds.Add(venue.EventId.ToString());
                    }
                }
            }

            // Group Admin gets events that they have entered
            if ((_user.ClaimsGroupAdmin != null && _user.ClaimsGroupAdmin.Count() > 0) || (_user.ClaimsGroupMember != null && _user.ClaimsGroupMember.Count() > 0))
            {

                var groupIds = _user.ClaimsGroupAdmin.Union(_user.ClaimsGroupMember).Distinct().Select(x => int.Parse(x)).ToList();

                var strGroupEventsIds = await this.ListEventIdsByGroupIds(groupIds);

                strEventIds = strEventIds.Union(strGroupEventsIds).Distinct().ToList();

            }

            foreach (var strEventId in strEventIds)
            {
                int eventId = int.Parse(strEventId);
                var myEvent = await _eventRepository.GetEventWithPrimaryImageAndCountsById(eventId);
                if (myEvent != null)
                {
                    eventsList.Add(myEvent);
                }
            }

            return eventsList;
        }

        public async Task<ICollection<Event>> ListAvailable()
        {

            var availableEvents = await _eventRepository.GetAvailableWithPrimaryImage();
            return availableEvents;
        }

        public async Task<ICollection<Event>> ListPromoted()
        {
            var promotedEvents = await _eventRepository.GetPromotedWithImages();
            return promotedEvents;
        }

        public async Task<ICollection<Event>> ListForShowcase()
        {
            var promotedEvents = await _eventRepository.GetShowcaseWithImages();
            return promotedEvents;
        }

        public async Task<Event> DetailForShowcase(int eventId)
        {
            var showcaseDetail = await _eventRepository.GetShowcaseDetailWithImages(eventId);
            return showcaseDetail;
        }

        /// <summary>
        /// Returns the event object with the minimal fields for completing authorization. 
        /// note - this has not been optimised. (or even implemented correctly as we can get a much reduced object)
        /// </summary>
        /// <param name="registrationId"></param>
        /// <returns></returns>
        public async Task<Event> GetForAuthorization(int eventId)
        {
            return await _eventRepository.GetById(eventId);
        }

        public async Task<EventOverviewDO> GetOverview(int eventId)
        {
            var myEventQueryable = await _eventRepository.GetEventOverviewQueryable(eventId);

            var activeOrCompletedRegistrations = myEventQueryable.SelectMany(e => e.Registrations.Where(r =>
                (r.FlowState == RegistrationFlowState.Submitted) ||
                (r.FlowState == RegistrationFlowState.Confirmed) ||
                (r.FlowState == RegistrationFlowState.Closed)
            ));

            var membersAndGuestsCount = activeOrCompletedRegistrations.SelectMany(r => r.MemberAttendances).Count();
            var teamsCount = activeOrCompletedRegistrations.SelectMany(r => r.TeamAttendances).Count();
            var registrationsCount = activeOrCompletedRegistrations.Count();

            var myEvent = myEventQueryable.Select(eq => eq).FirstOrDefault();

            return new EventOverviewDO {
                Id = myEvent.Id,
                ContactName = myEvent.ContactName,
                ContactTelephone = myEvent.ContactTelephone,
                ContactEmail = myEvent.ContactEmail,
                EventEndDate = myEvent.EventEndDate,
                EventImages = myEvent.EventImages,
                EventStartDate = myEvent.EventStartDate,
                EventSynopsis = myEvent.EventSynopsis,
                IsConfigured = myEvent.IsConfigured,
                IsCancelled = myEvent.IsCancelled,
                LocationPostcode = myEvent.LocationPostcode,
                LocationTown = myEvent.LocationTown,
                Name = myEvent.Name,
                RegistrationCloseDate = myEvent.RegistrationCloseDate,
                RegistrationOpenDate = myEvent.RegistrationOpenDate,
                RegistrationsCount = registrationsCount,
                MembersAndGuestsCount = membersAndGuestsCount,
                TeamsCount = teamsCount,
                SentEmailsBcc = myEvent.SentEmailsBcc,
                Visibility = myEvent.EventVisibilityType
            };
        }

        public async Task<Event> GetById(int id)
        {
            if (!this._user.IsSuperAdmin)
            {
                string[] eventUuids = this._user.ClaimsEventAdmin.ToArray();

                if (eventUuids.Contains(id.ToString()))
                {
                    return await _eventRepository.GetEventWithImagesById(id);
                }
                else
                {
                    // todo - Create a set of responses that have meaning at this level of the application.
                    //      - the consumers can then identify the response and act appropraitely
                    return null;
                }
            }
            else
            {
                return await _eventRepository.GetEventWithImagesById(id);
            }
        }

        public async Task<IEnumerable<EventCompetitionDO>> GetCompetitions(int eventId)
        {
            return await this._competitionService.ListByEvent(eventId);
        }

        public async Task<ContactInfoDO> GetContactInfo(int eventId)
        {
            var contactInfo = await _eventRepository.GetContactInfo(eventId);

            return contactInfo;
        }

        public async Task<Event> CreateMinimal(Event myEvent)
        {
            return await this.Create(myEvent, null, null, EventTemplateType.Blank);
        }

        /// <summary>
        /// Create a new event with the information provided
        /// As part of creating a event we also:
        /// - Create the Unique Id (Uuid) and assign it to the event
        /// - Add the event Uuid claim to the user creating the event
        /// - Handle the supplied image (if there is one) - Link to event
        /// - If template defined then apply event template to event.
        /// </summary>
        /// <param name="myEvent"></param>
        /// <returns></returns>
        public async Task<Event> Create(Event myEvent, byte[] imageByteArray, string imageExtension, EventTemplateType eventTemplate)
        {
            // Upload image to Azure & Create reference in the database
            var image = new Image();
            if (imageByteArray != null && imageExtension != null)
            {
                var connectionString = _storageAccountConnection.getImagesStorageConnectionString();
                var container = _storageAccountConnection.getEventPicturesContainer();
                var blobPath = _storageAccountConnection.getOriginalsFolder();
                var blobName = _storageAccountConnection.createEventPictureFileName(myEvent.Id, imageExtension);
                var blobExtension = imageExtension.Replace(".", string.Empty);

                var resourceUri = await _blobStorageRepository.UploadFileToBlob(imageByteArray, connectionString, container, blobPath, blobName);
                image.Container = container;
                image.BlobPath = blobPath;
                image.BlobName = blobName;
                image.Extension = blobExtension;
                image = await _imageRepository.Add(image);
            }
            else
            {
                // Apply the awaiting image image to the group. 
                image = await _imageService.GetDefaultEventImage();
            }

            // Assign the images
            var eventImages = new List<EventImage>();
            if (image.Id != 0)
            {
                EventImage eventImage = new EventImage();
                eventImage.IsPrimary = true;
                eventImage.Image = image;
                eventImages.Add(eventImage);
            }

            myEvent.EventImages = eventImages;

            // Save and return
            myEvent = await _eventRepository.Add(myEvent);

            // Apply the claim
            UserAccessClaims userAccessClaims = new UserAccessClaims();
            userAccessClaims.Auth0UserId = this._user.AuthId;
            userAccessClaims.EventPermissions = new string[] { myEvent.Id.ToString() };
            userAccessClaims = await this._authService.AddAccessClaims(userAccessClaims);

            // Event Template
            await _eventTemplateService.ApplyTemplate(myEvent, eventTemplate);

            return myEvent;
        }

        public async Task<Event> Configure(Event myEvent, EventTemplateType eventTemplateType)
        {
            var originalEvent = await _eventRepository.GetById(myEvent.Id);

            if (originalEvent == null) { throw new InvalidOperationException("Event Could Not Be Found"); }

            if (originalEvent.EventSynopsis != myEvent.EventSynopsis)
            {
                originalEvent.EventSynopsis = myEvent.EventSynopsis;
            }

            if (originalEvent.LocationTown != myEvent.LocationTown)
            {
                originalEvent.LocationTown = myEvent.LocationTown;
            }

            if (originalEvent.LocationPostcode != myEvent.LocationPostcode)
            {
                originalEvent.LocationPostcode = myEvent.LocationPostcode;
            }

            if (originalEvent.EventStartDate != myEvent.EventStartDate)
            {
                originalEvent.EventStartDate = myEvent.EventStartDate;
            }

            if (originalEvent.EventEndDate != myEvent.EventEndDate)
            {
                originalEvent.EventEndDate = myEvent.EventEndDate;
            }

            if (originalEvent.RegistrationOpenDate != myEvent.RegistrationOpenDate)
            {
                originalEvent.RegistrationOpenDate = myEvent.RegistrationOpenDate;
            }

            if (originalEvent.RegistrationCloseDate != myEvent.RegistrationCloseDate)
            {
                originalEvent.RegistrationCloseDate = myEvent.RegistrationCloseDate;
            }

            if (originalEvent.ContactName != myEvent.ContactName)
            {
                originalEvent.ContactName = myEvent.ContactName;
            }

            if (originalEvent.ContactEmail != myEvent.ContactEmail)
            {
                originalEvent.ContactEmail = myEvent.ContactEmail;
            }

            if (originalEvent.ContactTelephone != myEvent.ContactTelephone)
            {
                originalEvent.ContactTelephone = myEvent.ContactTelephone;
            }

            if (originalEvent.EventTemplateType != eventTemplateType || !originalEvent.IsConfigured)
            {
                originalEvent.EventTemplateType = eventTemplateType;
                await _eventTemplateService.ApplyTemplate(myEvent, eventTemplateType);
            }

            if (originalEvent.EventVisibilityType != myEvent.EventVisibilityType)
            {
                originalEvent.EventVisibilityType = myEvent.EventVisibilityType;
            }

            if (originalEvent.TermsAndConditionsAgreed != myEvent.TermsAndConditionsAgreed)
            {
                originalEvent.TermsAndConditionsAgreed = myEvent.TermsAndConditionsAgreed;
            }

            if (originalEvent.TermsAndConditionsAgreedBy != myEvent.TermsAndConditionsAgreedBy)
            {
                originalEvent.TermsAndConditionsAgreedBy = myEvent.TermsAndConditionsAgreedBy;
            }

            if (!originalEvent.IsConfigured)
            {
                originalEvent.IsConfigured = true;
            }

            // Save and return
            await _eventRepository.Update(originalEvent);

            return originalEvent;
        }

        public async Task<EventImage> AttachEventImage(int eventId, byte[] imageByteArray, string imageExtension)
        {
            var myEvent = await this._eventRepository.GetEventWithImagesById(eventId);

            var connection = _storageAccountConnection.getImagesStorageConnectionString();
            var blobContainer = _storageAccountConnection.getEventPicturesContainer();
            var blobPath = _storageAccountConnection.getOriginalsFolder();
            var blobName = _storageAccountConnection.createEventPictureFileName(eventId, imageExtension);
            var blobExtension = imageExtension.Replace(".", string.Empty);

            // Upload image to Azure
            var resourceUri = await _blobStorageRepository.UploadFileToBlob(imageByteArray, connection, blobContainer, blobPath, blobName);

            var image = new Image()
            {
                Container = blobContainer,
                BlobPath = blobPath,
                BlobName = blobName,
                Extension = blobExtension
            };
            image = await _imageRepository.Add(image);

            var eventImage = new EventImage();
            eventImage.EventId = eventId;
            eventImage.Image = image;

            if (myEvent.EventImages != null)
            {
                // if any images are the default image and a new image is added then remove the default image. 
                var defaultImage = await _imageService.GetDefaultEventImage();

                var filteredImages = myEvent.EventImages.Where(gi => gi.ImageId != defaultImage.Id).ToList();
                myEvent.EventImages = filteredImages;

                // In the case where the new image is the only 1 set it as primary.
                if (filteredImages.Count == 0)
                {
                    eventImage.IsPrimary = true;
                }

                // Add the uploaded image.
                myEvent.EventImages.Add(eventImage);
            }
            else
            {
                myEvent.EventImages = new List<EventImage> { eventImage };
            }

            // Save To Database - Apply update through event save.
            bool done = await _eventRepository.Update(myEvent);

            // We need to ensure that the rezises have been complated before returning.
            var resizePath = _storageAccountConnection.get480x360Folder();
            var loopCounter = 0;
            while (loopCounter < 8 && !await _blobStorageRepository.TestExists(connection, blobContainer, resizePath, blobName))
            {
                loopCounter++;
                Task.Delay(1000).Wait();
            }

            return done ? eventImage : throw new Exception("Event Attach Image Failed");
        }

        public async Task<EventImage> DetachEventImage(int groupId, int groupImageId)
        {
            var myEvent = await this._eventRepository.GetEventWithImagesById(groupId);

            if (myEvent.EventImages != null)
            {
                var eventImage = myEvent.EventImages.FirstOrDefault(gi => gi.Id == groupImageId);
                if (eventImage != null)
                {

                    // note - it would be better here to just mark the group image as deleted. 

                    // question - does the removal of the image then prevent the save of the image deleted.

                    // if this is the primary image the primary image needs to be reallocated. 
                    if (eventImage.IsPrimary && myEvent.EventImages.Count() > 1)
                    {
                        var alternatePrimary = myEvent.EventImages.FirstOrDefault(gi => !gi.IsPrimary);
                        if (alternatePrimary != null)
                        {
                            await this.SetPrimaryEventImage(groupId, alternatePrimary.Id);
                        }
                    }

                    if (myEvent.EventImages.Count() > 1)
                    {
                        // remove from the group images
                        myEvent.EventImages.Remove(eventImage);

                        // Mark the image as IsDeleted if not the default
                        var defaultImage = await _imageService.GetDefaultGroupImage();
                        if (eventImage.ImageId != defaultImage.Id)
                        {
                            eventImage.Image.IsDeleted = true;
                        }

                        //Save To Database - Apply update through group save.
                        bool done = await _eventRepository.Update(myEvent);
                        return done ? eventImage : throw new Exception("Event Detach Image Failed");
                    }

                    throw new Exception("Cannot remove last image from group");
                }
            }

            return null;
        }

        public async Task<Event> UpdateOverview(Event updatedEvent)
        {
            var originalEvent = await _eventRepository.GetById(updatedEvent.Id);

            if (originalEvent == null) { throw new InvalidOperationException("Event Could Not Be Found"); }

            if (originalEvent.Name != updatedEvent.Name)
            {
                originalEvent.Name = updatedEvent.Name;
            }

            if (originalEvent.ContactEmail != updatedEvent.ContactEmail)
            {
                originalEvent.ContactEmail = updatedEvent.ContactEmail;
            }

            if (originalEvent.ContactName != updatedEvent.ContactName)
            {
                originalEvent.ContactName = updatedEvent.ContactName;
            }

            if (originalEvent.ContactTelephone != updatedEvent.ContactTelephone)
            {
                originalEvent.ContactTelephone = updatedEvent.ContactTelephone;
            }

            if (originalEvent.EventSynopsis != updatedEvent.EventSynopsis)
            {
                originalEvent.EventSynopsis = updatedEvent.EventSynopsis;
            }

            if (originalEvent.LocationTown != updatedEvent.LocationTown)
            {
                originalEvent.LocationTown = updatedEvent.LocationTown;
            }

            if (originalEvent.LocationPostcode != updatedEvent.LocationPostcode)
            {
                originalEvent.LocationPostcode = updatedEvent.LocationPostcode;
            }

            if (originalEvent.EventVisibilityType != updatedEvent.EventVisibilityType)
            {
                originalEvent.EventVisibilityType = updatedEvent.EventVisibilityType;
            }

            if (originalEvent.SentEmailsBcc != updatedEvent.SentEmailsBcc)
            {
                originalEvent.SentEmailsBcc = updatedEvent.SentEmailsBcc;
            }

            await _eventRepository.Update(originalEvent);

            return originalEvent;
        }

        public async Task<Event> UpdateDates(Event updatedEvent)
        {
            var originalEvent = await _eventRepository.GetById(updatedEvent.Id);

            if (originalEvent == null) { throw new InvalidOperationException("Event Could Not Be Found"); }

            if (originalEvent.EventStartDate != updatedEvent.EventStartDate)
            {
                originalEvent.EventStartDate = updatedEvent.EventStartDate;
            }

            if (originalEvent.EventEndDate != updatedEvent.EventEndDate)
            {
                originalEvent.EventEndDate = updatedEvent.EventEndDate;
            }

            if (originalEvent.RegistrationOpenDate != updatedEvent.RegistrationOpenDate)
            {
                originalEvent.RegistrationOpenDate = updatedEvent.RegistrationOpenDate;
            }

            if (originalEvent.RegistrationCloseDate != updatedEvent.RegistrationCloseDate)
            {
                originalEvent.RegistrationCloseDate = updatedEvent.RegistrationCloseDate;
            }

            await _eventRepository.Update(originalEvent);

            return originalEvent;
        }

        public async Task SetPrimaryEventImage(int eventId, int eventImageId)
        {
            await this._eventRepository.ApplyPrimaryImage(eventId, eventImageId);
        }

        public async Task<Event> DeleteEvent(int eventId)
        {
            var eventRegistrations = await this._registrationService.ListForEvent(eventId);
            var myEvent = await _eventRepository.MarkDeleted(eventId);

            foreach (var registration in eventRegistrations)
            {
                await this._registrationService.HandleEventDeleted(registration.Id);
            }

            // Remove the claim
            UserAccessClaims userAccessClaims = new UserAccessClaims();
            userAccessClaims.Auth0UserId = this._user.AuthId;
            userAccessClaims.EventPermissions = new string[] { myEvent.Id.ToString() };
            userAccessClaims = await this._authService.RemoveAccessClaims(userAccessClaims);

            return myEvent;
        }

        public async Task<Event> CancelEvent(int eventId, EventCancellationOptionsDO options)
        {
            Ensure.Comparable.IsGt(eventId, 0);
            Ensure.Any.IsNotNull(options);

            if (!_user.ClaimsEventAdmin.Contains(eventId.ToString())) { throw new Exception("You do not have permission to cancel this event"); }

            var eventRegistrations = await this._registrationService.ListForEvent(eventId);
            var myEvent = await _eventRepository.MarkCancelled(eventId);

            foreach (var registration in eventRegistrations)
            {
                await this._registrationService.HandleEventCancelled(registration.Id, options);
            }

            return myEvent;
        }

        private async Task<IEnumerable<string>> ListEventIdsByGroupIds(IEnumerable<int> groupIds)
        {
            var events = await _eventRepository.Find(e => e.Registrations.Any(r => groupIds.Contains(r.GroupId)));

            return events.Select(e => e.Id.ToString()).Distinct();
        }

        public async Task<ICollection<Registration>> GetRegistrations(int eventId)
        {
            var registrations = await this._registrationRepository.GetByEventWithGroupImagesAndCounts(eventId);

            return registrations;
        }

        public async Task<ICollection<EventImage>> GetImages(int eventId)
        {
            var myEvent = await this._eventRepository.GetEventWithImagesById(eventId);

            return myEvent.EventImages;
        }

        public async Task<ICollection<Activity>> GetIndividualActivities(int eventId)
        {
            var individualActivities = await this._activityRepository.GetByEventAndTypeWithCounts(eventId, ActivityAudienceType.INDIVIDUAL);

            return individualActivities;
        }

        public async Task<ICollection<Activity>> GetTeamActivities(int eventId)
        {
            var teamActivities = await this._activityRepository.GetByEventAndTypeWithCounts(eventId, ActivityAudienceType.TEAM);

            return teamActivities;
        }

        public async Task<ICollection<Activity>> GetPublishedIndividualActivities(int eventId)
        {
            return await this._activityRepository.GetPublishedByEventAndAudience(eventId, ActivityAudienceType.INDIVIDUAL);
        }

        public async Task<ICollection<Activity>> GetPublishedTeamActivities(int eventId)
        {
            return await this._activityRepository.GetPublishedByEventAndAudience(eventId, ActivityAudienceType.TEAM);
        }

        public async Task<Activity> CreateActivity(Activity myActivity)
        {
            myActivity = await _activityRepository.Add(myActivity);

            return myActivity;
        }

        public async Task<Activity> RemoveActivity(int activityId)
        {
            var myActivity = await _activityRepository.MarkDeleted(activityId);
            return myActivity;
        }

        public async Task CloseEvent(int eventId)
        {
            // The query typically removes the deleted items after the ignore query filter. In this case we want all the data. 
            var registrations = await this._registrationRepository.GetByEventWithGroupImagesAndCounts(eventId, false);

            foreach (var registration in registrations)
            {
                await this._registrationService.CloseRegistration(registration.Id);
            }
        }
    }
}
