import userModel from "../../DB/models/user.model.js";
import * as db_service from "../../DB/db.service.js";
import * as redis_service from "../../DB/redis/redis.service.js";
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
import { generateOTP, sendEmail } from "../../common/utils/email/send.email.js";
import { eventEmitter } from "../../common/utils/email/email.events.js";
import { emailEnum } from "../../common/enum/email.enum.js";
import { emailTemplate } from "../../common/utils/email/email.template.js";
const salt_rounds = SALT_ROUNDS;

const sendEmailOtp = async ({ email, userName, subject } = {}) => {
  const isBlocked = await redis_service.ttl(redis_service.block_otp_key(email));
  if (isBlocked > 0)
    throw new Error(
      `you are blocked, please try again after ${isBlocked} seconds`,
    );

  const otpTTL = await redis_service.ttl(
    redis_service.otp_key({ email, subject }),
  );
  if (otpTTL > 0) throw new Error(`you can resend otp after ${otpTTL} seconds`);

  const maxOtp = await redis_service.get(redis_service.max_otp_key({ email }));
  if (maxOtp >= 3) {
    await redis_service.set({
      key: redis_service.block_otp_key(email),
      value: 1,
      ttl: 60,
    });
    throw new Error(`you have exceeded the maximum number of tries`);
  }

  const otp = await generateOTP();
  eventEmitter.emit(emailEnum.confirmEmail, async () => {
    await sendEmail({
      to: email,
      subject: "Welcome",
      html: emailTemplate(userName, otp),
    });
    await redis_service.set({
      key: redis_service.otp_key({ email, subject }),
      value: Hash({ plainText: `${otp}` }),
      ttl: 60 * 2,
    });
    await redis_service.incr(redis_service.max_otp_key(email));
  });
};

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
  eventEmitter.emit(emailEnum.confirmEmail, async () => {
    await sendEmail({
      to: email,
      subject: "Send OTP",
      html: emailTemplate(userName, otp),
    });
    await redis_service.set({
      key: redis_service.otp_key({ email, subject: emailEnum.confirmEmail }),
      value: Hash({ plainText: `${otp}` }),
      ttl: 60 * 2,
    });
    await redis_service.set({
      key: redis_service.max_otp_key(email),
      value: 1,
      ttl: 60 * 30,
    });
  });
  successResponse({ res, status: 201, data: user });
};

export const confirmEmail = async (req, res, next) => {
  const { email, otp } = req.body;
  const otpExist = await redis_service.get(redis_service.otp_key({ email }));

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
  await redis_service.deleteKey(redis_service.otp_key({ email }));
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
  await sendEmailOtp({
    email,
    userName: user.userName,
    subject: emailEnum.confirmEmail,
  });
  successResponse({ res, message: "Email confirmed successfully", data: user });
};

export const signUpWithGmail = async (req, res, next) => {
  const { idToken } = req.body;

  const client = new OAuth2Client();
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
  const isBlocked = await redis_service.ttl(
    redis_service.login_block_key(email),
  );
  if (isBlocked > 0)
    throw new Error(
      `Account temporarily banned. Try again after ${isBlocked} seconds`,
    );

  const user = await db_service.findOne({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.system,
      confirmed: { $exists: true },
    },
  });
  if (!user) throw new Error("User not exist");

  if (!Compare({ plainText: password, cipherText: user.password })) {
    await redis_service.incr(redis_service.login_attempts_key(email));
    const attempts = await redis_service.get(
      redis_service.login_attempts_key(email),
    );
    if (attempts === 1)
      await redis_service.set({
        key: redis_service.login_attempts_key(email),
        value: 1,
        ttl: 60 * 5,
      });
    if (attempts >= 5) {
      await redis_service.set({
        key: redis_service.login_block_key(email),
        value: 1,
        ttl: 60 * 5,
      });
      await redis_service.deleteKey(redis_service.login_attempts_key(email));
      throw new Error(
        "Account banned for 5 minutes due to too many failed attempts",
      );
    }
    throw new Error(`Invalid Password. ${5 - attempts} attempts remaining`);
  }
  await redis_service.deleteKey(redis_service.login_attempts_key(email));

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

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await db_service.findOne({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.system,
      confirmed: { $exists: true },
    },
  });
  if (!user) throw new Error("User not exist or not confirmed", { cause: 400 });
  await sendEmailOtp({
    email,
    userName: user.userName,
    subject: emailEnum.forgetPassword,
  });
  successResponse({ res, message: "OTP sent to your email" });
};

