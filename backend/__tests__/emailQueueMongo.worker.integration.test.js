const { connectTestDb, disconnectTestDb, hasTestDbConfig } = require('./testDb');

jest.mock('../src/services/emailService', () => ({
  sendEmail: jest.fn(),
}));

const EmailJob = require('../src/models/EmailJob');
const ContestReminder = require('../src/models/ContestReminder');
const User = require('../src/models/User');
const Contest = require('../src/models/Contest');
const { sendEmail } = require('../src/services/emailService');

const HAS_DB = hasTestDbConfig();
const dbTest = HAS_DB ? test : test.skip;

beforeAll(async () => {
  jest.setTimeout(30000);
  process.env.NODE_ENV = 'test';

  if (!HAS_DB) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Skipping DB tests: set MONGODB_URI_TEST (or MONGODB_URI pointing to localhost)');
    return;
  }

  await connectTestDb();
  await EmailJob.syncIndexes();
});

afterAll(async () => {
  await disconnectTestDb();
});

afterEach(async () => {
  sendEmail.mockReset();
  if (!HAS_DB) return;
  await Promise.all([
    EmailJob.deleteMany({}),
    ContestReminder.deleteMany({}),
    User.deleteMany({}),
    Contest.deleteMany({}),
  ]);
});

dbTest('Mongo email worker processes one job and marks reminder done', async () => {
  const emailQueueMongo = require('../src/queues/emailQueueMongo');

  const user = await User.create({
    username: `u${Date.now()}`,
    email: `u${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Test User',
    isActive: true,
  });

  const contestStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const contest = await Contest.create({
    name: 'Test Contest',
    platform: 'leetcode',
    url: 'https://example.com',
    startTime: contestStart,
    endTime: new Date(contestStart.getTime() + 60 * 60 * 1000),
    duration: 60,
    contestId: `t_${Date.now()}`,
  });

  const reminder = await ContestReminder.create({
    userId: user._id,
    contestId: contest._id,
    email: 'someone@example.com',
    reminderSent: false,
    status: 'queued',
    lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
    reminderTime: new Date(Date.now() - 60 * 1000),
    contestDetails: {
      name: 'Test Contest',
      platform: 'leetcode',
      url: 'https://example.com',
      startTime: contestStart,
      duration: 60,
    },
  });

  sendEmail.mockResolvedValue({ ok: true });

  await emailQueueMongo.add('contest-reminder', {
    reminderId: reminder._id,
    to: 'someone@example.com',
    subject: 'Subj',
    html: '<b>Hello</b>',
  }, {
    jobId: `contest-reminder:${reminder._id}`,
    attempts: 3,
  });

  const didWork = await emailQueueMongo._processOneJob();
  expect(didWork).toBe(true);

  const updatedReminder = await ContestReminder.findById(reminder._id);
  expect(updatedReminder.reminderSent).toBe(true);
  expect(updatedReminder.status).toBe('done');

  const job = await EmailJob.findOne({ jobKey: `contest-reminder:${reminder._id}` });
  expect(job).toBeTruthy();
  expect(job.status).toBe('done');

  expect(sendEmail).toHaveBeenCalledTimes(1);
  expect(sendEmail).toHaveBeenCalledWith({
    to: 'someone@example.com',
    subject: 'Subj',
    html: '<b>Hello</b>',
  });
});
