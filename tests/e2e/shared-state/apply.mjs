/**
 * Returns the local database to a shared-state pack.
 *
 * Deletes fixture rows and leaves the post-startup baseline in place.
 * Does not drop the database, restart the API, or run migrations.
 *
 * Usage (from tests/e2e):
 *   node shared-state/apply.mjs <system-empty|system-basic>
 *   node shared-state/apply.mjs --check system-basic
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const secretsPath = path.join(repoRoot, 'infra', 'secrets', 'api.env');
const actor = 'shared-state';

const eventTemplateType = { Basic: 0, StandardDert: 1, ClassicDert: 2, Blank: 3 };
const audienceType = { INDIVIDUAL: 1, TEAM: 2 };
const memberType = { activeMember: 1, guest: 2 };
const competitionFlowState = { New: 1, Populated: 2, Generated: 3, Published: 4 };
const registrationFlowState = { New: 0, Submitted: 1, Confirmed: 2, Closed: 4, Cancelled: 5 };

const checkOnly = process.argv[2] === '--check';
const packName = checkOnly ? process.argv[3] : process.argv[2];
if (!packName) {
  console.error('Usage: node shared-state/apply.mjs <system-empty|system-basic>');
  console.error('       node shared-state/apply.mjs --check system-basic');
  process.exit(1);
}

const definedPacks = new Set(['system-empty', 'system-basic']);
if (!definedPacks.has(packName)) {
  console.error(`Pack "${packName}" is not defined. Defined packs: system-empty, system-basic.`);
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseEnvFile(filePath) {
  const values = {};
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    values[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return values;
}

function sqlConfig() {
  if (!fs.existsSync(secretsPath)) {
    throw new Error(`SQL settings are missing: ${secretsPath}`);
  }
  const env = parseEnvFile(secretsPath);
  const serverRaw = env.SqlConnection__ServerName;
  const user = env.SqlConnection__ServerAdminName;
  const password = env.SqlConnection__ServerAdminPassword;
  const database = env.SqlConnection__DatabaseName;
  if (!serverRaw || !user || !password || !database) {
    throw new Error('api.env must set SqlConnection server, admin, password, and database.');
  }
  const [server, portText] = serverRaw.split(',');
  return {
    server,
    port: portText ? Number(portText) : 1433,
    user,
    password,
    database,
    options: { encrypt: false, trustServerCertificate: true },
  };
}

function requireEnum(map, value, label) {
  if (!Object.prototype.hasOwnProperty.call(map, value)) {
    throw new Error(`Unknown ${label} "${value}"`);
  }
  return map[value];
}

function findByName(rows, field, name, label) {
  const found = rows.find((row) => row[field] === name);
  if (!found) throw new Error(`${label} "${name}" was not found in the pack`);
  return found;
}

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

async function clearToBaseline(transaction, preserveTables) {
  const tables = await new sql.Request(transaction).query(`
    SELECT t.name
    FROM sys.tables t
    INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
    WHERE s.name = 'dbo'
  `);
  const preserve = new Set(preserveTables);
  const targets = tables.recordset
    .map((row) => row.name)
    .filter((name) => !preserve.has(name));
  for (const name of targets) {
    if (!IDENT.test(name)) throw new Error(`Refusing to clear unexpected table name "${name}"`);
  }

  await new sql.Request(transaction).query(`
    DECLARE @sql nvarchar(max) = N'';
    SELECT @sql = @sql + N'ALTER TABLE ' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) + N' NOCHECK CONSTRAINT ALL;'
    FROM sys.tables t
    INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
    WHERE s.name = 'dbo';
    EXEC sp_executesql @sql;
  `);

  for (const name of targets) {
    await new sql.Request(transaction).query(`DELETE FROM [dbo].[${name}]`);
  }

  await new sql.Request(transaction).query(`
    DECLARE @sql nvarchar(max) = N'';
    SELECT @sql = @sql + N'ALTER TABLE ' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) + N' WITH CHECK CHECK CONSTRAINT ALL;'
    FROM sys.tables t
    INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
    WHERE s.name = 'dbo';
    EXEC sp_executesql @sql;
  `);
}

function request(transaction) {
  return new sql.Request(transaction);
}

async function columnExists(transaction, table, column) {
  const result = await request(transaction)
    .input('tableName', sql.NVarChar, table)
    .input('columnName', sql.NVarChar, column)
    .query(`
      SELECT 1 AS found
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = @tableName AND COLUMN_NAME = @columnName
    `);
  return result.recordset.length > 0;
}

function requireAuth0ForcedId(record, label) {
  if (!Number.isInteger(record.Auth0ForcedId) || record.Auth0ForcedId < 1) {
    throw new Error(`${label} needs Auth0ForcedId. That value is written as the database id only so the Auth0 claim can match it.`);
  }
  return record.Auth0ForcedId;
}

function expectedLoginRows() {
  const events = readJson(path.join(here, 'system-basic', 'events.json'));
  const groups = readJson(path.join(here, 'system-basic', 'groups.json'));
  const competitions = readJson(path.join(here, 'system-basic', 'competitions.json'));
  const expected = {
    events: events.map((event) => ({ id: requireAuth0ForcedId(event, event.Name), name: event.Name, claim: 'eventadmin' })),
    groups: groups.map((group) => ({ id: requireAuth0ForcedId(group, group.GroupName), name: group.GroupName, claim: 'groupadmin' })),
    venues: competitions.flatMap((competition) => competition.Venues.map((venue) => ({
      id: requireAuth0ForcedId(venue, venue.Name),
      name: venue.Name,
      claim: 'venueadmin',
    }))),
  };
  assertPersonaClaim('event-admin', 'eventadmin', expected.events.map((row) => row.id));
  assertPersonaClaim('group-admin', 'groupadmin', [expected.groups[0].id]);
  assertPersonaClaim('group-admin-2', 'groupadmin', [expected.groups[1].id]);
  assertPersonaClaim('group-member', 'groupmember', [expected.groups[0].id]);
  assertPersonaClaim('venue-admin', 'venueadmin', expected.venues.map((row) => row.id));
  return expected;
}

function describeIdMismatch(label, expected, actual) {
  const lines = [];
  const actualByName = new Map(actual.map((row) => [row.name, row.id]));
  const expectedNames = new Set(expected.map((row) => row.name));
  for (const row of expected) {
    if (!actualByName.has(row.name)) {
      lines.push(`${label} "${row.name}" is missing. Auth0 ${row.claim} expects id ${row.id}.`);
      continue;
    }
    if (actualByName.get(row.name) !== row.id) {
      lines.push(`${label} "${row.name}" is id ${actualByName.get(row.name)}. Auth0 ${row.claim} expects ${row.id}.`);
    }
  }
  for (const row of actual) {
    if (!expectedNames.has(row.name)) {
      lines.push(`${label} "${row.name}" is id ${row.id} and is not part of this pack.`);
    }
  }
  return lines;
}

async function readIdNames(executor, table, nameColumn) {
  const result = await new sql.Request(executor).query(
    `SELECT [Id] AS id, [${nameColumn}] AS name FROM [dbo].[${table}]`,
  );
  return result.recordset.map((row) => ({ id: Number(row.id), name: row.name }));
}

async function assertStoredLoginIds(executor) {
  const expected = expectedLoginRows();
  const events = await readIdNames(executor, 'Events', 'Name');
  const groups = await readIdNames(executor, 'Groups', 'GroupName');
  const venues = await readIdNames(executor, 'Venues', 'Name');
  const problems = [
    ...describeIdMismatch('Event', expected.events, events),
    ...describeIdMismatch('Group', expected.groups, groups),
    ...describeIdMismatch('Venue', expected.venues, venues),
  ];
  if (problems.length > 0) {
    throw new Error(`Logins will not match the database.\n${problems.join('\n')}`);
  }
}

function assertPersonaClaim(personaId, claim, ids) {
  const personas = readJson(path.join(here, '..', 'auth0-personas.json'));
  const persona = personas.personas.find((item) => item.id === personaId);
  if (!persona) throw new Error(`Auth0 persona "${personaId}" is missing`);
  const claimed = (persona.app_metadata && persona.app_metadata[claim]) || [];
  const expected = ids.map(String);
  const matches = expected.length === claimed.length && expected.every((id, index) => claimed[index] === id);
  if (!matches) {
    throw new Error(
      `Auth0 persona "${personaId}" ${claim} is [${claimed.join(', ')}]. The pack inserts [${expected.join(', ')}].`,
    );
  }
}

async function insertRow(transaction, table, columns, explicitId = null) {
  if (!IDENT.test(table)) throw new Error(`Refusing to insert into unexpected table "${table}"`);
  const useExplicitId = explicitId !== null && explicitId !== undefined;
  const req = request(transaction);
  const names = [];
  const params = [];
  let index = 0;
  const entries = useExplicitId
    ? [['Id', { type: sql.Int, value: explicitId }], ...Object.entries(columns)]
    : Object.entries(columns);
  for (const [name, spec] of entries) {
    const param = `p${index}`;
    index += 1;
    names.push(`[${name}]`);
    params.push(`@${param}`);
    req.input(param, spec.type, spec.value);
  }
  const insert = `INSERT INTO [dbo].[${table}] (${names.join(', ')}) OUTPUT INSERTED.Id VALUES (${params.join(', ')})`;
  const statement = useExplicitId
    ? `SET IDENTITY_INSERT [dbo].[${table}] ON; ${insert}; SET IDENTITY_INSERT [dbo].[${table}] OFF; DBCC CHECKIDENT (N'dbo.${table}', RESEED, ${explicitId});`
    : insert;
  const result = await req.query(statement);
  return useExplicitId ? explicitId : result.recordset[0].Id;
}

function audit(now) {
  return {
    CreatedBy: { type: sql.NVarChar, value: actor },
    DateCreated: { type: sql.DateTime, value: now },
    DateModified: { type: sql.DateTime, value: now },
    ModifiedBy: { type: sql.NVarChar, value: actor },
    IsDeleted: { type: sql.Bit, value: false },
  };
}

function dateOnly(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`);
}

async function insertActivity(transaction, now, eventId, activity) {
  return insertRow(transaction, 'Activities', {
    ...audit(now),
    DateCreated: { type: sql.DateTime2, value: now },
    DateModified: { type: sql.DateTime2, value: now },
    EventId: { type: sql.Int, value: eventId },
    AudienceTypeId: { type: sql.Int, value: activity.audienceTypeId },
    CompetitionId: { type: sql.Int, value: activity.competitionId ?? null },
    Title: { type: sql.NVarChar, value: activity.title },
    Description: { type: sql.NVarChar, value: activity.description },
    IsDefault: { type: sql.Bit, value: activity.isDefault },
    PriceTBC: { type: sql.Bit, value: false },
    Price: { type: sql.Decimal(18, 2), value: activity.price },
    SoldOut: { type: sql.Bit, value: false },
  });
}

async function insertBasic(transaction) {
  const now = new Date();
  const events = readJson(path.join(here, 'system-basic', 'events.json'));
  const groups = readJson(path.join(here, 'system-basic', 'groups.json'));
  const competitions = readJson(path.join(here, 'system-basic', 'competitions.json'));
  const eventIds = new Map();
  const groupIds = new Map();
  const teamIds = new Map();
  const eventsWithCompetitionActivity = new Set();
  const registrationIds = new Map();
  const attendanceIds = new Map();

  expectedLoginRows();

  for (const event of events) {
    const eventId = await insertRow(transaction, 'Events', {
      ...audit(now),
      AccessToken: { type: sql.NVarChar, value: null },
      Name: { type: sql.NVarChar, value: event.Name },
      ContactName: { type: sql.NVarChar, value: event.ContactName },
      ContactEmail: { type: sql.NVarChar, value: event.ContactEmail },
      ContactTelephone: { type: sql.NVarChar, value: event.ContactTelephone },
      RegistrationOpenDate: { type: sql.DateTime, value: dateOnly(event.RegistrationOpenDate) },
      RegistrationCloseDate: { type: sql.DateTime, value: dateOnly(event.RegistrationCloseDate) },
      EventSynopsis: { type: sql.NVarChar, value: event.EventSynopsis },
      EventStartDate: { type: sql.DateTime, value: dateOnly(event.EventStartDate) },
      EventEndDate: { type: sql.DateTime, value: dateOnly(event.EventEndDate) },
      EventTemplateType: { type: sql.Int, value: requireEnum(eventTemplateType, event.EventTemplateType, 'EventTemplateType') },
      EventVisibilityType: { type: sql.Int, value: 0 },
      LocationTown: { type: sql.NVarChar, value: event.LocationTown },
      LocationPostcode: { type: sql.NVarChar, value: event.LocationPostcode },
      IsConfigured: { type: sql.Bit, value: true },
      IsPromoted: { type: sql.Bit, value: false },
      IsCancelled: { type: sql.Bit, value: false },
      TermsAndConditionsAgreed: { type: sql.Bit, value: true },
      TermsAndConditionsAgreedBy: { type: sql.NVarChar, value: actor },
      SentEmailsBcc: { type: sql.NVarChar, value: null },
    }, event.Auth0ForcedId);
    eventIds.set(event.Name, eventId);

    for (const activity of event.Activities || []) {
      await insertActivity(transaction, now, eventId, {
        audienceTypeId: requireEnum(audienceType, activity.AudienceTypeId, 'AudienceTypeId'),
        title: activity.Title,
        description: activity.Description,
        isDefault: Boolean(activity.IsDefault),
        price: activity.Price,
      });
    }
  }

  for (const group of groups) {
    const groupId = await insertRow(transaction, 'Groups', {
      ...audit(now),
      AccessToken: { type: sql.NVarChar, value: null },
      GroupName: { type: sql.NVarChar, value: group.GroupName },
      GroupBio: { type: sql.NVarChar, value: group.GroupBio },
      PrimaryContactName: { type: sql.NVarChar, value: group.PrimaryContactName },
      PrimaryContactNumber: { type: sql.NVarChar, value: group.PrimaryContactNumber },
      PrimaryContactEmail: { type: sql.NVarChar, value: group.PrimaryContactEmail },
      GroupImageUrl: { type: sql.NVarChar, value: null },
      GroupMemberJoiningPinCode: { type: sql.NVarChar, value: group.GroupMemberJoiningPinCode || null },
      OriginTown: { type: sql.NVarChar, value: group.OriginTown },
      OriginPostcode: { type: sql.NVarChar, value: group.OriginPostcode },
      GroupVisibilityType: { type: sql.Int, value: 0 },
      TermsAndConditionsAgreed: { type: sql.Bit, value: true },
      TermsAndConditionsAgreedBy: { type: sql.NVarChar, value: actor },
      IsConfigured: { type: sql.Bit, value: true },
    }, group.Auth0ForcedId);
    groupIds.set(group.GroupName, groupId);

    for (const member of group.GroupMembers || []) {
      await insertRow(transaction, 'GroupMembers', {
        ...audit(now),
        AccessToken: { type: sql.NVarChar, value: null },
        Name: { type: sql.NVarChar, value: member.Name },
        MemberType: { type: sql.Int, value: requireEnum(memberType, member.MemberType, 'MemberType') },
        EmailAddress: { type: sql.NVarChar, value: member.EmailAddress || null },
        GroupId: { type: sql.Int, value: groupId },
        DateJoined: { type: sql.DateTime2, value: now },
        DateOfBirth: { type: sql.DateTime, value: null },
        Facebook: { type: sql.NVarChar, value: null },
        TelephoneNumber: { type: sql.NVarChar, value: null },
      });
    }

    for (const team of group.Teams || []) {
      const teamId = await insertRow(transaction, 'Teams', {
        ...audit(now),
        AccessToken: { type: sql.NVarChar, value: null },
        GroupId: { type: sql.Int, value: groupId },
        ShowShowcase: { type: sql.Bit, value: false },
        TeamBio: { type: sql.NVarChar, value: team.TeamBio },
        TeamName: { type: sql.NVarChar, value: team.TeamName },
      });
      teamIds.set(team.TeamName, { teamId, groupId, groupName: group.GroupName });
    }
  }

  for (const competition of competitions) {
    const event = findByName(events, 'Name', competition.EventName, 'Event');
    const eventId = eventIds.get(event.Name);
    const dertYear = dateOnly(event.EventStartDate).getUTCFullYear();
    const competitionId = await insertRow(transaction, 'Competitions', {
      ...audit(now),
      AccessToken: { type: sql.NVarChar, value: null },
      AllowAdHocDanceAddition: { type: sql.Bit, value: Boolean(competition.AllowAdHocDanceAddition) },
      CompetitionDescription: { type: sql.NVarChar, value: competition.CompetitionDescription },
      DatePopulated: { type: sql.DateTime2, value: now },
      EventId: { type: sql.Int, value: eventId },
      FlowState: { type: sql.Int, value: requireEnum(competitionFlowState, competition.FlowState, 'FlowState') },
      HasBeenPopulated: { type: sql.Bit, value: Boolean(competition.HasBeenPopulated) },
      InTestingMode: { type: sql.Bit, value: Boolean(competition.InTestingMode) },
      JudgeRequirementPerVenue: { type: sql.Int, value: competition.JudgeRequirementPerVenue },
      Name: { type: sql.NVarChar, value: competition.Name },
      ResultsAreCollated: { type: sql.Bit, value: Boolean(competition.ResultsAreCollated) },
      ResultsPublished: { type: sql.Bit, value: Boolean(competition.ResultsPublished) },
      TeamEntryFee: { type: sql.Decimal(18, 2), value: competition.TeamEntryFee },
    });

    // The event competitions page lists activities whose CompetitionId is set, not Competitions by EventId.
    const isFirstCompetitionActivity = !eventsWithCompetitionActivity.has(eventId);
    eventsWithCompetitionActivity.add(eventId);
    const competitionActivityId = await insertActivity(transaction, now, eventId, {
      audienceTypeId: audienceType.TEAM,
      competitionId,
      title: competition.Name,
      description: competition.CompetitionDescription,
      isDefault: isFirstCompetitionActivity,
      price: competition.TeamEntryFee,
    });

    for (const team of teamIds.values()) {
      const registrationKey = `${eventId}:${team.groupId}`;
      if (!registrationIds.has(registrationKey)) {
        const registrationId = await insertRow(transaction, 'Registrations', {
          ...audit(now),
          AccessToken: { type: sql.NVarChar, value: null },
          DertYear: { type: sql.Int, value: dertYear },
          EstimateAccomodation: { type: sql.Int, value: 0 },
          EstimateAttending: { type: sql.Int, value: 0 },
          EventId: { type: sql.Int, value: eventId },
          FlowState: { type: sql.Int, value: registrationFlowState.Confirmed },
          GroupId: { type: sql.Int, value: team.groupId },
          SpecialRequirements: { type: sql.NVarChar, value: null },
          TermsAndConditionsAgreed: { type: sql.Bit, value: true },
          TermsAndConditionsAgreedBy: { type: sql.NVarChar, value: actor },
        });
        registrationIds.set(registrationKey, registrationId);
      }

      const attendanceKey = `${eventId}:${team.teamId}`;
      if (!attendanceIds.has(attendanceKey)) {
        const attendanceId = await insertRow(transaction, 'TeamAttendances', {
          ...audit(now),
          AccessToken: { type: sql.NVarChar, value: null },
          AttendanceNotes: { type: sql.NVarChar, value: null },
          RegistrationId: { type: sql.Int, value: registrationIds.get(registrationKey) },
          TeamId: { type: sql.Int, value: team.teamId },
        });
        attendanceIds.set(attendanceKey, attendanceId);
      }

      const attendanceId = attendanceIds.get(attendanceKey);
      await insertRow(transaction, 'ActivityTeamAttendances', {
        ...audit(now),
        DateCreated: { type: sql.DateTime2, value: now },
        DateModified: { type: sql.DateTime2, value: now },
        ActivityId: { type: sql.Int, value: competitionActivityId },
        TeamAttendanceId: { type: sql.Int, value: attendanceId },
      });
      await insertRow(transaction, 'CompetitionEntries', {
        ...audit(now),
        AccessToken: { type: sql.NVarChar, value: null },
        CompetitionId: { type: sql.Int, value: competitionId },
        DertYear: { type: sql.Int, value: dertYear },
        IsDisabled: { type: sql.Bit, value: false },
        TeamAttendanceId: { type: sql.Int, value: attendanceId },
      });
    }

    const venueIds = new Map();
    for (const venue of competition.Venues) {
      const venueId = await insertRow(transaction, 'Venues', {
        ...audit(now),
        AccessToken: { type: sql.NVarChar, value: null },
        Auth0Username: { type: sql.NVarChar, value: venue.Auth0Username || null },
        EventId: { type: sql.Int, value: eventId },
        JudgeMinderUsername: { type: sql.NVarChar, value: venue.Auth0Username || null },
        Name: { type: sql.NVarChar, value: venue.Name },
      }, venue.Auth0ForcedId);
      venueIds.set(venue.Name, venueId);
      await request(transaction)
        .input('competitionId', sql.Int, competitionId)
        .input('venueId', sql.Int, venueId)
        .query('INSERT INTO [dbo].[CompetitionVenuesJoin] ([Competition_Id], [Venue_Id]) VALUES (@competitionId, @venueId)');
    }

    const judgeIds = new Map();
    for (const judge of competition.Judges) {
      const judgeId = await insertRow(transaction, 'Judges', {
        ...audit(now),
        AccessToken: { type: sql.NVarChar, value: null },
        Email: { type: sql.NVarChar, value: judge.Email || null },
        Name: { type: sql.NVarChar, value: judge.Name },
        Telephone: { type: sql.NVarChar, value: judge.Telephone || null },
      });
      judgeIds.set(judge.Name, judgeId);
      await insertRow(transaction, 'CompetitionJudges', {
        ...audit(now),
        CompetitionId: { type: sql.Int, value: competitionId },
        JudgeId: { type: sql.Int, value: judgeId },
      });
    }

    const scoreSetCount = competition.ScoreSets.length;
    const judgesPerVenue = competition.JudgeRequirementPerVenue;
    if (scoreSetCount === 0 || judgesPerVenue % scoreSetCount !== 0) {
      throw new Error(
        `${competition.Name}: judge requirement per venue (${judgesPerVenue}) must be divisible by the number of score sets (${scoreSetCount}).`,
      );
    }
    const expectedJudges = judgesPerVenue * competition.Venues.length;
    if (competition.Judges.length !== expectedJudges) {
      throw new Error(
        `${competition.Name}: expected ${expectedJudges} judges (${judgesPerVenue} per venue), received ${competition.Judges.length}.`,
      );
    }

    const scoreSetIds = new Map();
    competition.ScoreSets.forEach((scoreSet, index) => {
      scoreSet.markingSet = index + 1;
    });
    for (const scoreSet of competition.ScoreSets) {
      const scoreSetId = await insertRow(transaction, 'ScoreSets', {
        ...audit(now),
        AccessToken: { type: sql.NVarChar, value: null },
        CompetitionId: { type: sql.Int, value: competitionId },
        Description: { type: sql.NVarChar, value: scoreSet.Description || null },
        Name: { type: sql.NVarChar, value: scoreSet.Name },
      });
      scoreSetIds.set(scoreSet.Name, scoreSetId);
    }

    const categoryIds = [];
    for (const category of competition.ScoreCategories) {
      const setNames = category.ScoreSets || [];
      const categoryId = await insertRow(transaction, 'ScoreCategories', {
        ...audit(now),
        AccessToken: { type: sql.NVarChar, value: null },
        CompetitionAppliesToId: { type: sql.Int, value: competitionId },
        Description: { type: sql.NVarChar, value: category.Description || null },
        InScoreSet1: { type: sql.Bit, value: setNames.includes(competition.ScoreSets[0]?.Name) },
        InScoreSet2: { type: sql.Bit, value: setNames.includes(competition.ScoreSets[1]?.Name) },
        MaxMarks: { type: sql.Int, value: category.MaxMarks },
        Name: { type: sql.NVarChar, value: category.Name },
        SortOrder: { type: sql.Int, value: category.SortOrder },
        Tag: { type: sql.NVarChar, value: category.Tag },
      });
      categoryIds.push(categoryId);
      for (const setName of setNames) {
        const scoreSet = findByName(competition.ScoreSets, 'Name', setName, 'Score set');
        await request(transaction)
          .input('scoreSetId', sql.Int, scoreSetIds.get(scoreSet.Name))
          .input('scoreCategoryId', sql.Int, categoryId)
          .query('INSERT INTO [dbo].[ScoreSetScoreCategories] ([ScoreSet_Id], [ScoreCategory_Id]) VALUES (@scoreSetId, @scoreCategoryId)');
      }
    }

    for (const attribute of competition.EntryAttributes || []) {
      await insertRow(transaction, 'CompetitionEntryAttributes', {
        ...audit(now),
        AccessToken: { type: sql.NVarChar, value: null },
        CompetitionAppliesToId: { type: sql.Int, value: competitionId },
        Name: { type: sql.NVarChar, value: attribute.Name },
        Tag: { type: sql.NVarChar, value: attribute.Tag },
      });
    }

    let judgeIndex = 0;
    for (const venue of competition.Venues) {
      for (let slot = 0; slot < judgesPerVenue; slot += 1) {
        const scoreSet = competition.ScoreSets[slot % scoreSetCount];
        const judge = competition.Judges[judgeIndex];
        judgeIndex += 1;
        await insertRow(transaction, 'JudgeSlots', {
          ...audit(now),
          AccessToken: { type: sql.NVarChar, value: null },
          CompetitionId: { type: sql.Int, value: competitionId },
          JudgeId: { type: sql.Int, value: judgeIds.get(judge.Name) },
          MarkingSet: { type: sql.Int, value: scoreSet.markingSet },
          Name: { type: sql.NVarChar, value: `${judge.Name} at ${venue.Name}` },
          ScoreSetId: { type: sql.Int, value: scoreSetIds.get(scoreSet.Name) },
          VenueId: { type: sql.Int, value: venueIds.get(venue.Name) },
        });
      }
    }

    for (const dance of competition.Dances) {
      const team = teamIds.get(dance.TeamName);
      if (!team) throw new Error(`Dance team "${dance.TeamName}" was not found in groups.json`);
      const venue = findByName(competition.Venues, 'Name', dance.VenueName, 'Venue');
      const attendanceId = attendanceIds.get(`${eventId}:${team.teamId}`);
      if (!attendanceId) throw new Error(`Team "${dance.TeamName}" is not registered for this event`);

      const danceColumns = {
        ...audit(now),
        AccessToken: { type: sql.NVarChar, value: null },
        CompetitionId: { type: sql.Int, value: competitionId },
        DateScoresEntered: { type: sql.DateTime, value: null },
        DertYear: { type: sql.Int, value: dertYear },
        HasScoresChecked: { type: sql.Bit, value: Boolean(dance.HasScoresChecked) },
        HasScoresEntered: { type: sql.Bit, value: Boolean(dance.HasScoresEntered) },
        Overrun: { type: sql.Bit, value: Boolean(dance.Overrun) },
        ScoresEnteredBy: { type: sql.NVarChar, value: null },
        TeamAttendanceId: { type: sql.Int, value: attendanceId },
        VenueId: { type: sql.Int, value: venueIds.get(venue.Name) },
      };
      // Present on databases created from the initial migration and not yet dropped.
      if (await columnExists(transaction, 'Dances', 'RandomTest')) {
        danceColumns.RandomTest = { type: sql.Bit, value: false };
      }
      const danceId = await insertRow(transaction, 'Dances', danceColumns);
      for (const categoryId of categoryIds) {
        await insertRow(transaction, 'DanceScores', {
          ...audit(now),
          CommentGiven: { type: sql.NVarChar, value: null },
          DanceId: { type: sql.Int, value: danceId },
          MarkGiven: { type: sql.Decimal(18, 2), value: 0 },
          ScoreCategoryId: { type: sql.Int, value: categoryId },
        });
      }
    }
  }
}

const baseline = readJson(path.join(here, 'system-empty', 'baseline.json'));
const pool = await sql.connect(sqlConfig());
try {
  if (checkOnly) {
    if (packName !== 'system-basic') {
      throw new Error('The login id check applies to system-basic, the pack the app logins use.');
    }
    await assertStoredLoginIds(pool);
    console.log('Event, group, and venue ids match the Auth0 login claims.');
  } else {
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();
      await clearToBaseline(transaction, baseline.preserveTables);
      if (packName === 'system-basic') {
        await insertBasic(transaction);
        await assertStoredLoginIds(transaction);
      }
      await transaction.commit();
      console.log(`Applied ${packName}. Baseline tables left in place: ${baseline.preserveTables.join(', ')}.`);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.close();
}
