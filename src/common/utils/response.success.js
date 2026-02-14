export const successResponse = ({
  res,
  status = 200,
  message = undefined,
  data = undefined,
} = {}) => {
  return res.status(status).json({ message, data });
};
