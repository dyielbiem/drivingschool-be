import { getCoupon } from "./dbUtils/coupon.js";

export const getFinalChargeAmount = (coupon, chargeAmount) => {
  const finalChargeAmount = !coupon?.couponAmount
    ? chargeAmount
    : coupon?.couponAmount >= chargeAmount
      ? 0
      : chargeAmount - (coupon?.couponAmount || 0);

  return finalChargeAmount;
};

export const validateCoupon = async (couponCode, drivingSchoolID) => {
  if (!couponCode) {
    return [null, true];
  }

  const { Item: coupon } = await getCoupon(
    couponCode?.toLowerCase?.(),
    drivingSchoolID
  );

  if (!coupon) {
    return [coupon, false];
  }

  const expiryDate = new Date(coupon.toDate);
  expiryDate.setDate(expiryDate.getDate() + 1);

  const isValid = coupon.isActive && expiryDate > new Date();

  return [coupon, isValid];
};

export const handleAuthorizeResponse = (response) => {
  const { resultCode, message } = response.messages || {};
  const { errors, responseCode } = response.transactionResponse || {};

  if (resultCode !== "Ok")
    return {
      ok: false,
      errorMessage:
        errors?.[0]?.errorText ||
        message?.[0]?.text ||
        "An error occured in payment transaction"
    };

  if (responseCode !== "1")
    return {
      ok: false,
      errorMessage: errors?.[0]?.errorText || "The credit card was declined"
    };

  return {
    ok: true,
    errorMessage: ""
  };
};
