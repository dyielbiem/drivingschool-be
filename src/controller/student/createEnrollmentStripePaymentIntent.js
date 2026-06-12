import Stripe from "stripe";

import { getCourse } from "../../utils/dbUtils/course.js";
import { getFinalChargeAmount } from "../../utils/enrollment.js";

/*
---- Controller to create enrollment Stripe Payment Intent
---- /api/student/enroll/stripe/payment/intent/create (POST)
*/
const createEnrollmentStripePaymentIntent = async (req, res) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SK);
    const { courseID, couponCode = null, drivingSchoolID } = req.body;

    if (!courseID || !drivingSchoolID) throw Error("Missing required fields");

    const { Item: course } = await getCourse(courseID);

    if (!course) throw Error("Invalid course ID");

    // Get final charge amount and coupon
    const { finalChargeAmount, coupon } = await getFinalChargeAmount(
      couponCode,
      drivingSchoolID,
      course.coursePrice
    );

    if (finalChargeAmount < 1) throw Error("Final amount must be at least $1");

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalChargeAmount * 100,
      currency: "usd"
    });

    res.status(200).json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount / 100,
      couponUsed: coupon
    });
  } catch (error) {
    if (!error.code) {
      console.log("ERROR: ", error.message); // eslint-disable-line
      res.status(400).json({ error: error.message });
      return;
    }
    console.log("ERROR: ", error.message); // eslint-disable-line
    res.status(400).json(error);
  }
};

export default createEnrollmentStripePaymentIntent;
