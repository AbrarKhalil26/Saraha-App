import * as db_service from "../../DB/db.service.js";
import messageModel from "../../DB/models/message.model.js";
import userModel from "../../DB/models/user.model.js";
import { successResponse } from "../../common/utils/response.success.js";
// import * as redis_service from "../../DB/redis/redis.service.js";

export const sendMessage = async (req, res, next) => {
  const { content, userId } = req.body;
  const user = await db_service.findById({ model: userModel, id: userId });
  if (!user) throw new Error("User not found.");
  // create message ------>
  let arr = [];
  if (req.files.length) {
    for (const file of req.files) arr.push(file.path);
  }
  const message = await db_service.create({
    model: messageModel,
    data: { content, attachments: arr, userId: user._id },
  });
  successResponse({ res, status: 201, data: message });
};

export const getMessage = async (req, res, next) => {
  const { messageId } = req.params;
  const message = await db_service.findOne({
    model: messageModel,
    filter: { _id: messageId, userId: req.params.userId },
  });
  if (!message) throw new Error("Message not found.");
  successResponse({ res, status: 200, data: message });
};

export const getMessages = async (req, res, next) => {
  const messages = await db_service.find({
    model: messageModel,
    filter: { userId: req.user._id },
  });
  if (!messages) throw new Error("Messages not found.");
  successResponse({ res, status: 200, data: messages });
};
