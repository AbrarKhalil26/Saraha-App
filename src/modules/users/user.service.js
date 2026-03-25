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
  REFRESH_SECRET_KEY,
  SALT_ROUNDS,
} from "../../../config/config.service.js";
import cloudinary from "../../common/utils/cloudinary.js";
import { randomUUID } from "crypto";
import {
  block_otp_key,
  deleteKey,
  get,
  get_key,
  incr,
  keys,
  max_otp_key,
  otp_key,
  set,
} from "../../DB/redis/redis.service.js";
import { generateOTP, sendEmail } from "../../common/utils/email/send.email.js";
const salt_rounds = SALT_ROUNDS;

export const signUp = async (req, res, next) => {
  const { userName, email, password, gender, phone } = req.body;
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
  // for (const file of req.file?.profileImage) {
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
  const otp = await generateOTP();
  await sendEmail({
    to: email,
    subject: "Welcome",
    html: `<h1>Hello ${userName}</h1>
    <p>Welcome to saraha app , your otp is: ${otp}</p>`,
  });
  await set({
    key: otp_key(email),
    value: Hash({ plainText: `${otp}` }),
    ttl: 60 * 2,
  });
  await set({
    key: max_otp_key(email),
    value: 1,
    ttl: 30,
  });
  successResponse({ res, status: 201, data: user });
};

export const confirmEmail = async (req, res, next) => {
  const { email, otp } = req.body;
  const otpExist = await get(otp_key(email));

  if (!otpExist) throw new Error("OTP Expired");
  if (!Compare({ plainText: otp, cipherText: otpExist }))
    throw new Error("Invalid OTP");

  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: {
      email,
      confirmed: { $exists: false },
      provider: ProviderEnum.system,
    },
    update: { confirmed: true },
  });
  if (!user) throw new Error("User not exist");
  await deleteKey(otp_key(email));
  successResponse({ res, message: "Email confirmed successfully", data: user });
};

export const resendOtp = async (req, res, next) => {
  const { email } = req.body;
  const user = await db_service.findOne({
    model: userModel,
    filter: {
      email,
      confirmed: { $exists: false },
      provider: ProviderEnum.system,
    },
  });
  if (!user) throw new Error("User not exist or already confirmed");

  const isBlocked = await ttl(block_otp_key(email));
  if (isBlocked > 0)
    throw new Error(`you are blocked, please try again after ${isBlocked} seconds`);

  const otpTTL = await ttl(otp_key(email));
  if (otpTTL > 0) throw new Error(`you can resend otp after ${otpTTL} seconds`);

  const maxOtp = await get(max_otp_key({ email }));
  if (maxOtp >= 3) {
    await set({
      key: block_otp_key(email),
      value: 1,
      ttl: 60,
    });
    throw new Error(`you have exceeded the maximum number of tries`);
  }

  const otp = await generateOTP();
  await sendEmail({
    to: user.email,
    subject: "Welcome",
    html: `<h1>Hello ${user.userName}</h1>
    <p>Welcome to saraha app , your otp is: ${otp}</p>`,
  });
  await set({
    key: otp_key(email),
    value: Hash({ plainText: `${otp}` }),
    ttl: 60 * 2,
  });
  await incr(max_otp_key(email))
  successResponse({ res, message: "Email confirmed successfully", data: user });
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
  const jwtid = randomUUID();
  const access_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: ACCESS_SECRET_KEY,
    options: { expiresIn: 60 * 3, jwtid },
  });
  const refresh_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: REFRESH_SECRET_KEY,
    options: { expiresIn: "1y", jwtid },
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
    await deleteKey(await keys(get_key(req.user._id)));
  } else {
    await set({
      key: revoked_key({ userId: req.user.id, jti: req.decoded.jti }),
      value: `${req.decoded.jti}`,
      ttl: req.decoded.exp - Math.floor(Date.now() / 1000),
    });
  }
  successResponse({ res });
};

export const getProfile = async (req, res, next) => {
  const key = `profile::${req.user._id}`;
  const userExist = await get(key);
  if (userExist) {
    return successResponse({ res, data: userExist });
  }
  await set({ key, value: req.user, ttl: 60 });
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
  successResponse({ res, data: user });
};

export const updateProfile = async (req, res, next) => {
  const { firstName, lastName, gender, phone } = req.body;
  if (phone) phone = encrypt(phone);
  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: { _id: req.user._id },
    update: { firstName, lastName, gender, phone },
  });
  if (!user) {
    throw new Error("User not exist", { cause: 400 });
  }
  await deleteKey(`profile::${req.user._id}`);
  successResponse({ res, data: user });
};

export const updatePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!Compare({ plainText: oldPassword, cipherText: req.user.password })) {
    throw new Error("Invalid old password");
  }

  const hash = Hash({ plainText: newPassword });
  req.user.password = hash;
  await req.user.save();
  successResponse({ res, data: req.user });
};
