import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to delete a discount coupon of a driving school
---- /api/admin/coupon (DELETE)
*/
const deleteCoupon = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;
    const { couponCode } = req.query;
    if (!couponCode) throw Error("Coupon code must be provided");

    const command = new DeleteCommand({
      TableName: process.env.COUPON_TABLE,
      Key: {
        couponCode,
        drivingSchoolID
      },
      ConditionExpression:
        "attribute_exists(couponCode) AND attribute_exists(drivingSchoolID)",
      ReturnValues: "ALL_OLD"
    });

    const response = await dynamoClient.send(command);

    return res.status(200).json(response);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Coupon code does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default deleteCoupon;
