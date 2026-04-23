// IN-MEMORY EMAIL QUEUE REPLACEMENT
// Replaces BullMQ due to strict Redis >= 5.0.0 requirements crashing on older variants.

const emailService = require('../services/emailService');

const internalQueue = [];

// Simple Background array processor mimicking Queue behavior loosely
setInterval(async () => {
    if (internalQueue.length > 0) {
        const job = internalQueue.shift();
        try {
            console.log(`📨 [MemoryQueue] Processing email to: ${job.data.to}`);
            await emailService.sendEmail({
                to: job.data.to,
                subject: job.data.subject,
                html: job.data.html
            });
            console.log(`✅ [MemoryQueue] Email successfully sent to ${job.data.to}`);
        } catch (err) {
            console.error(`❌ [MemoryQueue] Email delivery failed for ${job.data.to}:`, err.message);
        }
    }
}, 1000); // Check the queue every 1 second

const emailQueue = {
    add: async (jobName, data) => {
        internalQueue.push({ name: jobName, data });
        console.log(`📥 [MemoryQueue] Job '${jobName}' added to internal queue (Size: ${internalQueue.length})`);
        return true;
    }
};

module.exports = {
  emailQueue
};

