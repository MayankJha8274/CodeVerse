// Unified Email Queue
// Uses BullMQ/Redis when available; falls back to a simple in-memory queue otherwise.

const emailService = require('../services/emailService');
const { getRedisConnection, isRedisAvailable } = require('../config/redis');
const ContestReminder = require('../models/ContestReminder');

let bullQueue = null;
let bullInitError = null;
let emailQueueMongo = null;

try {
    emailQueueMongo = require('./emailQueueMongo');
} catch (err) {
    emailQueueMongo = null;
}

const internalQueue = [];

let memoryProcessorStarted = false;

function startMemoryProcessorOnce() {
    if (memoryProcessorStarted) return;
    memoryProcessorStarted = true;

    // Background processor for in-memory fallback
    setInterval(async () => {
        if (internalQueue.length === 0) return;

        const job = internalQueue.shift();
        const { data, attempts = 0, maxAttempts = 3 } = job;
        try {
            console.log(`📨 [MemoryQueue] Processing email to: ${data.to} (attempt ${attempts + 1})`);
            await emailService.sendEmail({ to: data.to, subject: data.subject, html: data.html });
            if (data.reminderId) {
                await ContestReminder.updateOne(
                    { _id: data.reminderId },
                    { $set: { reminderSent: true, status: 'done', lockedUntil: null, lastError: null } }
                );
            }
            console.log(`✅ [MemoryQueue] Email successfully sent to ${data.to}`);
        } catch (err) {
            console.error(`❌ [MemoryQueue] Email delivery failed for ${data.to}:`, err.message);
            if (attempts + 1 < maxAttempts) {
                const delay = Math.min(5000 * Math.pow(2, attempts), 60000);
                setTimeout(() => internalQueue.push({ data, attempts: attempts + 1, maxAttempts }), delay);
                console.log(`↩️ [MemoryQueue] Requeued ${data.to} (next attempt in ${delay}ms)`);
            } else {
                console.error(`❌ [MemoryQueue] Giving up on ${data.to} after ${maxAttempts} attempts`);
                if (data.reminderId) {
                    try {
                        await ContestReminder.updateOne(
                            { _id: data.reminderId },
                            { $set: { status: 'failed', lockedUntil: null, lastError: err?.message || String(err) } }
                        );
                    } catch (_) {
                        // ignore
                    }
                }
            }
        }
    }, 1000);
}

function initBullQueueOnce() {
    if (bullQueue || bullInitError) return;
    if (!isRedisAvailable()) return;
    try {
        const { Queue } = require('bullmq');
        const connection = getRedisConnection();
        bullQueue = new Queue('email-queue', { connection });
        console.log('✅ EmailQueue: BullMQ queue initialized');
    } catch (err) {
        bullInitError = err;
        console.warn('⚠️ EmailQueue: BullMQ init failed, will not use Redis queue:', err.message);
    }
}

const emailQueue = {
    add: async (jobName, data, opts = {}) => {
        // 1) Prefer BullMQ/Redis when enabled and compatible
        initBullQueueOnce();
        if (bullQueue) {
            const jobOptions = Object.assign({
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: true,
            }, opts);

            // BullMQ: if jobId is provided and a job already exists with that id, add() throws.
            // For idempotency, treat that as success *unless* the existing job is in a terminal
            // failed state (in which case we attempt to retry it).
            try {
                const job = await bullQueue.add(jobName, data, jobOptions);
                console.log(`📥 [BullMQ] Enqueued job ${job.id} for ${data.to}`);
                return job;
            } catch (err) {
                const msg = err?.message || '';
                if (jobOptions.jobId && /already exists/i.test(msg)) {
                    try {
                        const existing = await bullQueue.getJob(jobOptions.jobId);
                        if (existing) {
                            const state = await existing.getState();
                            if (state === 'failed') {
                                console.warn(`↩️ [BullMQ] Job exists but failed; retrying (jobId=${jobOptions.jobId})`);
                                await existing.retry();
                                return { id: jobOptions.jobId, retried: true };
                            }
                        }
                    } catch (_) {
                        // ignore and fall through to idempotent success
                    }

                    console.log(`ℹ️ [BullMQ] Job already exists (jobId=${jobOptions.jobId}) for ${data.to}`);
                    return { id: jobOptions.jobId, alreadyExists: true };
                }
                throw err;
            }
        }

        // 2) If Mongo durable queue module exists, use it (it persists jobs; separate worker sends them)
        if (emailQueueMongo) {
            try {
                const job = await emailQueueMongo.add(jobName, data, opts);
                return job;
            } catch (err) {
                console.warn('⚠️ EmailQueue: Mongo enqueue failed; falling back to in-memory:', err.message);
            }
        }

        // 3) Last resort: in-memory queue
        const maxAttempts = opts.attempts || 3;
        startMemoryProcessorOnce();
        internalQueue.push({ name: jobName, data, attempts: 0, maxAttempts });
        console.log(`📥 [MemoryQueue] Job '${jobName}' added to internal queue (Size: ${internalQueue.length})`);
        return true;
    },
    _getQueueSize: () => internalQueue.length,
};

module.exports = {
    emailQueue
};

