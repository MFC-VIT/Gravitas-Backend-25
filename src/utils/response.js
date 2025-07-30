const successResponse = (
  res,
  data = {},
  message = 'Request successful',
  statusCode = 200
) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

const errorResponse = (
  res,
  error = {},
  message = 'Something went wrong',
  statusCode = 500
) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    error: typeof error === 'string' ? { detail: error } : error,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
