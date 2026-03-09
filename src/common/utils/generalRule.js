import Joi from "joi";
import { Types } from "mongoose";

export const general_rules = {
  id: Joi.string().custom((value, helper)=>{
    const isValid = Types.ObjectId.isValid(value);
    return isValid ? value : helper.message("Invalid ID format")
  }),
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
  password: Joi.string().regex(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,
  ),
  cPassword: Joi.string().valid(Joi.ref("password")).required(),

  file: Joi.object({
      fieldname: Joi.string().required(),
      originalname: Joi.string().required(),
      encoding: Joi.string().required(),
      mimetype: Joi.string().required(),
      destination: Joi.string().required(),
      filename: Joi.string().required(),
      path: Joi.string().required(),
      size: Joi.number().required(),
    }).messages({
      "any.required": "file must not be empty",
    })
};
