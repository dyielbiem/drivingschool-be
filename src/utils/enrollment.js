import dayjs from "dayjs";

import { getCoupon } from "./dbUtils/coupon.js";

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

export const validateCoupon = (coupon) => {
  if (!coupon || !coupon.isActive) return false;
  const currentDate = dayjs().startOf("day");
  const couponFromDate = dayjs(coupon.fromDate, "YYYY-MM-DD").startOf("day");
  const couponToDate = dayjs(coupon.toDate, "YYYY-MM-DD").endOf("day");

  if (currentDate.isBefore(couponFromDate) || currentDate.isAfter(couponToDate))
    return false;

  return true;
};

export const getFinalChargeAmount = async (
  couponCode,
  drivingSchoolID,
  coursePrice
) => {
  const invalidCouponError = "Invalid coupon code";
  if (!couponCode)
    return {
      finalChargeAmount: coursePrice,
      coupon: null
    };

  const { Item: coupon } = await getCoupon(
    couponCode?.toLowerCase?.(),
    drivingSchoolID
  );

  const isCouponValid = validateCoupon(coupon);
  if (!isCouponValid) throw Error(invalidCouponError);

  const couponDiscount = coupon.couponAmount || 0;
  const finalChargeAmount = Math.max(coursePrice - couponDiscount, 0);

  return { coupon, finalChargeAmount };
};
