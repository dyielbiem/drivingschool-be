import Stripe from "stripe";
import dayjs from "dayjs";

import sendStudentWelcomeEmail from "../../utils/sendStudentWelcomeEmail.js";
import emailAdminAboutNewStudent from "../../utils/emailAdminAboutNewStudent.js";
import { getStudent, updateStudentItem } from "../../utils/dbUtils/student.js";
import { getDrivingSchool } from "../../utils/dbUtils/drivingSchool.js";
import { getCourse } from "../../utils/dbUtils/course.js";
import { getCoupon } from "../../utils/dbUtils/coupon.js";

/*
---- Controller to confirm enrollment stripe payment
---- /api/student/enroll/stripe/payment/confirm (POST)
*/
const confirmEnrollmentStripePayment = async (req, res) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SK);
    const { paymentIntentID } = req.body;

    if (!paymentIntentID) throw Error("Payment intent ID is required");

    const {
      status,
      metadata = {},
      payment_method: paymentMethod
    } = await stripe.paymentIntents.retrieve(paymentIntentID, {
      expand: ["payment_method"]
    });

    const brand = paymentMethod?.card?.brand ?? null;
    const last4 = paymentMethod?.card?.last4 ?? null;

    if (status !== "succeeded")
      throw Error("Payment transaction did not succeed");

    const { drivingSchoolID, studentUserName, usedCouponCode } = metadata;
    const { Item: student } = await getStudent(
      drivingSchoolID,
      studentUserName
    );

    if (!student || student.paymentMethod !== "stripe")
      throw Error("Invalid payment transaction");
    if (student && student.isActive)
      throw Error("Payment transaction has already been processed");

    await updateStudentItem(drivingSchoolID, studentUserName, {
      ":isActive": true,
      ":isPaid": true,
      ":transactionID": paymentIntentID,
      ":accountNumber": last4 ? `XXXX${last4}` : null,
      ":accountType": brand
    });

    const [{ Item: drivingSchool }, { Item: course }] = await Promise.all([
      getDrivingSchool(drivingSchoolID),
      getCourse(student.courseID)
    ]);
    let coupon = null;
    if (usedCouponCode) {
      const { Item } = await getCoupon(usedCouponCode, drivingSchoolID);
      coupon = Item;
    }

    const emailRequests = [
      sendStudentWelcomeEmail(
        student.mailingEmail,
        drivingSchool.emailSubject,
        `${drivingSchool.emailBody || ""}`
          .replace("{ username }", student.studentUserName)
          .replace("{ password }", student.encryptedPassWord)
      ),
      emailAdminAboutNewStudent(
        [
          { label: "First Name", value: student.mailingFirstName },
          { label: "Last Name", value: student.mailingLastName },
          { label: "Date of Birth", value: student.birthDate },
          { label: "Address", value: student.mailingAddress },
          { label: "City", value: student.mailingCity },
          { label: "State", value: student.mailingState },
          { label: "Zip Code", value: student.mailingZip },
          { label: "Phone Number", value: student.mailingPhoneNumber },
          { label: "Email Address", value: student.mailingEmailstudent },
          {
            label: "Start Date",
            value: dayjs(student.enrollmentDate).format("MM-DD-YYYY")
          },
          { label: "Username", value: student.studentUserName },
          { label: "Password", value: student.encryptedPassWord },
          { label: "Course", value: course.courseName },
          { label: "Course Price", value: course.coursePrice },
          { label: "Coupon Code", value: coupon?.couponCode || "" },
          { label: "Coupon Price", value: coupon?.couponAmount || "" },
          { label: "School", value: student.highSchool || "" }
        ],
        drivingSchool.email
      )
    ];

    await Promise.all(emailRequests);

    res.status(200).json({ message: "Payment transaction confirmed" });
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

export default confirmEnrollmentStripePayment;
