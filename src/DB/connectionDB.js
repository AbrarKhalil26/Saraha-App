import mongoose from "mongoose";

const checkConnectionDB = async () => {
  await mongoose
    .connect("mongodb://localhost:27017/saraha_app", {
      serverSelectionTimeoutMS: 1000,
    })
    .then(() => console.log("DB connected successfully"))
    .catch((err) => console.log("DB Connected Failed", err));
};

export default checkConnectionDB;
