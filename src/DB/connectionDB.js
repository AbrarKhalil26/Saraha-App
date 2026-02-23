import mongoose from "mongoose";

const checkConnectionDB = async () => {
  await mongoose
    .connect(process.env.DB_URL, {
      serverSelectionTimeoutMS: 1000,
    })
    .then(() => console.log("DB connected successfully"))
    .catch((err) => console.log("DB Connected Failed", err));
};

export default checkConnectionDB;
