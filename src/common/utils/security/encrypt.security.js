import crypto from "node:crypto";

const ENCRYPTION_KEY = Buffer.from("12h%56b8@123456hhs0y123456789012");
const IV_LENGTH = 16;

export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(text) {
  const [ivHex, encryptedText] = text.split(":")
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
