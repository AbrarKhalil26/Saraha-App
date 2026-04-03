import { Router } from "express";
import * as MS from "./message.service.js";
import * as MV from "./message.validation.js";
import { multer_local } from "../../common/middleware/multer.js";
import { validation } from "../../common/middleware/validation.js";
import { multer_enum } from "../../common/enum/multer.enum.js";
import { authentication } from "../../common/middleware/authentication.js";

const messageRouter = Router({
  mergeParams: true,
  caseSensitive: true,
  strict: true,
});

messageRouter.post(
  "/send",
  multer_local({
    custom_path: "messages",
    custom_types: multer_enum.image,
  }).array("attachments", 3),
  validation(MV.sendMessageSchema),
  MS.sendMessage,
);

messageRouter.get(
  "/:messageId",
  authentication,
  validation(MV.getMessageSchema),
  MS.getMessage,
);

messageRouter.get("/", authentication, MS.getMessages);

export default messageRouter;
