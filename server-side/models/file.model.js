import mongoose from "mongoose";

const { Schema } = mongoose;

// The schema for the file model
const fileSchema = new Schema(
    {
        file_key: { type: String, required: true, trim: true }, // The file key after S3 file upload is done
        file_mimetype: { type: String, required: true, trim: true }, // The mimetype helps download the correct filetype later
        file_location: { type: String, required: true, trim: true }, // The URL to download the file, provided after AWS S3 file upload is done
        file_name: { type: String, required: true, trim: true }, // The original name of the file that has been uploaded, without the date-time prefix
    },
    {
        timestamps: true, // Automatically create `createdAt` and `updatedAt` fields
    }
);

// Set the Time-to-Live (TTL) to 15 days to remove the document and save space in the MongoDB database
fileSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 * 24 * 15 });

const File = mongoose.model("File", fileSchema);

export default File;
