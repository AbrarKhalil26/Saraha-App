import Joi from "joi";
import { GenderEnum } from "../../common/enum/user.enum.js";

export const signUpSchema = {
  body: Joi.object({
    userName: Joi.string().min(5).max(40).required(),
    email: Joi.string()
      .email({
        tlds: {
          allow: false,
          deny: ["org"],
          minDomainSegments: 2,
          maxDomainSegments: 2,
        },
      })
      .required(),
    password: Joi.string().required(),
    cPassword: Joi.string().valid(Joi.ref("password")).required(),
    gender: Joi.string()
      .valid(...Object.values(GenderEnum))
      .required(),
    phone: Joi.string().required(),
  })
    .required()
    .messages({
      "any.required": "body must not be empty",
    }),
};

export const signInSchema = {
  body: Joi.object({
    email: Joi.string().required(),
    password: Joi.string().min(20).required(),
  }).required(),
};
