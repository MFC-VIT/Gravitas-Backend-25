const successResponse = {
  status: 'success',
  message: 'Request successful',
  data: {},
};

const errorResponse = {
  status: 'error',
  message: 'Something went wrong',
  error: {},
};

module.exports = {
  successResponse,
  errorResponse,
};
