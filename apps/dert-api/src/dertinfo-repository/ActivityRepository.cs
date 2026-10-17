using DertInfo.CrossCutting.Auth;
using DertInfo.Models.Database;
using DertInfo.Models.System.Enumerations;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DertInfo.Repository
{
    public interface IActivityRepository : IRepository<Activity, int>
    {
        Task<ICollection<Activity>> GetByEventAndTypeWithCounts(int eventId, ActivityAudienceType audienceType);
        Task<ICollection<Activity>> GetPublishedByEventAndAudience(int eventId, ActivityAudienceType audienceType);
        Task<Activity> MarkDeleted(int activityId);
        Task<Activity> GetActivityDetail(int activityId);
        Task<ICollection<Activity>> GetDefaultsByEventAndAudience(int eventId, ActivityAudienceType audienceType);
        Task<ICollection<Activity>> GetByEventWhereIsCompetition(int eventId);
        Task<Activity> GetActivityForCompetition(int competitionId);
    }

    public class ActivityRepository : BaseRepository<Activity, int, DertInfoContext>, IActivityRepository
    {
        public ActivityRepository(DertInfoContext context, IDertInfoUser user) : base(context, user)
        { }

        public async Task<Activity> GetActivityDetail(int id)
        {
            var task = Task.Run(() =>
            {
                IQueryable<Activity> query = _context.Activities
                .Where(a => a.Id == id);

                return query.FirstOrDefault();
            });

            return await task;
        }

        public async Task<ICollection<Activity>> GetByEventAndTypeWithCounts(int eventId, ActivityAudienceType audienceType)
        {
            var task = Task.Run(() =>
            {
                IQueryable<Activity> query = _context.Activities
                .Include(a => a.ParticipatingTeams.Where(pt => !pt.IsDeleted && !pt.TeamAttendance.IsDeleted))
                .Include(a => a.ParticipatingIndividuals.Where(pt => !pt.IsDeleted && !pt.MemberAttendance.IsDeleted))
                .Where(a => a.EventId == eventId && a.AudienceTypeId == (int)audienceType && !a.IsDeleted);

                return query.ToList();
            });

            return await task;
        }

        public async Task<ICollection<Activity>> GetByEventWhereIsCompetition(int eventId)
        {
            var task = Task.Run(() =>
            {
                IQueryable<Activity> query = _context.Activities
                .Include(a => a.ParticipatingTeams).ThenInclude(pt => pt.TeamAttendance).ThenInclude(ta => ta.Registration)
                .Where(a => a.EventId == eventId && a.CompetitionId != null && !a.IsDeleted);

                return query.ToList();
            });

            return await task;
        }

        public async Task<ICollection<Activity>> GetPublishedByEventAndAudience(int eventId, ActivityAudienceType audienceType)
        {
            var task = Task.Run(() =>
            {
                IQueryable<Activity> query = _context.Activities
                .Where(a => a.EventId == eventId && a.AudienceTypeId == (int)audienceType && !a.IsDeleted);

                return query.ToList();
            });

            return await task;
        }

        public async Task<ICollection<Activity>> GetDefaultsByEventAndAudience(int eventId, ActivityAudienceType audienceType)
        {
            var task = Task.Run(() =>
            {
                IQueryable<Activity> query = _context.Activities
                .Where(a => a.EventId == eventId && a.AudienceTypeId == (int)audienceType && a.IsDefault);

                return query.ToList();
            });

            return await task;
        }

        public async Task<Activity> MarkDeleted(int activityId)
        {
            var task = Task.Run(() =>
            {
                var activity = _context.Activities.Find(activityId);

                activity.IsDeleted = true;

                _context.SaveChanges();

                return activity;
            });

            return await task;
        }

        public async Task<Activity> GetActivityForCompetition(int competitionId)
        {
            var task = Task.Run(() =>
            {
                var activity = _context.Activities.Where(a => a.CompetitionId == competitionId)
                    .Include(a => a.ParticipatingTeams).ThenInclude(ata => ata.TeamAttendance).ThenInclude(ta => ta.Registration);

                return activity.FirstOrDefault();
            });

            return await task;
        }
    }
}
