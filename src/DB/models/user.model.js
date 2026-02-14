import mongoose from "mongoose";
import { GenderEnum, ProviderEnum } from "../../common/enum/user.enum.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      require: true,
      minLength: 3,
      maxLength: 15,
      trim: true,
    },
    lastName: {
      type: String,
      require: true,
      minLength: 3,
      maxLength: 15,
      trim: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      require: true,
      trim: true,
      minLength: 6,
    },
    age: Number,
    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.male,
    },
    profilePicture: String,
    confirmed: Boolean,
    provider: {
      type: String,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.system,
    },
    phone: String
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
  },
);

userSchema
  .virtual("userName")
  .get(function () {
    return this.firstName + " " + this.lastName;
  })
  .set(function (val) {
    const [firstName, lastName] = val.split(" ");
    this.set({ firstName, lastName });
  });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
