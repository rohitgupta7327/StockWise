/**
 * Recursive sanitizer to prevent MongoDB NoSQL Injection attacks.
 * Strips any object keys starting with '$' or containing '.' from req.body, req.params, and req.query.
 */
function clean(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = clean(obj[i]);
    }
    return obj;
  }

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      clean(obj[key]);
    }
  }

  return obj;
}

const mongoSanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    clean(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    clean(req.params);
  }
  if (req.query && typeof req.query === 'object') {
    try {
      clean(req.query);
    } catch (_) {
      // Gracefully handle read-only property edge-cases in modern Express
    }
  }
  next();
};

module.exports = mongoSanitize;
