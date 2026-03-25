import { VerifyToken } from "../utils/token.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { ACCESS_SECRET_KEY, PREFIX } from "../../../config/config.service.js";

export const authentication = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    throw new Error("Token not exist");
  }
  const [prefix, token] = authorization.split(" ");
  if (prefix !== PREFIX) {
    throw new Error("Invalid token prefix");
  }
  const decoded = VerifyToken({
    payload: token,
    secret_key: ACCESS_SECRET_KEY,
  });
  if (!decoded || !decoded.id) {
    throw new Error("InValid token payload");
  }
  const user = await db_service.findById({
    model: userModel,
    id: decoded.id,
  });
  if (!user) {
    throw new Error("User not exist", { cause: 400 });
  }
  if (user?.changeCredential?.getTime() > decoded.iat * 1000) {
    throw new Error("Invalid token");
  }
  req.user = user;
  req.decoded = decoded;
  next();
};
