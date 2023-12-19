import crypto from "crypto";

const SECRET = process.env.CRYPTO_SECRET;
const IV = process.env.CRYPTO_IV;

/*
---- Utility function to encrypt a string
*/
export const encrypt = (text) => {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(SECRET, "hex"),
    Buffer.from(IV, "hex")
  );
  let encryptedText = cipher.update(text, "utf-8", "hex");
  encryptedText += cipher.final("hex");
  return encryptedText;
};

/*
---- Utility function to decrypt an encrypted string
*/
export const decrypt = (encryptedText) => {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(SECRET, "hex"),
    Buffer.from(IV, "hex")
  );

  let decryptedText = decipher.update(encryptedText, "hex", "utf-8");
  decryptedText += decipher.final("utf-8");
  return decryptedText;
};
