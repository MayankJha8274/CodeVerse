const { connectTestDb, disconnectTestDb, hasTestDbConfig } = require('./testDb');

jest.mock('../src/queues/emailQueue', () => ({
  emailQueue: {
    add: jest.fn(),
  },
}));

const User = require('../src/models/User');
const Contest = require('../src/models/Contest');
const ContestReminder = require('../src/models/ContestReminder');
const { emailQueue } = require('../src/queues/emailQueue');
const { processContestReminders } = require('../src/services/cronService');

const HAS_DB = hasTestDbConfig();
const dbTest = HAS_DB ? test : test.skip;

beforeAll(async () => {
  jest.setTimeout(30000);
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

  if (!HAS_DB) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Skipping DB tests: set MONGODB_URI_TEST (or MONGODB_URI pointing to localhost)');
    return;
  }

  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

afterEach(async () => {
  emailQueue.add.mockReset();
  if (!HAS_DB) return;
  await Promise.all([
    User.deleteMany({}),
    Contest.deleteMany({}),
    ContestReminder.deleteMany({}),
  ]);
});

dbTest('cron marks reminder as queued only after successful enqueue', async () => {
  const user = await User.create({
    username: `u${Date.now()}`,
    email: `u${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Test User',
    isActive: true,
  });

  const contest = await Contest.create({
    name: 'Cron Contest',
    platform: 'leetcode',
    url: 'https://example.com/contest',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    duration: 60,
    contestId: `t_${Date.now()}`,
  });

  const reminder = await ContestReminder.create({
    userId: user._id,
    contestId: contest._id,
    email: user.email,
    reminderSent: false,
    status: 'pending',
    lockedUntil: null,
    reminderTime: new Date(Date.now() - 60 * 1000),
    contestDetails: {
      name: contest.name,
      platform: contest.platform,
      url: contest.url,
      startTime: contest.startTime,
      duration: contest.duration,
    },
  });

  emailQueue.add.mockResolvedValue({ id: 'job1' });

  await processContestReminders();

  const updated = await ContestReminder.findById(reminder._id);
  expect(updated.reminderSent).toBe(false);
  expect(updated.status).toBe('queued');
});

dbTest('cron enqueue is idempotent via jobId', async () => {
  const user = await User.create({
    username: `u${Date.now()}`,
    email: `u${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Test User',
    isActive: true,
  });

  const contest = await Contest.create({
    name: 'Cron Contest',
    platform: 'leetcode',
    url: 'https://example.com/contest',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    duration: 60,
    contestId: `t_${Date.now()}`,
  });

  const reminder = await ContestReminder.create({
    userId: user._id,
    contestId: contest._id,
    email: user.email,
    reminderSent: false,
    status: 'pending',
    lockedUntil: null,
    reminderTime: new Date(Date.now() - 60 * 1000),
    contestDetails: {
      name: contest.name,
      platform: contest.platform,
      url: contest.url,
      startTime: contest.startTime,
      duration: contest.duration,
    },
  });

  emailQueue.add.mockResolvedValue({ id: 'job1' });

  await processContestReminders();

  expect(emailQueue.add).toHaveBeenCalled();
  const lastCall = emailQueue.add.mock.calls[emailQueue.add.mock.calls.length - 1];
  const opts = lastCall[2] || {};
  expect(opts.jobId).toBe(`contest-reminder:${reminder._id}`);
});

dbTest('cron keeps reminder pending when enqueue fails', async () => {
  const user = await User.create({
    username: `u${Date.now()}`,
    email: `u${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Test User',
    isActive: true,
  });

  const contest = await Contest.create({
    name: 'Cron Contest',
    platform: 'leetcode',
    url: 'https://example.com/contest',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    duration: 60,
    contestId: `t_${Date.now()}`,
  });

  const reminder = await ContestReminder.create({
    userId: user._id,
    contestId: contest._id,
    email: user.email,
    reminderSent: false,
    status: 'pending',
    lockedUntil: null,
    reminderTime: new Date(Date.now() - 60 * 1000),
    contestDetails: {
      name: contest.name,
      platform: contest.platform,
      url: contest.url,
      startTime: contest.startTime,
      duration: contest.duration,
    },
  });

  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  emailQueue.add.mockRejectedValue(new Error('enqueue failed'));

  await processContestReminders();

  errSpy.mockRestore();

  const updated = await ContestReminder.findById(reminder._id);
  expect(updated.reminderSent).toBe(false);
  expect(updated.status).toBe('pending');
  expect(updated.lastError).toBeTruthy();
});
