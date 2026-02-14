import { VerifyToken } from "../utils/token.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";

export const authentication = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    throw new Error("Token not exist");
  }
  const [prefix, token] = authorization.split(" ");
  if (prefix !== "bearer") {
    throw new Error("Invalid token prefix");
  }
  const decoded = VerifyToken({
    payload: token,
    secret_key: "12h%56b8@123456hhs0y123456789012",
  });
  if (!decoded || !decoded.id) {
    throw new Error("InValid token");
  }
  const user = await db_service.findById({
    model: userModel,
    id: decoded.id,
    select: "-password",
  });
  if (!user) {
    throw new Error("User not exist", { cause: 400 });
  }
  req.user = user;
  next();
};
