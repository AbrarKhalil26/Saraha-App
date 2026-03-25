import { Router } from "express";
import * as US from "./user.service.js";
import * as UV from "./user.validation.js";
import { validation } from "../../common/middleware/validation.js";
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";
import { multer_host, multer_local } from "../../common/middleware/multer.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { multer_enum } from "../../common/enum/multer.enum.js";

const userRouter = Router();
userRouter.post(
  "/signup",
  multer_host(multer_enum.image).single("profileImage"),
  validation(UV.signUpSchema),
  US.signUp,
);
userRouter.post(
  "/verify-email",
  validation(UV.confirmEmailSchema),
  US.confirmEmail,
);
userRouter.post(
  "/resend-otp",
  validation(UV.resendOtpSchema),
  US.confirmEmail,
);
userRouter.post("/signup/gmail", US.signUpWithGmail);
userRouter.post("/signin", validation(UV.signInSchema), US.signIn);
userRouter.get("/refresh-token", US.refreshToken);
userRouter.get(
  "/profile",
  authentication,
  // authorization([RoleEnum.user]),
  US.getProfile,
);
userRouter.patch(
  "/update-profile",
  authentication,
  validation(UV.updateProfileSchema),
  US.updateProfile,
);
userRouter.patch(
  "/update-password",
  authentication,
  validation(UV.updatePasswordSchema),
  US.updatePassword,
);
userRouter.get(
  "/share-profile/:id",
  validation(UV.shareProfileSchema),
  US.shareProfile,
);
userRouter.post("/logout", authentication, US.logout);
export default userRouter;
