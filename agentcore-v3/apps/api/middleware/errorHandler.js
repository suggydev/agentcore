const { v4: uuidv4 } = require('uuid');

function errorHandler(err, req, res, next) {
  console.error(JSON.stringify({
    requestId: req.requestId,
    error: err.message,
    stack: err.stack?.split('\n').slice(0, 3).join(' | ')
  }));
  const errorId = req.requestId || uuidv4();
  res.status(err.status || 500).json({
    error: err.message || 'Внутренняя ошибка сервера',
    errorId
  });
}

module.exports = { errorHandler };
