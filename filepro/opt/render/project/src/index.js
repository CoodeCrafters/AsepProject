// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json()); // Parse JSON data
app.use(cors()); // Enable Cross-Origin Resource Sharing

// MongoDB Atlas connection string
const mongoUri = "mongodb+srv://codecrafters:n2R7uwl86Dhz5Y8@centrallibraryprofile.zw3fw.mongodb.net/CentralLibraryProfile?retryWrites=true&w=majority";

// Replace <db_password> with the actual password from MongoDB Atlas
mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));

// Define Mongoose Schema
const profileSchema = new mongoose.Schema({
  name: String,
  branch: String,
  email_id: String,
  prn_no: String,
  roll_no: String,
  div: String,
  contact_no: String,
});

// Create Mongoose Model
const Profile = mongoose.model("Profile", profileSchema);

// API Endpoint to save profile data
app.post('/saveProfile', async (req, res) => {
  try {
    const { name, branch, email_id, prn_no, roll_no, div, contact_no } = req.body;

    // Create a new profile instance
    const newProfile = new Profile({
      name,
      branch,
      email_id,
      prn_no,
      roll_no,
      div,
      contact_no,
    });

    // Save the profile to MongoDB
    await newProfile.save();

    res.status(201).send({ message: "Profile saved successfully!" });
  } catch (error) {
    res.status(500).send({ error: "Failed to save profile" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
