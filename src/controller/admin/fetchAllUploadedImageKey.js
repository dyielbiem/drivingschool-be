import { ListObjectsCommand } from "@aws-sdk/client-s3";
import s3Client from "../../s3_connection/s3Client.js";

/*
---- Controller to allow admin to upload image
---- /api/admin/s3/image/key/list (GET)
*/
const fetchAllUploadedImageKey = async (req, res) => {
  try {
    const command = new ListObjectsCommand({
      Bucket: process.env.IMAGES_BUCKET,
      Prefix: "image/"
    });

    const response = await s3Client.send(command);
    if (!response.Contents) return res.status(200).json({ imageKeys: [] });

    res
      .status(200)
      .json({ imageKeys: response.Contents.map((image) => image.Key) });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllUploadedImageKey;
