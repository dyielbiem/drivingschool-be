import { getCoupon } from "../../utils/dbUtils/coupon.js";
import { validateCoupon } from "../../utils/enrollment.js";

/*
---- Controller to redeem a coupon
---- /api/student/coupon (POST)
*/
const redeemCoupon = async (req, res) => {
  try {
    const { drivingSchoolID, couponCode } = req.body;
    if (!drivingSchoolID || !couponCode)
      throw Error("All required fields must be filled");

    const { Item: coupon = null } = await getCoupon(
      couponCode,
      drivingSchoolID
    );

    const isCouponValid = validateCoupon(coupon);
    if (!isCouponValid)
      return res.status(200).json({ couponStatus: "invalid" });

    res
      .status(200)
      .json({ couponStatus: "valid", couponAmount: coupon.couponAmount });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};
export default redeemCoupon;
