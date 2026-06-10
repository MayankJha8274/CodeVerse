const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const cacheMiddleware = (duration = 60) => {
  return (req, res, next) => {
    const key = req.originalUrl || req.url;
    const cached = cache.get(key);
    if (cached) {
      return res.json(cached);
    }
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      cache.set(key, body, duration);
      originalJson(body);
    };
    next();
  };
};

module.exports = { cacheMiddleware, cache };
