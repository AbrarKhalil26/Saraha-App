import dotenv from "dotenv";
import { resolve } from "node:path";
const NODE_ENV = process.env.NODE_ENV;

let envPaths = {
  development: ".env.development",
  production: ".env.production",
};

dotenv.config({ path: resolve(`config/${envPaths[NODE_ENV]}`) });

export const PORT = +process.env.PORT || 3000;
export const SALT_ROUNDS = +process.env.SALT_ROUNDS || 12;
