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
import {
  ACCESS_SECRET_KEY,
  PREFIX,
  SALT_ROUNDS,
} from "../../../config/config.service.js";
import cloudinary from "../../common/utils/cloudinary.js";
import revokeTokenModel from "../../DB/models/revokeToken.model.js";
const salt_rounds = SALT_ROUNDS;

export const signUp = async (req, res, next) => {
  const { userName, email, password, age, gender, phone } = req.body;
  if (await db_service.findOne({ model: userModel, filter: { email } })) {
    throw new Error("Email already exist");
  }

  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: "Saraha_App/users",
    },
  );
  // let arr_paths = [];
  // for (const file of req.files?.attachments) {
  //   arr_paths.push(file.path);
  // }

  const user = await db_service.create({
    model: userModel,
    data: {
      userName,
      email,
      password: Hash({ plainText: password, salt_rounds }),
      gender,
      phone: encrypt(phone),
      profilePicture: { secure_url, public_id },
      // coverPictures: arr_paths,
    },
  });

  successResponse({ res, status: 201, data: data });
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
    secret_key: ACCESS_SECRET_KEY,
    options: { expiresIn: 60 * 5 },
  });
  const refresh_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: REFRESH_SECRET_KEY,
    options: { expiresIn: "1y" },
  });
  successResponse({
    res,
    status: 200,
    message: "Login Successfully...",
    data: { access_token, refresh_token },
  });
};

export const refreshToken = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    throw new Error("Token not found");
  }
  const [prefix, token] = authorization.split(" ");
  if (prefix !== PREFIX) {
    throw new Error("Invalid token prefix");
  }

  const decoded = VerifyToken({
    payload: token,
    secret_key: REFRESH_SECRET_KEY,
  });
  if (!decoded || !decoded.id) {
    throw new Error("InValid token");
  }
  const user = await db_service.findOne({
    model: userModel,
    id: decoded.id,
    select: "-password",
  });
  if (!user) {
    throw new Error("User not exist", { cause: 400 });
  }
  const access_token = GenerateToken({
    payload: {
      id: user._id,
      email: user.email,
    },
    secret_key: ACCESS_SECRET_KEY,
    options: {
      expiresIn: 60 * 5,
    },
  });
  successResponse({
    res,
    data: { access_token },
  });
};

export const logout = async (req, res, next) => {
  const { flag } = req.query;
  if (flag === "all") {
    req.user.changeCredential = new Date();
    await req.user.save();
    await db_service.deleteMany({
      model: revokeTokenModel,
      filter: {
        userId: req.user._id,
      },
    });
  } else {
    await db_service.create({
      model: revokeTokenModel,
      data: {
        tokenId: req.decoded.jti,
        userId: req.user._id,
        expiredAt: new Date(req.decoded.exp * 1000),
      },
    });
  }
  successResponse({ req });
};

export const getProfile = async (req, res, next) => {
  successResponse({ res, data: req.user });
};

export const shareProfile = async (req, res, next) => {
  const { id } = req.params;
  const user = await db_service.findById({
    model: userModel,
    id,
    select: "-password",
  });
  if (!user) {
    throw new Error("User not exist", { cause: 400 });
  }
  user.phone = decrypt(user.phone); 
  successResponse({ res, data: req.user });  
};
