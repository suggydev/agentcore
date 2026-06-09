const { v4: uuidv4 } = require('uuid');

function requestIdTracking(req, res, next) {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('x-request-id', req.requestId);
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify({
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration
      }));
    }
  });
  next();
}

module.exports = { requestIdTracking };
