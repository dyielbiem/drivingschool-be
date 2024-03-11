import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../../s3_connection/s3Client.js";

/*
---- Controller to generate pre-signed URL for course image upload
---- /api/admin/s3/pre-signed-url/course/put (GET)
*/
const generateCourseImageSignedURL = async (req, res) => {
  try {
    const { courseID } = req.query;
    if (!courseID) throw Error("Course ID must be provided");

    const command = new PutObjectCommand({
      Bucket: process.env.IMAGES_BUCKET,
      Key: `image/course/${courseID}`
    });

    const preSignedURL = await getSignedUrl(s3Client, command, {
      expiresIn: 600
    });

    res.status(200).json({
      preSignedURL,
      imageKey: `course/${courseID}`
    });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default generateCourseImageSignedURL;
