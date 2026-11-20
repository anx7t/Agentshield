function validateBody(requiredFields) {
  return function (req, res, next) {
    const missing = requiredFields.filter((field) => req.body?.[field] == null);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
    }
    next();
  };
}

module.exports = validateBody;
