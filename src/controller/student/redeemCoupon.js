import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to redeem a coupon
---- /api/student/coupon (POST)
*/
const redeemCoupon = async (req, res) => {
  try {
    const { drivingSchoolID, couponCode } = req.body;
    if (!drivingSchoolID || !couponCode)
      throw Error("All required fields must be filled");

    const command = new GetCommand({
      TableName: process.env.COUPON_TABLE,
      Key: {
        drivingSchoolID,
        couponCode
      }
    });

    const { Item } = await dynamoClient.send(command);

    if (!Item) return res.status(200).json({ couponStatus: "invalid" });

    const expiryDate = new Date(Item.toDate);
    expiryDate.setDate(expiryDate.getDate() + 1);

    if (!Item.isActive || expiryDate < new Date())
      return res.status(200).json({ couponStatus: "invalid" });

    res
      .status(200)
      .json({ couponStatus: "valid", couponAmount: Item.couponAmount });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};
export default redeemCoupon;
