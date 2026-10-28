function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, _next) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err.message);
  }

  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ message: msg || 'Validation failed' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(', ') || 'field';
    return res.status(409).json({ message: `Duplicate value for ${field}` });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON in request body' });
  }

  const status = err.statusCode || err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
}

module.exports = { notFound, errorHandler };