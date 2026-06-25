import bcrypt from "bcryptjs";

export const hashPassWord = async (passWord) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassWord = await bcrypt.hash(passWord, salt);

  return hashedPassWord;
};

export const paginate = (items, page = 1, pageSize = 50) => {
  const totalCount = items.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIdx = (page - 1) * pageSize;
  const endIdx = page * pageSize;

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNext: page < totalPages,
    data: items.slice(startIdx, endIdx)
  };
};

export const validateObject = (obj, requiredFields, objName = "Object") => {
  if (!obj) throw Error(`${objName} is required`);

  requiredFields.forEach((field) => {
    if (!obj[field]) throw Error(`${objName}.${field} is required`);
  });
};
