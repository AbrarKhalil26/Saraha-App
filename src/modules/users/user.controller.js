import { Router } from "express";
import * as US from "./user.service.js";
import * as VU from "./user.validation.js";
import { validation } from "../../common/middleware/validation.js";
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";

const userRouter = Router();
userRouter.post("/signup", validation(VU.signUpSchema), US.signUp);
userRouter.post("/signup/gmail", US.signUpWithGmail);
userRouter.post("/signin", validation(VU.signInSchema), US.signIn);
userRouter.get("/profile", authentication, authorization, US.getProfile);

export default userRouter;
