import Stripe from "stripe";

import { updateDrivingSchoolItem } from "../../utils/dbUtils/drivingSchool.js";
import { encrypt } from "../../utils/crypto.js";

/*
---- Controller to update driving school Stripe secret key
---- /api/admin/driving-school/stripe/secret-key (PATCH)
*/
const updateDrivingSchoolStripeSK = async (req, res) => {
  try {
    const { drivingSchoolID, secretKey } = req.body;
    if (!secretKey) throw Error("Secret key is required");

    const stripe = new Stripe(secretKey);
    await stripe.accounts.retrieve();

    const encryptedStripeSecretKey = encrypt(secretKey);

    await updateDrivingSchoolItem(drivingSchoolID, {
      ":stripeSecretKey": encryptedStripeSecretKey
    });
    res.status(200).json({ message: "Stripe secret key updated" });
  } catch (error) {
    console.log(JSON.stringify(error, null, 2)); // eslint-disable-line

    if (error.message?.includes?.("Invalid API Key provided")) {
      res.status(400).json({ error: "Invalid Stripe secret key" });
      return;
    }

    res.status(400).json({ error: error.message || error });
  }
};

export default updateDrivingSchoolStripeSK;
