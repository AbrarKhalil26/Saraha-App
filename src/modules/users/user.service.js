import userModel from "../../DB/models/user.model.js";
import * as db_service from "../../DB/db.service.js";
import { ProviderEnum } from "../../common/enum/user.enum.js";
import { successResponse } from "../../common/utils/response.success.js";
import {
  decrypt,
  encrypt,
} from "../../common/utils/security/encrypt.security.js";
import { Compare, Hash } from "../../common/utils/security/hash.security.js";
import { GenerateToken } from "../../common/utils/token.service.js";

export const signUp = async (req, res, next) => {
  const { userName, email, password, age, gender, phone } = req.body;
  if (await db_service.findOne({ model: userModel, filter: { email } })) {
    throw new Error("Email already exist");
  }
  const user = await db_service.create({
    model: userModel,
    data: {
      userName,
      email,
      password: Hash({ plainText: password, salt_rounds: 12 }),
      age,
      gender,
      phone: encrypt(phone),
    },
  });
  successResponse({ res, status: 201, data: user });
};

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await db_service.findOne({
    model: userModel,
    filter: { email, provider: ProviderEnum.system },
  });
  if (!user) {
    throw new Error("User not exist");
  }
  if (!Compare({ plainText: password, cipherText: user.password })) {
    throw new Error("Invalid Password", { cause: 409 });
  }
  const access_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: "12h%56b8@123456hhs0y123456789012",
    options: { expiresIn: "1h" },
  });
  successResponse({
    res,
    status: 200,
    message: "Login Successfully...",
    data: { access_token },
  });
};

export const getProfile = async (req, res, next) => {
  successResponse({
    res,
    status: 200,
    data: { ...req.user._doc, phone: decrypt(req.user.phone) },
  });
};
