const mongoose = require('mongoose');
const path = require('path');

// Load backend .env for local runs (doesn't affect production; only used in tests)
try {
  // Only load if not already provided by environment/CI
  if (!process.env.MONGODB_URI && !process.env.MONGODB_URI_TEST) {
    // eslint-disable-next-line global-require
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  }
} catch (_) {
  // ignore
}

function buildTestUri() {
  // Prefer explicit test URI
  const explicit = process.env.MONGODB_URI_TEST;
  if (explicit) return explicit;

  // Fallback to normal URI if it looks like a local dev instance
  const fallback = process.env.MONGODB_URI;
  if (fallback && /localhost|127\.0\.0\.1/i.test(fallback)) return fallback;

  return null;
}

function hasTestDbConfig() {
  return Boolean(buildTestUri());
}

async function connectTestDb() {
  const uri = buildTestUri();
  if (!uri) {
    return { connected: false, uri: null };
  }

  if (mongoose.connection.readyState === 1) {
    return { connected: true, uri };
  }

  // Ensure a unique db name per run to prevent collisions.
  const url = new URL(uri);
  const baseDbName = (url.pathname || '').replace(/^\//, '') || 'codeverse';
  const testDbName = `${baseDbName}_jest_${Date.now()}`;
  url.pathname = `/${testDbName}`;

  await mongoose.connect(url.toString());
  return { connected: true, uri: url.toString() };
}

async function disconnectTestDb() {
  if (mongoose.connection.readyState !== 0) {
    // Force-close sockets to avoid Jest open-handle warnings.
    try {
      const client = typeof mongoose.connection.getClient === 'function'
        ? mongoose.connection.getClient()
        : null;
      if (client && typeof client.close === 'function') {
        await client.close(true);
      }
    } catch (_) {
      // ignore
    }

    try {
      await mongoose.connection.close(true);
    } catch (_) {
      // ignore
    }
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore
    }
  }

  if (process.env.JEST_DEBUG_HANDLES === '1') {
    const handles = process._getActiveHandles();
    const summary = handles.map(h => h && h.constructor && h.constructor.name);

    // eslint-disable-next-line no-console
    console.log('Active handles after disconnect:', summary);

    // eslint-disable-next-line no-console
    console.log(
      'Active sockets:',
      handles
        .filter(h => h && h.constructor && h.constructor.name === 'Socket')
        .map(s => ({
          local: `${s.localAddress || ''}:${s.localPort || ''}`,
          remote: `${s.remoteAddress || ''}:${s.remotePort || ''}`,
          destroyed: s.destroyed,
          connecting: s.connecting,
        }))
    );
  }
}

module.exports = {
  connectTestDb,
  disconnectTestDb,
  hasTestDbConfig,
};
