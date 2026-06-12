import { parseDate } from "chrono-node";

import { requiredBillingInfo } from "../../constants/index.js";
import { getDrivingSchool } from "../../utils/dbUtils/drivingSchool.js";
import { getStudent } from "../../utils/dbUtils/student.js";
import { getCourse } from "../../utils/dbUtils/course.js";
import { getActiveSection } from "../../utils/dbUtils/section.js";
import { getAffiliationByCode } from "../../utils/dbUtils/affiliation.js";
import { getFinalChargeAmount } from "../../utils/enrollment.js";

/*
---- Controller to validate student enrollment
---- /api/student/enroll/validate (POST)
*/
const validateStudentEnrollment = async (req, res) => {
  try {
    const {
      drivingSchoolCredentials,
      accountInformation = {},
      mailingInformation = {},
      billingInformation = {},
      cardInformation = {},
      courseID,
      couponCode,
      affiliationCode,
      paymentMethod
    } = req.body;

    if (!drivingSchoolCredentials?.drivingSchoolID)
      throw Error("Driving school ID is required");

    if (
      !accountInformation?.userName ||
      !accountInformation?.passWord ||
      !accountInformation?.confirmPassWord ||
      !accountInformation?.birthDate
    )
      throw Error("Account information must be complete");

    if (
      !mailingInformation?.firstName ||
      !mailingInformation?.lastName ||
      !mailingInformation?.address ||
      !mailingInformation?.city ||
      !mailingInformation?.state ||
      !mailingInformation?.zip ||
      !mailingInformation?.country ||
      !mailingInformation?.email ||
      !mailingInformation?.phoneNumber
    )
      throw Error("Mailing information must be complete");

    if (accountInformation.userName.includes(" "))
      throw Error("Username must not include spaces");

    const parsedBirthDate = parseDate(accountInformation.birthDate);
    if (!parsedBirthDate) throw Error("Invalid birth date format");

    if (!courseID) throw Error("Course ID must be provided");

    if (accountInformation?.passWord !== accountInformation?.confirmPassWord)
      throw Error("Passwords do not match");

    let affiliation = null;
    if (affiliationCode) {
      affiliation = await getAffiliationByCode(
        drivingSchoolCredentials.drivingSchoolID,
        affiliationCode
      );
      if (!affiliation) throw Error("Invalid affiliation code");
    }

    const [
      { Item: drivingSchool },
      { Item: student },
      { Item: course },
      activeSection
    ] = await Promise.all([
      getDrivingSchool(drivingSchoolCredentials.drivingSchoolID),
      getStudent(
        drivingSchoolCredentials.drivingSchoolID,
        accountInformation.userName
      ),
      getCourse(courseID),
      getActiveSection(drivingSchoolCredentials.drivingSchoolID)
    ]);

    if (!drivingSchool) throw Error("The driving school does not exist");
    if (student) throw Error("Username is already in use");
    if (!course) throw Error("Invalid course ID");
    if (!activeSection) throw Error("The driving school has no active section");

    const { finalChargeAmount } = await getFinalChargeAmount(
      couponCode,
      drivingSchoolCredentials.drivingSchoolID,
      course.coursePrice
    );

    if (paymentMethod !== "stripe") {
      if (
        !drivingSchoolCredentials?.paymentLogInKey ||
        !drivingSchoolCredentials?.paymentTransactionKey
      )
        throw Error("Driving school payment information is required");

      if (finalChargeAmount > 0) {
        const { cardNumber, cardCode, cardExpiration } = cardInformation || {};

        if (!cardNumber || !cardCode || !cardExpiration) {
          throw Error("Card information must be complete");
        }

        if (requiredBillingInfo.some((field) => !billingInformation?.[field]))
          throw Error("Billing information must be complete");
      }
    }

    res.status(200).json({ message: "Student can be enrolled" });
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

export default validateStudentEnrollment;
