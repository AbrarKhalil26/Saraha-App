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

  files: Joi.object({
    profileImage: Joi.array()
      .max(1)
      .items(general_rules.file.required())
      .required(),
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
