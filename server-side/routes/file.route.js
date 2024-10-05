import { Router } from "express"; // to handle express routes
import multer from "multer"; // to handle file uploads in Node.js
import aws from "aws-sdk"; // to connect to the S3 bucket, we use the aws-sdk
import multerS3 from "multer-s3"; // to help deal with file upload to the S3 bucket
import File from "../models/file.model.js"; // The file model to create new models
import cloudinary from 'cloudinary'
import fileUpload from "express-fileupload"; // To handle file uploads
import dotenv from 'dotenv'

dotenv.config()
const router = Router(); // initialize the express router

// Route to upload a new file
// Configure Cloudinary with credentials from the environment variables
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
  });
  
  // Use express-fileupload middleware to handle file uploads
  router.use(
    fileUpload({
      useTempFiles: true, // Store files temporarily before processing
      tempFileDir: "/tmp/", // Temp directory for uploaded files
      limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    })
  );
  
  // Route to upload a new file to Cloudinary and store in File model
  router.post(
    "/upload",
    async (req, res) => {
      try {
        // Check if the file exists in the request
        if (!req.files || Object.keys(req.files).length === 0) {
          return res.status(400).json({ success: false, error: "No file uploaded" });
        }
  
        // Get the uploaded file from the request
        const uploadedFile = req.files.file;
  
        // Upload file to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(uploadedFile.tempFilePath);
  
        // Extract details from the uploaded file
        const file = new File({
          file_key: uploadResult.public_id, // Cloudinary file ID
          file_mimetype: uploadedFile.mimetype,
          file_location: uploadResult.secure_url, // File URL
          file_name: uploadedFile.name,
        });
  
        // Save the file details in the database
        await file.save();
  
        // Retrieve the saved file object from the DB
        const savedFile = await File.findOne({ file_key: uploadResult.public_id });
  
        // Send the saved file object as a response
        res.json(savedFile);
      } catch (err) {
        console.error("Error uploading file:", err);
        res.status(400).json(`Error: ${err}`);
      }
    },
    (error, req, res, next) => {
      if (error) {
        res.status(500).send(error.message);
      }
    }
  );
  
// Route to get a particular file object from the DB
router.get("/:id", async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json("File not found");
        }

        // Set the response content type to be the file's mimetype
        res.set({ "Content-Type": file.file_mimetype });

        // The params are required to access objects from the S3 bucket
        const params = {
            Key: file.file_key,
            Bucket: "easysharebucket",
        };

        s3.getObject(params, (err, data) => {
            if (err) {
                res.status(400).json(`Error: ${err}`);
            } else {
                // return the file object and actual file data from the S3 bucket
                res.json({ file, data });
            }
        });
    } catch (err) {
        res.status(400).json(`Error: ${err}`);
    }
});

// Route to delete all files from the DB (not from the S3 bucket)
router.delete("/", async (req, res) => {
    try {
        await File.deleteMany({});
        res.json("All files deleted");
    } catch (err) {
        res.status(400).json(`Error: ${err}`);
    }
});

// Export the router with all the configured routes
export default router;
