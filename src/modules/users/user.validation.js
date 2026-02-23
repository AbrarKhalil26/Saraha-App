import Joi from "joi";
import { GenderEnum } from "../../common/enum/user.enum.js";

export const signUpSchema = {
  body: Joi.object({
    userName: Joi.string().min(5).max(40).required(),
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com'] } }).required(),
    password: Joi.string().required(),
    cPassword: Joi.string().valid(Joi.ref("password")).required(),
    age: Joi.number().min(18).max(100).required(),
    gender: Joi.string().valid(...Object.values(GenderEnum)).required(),
    phone: Joi.string().required()
  }).required(),
};

export const signInSchema = {
  body: Joi.object({
    email: Joi.string().required(),
    password: Joi.string().min(20).required(),
  }).required(), 
};
