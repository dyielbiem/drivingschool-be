import { getAffiliationList } from "../../utils/dbUtils/affiliation.js";
import { getAffiliationStudentList } from "../../utils/dbUtils/student.js";

/*
---- Controller to fetch all the affiliations of a driving school
---- /api/admin/affiliation/list (GET)
*/
const fetchAllAffiliations = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;

    let affiliationList = await getAffiliationList(drivingSchoolID);
    affiliationList = (
      await Promise.all(
        affiliationList.map(async (item) => {
          const studentList = await getAffiliationStudentList(
            item.affiliationID
          );
          return {
            ...item,
            studentCount: studentList.length
          };
        })
      )
    ).sort((a, b) => b.affiliationID.localeCompare(a.affiliationID));

    res.status(200).json(affiliationList);
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllAffiliations;
