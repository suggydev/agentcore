const { v4: uuidv4 } = require('uuid');
const config = require('../config');

function errorHandler(err, req, res, next) {
  if (config.NODE_ENV !== 'production') {
    console.error('Unhandled error:', {
      requestId: req.requestId,
      error: err.message,
      stack: err.stack
    });
  } else {
    console.error('Unhandled error:', err.message);
  }
  const errorId = req.requestId || uuidv4();
  res.status(err.status || 500).json({
    error: err.message || 'Внутренняя ошибка сервера',
    errorId
  });
}

module.exports = { errorHandler };
