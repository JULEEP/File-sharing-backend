import express from "express"; // express framework to build the application
import mongoose from "mongoose"; // mongoose ODM to handle mongoDB documents
import cors from "cors"; // package to avoid CORS errors
import path from "path"; // to handle static files' path for deploying the app
import dotenv from "dotenv"; // package to handle environment vars

// configure dotenv to read the .env file
dotenv.config();

// configure the express app to use JSON and CORS()
const app = express();
app.use(cors()); 
app.use(express.json());

// configure the port for the server
const PORT = process.env.PORT || 5000;

const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
      });
      console.log("MongoDB connection has been established");
    } catch (error) {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1); // Exit the process with failure
    }
  };

// Call the MongoDB connection function
connectDB();

// configure the routes
import fileRouter from "./routes/file.route.js"; // use ES6 import for the file route
app.use("/api/file", fileRouter);

// Serve the static frontend files if in production
if (process.env.NODE_ENV === "production") {
  // set a static folder
  const __dirname = path.resolve(); // to get the current directory in ES6
  app.use(express.static(path.join(__dirname, "build")));

  // Provide a wildcard as a fallback for all routes
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "build", "index.html"));
  });
}

// Start the server and listen on the designated port
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