export const resetPassword = async (req, res, next) => {
  const { email, otp, password } = req.body;
  const otpValue = await redis_service.get(
    redis_service.otp_key({ email, subject: emailEnum.forgetPassword }),
  );
  if (!otpValue) throw new Error("OTP Expired");
  if (!Compare({ plainText: otp, cipherText: otpValue }))
    throw new Error("Invalid OTP");
  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.system,
      confirmed: { $exists: true },
    },
    update: {
      password: Hash({ plainText: password }),
      changeCredential: new Date(),
    },
  });
  if (!user) throw new Error("User not exist or not confirmed", { cause: 400 });
  await redis_service.deleteKey(
    redis_service.otp_key({ email, subject: emailEnum.forgetPassword }),
  );
  successResponse({ res, message: "OTP sent to your email" });
};

export const enable2Step = async (req, res, next) => {
  const { email } = req.body;
  const user = await db_service.findOne({
    model: userModel,
    filter: { email },
  });
  if (user.twoStepVerification)
    throw new Error("2-step verification already enabled");
  // check in otp expire, blocked email, max tries
  const isBlocked = await redis_service.ttl(redis_service.block_otp_key(email));
  if (isBlocked > 0)
    throw new Error(
      `you are blocked, please try again after ${isBlocked} seconds`,
    );
  const otpTTL = await redis_service.ttl(redis_service.otp_key(email));
  if (otpTTL > 0) throw new Error(`you can resend otp after ${otpTTL} seconds`);
  const maxOtp = await redis_service.get(redis_service.max_otp_key({ email }));
  if (maxOtp >= 3) {
    await redis_service.set({
      key: redis_service.block_otp_key(email),
      value: 1,
      ttl: 60,
    });
    throw new Error(`you have exceeded the maximum number of tries`);
  }
  // Generate OTP
  const otp = await generateOTP();
  await sendEmail({
    to: email,
    subject: "2-Step Verification",
    html: `<h1>Hello ${user.userName}</h1>
         <p>Your OTP to enable 2-step verification: <b>${otp}</b></p>`,
  });
  await redis_service.set({
    key: redis_service.otp_key(email),
    value: Hash({ plainText: `${otp}` }),
    ttl: 60 * 2,
  });
  await redis_service.incr(max_otp_key(email));

  successResponse({ res, message: "OTP sent to your email" });
};

export const verify2Step = async (req, res, next) => {
  const { email, otp } = req.body;

  const otpExist = await redis_service.get(redis_service.otp_key(email));
  if (!otpExist) throw new Error("OTP Expired");
  if (!Compare({ plainText: `${otp}`, cipherText: otpExist }))
    throw new Error("Invalid OTP");

  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: { email },
    update: { twoStepVerification: true },
  });
  await redis_service.deleteKey(redis_service.otp_key(email));
  await redis_service.deleteKey(redis_service.max_otp_key(email));

  successResponse({
    res,
    message: "2-step verification enabled successfully",
    data: user,
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
    await redis_service.deleteKey(
      await redis_service.keys(redis_service.get_key(req.user._id)),
    );
  } else {
    await redis_service.set({
      key: redis_service.revoked_key({
        userId: req.user.id,
        jti: req.decoded.jti,
      }),
      value: `${req.decoded.jti}`,
      ttl: req.decoded.exp - Math.floor(Date.now() / 1000),
    });
  }
  successResponse({ res });
};

// ---------------------------------------------------
// Profile
// ---------------------------------------------------
export const getProfile = async (req, res, next) => {
  const key = `profile::${req.user._id}`;
  const userExist = await redis_service.get(key);
  if (userExist) {
    return successResponse({ res, data: userExist });
  }
  await redis_service.set({ key, value: req.user, ttl: 60 });
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
  await redis_service.deleteKey(`profile::${req.user._id}`);
  successResponse({ res, data: user });
};

export const updatePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!Compare({ plainText: oldPassword, cipherText: req.user.password })) {
    throw new Error("Invalid old password");
  }

  const hash = Hash({ plainText: newPassword });
  req.user.password = hash;
  req.user.changeCredential = new Date();
  await req.user.save();
  successResponse({ res, data: req.user });
};
