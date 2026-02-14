import { compareSync, hashSync } from "bcrypt";

export const Hash = ({ plainText, salt_rounds } = {}) => {
  return hashSync(plainText, salt_rounds);
};

export const Compare = ({ plainText, cipherText } = {}) => {
  return compareSync(plainText, cipherText);
};
