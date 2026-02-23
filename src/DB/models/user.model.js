import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enum/user.enum.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 15,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 15,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: function(){
        return this.provider == ProviderEnum.google ? false: true
      },
      trim: true,
    },
    age: Number,
    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.male,
    },
    provider: {
      type: String,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.system,
    },
    role: {
      type: String,
      enum: Object.values(RoleEnum),
      default: RoleEnum.user,
    },
    phone: { type: String },
    profilePicture: String,
    confirmed: Boolean,
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true},
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
