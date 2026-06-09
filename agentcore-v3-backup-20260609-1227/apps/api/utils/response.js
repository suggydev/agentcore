function successResponse(res, data, status = 200) {
  const payload = { success: true };
  if (data !== undefined) payload.data = data;
  res.status(status).json(payload);
}

function errorResponse(res, message, status = 500, extra = {}) {
  const payload = { success: false, error: message, ...extra };
  res.status(status).json(payload);
}

module.exports = { successResponse, errorResponse };
