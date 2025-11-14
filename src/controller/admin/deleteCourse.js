import { updateCourseItem } from "../../utils/dbUtils/course.js";

/*
---- Controller to delete a course of a driving school
---- /api/admin/course (DELETE)
*/
const deleteCourse = async (req, res) => {
  try {
    const { courseID } = req.query;
    if (!courseID) throw Error("Course ID must be provided");

    await updateCourseItem(courseID, { ":isDeleted": true });

    return res.status(200).json({
      message: "Course has been deleted"
    });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Course does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default deleteCourse;
