import bcrypt from "bcryptjs";

export const hashPassWord = async (passWord) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassWord = await bcrypt.hash(passWord, salt);

  return hashedPassWord;
};
