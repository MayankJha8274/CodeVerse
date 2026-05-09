jest.mock('../src/services/emailService', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('../src/models/ContestReminder', () => ({
  updateOne: jest.fn(),
}));

jest.mock('../src/config/redis', () => ({
  createWorkerConnection: jest.fn(() => ({ quit: jest.fn() })),
}));

jest.mock('bullmq', () => {
  return {
    Worker: jest.fn().mockImplementation((queueName, processor, opts) => {
      // expose constructor args for assertions
      return {
        __queueName: queueName,
        __processor: processor,
        __opts: opts,
        on: jest.fn(),
        close: jest.fn(async () => {}),
      };
    }),
  };
});

const { sendEmail } = require('../src/services/emailService');
const ContestReminder = require('../src/models/ContestReminder');

const { startEmailWorker, stopEmailWorker } = require('../src/workers/emailWorker');

describe('emailWorker (BullMQ) unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('processes a job by calling sendEmail', async () => {
    process.env.REDIS_ENABLED = 'true';

    sendEmail.mockResolvedValue({ ok: true });

    await startEmailWorker();

    // Import mocked Worker to access captured processor
    const { Worker } = require('bullmq');
    const workerInstance = Worker.mock.results[0].value;

    const job = {
      data: { to: 'x@example.com', subject: 'Hello', html: '<b>Hi</b>', reminderId: 'rem1' },
    };

    const res = await workerInstance.__processor(job);
    expect(res).toEqual({ success: true });
    expect(sendEmail).toHaveBeenCalledWith({ to: 'x@example.com', subject: 'Hello', html: '<b>Hi</b>' });
    expect(ContestReminder.updateOne).toHaveBeenCalledWith(
      { _id: 'rem1' },
      { $set: { reminderSent: true, status: 'done', lockedUntil: null, lastError: null } }
    );

    await stopEmailWorker();
  });

  test('rethrows on sendEmail failure (BullMQ retries)', async () => {
    process.env.REDIS_ENABLED = 'true';

    sendEmail.mockRejectedValue(new Error('boom'));

    await startEmailWorker();

    const { Worker } = require('bullmq');
    const workerInstance = Worker.mock.results[0].value;

    await expect(
      workerInstance.__processor({ data: { to: 'x@example.com', subject: 'Hello', html: '<b>Hi</b>', reminderId: 'rem1' } })
    ).rejects.toThrow('boom');

    expect(ContestReminder.updateOne).toHaveBeenCalledWith(
      { _id: 'rem1' },
      { $set: { lastError: 'boom' } }
    );

    await stopEmailWorker();
  });
});
