using AutoMapper;
using DertInfo.Api.AuthorisationPolicies.ClaimsBased;
using DertInfo.Api.AuthorisationPolicies.ResourceBased;
using DertInfo.Api.Controllers.Base;
using DertInfo.Api.Filters;
using DertInfo.CrossCutting.Auth;
using DertInfo.Models.Database;
using DertInfo.Models.DataTransferObject;
using DertInfo.Models.DomainObjects;
using DertInfo.Models.System.Enumerations;
using DertInfo.Repository;
using DertInfo.Services;
using DertInfo.Services.Entity.Activities;
using DertInfo.Services.Entity.Competitions;
using DertInfo.Services.Entity.EmailTemplates;
using DertInfo.Services.Entity.Events;
using DertInfo.Services.Entity.Images;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Xml;

namespace DertInfo.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class EventController : ResourceAuthController
    {
        private string _errorMessage = string.Empty;

        IMapper _mapper;
        IActivityService _activityService;
        ICompetitionService _competitionService;
        IEmailTemplateService _emailTemplateService;
        IEventService _eventService;
        IImageService _imageService;
        IInvoiceService _invoiceService;
        ITeamService _teamService;
        IVenueService _venueService;

        public EventController(
            IAuthorizationService authorizationService,
            IMapper mapper,
            IActivityService activityService,
            ICompetitionService competitionService,
            IEmailTemplateService emailTemplateService,
            IEventService eventService,
            IImageService imageService,
            IInvoiceService invoiceService,
            ITeamService teamService,
            IVenueService venueService,
            IDertInfoUser user
            ) : base(user, authorizationService)
        {
            _mapper = mapper;
            _activityService = activityService;
            _competitionService = competitionService;
            _emailTemplateService = emailTemplateService;
            _eventService = eventService;
            _imageService = imageService;
            _invoiceService = invoiceService;
            _teamService = teamService;
            _venueService = venueService;
        }

        #region GET

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            var events = await _eventService.ListByUserForApp();

            // Perform Auto Map of simple fields
            List<EventDto> eventDtos = _mapper.Map<List<EventDto>>(events);

            return Ok(eventDtos.OrderByDescending(dto => dto.EventStartDate));
        }

        [HttpGet]
        [Route("web")]
        public async Task<IActionResult> GetForWeb()
        {
            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            var events = await _eventService.ListByUserForWeb();

            // Perform Auto Map of simple fields
            List<EventDto> eventDtos = _mapper.Map<List<EventDto>>(events);

            return Ok(eventDtos.OrderByDescending(dto => dto.EventStartDate));
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailable()
        {
            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            var events = await _eventService.ListAvailable();

            // Perform Auto Map of simple fields
            List<EventDto> eventDtos = _mapper.Map<List<EventDto>>(events);

            return Ok(eventDtos.OrderByDescending(dto => dto.EventStartDate));
        }

        [HttpGet("promoted")]
        public async Task<IActionResult> GetPromoted()
        {
            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            var events = await _eventService.ListPromoted();

            // Perform Auto Map of simple fields
            List<EventDto> eventDtos = _mapper.Map<List<EventDto>>(events);

            return Ok(eventDtos.OrderByDescending(dto => dto.EventStartDate));
        }

        [HttpGet("{eventId}")]
        public async Task<IActionResult> Get(int eventId)
        {
            // EventDto is safe for public consumption. No personally identifiable information.
            // todo - to be extra secure we should check the visibility of the event and ensure that it is not private.
            //      - if the event is private then the requesting user should be in the invite list for the event. (invite functionality remains to be implemented)

            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            var events = await _eventService.ListAvailable();

            var myEvent = await this._eventService.GetOverview(eventId);

            EventDto eventDto = _mapper.Map<EventDto>(myEvent);

            return Ok(eventDto);
        }

        [HttpGet("{eventId}/overview")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> GetOverview(int eventId)
        {
            base.ExtractUser(); //Fill the scoped injected IDertInfoUser

            var eventOverviewDo = await this._eventService.GetOverview(eventId);

            EventOverviewDto eventOverviewDto = _mapper.Map<EventOverviewDto>(eventOverviewDo);

            return Ok(eventOverviewDto);
        }

        [HttpGet("{eventId}/venues")]
        public async Task<IActionResult> GetVenues(int eventId)
        {
            base.ExtractUser(); //Fill the scoped injected IDertInfoUser

            var venues = await _venueService.ListByUser(eventId);

            List<VenueDto> venueDtos = _mapper.Map<List<VenueDto>>(venues);

            return Ok(venueDtos.OrderBy(dto => dto.Name));
        }

        [HttpGet]
        [Route("{eventId}/registrations")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> GetRegistrations(int eventId)
        {
            base.ExtractUser(); //Fill the scoped injected IDertInfoUser

            var eventRegistrations = await _eventService.GetRegistrations(eventId);

            // Perform Auto Map of simple fields
            List<EventRegistrationDto> eventRegistrationDtos = _mapper.Map<List<EventRegistrationDto>>(eventRegistrations);

            return Ok(eventRegistrationDtos);
        }

        [HttpGet]
        [Route("{eventId}/images")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> GetImages(int eventId)
        {
            base.ExtractUser(); //Fill the scoped injected IDertInfoUser

            var eventImages = await _eventService.GetImages(eventId);

            // Perform Auto Map of simple fields
            List<EventImageDto> eventImageDtos = _mapper.Map<List<EventImageDto>>(eventImages);

            return Ok(eventImageDtos);
        }

        [Obsolete("Event GetInvoices is deprecated, please use Invoice Controller instead", false)]
        [HttpGet]
        [Route("{eventId}/invoices")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> GetInvoices(int eventId)
        {
            base.ExtractUser(); //Fill the scoped injected IDertInfoUser

            var eventInvoices = await _invoiceService.GetInvoicesForEvent(eventId);

            // Perform Auto Map of simple fields
            List<EventInvoiceDto> eventInvoiceDtos = _mapper.Map<List<EventInvoiceDto>>(eventInvoices);

            foreach (var invoiceDto in eventInvoiceDtos)
            {
                try
                {
                    XmlDocument entryNotesXml = new XmlDocument();
                    entryNotesXml.LoadXml(invoiceDto.InvoiceEntryNotes);
                    string jsonTextEntryNotes = JsonConvert.SerializeXmlNode(entryNotesXml);
                    invoiceDto.InvoiceEntryNotes = jsonTextEntryNotes;

                    XmlDocument invoiceLinesXml = new XmlDocument();
                    invoiceLinesXml.LoadXml(invoiceDto.InvoiceLineItemNotes);
                    string jsonTextInvoiceLines = JsonConvert.SerializeXmlNode(invoiceLinesXml);
                    invoiceDto.InvoiceLineItemNotes = jsonTextInvoiceLines;

                    invoiceDto.HasStructuredNotes = true;
                }
                catch
                {
                    invoiceDto.HasStructuredNotes = false;
                }
            }

            return Ok(eventInvoiceDtos);
        }

        [HttpGet]
        [Route("{eventId}/individual-activities")]
        public async Task<IActionResult> GetIndividualActivities(int eventId)
        {
            var authorisationPolicy = EventGetActivitiesPolicy.PolicyName;

            Event myEvent = await this._eventService.GetForAuthorization(eventId);

            if (myEvent == null) return NotFound();

            if (await this.CheckAuthorisationPolicy(authorisationPolicy, myEvent))
            {

                base.ExtractUser(); //Fill the scoped injected IDertInfoUser

                var activities = await _eventService.GetIndividualActivities(eventId);

                // Perform Auto Map of simple fields
                List<EventActivityDto> activityDtos = _mapper.Map<List<EventActivityDto>>(activities);

                return Ok(activityDtos);
            }
            else
            {
                return StatusCode(403, " Failed to meet requirements for " + authorisationPolicy);
            }
        }

        [HttpGet]
        [Route("{eventId}/team-activities")]
        public async Task<IActionResult> GetTeamActivities(int eventId)
        {
            var authorisationPolicy = EventGetActivitiesPolicy.PolicyName;

            Event myEvent = await this._eventService.GetForAuthorization(eventId);

            if (myEvent == null) return NotFound();

            if (await this.CheckAuthorisationPolicy(authorisationPolicy, myEvent))
            {
                base.ExtractUser(); //Fill the scoped injected IDertInfoUser

                var activities = await _eventService.GetTeamActivities(eventId);

                // Perform Auto Map of simple fields
                List<EventActivityDto> activityDtos = _mapper.Map<List<EventActivityDto>>(activities);

                return Ok(activityDtos);
            }
            else
            {
                return StatusCode(403, " Failed to meet requirements for " + authorisationPolicy);
            }
        }

        [HttpGet]
        [Route("{eventId}/published-individual-activities")]
        public async Task<IActionResult> GetPublishedIndividualActivities(int eventId)
        {
            return await this.GetPublishedActivities(eventId, individual: true);
        }

        [HttpGet]
        [Route("{eventId}/published-team-activities")]
        public async Task<IActionResult> GetPublishedTeamActivities(int eventId)
        {
            return await this.GetPublishedActivities(eventId, individual: false);
        }

        [HttpGet]
        [Route("{eventId}/activities/{activityId}")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> GetActivity([FromRoute] int eventId, [FromRoute] int activityId)
        {
            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            var activity = await _activityService.GetDetail(activityId);

            ActivityDetailDto activityDetailDto = _mapper.Map<ActivityDetailDto>(activity);

            return Ok(activityDetailDto);
        }

        [HttpGet]
        [Route("{eventId}/activities/{activityId}/attendances")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> GetActivityAttendances([FromRoute] int eventId, [FromRoute] int activityId)
        {
            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            var activityAttendances = await _activityService.GetActivityAttendances(activityId);

            List<ActivityAttendanceDto> activityAttendanceDtos = _mapper.Map<List<ActivityAttendanceDto>>(activityAttendances);

            return Ok(activityAttendanceDtos);
        }

        [HttpGet]
        [Route("{eventId}/email-templates")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> GetEmailTemplates([FromRoute] int eventId)
        {
            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            var emailTemplates = await _emailTemplateService.ListByEvent(eventId);

            List<EmailTemplateDto> emailTemplateDtos = _mapper.Map<List<EmailTemplateDto>>(emailTemplates);

            return Ok(emailTemplateDtos);
        }

        [HttpGet]
        [Route("{eventId}/email-template/{templateId}")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> GetEmailTemplate([FromRoute] int eventId, [FromRoute] int templateId)
        {
            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            var emailTemplate = await _emailTemplateService.FindById(templateId);

            var errorMessage = "Template requested not found";
            if (emailTemplate == null) return BadRequest(errorMessage);
            if (emailTemplate.EventId != eventId)
            {
                errorMessage = errorMessage + " for event";
                return BadRequest(errorMessage);
            }

            EmailTemplateDetailDto emailTemplateDto = _mapper.Map<EmailTemplateDetailDto>(emailTemplate);

            return Ok(emailTemplateDto);
        }

        [HttpGet("{eventId}/competitions")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> GetCompetitions(int eventId)
        {
            base.ExtractUser(); //Fill the scoped injected IDertInfoUser

            var myEventCompetitions = await this._eventService.GetCompetitions(eventId);

            IEnumerable<EventCompetitionDto> eventCompetitionOverviewDtos = _mapper.Map<IEnumerable<EventCompetitionDto>>(myEventCompetitions);

            return Ok(eventCompetitionOverviewDtos);
        }

        [HttpGet("{eventId}/downloads")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> GetDownloads(int eventId)
        {
            base.ExtractUser(); //Fill the scoped injected IDertInfoUser

            var myEventConfirmedTeams = await this._teamService.GetConfirmedByEvent(eventId);

            IEnumerable<GroupTeamDto> confirmedTeamsDto = _mapper.Map<IEnumerable<GroupTeamDto>>(myEventConfirmedTeams);

            return Ok(confirmedTeamsDto.OrderBy(t => t.TeamName));
        }

        #endregion

        #region POST

        [HttpPost]
        [Route("minimal")]
        public async Task<IActionResult> PostMinimal([FromBody] EventMinimalSubmissionDto eventMinimalSubmission)
        {
            if (!ValidEventMinimalSubmission(eventMinimalSubmission)) { return BadRequest(this._errorMessage); }

            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            // todo - invetigate whether we can cleanly do this via automapper
            Event myEvent = new Event();
            myEvent.Name = eventMinimalSubmission.EventName;
            myEvent.EventSynopsis = eventMinimalSubmission.EventSynopsis;
            myEvent.IsConfigured = false;

            myEvent = await _eventService.CreateMinimal(myEvent);

            EventDto eventDto = _mapper.Map<EventDto>(myEvent);

            return Created("api/event/" + myEvent.Id, eventDto);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] EventSubmissionDto eventSubmission)
        {
            if (!ValidEventSubmission(eventSubmission)) { return BadRequest(this._errorMessage); }

            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            byte[] imageBytes = null;
            if (eventSubmission.Base64StringImage != null)
            {
                imageBytes = Convert.FromBase64String(eventSubmission.Base64StringImage);
            }

            // todo - invetigate whether we can cleanly do this via automapper
            Event myEvent = new Event();
            myEvent.Name = eventSubmission.EventName;
            myEvent.EventSynopsis = eventSubmission.EventSynopsis;
            myEvent.EventStartDate = eventSubmission.EventStartDate;
            myEvent.EventEndDate = eventSubmission.EventEndDate;
            myEvent.RegistrationOpenDate = eventSubmission.RegistrationOpenDate;
            myEvent.RegistrationCloseDate = eventSubmission.RegistrationCloseDate;
            myEvent.IsConfigured = true;

            var template = eventSubmission.TemplateSelection != null ? (EventTemplateType)Enum.Parse(typeof(EventTemplateType), eventSubmission.TemplateSelection.ToLower()) : EventTemplateType.Basic;
            myEvent = await _eventService.Create(myEvent, imageBytes, eventSubmission.UploadImageExtension, template);

            EventDto eventDto = _mapper.Map<EventDto>(myEvent);

            return Created("api/event/" + myEvent.Id, eventDto);
            // todo - there has to be a better way (other than hardcode) to return the get endpoint as a string based on the routing. 
            //      - there is, it is: CreatedAtRoute()
        }

        /// <summary>
        /// Used to add configuration to a minimal created event
        /// </summary>
        /// <param name="eventConfigurationSubmission"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("{eventId}/configure")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> ConfigureEvent([FromRoute] int eventId, [FromBody] EventConfigurationSubmissionDto eventConfigurationSubmission)
        {
            if (!ValidEventConfigurationSubmission(eventConfigurationSubmission)) { return BadRequest(this._errorMessage); }

            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            // todo - invetigate whether we can cleanly do this via automapper
            Event myEvent = new Event();
            myEvent.Id = eventId;
            myEvent.EventSynopsis = eventConfigurationSubmission.EventSynopsis;
            myEvent.EventStartDate = eventConfigurationSubmission.EventStartDate;
            myEvent.EventEndDate = eventConfigurationSubmission.EventEndDate;
            myEvent.RegistrationOpenDate = eventConfigurationSubmission.RegistrationOpenDate;
            myEvent.RegistrationCloseDate = eventConfigurationSubmission.RegistrationCloseDate;
            myEvent.ContactName = eventConfigurationSubmission.ContactName;
            myEvent.ContactEmail = eventConfigurationSubmission.ContactEmail;
            myEvent.ContactTelephone = eventConfigurationSubmission.ContactTelephone;
            myEvent.LocationTown = eventConfigurationSubmission.LocationTown;
            myEvent.LocationPostcode = eventConfigurationSubmission.LocationPostcode;
            myEvent.IsConfigured = true;
            myEvent.TermsAndConditionsAgreed = eventConfigurationSubmission.AgreeToTermsAndConditions;
            myEvent.TermsAndConditionsAgreedBy = _user.AuthId;

            var template = (EventTemplateType)eventConfigurationSubmission.TemplateType;
            myEvent = await _eventService.Configure(myEvent, template);

            EventDto eventDto = _mapper.Map<EventDto>(myEvent);

            return Ok(eventDto);
        }

        /// <summary>
        /// Takes a event image submission. 
        /// Stores the image and attaches the image to the event. 
        /// </summary>
        /// <param name="eventId"></param>
        /// <param name="eventImageSubmission"></param>
        /// <returns>201: Event Image</returns>
        [HttpPost]
        [RequestFormSizeLimit(valueLengthLimit: 16384)]
        [Route("{eventId}/image")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> Post([FromRoute] int eventId, [FromBody] EventImageSubmissionDto eventImageSubmission)
        {
            if (!ValidEventImageSubmission(eventImageSubmission)) { return BadRequest(this._errorMessage); }

            base.ExtractUser(); //Fill the scoped injected IDertInfoUser

            byte[] imageBytes = Convert.FromBase64String(eventImageSubmission.Base64StringImage);

            var eventImage = await _eventService.AttachEventImage(eventImageSubmission.EventId, imageBytes, eventImageSubmission.UploadImageExtension);

            EventImageDto eventImageDto = _mapper.Map<EventImageDto>(eventImage);

            // note - it was considered that we rerturned the location using CreatedAtAction
            //      - however we have no need to get this item seperately at this time
            return Created("", eventImageDto);
        }

        /// <summary>
        /// Takes a event image submission. 
        /// Stores the image and attaches the image to the event. 
        /// </summary>
        /// <param name="eventId"></param>
        /// <param name="eventImageSubmission"></param>
        /// <returns>201: Event Image</returns>
        [HttpPost]
        [RequestFormSizeLimit(valueLengthLimit: 16384)]
        [Route("{eventId}/activity")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> Post([FromRoute] int eventId, [FromBody] ActivitySubmissionDto activitySubmission)
        {
            if (!ValidActivitySubmission(activitySubmission)) { return BadRequest(this._errorMessage); }

            base.ExtractUser(); //Fill the scoped injected IDertInfoUser

            Activity myActivity = new Activity();
            myActivity.EventId = eventId;
            myActivity.Title = activitySubmission.Title;
            myActivity.Price = activitySubmission.Price;
            myActivity.Description = activitySubmission.Description;
            myActivity.AudienceTypeId = activitySubmission.AudienceTypeId;
            myActivity.IsDefault = activitySubmission.IsDefault;
            myActivity.PriceTBC = activitySubmission.PriceTBC;
            myActivity.SoldOut = activitySubmission.SoldOut;

            myActivity = await _eventService.CreateActivity(myActivity);

            ActivityDto activityDto = _mapper.Map<ActivityDto>(myActivity);

            return Created("api/event/" + eventId + "/activity/" + myActivity.Id, activityDto);
        }

        #endregion

        #region DELETE

        /// <summary>
        /// Marks and image for a event as deleted.  
        /// </summary>
        /// <param name="eventId"></param>
        /// <param name="eventImageSubmission"></param>
        /// <returns>201: Event Image</returns>
        [HttpDelete]
        [Route("{eventId}/eventimage/{eventImageId}")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> DeleteEventImage([FromRoute] int eventId, [FromRoute] int eventImageId)
        {
            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            var eventImage = await _eventService.DetachEventImage(eventId, eventImageId);

            EventImageDto eventImageDto = _mapper.Map<EventImageDto>(eventImage);

            if (eventImage != null)
            {
                return Ok(eventImageDto);
            }
            else
            {
                return NotFound();
            }

        }

        [HttpDelete]
        [Route("{eventId}")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> DeleteEvent([FromRoute] int eventId)
        {
            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            var myEvent = await _eventService.DeleteEvent(eventId);

            EventDto eventDto = _mapper.Map<EventDto>(myEvent);

            if (myEvent != null)
            {
                return Ok(eventDto);
            }
            else
            {
                return NotFound();
            }

        }

        [HttpDelete]
        [Route("{eventId}/activities/{activityId}")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> RemoveActivity([FromRoute] int eventId, [FromRoute] int activityId)
        {
            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            var activity = await _eventService.RemoveActivity(activityId);

            if (activity != null)
            {
                ActivityDto activityDto = _mapper.Map<ActivityDto>(activity);
                return Ok(activityDto);
            }
            else
            {
                return NotFound();
            }

        }

        #endregion

        #region PUT

        [HttpPut]
        [Route("{eventId}")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> UpdateOverview([FromRoute] int eventId, [FromBody] EventOverviewUpdateDto eventOverviewUpdate)
        {
            if (!ValidEventOverviewUpdate(eventOverviewUpdate)) { return BadRequest(this._errorMessage); }
            if (eventId != eventOverviewUpdate.EventId) { return BadRequest("Submission of an overview update to one event cannot contain details of another."); }

            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            Event myEvent = new Event();
            myEvent.Id = eventId;
            myEvent.Name = eventOverviewUpdate.EventName;
            myEvent.EventSynopsis = eventOverviewUpdate.EventSynopsis;
            myEvent.ContactName = eventOverviewUpdate.ContactName;
            myEvent.ContactEmail = eventOverviewUpdate.ContactEmail;
            myEvent.ContactTelephone = eventOverviewUpdate.ContactTelephone;
            myEvent.LocationTown = eventOverviewUpdate.LocationTown;
            myEvent.LocationPostcode = eventOverviewUpdate.LocationPostcode;
            myEvent.EventVisibilityType = (EventVisibilityType)eventOverviewUpdate.Visibility;
            myEvent.SentEmailsBcc = eventOverviewUpdate.SentEmailsBcc;

            // todo - invetigate whether we can cleanly do this via automapper

            myEvent = await _eventService.UpdateOverview(myEvent);

            return NoContent();
        }

        [HttpPut]
        [Route("{eventId}/dates")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> UpdateDates([FromRoute] int eventId, [FromBody] EventDatesUpdateDto eventDatesUpdate)
        {
            if (!ValidEventDatesUpdate(eventDatesUpdate)) { return BadRequest(this._errorMessage); }
            if (eventId != eventDatesUpdate.EventId) { return BadRequest("Submission of an dates update to one event cannot contain details of another."); }

            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            Event myEvent = new Event();
            myEvent.Id = eventId;
            myEvent.EventStartDate = eventDatesUpdate.EventStartDate;
            myEvent.EventEndDate = eventDatesUpdate.EventEndDate;
            myEvent.RegistrationOpenDate = eventDatesUpdate.RegistrationOpenDate;
            myEvent.RegistrationCloseDate = eventDatesUpdate.RegistrationCloseDate;

            myEvent = await _eventService.UpdateDates(myEvent);

            return NoContent();
        }

        /// <summary>
        /// We only ever update an event image when we are changing if the image is primary or not
        /// </summary>
        /// <param name="eventId"></param>
        /// <param name="eventImageUpdate"></param>
        /// <returns></returns>
        [HttpPut]
        [Route("{eventId}/eventimage/{eventImageId}/setprimary")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> UpdateEventImagePrimary([FromRoute] int eventId, [FromRoute] int eventImageId)
        {
            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            try
            {
                await _eventService.SetPrimaryEventImage(eventId, eventImageId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(ex);
            }
        }

        [HttpPut]
        [Route("{eventId}/activities")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> UpdateActivity([FromRoute] int eventId, [FromBody] ActivityUpdateDto activityUpdate)
        {
            if (!ValidActivityUpdate(activityUpdate)) { return BadRequest(this._errorMessage); }

            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            // todo - invetigate whether we can cleanly do this via automapper
            Activity myActivity = new Activity();
            myActivity.Id = activityUpdate.Id;
            myActivity.EventId = eventId;
            myActivity.Title = activityUpdate.Title;
            myActivity.Price = activityUpdate.Price;
            myActivity.Description = activityUpdate.Description;
            myActivity.AudienceTypeId = activityUpdate.AudienceTypeId;
            myActivity.IsDefault = activityUpdate.IsDefault;
            myActivity.PriceTBC = activityUpdate.PriceTBC;
            myActivity.SoldOut = activityUpdate.SoldOut;

            myActivity = await _activityService.UpdateActivity(myActivity);

            ActivityDto activityDto = _mapper.Map<ActivityDto>(myActivity);


            return Ok(activityDto);
        }

        [HttpPut]
        [Route("{eventId}/email-template")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> UpdateEmailTemplate([FromRoute] int eventId, [FromBody] EmailTemplateUpdateSubmissionDto emailTemplateUpdate)
        {
            if (!ValidEmailTemplateUpdate(emailTemplateUpdate)) { return BadRequest(this._errorMessage); }

            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            // todo - invetigate whether we can cleanly do this via automapper
            EmailTemplate myEmailTemplate = new EmailTemplate();
            myEmailTemplate.Id = emailTemplateUpdate.Id;
            myEmailTemplate.EventId = eventId;
            myEmailTemplate.TemplateName = emailTemplateUpdate.TemplateName;
            myEmailTemplate.Subject = emailTemplateUpdate.Subject;
            myEmailTemplate.Body = emailTemplateUpdate.Body;
            myEmailTemplate.TemplateRef = null;

            myEmailTemplate = await _emailTemplateService.UpdateEmailTemplate(myEmailTemplate);

            EmailTemplateDetailDto emailTemplateDetailDto = _mapper.Map<EmailTemplateDetailDto>(myEmailTemplate);


            return NoContent();
        }

        [HttpPut]
        [Route("{eventId}/invoice/paid")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> UpdateEventInvoicePaid([FromRoute] int eventId, [FromBody] InvoicePaidUpdateSubmissionDto invoicePaidUpdateSubmissionDto)
        {
            var authorisationPolicy = InvoiceSetPaidPolicy.PolicyName;

            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            Invoice invoice = await this._invoiceService.GetForAuthorization(invoicePaidUpdateSubmissionDto.InvoiceId);

            if (invoice == null) return NotFound();

            if (await this.CheckAuthorisationPolicy(authorisationPolicy, invoice))
            {
                await this._invoiceService.SetInvoicePaidStatus(invoice.Id, invoicePaidUpdateSubmissionDto.HasPaid);
            }

            return NoContent();
        }

        [HttpPut]
        [Route("{eventId}/cancel")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> CancelEvent([FromRoute] int eventId, [FromBody] EventCancellationOptionsDto cancellationOptions)
        {
            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            var registrationStatesToInform = new List<RegistrationFlowState>();
            if (cancellationOptions.InformNewRegistrations) { registrationStatesToInform.Add(RegistrationFlowState.New); }
            if (cancellationOptions.InformSubmittedRegistrations) { registrationStatesToInform.Add(RegistrationFlowState.Submitted); }
            if (cancellationOptions.InformConfirmedRegistrations) { registrationStatesToInform.Add(RegistrationFlowState.Confirmed); }

            var eventCancellationOptions = new EventCancellationOptionsDO()
            {
                SendCommunications = cancellationOptions.SendCommunications,
                CommunicateToStates = registrationStatesToInform
            };

            var myEvent = await _eventService.CancelEvent(eventId, eventCancellationOptions);

            return NoContent();
        }

        [HttpPut]
        [Route("{eventId}/close")]
        [Authorize(Policy = "EventAdministratorOnlyPolicy")]
        public async Task<IActionResult> CloseEvent([FromRoute] int eventId)
        {
            base.ExtractUser(); // Fill the scoped injected IDertInfoUser

            await _eventService.CloseEvent(eventId);

            return NoContent();
        }

        #endregion

        #region Private

        private async Task<IActionResult> GetPublishedActivities(int eventId, bool individual)
        {
            var authorisationPolicy = EventGetPublishedActivitiesPolicy.PolicyName;

            Event myEvent = await this._eventService.GetForAuthorization(eventId);

            if (myEvent == null) return NotFound();

            if (!this.PublishedActivitiesAreAvailable(myEvent))
            {
                return StatusCode(403, "event activities are not published");
            }

            if (await this.CheckAuthorisationPolicy(authorisationPolicy, myEvent))
            {
                base.ExtractUser();

                var activities = individual
                    ? await _eventService.GetPublishedIndividualActivities(eventId)
                    : await _eventService.GetPublishedTeamActivities(eventId);

                List<ActivityDto> activityDtos = _mapper.Map<List<ActivityDto>>(activities);

                return Ok(activityDtos);
            }

            return StatusCode(403, " Failed to meet requirements for " + authorisationPolicy);
        }

        /// <summary>
        /// Same day boundaries as EventRepository.GetAvailableWithPrimaryImage.
        /// Private events are not published. A private event should be published only when
        /// the group administrator is the same person who created the event. We do not
        /// currently record that link, so there is no exception yet.
        /// </summary>
        private bool PublishedActivitiesAreAvailable(Event myEvent)
        {
            if (myEvent.EventVisibilityType == EventVisibilityType._private)
            {
                return false;
            }

            var now = DateTime.Now;
            var startOfToday = new DateTime(now.Year, now.Month, now.Day);
            var startOfTomorrow = startOfToday.AddDays(1);

            var registrationHasOpened = myEvent.RegistrationOpenDate.HasValue
                && myEvent.RegistrationOpenDate.Value < startOfTomorrow;
            var registrationHasNotClosed = myEvent.RegistrationCloseDate.HasValue
                && myEvent.RegistrationCloseDate.Value > startOfToday;
            var eventHasNotStarted = myEvent.EventStartDate.HasValue
                && myEvent.EventStartDate.Value > startOfToday;

            return registrationHasOpened && registrationHasNotClosed && eventHasNotStarted;
        }

        #endregion

        #region Submission Validation
        private bool ValidEventMinimalSubmission(EventMinimalSubmissionDto eventMinimalSubmission)
        {
            if (eventMinimalSubmission == null)
            {
                this._errorMessage = "event minimal submission is null";
                return false;
            }

            if (eventMinimalSubmission.EventName == string.Empty)
            {
                this._errorMessage = "event name must be supplied";
                return false;
            }

            return true;
        }

        private bool ValidEventSubmission(EventSubmissionDto eventSubmission)
        {
            if (eventSubmission.EventName == string.Empty)
            {
                this._errorMessage = "event name must be supplied";
                return false;
            }
            if (eventSubmission.EventStartDate == null || eventSubmission.EventStartDate < DateTime.Now.AddDays(-1))
            {
                this._errorMessage = "event start date must be supplied and it must be in the future";
                return false;
            }
            if (eventSubmission.EventEndDate == null || eventSubmission.EventEndDate < DateTime.Now.AddDays(-1))
            {
                this._errorMessage = "event end date must be supplied and it must be in the future";
                return false;
            }
            if (eventSubmission.RegistrationOpenDate == null)
            {
                this._errorMessage = "event registration open date must be supplied";
                return false;
            }
            if (eventSubmission.RegistrationCloseDate == null || eventSubmission.RegistrationCloseDate < DateTime.Now.AddDays(-1))
            {
                this._errorMessage = "event registration close date must be supplied and it must be in the future";
                return false;
            }
            if (eventSubmission.EventStartDate > eventSubmission.EventEndDate)
            {
                this._errorMessage = "event start date cannot be after the event end date";
                return false;
            }
            if (eventSubmission.RegistrationOpenDate > eventSubmission.RegistrationCloseDate)
            {
                this._errorMessage = "registration open date must be before registration close date";
                return false;
            }
            if (eventSubmission.RegistrationCloseDate > eventSubmission.EventEndDate || eventSubmission.RegistrationOpenDate > eventSubmission.EventEndDate)
            {
                this._errorMessage = "it is not permitted to accept registrations after the event has finished";
                return false;
            }
            if (eventSubmission.Base64StringImage != null && eventSubmission.UploadImageExtension == string.Empty)
            {
                this._errorMessage = "image submission is not permitted without supplying the extension";
                return false;
            }

            return true;
        }

        private bool ValidEventConfigurationSubmission(EventConfigurationSubmissionDto eventConfigurationSubmission)
        {
            if (eventConfigurationSubmission == null)
            {
                this._errorMessage = "event configuration submission is null";
                return false;
            }

            if (eventConfigurationSubmission.EventStartDate < DateTime.Now.AddDays(-1))
            {
                this._errorMessage = "event start date must be supplied and it must be in the future";
                return false;
            }

            if (eventConfigurationSubmission.EventEndDate < DateTime.Now.AddDays(-1))
            {
                this._errorMessage = "event end date must be supplied and it must be in the future";
                return false;
            }

            if (eventConfigurationSubmission.EventStartDate > eventConfigurationSubmission.EventEndDate)
            {
                this._errorMessage = "event start date cannot be after the event end date";
                return false;
            }

            if (eventConfigurationSubmission.RegistrationOpenDate > eventConfigurationSubmission.RegistrationCloseDate)
            {
                this._errorMessage = "registration open date must be before registration close date";
                return false;
            }

            if (eventConfigurationSubmission.VisibilityType == (int)EventVisibilityType._private && (eventConfigurationSubmission.RegistrationOpenDate != null || eventConfigurationSubmission.RegistrationCloseDate != null))
            {
                this._errorMessage = "private events should not have registration open or close dates";
                return false;
            }

            if ((eventConfigurationSubmission.VisibilityType == (int)EventVisibilityType._public || eventConfigurationSubmission.VisibilityType == (int)EventVisibilityType._restricted) && (eventConfigurationSubmission.RegistrationOpenDate == null || eventConfigurationSubmission.RegistrationCloseDate == null))
            {
                this._errorMessage = "public or restricted events events not have registration open and close dates";
                return false;
            }

            // Need Visibility

            return true;
        }

        private bool ValidEventImageSubmission(EventImageSubmissionDto eventImageSubmission)
        {
            if (eventImageSubmission.Base64StringImage == null)
            {
                this._errorMessage = "image submission with no image";
                return false;
            }

            if (eventImageSubmission.Base64StringImage != null && eventImageSubmission.UploadImageExtension == string.Empty)
            {
                this._errorMessage = "image submission is not permitted without supplying the extension";
                return false;
            }

            return true;
        }

        private bool ValidEventOverviewUpdate(EventOverviewUpdateDto eventOverviewUpdate)
        {
            if (eventOverviewUpdate.EventName == string.Empty)
            {
                this._errorMessage = "event name must be supplied";
                return false;
            }
            if (eventOverviewUpdate.ContactName == string.Empty)
            {
                this._errorMessage = "event contact name must be supplied";
                return false;
            }
            if (eventOverviewUpdate.ContactEmail == string.Empty)
            {
                this._errorMessage = "event contact email must be supplied";
                return false;
            }
            if (eventOverviewUpdate.ContactTelephone == string.Empty)
            {
                this._errorMessage = "event contact telephone must be supplied";
                return false;
            }

            return true;
        }

        private bool ValidEventDatesUpdate(EventDatesUpdateDto eventOverviewUpdate)
        {
            // todo - there are significantly more checks that can be performed here. e.g: date not in the past

            if (eventOverviewUpdate.EventStartDate == DateTime.MinValue)
            {
                this._errorMessage = "event must have a start date";
                return false;
            }
            if (eventOverviewUpdate.EventEndDate == DateTime.MinValue)
            {
                this._errorMessage = "event must have an end date";
                return false;
            }

            // Note - registration dates can be null if the event is private - must handle validation in the service
            //      - also need to handle that dates cannot be changed based on the status of the event.

            return true;
        }

        private bool ValidActivitySubmission(ActivitySubmissionDto activitySubmission)
        {
            if (activitySubmission == null)
            {
                this._errorMessage = "activity submission is null";
                return false;
            }

            if (activitySubmission.Title == string.Empty)
            {
                this._errorMessage = "title must be supplied";
                return false;
            }

            if (activitySubmission.AudienceTypeId == 0)
            {
                this._errorMessage = "activity must define an audience";
                return false;
            }

            return true;
        }

        private bool ValidActivityUpdate(ActivityUpdateDto activityUpdate)
        {
            if (activityUpdate == null)
            {
                this._errorMessage = "activity submission is null";
                return false;
            }

            if (activityUpdate.Title == string.Empty)
            {
                this._errorMessage = "title must be supplied";
                return false;
            }

            if (activityUpdate.AudienceTypeId == 0)
            {
                this._errorMessage = "activity must define an audience";
                return false;
            }

            return true;
        }

        private bool ValidEmailTemplateUpdate(EmailTemplateUpdateSubmissionDto emailTemplateUpdate)
        {
            if (emailTemplateUpdate == null)
            {
                this._errorMessage = "email template update submission is null";
                return false;
            }

            if (emailTemplateUpdate.TemplateName == string.Empty)
            {
                this._errorMessage = "template name must be supplied";
                return false;
            }

            if (emailTemplateUpdate.Subject == string.Empty)
            {
                this._errorMessage = "template subject must be supplied";
                return false;
            }

            if (emailTemplateUpdate.Body == string.Empty)
            {
                this._errorMessage = "template body must be supplied";
                return false;
            }

            return true;
        }
        #endregion
    }
}
