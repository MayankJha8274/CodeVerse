const { connectTestDb, disconnectTestDb, hasTestDbConfig } = require('./testDb');

const EmailJob = require('../src/models/EmailJob');
const emailQueueMongo = require('../src/queues/emailQueueMongo');

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
  // Ensure indexes (including unique sparse jobKey) exist before assertions.
  await EmailJob.syncIndexes();
});

afterAll(async () => {
  await disconnectTestDb();
});

afterEach(async () => {
  if (!HAS_DB) return;
  await EmailJob.deleteMany({});
});

dbTest('emailQueueMongo.add is idempotent when opts.jobId is provided', async () => {
  const payload = {
    reminderId: 'rem1',
    to: 'a@example.com',
    subject: 'Subj',
    html: '<b>Hello</b>',
  };

  const job1 = await emailQueueMongo.add('contest-reminder', payload, { jobId: 'contest-reminder:rem1' });
  const job2 = await emailQueueMongo.add('contest-reminder', payload, { jobId: 'contest-reminder:rem1' });

  expect(job1._id.toString()).toBe(job2._id.toString());

  const count = await EmailJob.countDocuments({ jobKey: 'contest-reminder:rem1' });
  expect(count).toBe(1);
});

dbTest('emailQueueMongo.add inserts multiple jobs when opts.jobId is not provided', async () => {
  const payload = {
    to: 'b@example.com',
    subject: 'Subj2',
    html: '<b>Hello2</b>',
  };

  const job1 = await emailQueueMongo.add('generic', payload);
  const job2 = await emailQueueMongo.add('generic', payload);

  expect(job1._id.toString()).not.toBe(job2._id.toString());

  const count = await EmailJob.countDocuments({ to: 'b@example.com' });
  expect(count).toBe(2);
});
