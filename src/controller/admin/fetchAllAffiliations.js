import { getAffiliationList } from "../../utils/dbUtils/affiliation.js";

/*
---- Controller to fetch all the affiliations of a driving school
---- /api/admin/affiliation/list (GET)
*/
const fetchAllAffiliations = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;

    const affiliationList = await getAffiliationList(drivingSchoolID);

    res.status(200).json(affiliationList);
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllAffiliations;
