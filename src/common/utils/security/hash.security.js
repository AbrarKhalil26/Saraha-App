import { compareSync, hashSync } from "bcrypt";

export const Hash = ({ plainText, salt_rounds = +process.env.SALT_ROUNDS } = {}) => {
  return hashSync(plainText, salt_rounds);
};

export const Compare = ({ plainText, cipherText } = {}) => {
  return compareSync(plainText, cipherText);
};
