import { getDrivingSchool } from "../../utils/dbUtils/drivingSchool.js";

/*
---- Controller to check driving school Stripe secret key
---- /api/admin/driving-school/stripe/secret-key (GET)
*/
const checkDrivingSchoolStripeSK = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;

    const { Item: drivingSchool } = await getDrivingSchool(drivingSchoolID);

    res
      .status(200)
      .json({ hasStripeSecretKey: !!drivingSchool.stripeSecretKey });
  } catch (error) {
    console.log(JSON.stringify(error, null, 2)); // eslint-disable-line
    res.status(400).json({ error: error.message || error });
  }
};

export default checkDrivingSchoolStripeSK;
