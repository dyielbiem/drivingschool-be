import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to update a discount coupon of a driving school
---- /api/admin/coupon (PATCH)
*/
const updateCoupon = async (req, res) => {
  try {
    const { drivingSchoolID, couponCode, couponAmount, isActive } = req.body;
    if (!couponCode || !couponAmount || isActive === undefined)
      throw Error("All required fields must be provided");
    if (typeof couponAmount !== "number")
      throw Error("Coupon amount must be a number");
    if (typeof isActive !== "boolean")
      throw Error("isActive must be a boolean");

    const command = new UpdateCommand({
      TableName: process.env.COUPON_TABLE,
      Key: {
        couponCode,
        drivingSchoolID
      },
      UpdateExpression:
        "SET couponAmount = :couponAmountValue, isActive = :isActiveValue",
      ExpressionAttributeValues: {
        ":couponAmountValue": couponAmount,
        ":isActiveValue": isActive
      },
      ConditionExpression:
        "attribute_exists(couponCode) AND attribute_exists(drivingSchoolID)",
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: updatedCoupon } = await dynamoClient.send(command);

    return res.status(200).json(updatedCoupon);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Coupon code does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateCoupon;
