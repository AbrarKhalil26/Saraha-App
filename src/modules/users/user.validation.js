import Joi from "joi";
import { GenderEnum } from "../../common/enum/user.enum.js";
import { general_rules } from "../../common/utils/generalRule.js";

export const signUpSchema = {
  body: Joi.object({
    userName: Joi.string().trim().min(5).required(),
    email: general_rules.email.required(),
    password: general_rules.password.required(),
    cPassword: general_rules.cPassword.required(),
    gender: Joi.string()
      .valid(...Object.values(GenderEnum))
      .required(),
    phone: Joi.string().required(),
  })
    .required()
    .messages({
      "any.required": "body must not be empty",
    }),
  file: general_rules.file.required(),
};

export const confirmEmailSchema = {
  body: Joi.object({
    email: general_rules.email.required(),
    otp: Joi.string().length(6).regex(/^[0-9]{6}$/).required(),
  }).required(),
};

export const resendOtpSchema = {
  body: Joi.object({
    email: general_rules.email.required(),
  }).required(),
};

export const signInSchema = {
  body: Joi.object({
    email: general_rules.email.required(),
    password: general_rules.password.required(),
  }).required(),
};

export const shareProfileSchema = {
  params: Joi.object({
    id: general_rules.id.required(),
  }).required(),
};

export const updateProfileSchema = {
  body: Joi.object({
    firstName: Joi.string().trim().min(5),
    lastName: Joi.string().trim().min(5),
    gender: Joi.string().valid(...Object.values(GenderEnum)),
    phone: Joi.string(),
  })
    .required()
    .messages({
      "any.required": "body must not be empty",
    }),
};

export const updatePasswordSchema = {
  body: Joi.object({
    oldPassword: general_rules.password.required(),
    cPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
    newPassword: general_rules.password.required(),
  })
    .required()
    .messages({
      "any.required": "body must not be empty",
    }),
};
