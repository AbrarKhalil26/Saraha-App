import mongoose from "mongoose";
import { DB_URL_ONLINE } from "../../config/config.service.js";

const checkConnectionDB = async () => {
  await mongoose
    .connect(DB_URL_ONLINE, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => console.log("DB connected successfully"))
    .catch((err) => console.log("DB Connected Failed", err));
};

export default checkConnectionDB;
