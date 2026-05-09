const request = require('supertest');
const jwt = require('jsonwebtoken');
const { connectTestDb, disconnectTestDb, hasTestDbConfig } = require('./testDb');

const app = require('../src/app');
const User = require('../src/models/User');
const Contest = require('../src/models/Contest');
const ContestReminder = require('../src/models/ContestReminder');

const HAS_DB = hasTestDbConfig();
const dbTest = HAS_DB ? test : test.skip;

function authHeaderForUser(user) {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  return `Bearer ${token}`;
}

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
  if (!HAS_DB) return;
  await Promise.all([
    User.deleteMany({}),
    Contest.deleteMany({}),
    ContestReminder.deleteMany({}),
  ]);
});

dbTest('POST /api/contests/:contestId/reminder schedules ~1 hour before', async () => {
  const user = await User.create({
    username: `u${Date.now()}`,
    email: `u${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Test User',
    isActive: true,
  });

  const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const contest = await Contest.create({
    name: 'Test Contest',
    platform: 'leetcode',
    url: 'https://example.com/contest',
    startTime,
    endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
    duration: 60,
    contestId: `t_${Date.now()}`,
  });

  const res = await request(app)
    .post(`/api/contests/${contest._id}/reminder`)
    .set('Authorization', authHeaderForUser(user))
    .send();

  expect(res.status).toBe(201);
  expect(res.body.success).toBe(true);

  const reminder = await ContestReminder.findOne({ userId: user._id, contestId: contest._id });
  expect(reminder).toBeTruthy();

  const diffMs = startTime.getTime() - new Date(reminder.reminderTime).getTime();
  // Allow 5 seconds of clock/test drift
  expect(Math.abs(diffMs - 60 * 60 * 1000)).toBeLessThanOrEqual(5000);
  expect(reminder.status).toBe('pending');
  expect(reminder.reminderSent).toBe(false);
});

dbTest('POST /api/contests/:contestId/reminder uses 5-minute minimum when < 1 hour away', async () => {
  const user = await User.create({
    username: `u${Date.now()}`,
    email: `u${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Test User',
    isActive: true,
  });

  const startTime = new Date(Date.now() + 30 * 60 * 1000);
  const contest = await Contest.create({
    name: 'Soon Contest',
    platform: 'leetcode',
    url: 'https://example.com/contest',
    startTime,
    endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
    duration: 60,
    contestId: `t_${Date.now()}`,
  });

  const before = Date.now();
  const res = await request(app)
    .post(`/api/contests/${contest._id}/reminder`)
    .set('Authorization', authHeaderForUser(user))
    .send();

  expect(res.status).toBe(201);

  const reminder = await ContestReminder.findOne({ userId: user._id, contestId: contest._id });
  expect(reminder).toBeTruthy();

  const scheduledMs = new Date(reminder.reminderTime).getTime();
  // Should be ~now+5min
  expect(scheduledMs).toBeGreaterThanOrEqual(before + 5 * 60 * 1000 - 5000);
  expect(scheduledMs).toBeLessThanOrEqual(before + 5 * 60 * 1000 + 15000);
});

dbTest('Duplicate reminder returns 400', async () => {
  const user = await User.create({
    username: `u${Date.now()}`,
    email: `u${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Test User',
    isActive: true,
  });

  const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const contest = await Contest.create({
    name: 'Test Contest',
    platform: 'leetcode',
    url: 'https://example.com/contest',
    startTime,
    endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
    duration: 60,
    contestId: `t_${Date.now()}`,
  });

  const auth = authHeaderForUser(user);

  const res1 = await request(app)
    .post(`/api/contests/${contest._id}/reminder`)
    .set('Authorization', auth)
    .send();
  expect(res1.status).toBe(201);

  const res2 = await request(app)
    .post(`/api/contests/${contest._id}/reminder`)
    .set('Authorization', auth)
    .send();
  expect(res2.status).toBe(400);
});

dbTest('GET /api/contests/reminders includes upcoming reminders even when sent', async () => {
  const user = await User.create({
    username: `u${Date.now()}`,
    email: `u${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Test User',
    isActive: true,
  });

  const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const contest = await Contest.create({
    name: 'Future Contest',
    platform: 'leetcode',
    url: 'https://example.com/contest',
    startTime,
    endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
    duration: 60,
    contestId: `t_${Date.now()}`,
  });

  await ContestReminder.create({
    userId: user._id,
    contestId: contest._id,
    email: user.email,
    reminderSent: true,
    status: 'done',
    lockedUntil: null,
    lastError: null,
    reminderTime: new Date(Date.now() - 60 * 1000),
    contestDetails: {
      name: contest.name,
      platform: contest.platform,
      url: contest.url,
      startTime: contest.startTime,
      duration: contest.duration,
    },
  });

  const res = await request(app)
    .get('/api/contests/reminders')
    .set('Authorization', authHeaderForUser(user));

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.data.length).toBe(1);
  expect(res.body.data[0].reminderSent).toBe(true);
});

dbTest('DELETE /api/contests/:contestId/reminder removes reminder', async () => {
  const user = await User.create({
    username: `u${Date.now()}`,
    email: `u${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Test User',
    isActive: true,
  });

  const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const contest = await Contest.create({
    name: 'Test Contest',
    platform: 'leetcode',
    url: 'https://example.com/contest',
    startTime,
    endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
    duration: 60,
    contestId: `t_${Date.now()}`,
  });

  await ContestReminder.create({
    userId: user._id,
    contestId: contest._id,
    email: user.email,
    reminderSent: false,
    status: 'pending',
    reminderTime: new Date(Date.now() + 60 * 1000),
    contestDetails: {
      name: contest.name,
      platform: contest.platform,
      url: contest.url,
      startTime: contest.startTime,
      duration: contest.duration,
    },
  });

  const res = await request(app)
    .delete(`/api/contests/${contest._id}/reminder`)
    .set('Authorization', authHeaderForUser(user));

  expect(res.status).toBe(200);
  const reminder = await ContestReminder.findOne({ userId: user._id, contestId: contest._id });
  expect(reminder).toBeNull();
});

dbTest('DELETE /api/contests/:contestId/reminder returns 409 when reminder is queued', async () => {
  const user = await User.create({
    username: `u${Date.now()}`,
    email: `u${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Test User',
    isActive: true,
  });

  const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const contest = await Contest.create({
    name: 'Test Contest',
    platform: 'leetcode',
    url: 'https://example.com/contest',
    startTime,
    endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
    duration: 60,
    contestId: `t_${Date.now()}`,
  });

  await ContestReminder.create({
    userId: user._id,
    contestId: contest._id,
    email: user.email,
    reminderSent: false,
    status: 'queued',
    lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
    reminderTime: new Date(Date.now() - 60 * 1000),
    contestDetails: {
      name: contest.name,
      platform: contest.platform,
      url: contest.url,
      startTime: contest.startTime,
      duration: contest.duration,
    },
  });

  const res = await request(app)
    .delete(`/api/contests/${contest._id}/reminder`)
    .set('Authorization', authHeaderForUser(user));

  expect(res.status).toBe(409);

  const reminder = await ContestReminder.findOne({ userId: user._id, contestId: contest._id });
  expect(reminder).toBeTruthy();
  expect(reminder.status).toBe('queued');
});
