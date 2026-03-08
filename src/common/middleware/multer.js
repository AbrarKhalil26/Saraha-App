import multer from "multer";
import fs from "node:fs";

export const multer_local = ({
  custom_path = "General",
  custom_types = [],
}) => {
  const full_path = `uploads/${custom_path}`;
  if (!fs.existsSync(full_path)) {
    fs.mkdirSync(full_path);
  }
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `uploads/${custom_path}`);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.originalname.substring(0, file.originalname.lastIndexOf(".")) +
          "-" +
          uniqueSuffix +
          "." +
          file.mimetype.split("/")[1],
      );
    },
  });

  function fileFilter(req, file, cb) {
    if (!custom_types.includes(file.mimetype)) {
      cd(new Error("Invalid file type"));
    }
    cb(null, true);
  }

  const upload = multer({ storage, fileFilter });
  return upload;
};

export const multer_host = (custom_types = []) => {
  const storage = multer.diskStorage({
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.originalname.substring(0, file.originalname.lastIndexOf(".")) +
          "-" +
          uniqueSuffix +
          "." +
          file.mimetype.split("/")[1],
      );
    },
  });

  function fileFilter(req, file, cb) {
    if (!custom_types.includes(file.mimetype)) {
      cd(new Error("Invalid file type"));
    }
    cb(null, true);
  }

  const upload = multer({ storage, fileFilter });
  return upload;
};
