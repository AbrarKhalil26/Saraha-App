import mongoose from "mongoose";

const revokeTokenSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiredAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true, strictQuery: true },
);

revokeTokenSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });
const revokeTokenModel =
  mongoose.models.revokeToken || mongoose.model("revokeToken", revokeTokenSchema);

export default revokeTokenModel;
