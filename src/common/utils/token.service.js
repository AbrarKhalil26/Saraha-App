import jwt from "jsonwebtoken";

export const GenerateToken = ({ payload, secret_key, options = {} } = {}) => {
  return jwt.sign(payload, secret_key, options);
};

export const VerifyToken = ({ payload, secret_key, options = {} } = {}) => {
  return jwt.verify(payload, secret_key, options);
};
