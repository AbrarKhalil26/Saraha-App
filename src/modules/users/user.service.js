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
import { OAuth2Client } from "google-auth-library";
import { SALT_ROUNDS } from "../../../config/config.service.js";
const salt_rounds = SALT_ROUNDS

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
      password: Hash({ plainText: password, salt_rounds }),
      age,
      gender,
      phone: encrypt(phone),
    },
  });
  successResponse({ res, status: 201, data: user });
};

export const signUpWithGmail = async (req, res, next) => {
  const { idToken } = req.body;

  const client = new OAuth2Client();
  console.log(idToken);
  const ticket = await client.verifyIdToken({
    idToken,
    audience:
      "652811269472-eibp6r7t98acke9lj8pu8kl6iofj32ac.apps.googleusercontent.com",
  });
  const payload = ticket.getPayload();
  const { email, email_verified, name, picture } = payload;

  let user = await db_service.findOne({ model: userModel, filter: { email } });
  if (!user) {
    user = await db_service.create({
      model: userModel,
      data: {
        email,
        confirmed: email_verified,
        userName: name,
        profilePicture: picture,
        provider: ProviderEnum.google,
      },
    });
  }

  if (user.provider == ProviderEnum.system) {
    throw new Error("Please log in on system only", { cause: 400 });
  }

  const access_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: SECRET_KEY,
    options: { expiresIn: "1h" },
  });
  successResponse({
    res,
    status: 200,
    message: "Login Successfully...",
    data: { access_token },
  });
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
    secret_key: process.env.SECRET_KEY,
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
