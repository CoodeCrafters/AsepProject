// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // For generating unique user IDs
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json()); // Parse JSON data

// CORS Configuration
const corsOptions = {
  origin: 'https://coodecrafters.github.io', // Allow only this origin
  methods: ['GET', 'POST'], // Allow only necessary methods
};
app.use(cors(corsOptions));

// MongoDB Atlas connection string
const mongoUri =
  'mongodb+srv://codecrafters:nn2R7uwl86Dhz5Y8@centrallibraryprofile.zw3fw.mongodb.net/CentralLibraryProfile?retryWrites=true&w=majority';

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

// Define Mongoose Schema
const profileSchema = new mongoose.Schema({
  name: String,
  branch: String,
  email_id: { type: String, unique: true }, // Ensure unique email
  prn_no: String,
  roll_no: String,
  div: String,
  contact_no: String,
  userId: { type: String, unique: true, default: uuidv4 }, // Auto-generate unique user ID
  createdTime: { type: Date, default: Date.now }, // Auto-set created date
});

// Create Mongoose Model
const Profile = mongoose.model('Profile', profileSchema);

// API Endpoint to save profile data
app.post('/saveProfile', async (req, res) => {
  try {
    const { name, branch, email_id, prn_no, roll_no, div, contact_no, userId, createdTime } = req.body;

    // Check if profile already exists
    const existingProfile = await Profile.findOne({ email_id });

    if (existingProfile) {
      // If email already exists, reject the request
      return res.status(409).send({ error: 'Email already exists. Profile not saved.' });
    }

    // Create a new profile if it doesn't exist
    const newProfile = new Profile({
      name,
      branch,
      email_id,
      prn_no,
      roll_no,
      div,
      contact_no,
      userId,
      createdTime,
    });

    await newProfile.save();
    res.status(201).send({
      message: 'Profile saved successfully!',
      userId: newProfile.userId,
      createdTime: newProfile.createdTime,
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).send({ error: 'Failed to save profile' });
  }
});

// API Endpoint to get profile data
app.get('/getProfile', async (req, res) => {
  const origin = req.get('Origin'); // Get the Origin header from the request

  // Check if the request is from the allowed origin
  if (origin !== 'https://coodecrafters.github.io') {
    return res.status(403).send({ error: "What are u trying to access, go to hell" });
  }

  try {
    const { email_id } = req.query;

    // Check if email_id is provided
    if (!email_id) {
      return res.status(400).send({ error: 'Email ID is required' });
    }

    // Find the profile by email_id
    const profile = await Profile.findOne({ email_id });

    if (!profile) {
      return res.status(404).send({ error: 'Profile not found' });
    }

    // Send the profile data in the response
    res.status(200).send({
      name: profile.name,
      branch: profile.branch,
      email_id: profile.email_id,
      prn_no: profile.prn_no,
      roll_no: profile.roll_no,
      div: profile.div,
      contact_no: profile.contact_no,
      userId: profile.userId,
      createdTime: profile.createdTime,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).send({ error: 'Failed to fetch profile' });
  }
});

// Define Mongoose Schema for LibraryView (to store PDF links)
const libraryViewSchema = new mongoose.Schema({
  isbn: { type: String, unique: true },
  pdf_link: String, // Store the link to the PDF
});

// Create Mongoose Model for LibraryView
const LibraryView = mongoose.model('LibraryView', libraryViewSchema);
// Function to encode URL to Base64
function encodeUrl(url) {
  return Buffer.from(url).toString('base64');
}

// Function to decode Base64 URL
function decodeUrl(encodedUrl) {
  return Buffer.from(encodedUrl, 'base64').toString('utf-8');
}


// API Endpoint to get PDF link by ISBN
app.get('/getLibraryView', async (req, res) => {
  const origin = req.get('Origin');

  if (origin !== 'https://coodecrafters.github.io') {
    return res.status(403).send({ error: "What are u trying to access, go to hell" });
  }

  try {
    const { isbn } = req.query;

    if (!isbn) {
      return res.status(400).send({ error: 'ISBN is required' });
    }

    const libraryView = await LibraryView.findOne({ isbn });

    if (!libraryView) {
      return res.status(404).send({ error: 'PDF link not found for this ISBN' });
    }

    const encodedPdfLink = encodeURIComponent(libraryView.pdf_link);
    res.status(200).send({ pdf_link: encodedPdfLink });
  } catch (error) {
    console.error('Error fetching PDF link:', error);
    res.status(500).send({ error: 'Failed to fetch PDF link' });
  }
});

// API Endpoint to save PDF URL with ISBN
app.post('/saveLibraryView', async (req, res) => {
  const { isbn, pdfLink } = req.body;

  // Check if ISBN and PDF link are provided
  if (!isbn || !pdfLink) {
    return res.status(400).send({ error: 'ISBN and PDF link are required' });
  }

  try {
    // Save PDF link as provided in the input (no encoding)
    const libraryView = new LibraryView({
      isbn,
      pdf_link: pdfLink, // Directly save the PDF link without encoding
    });

    await libraryView.save();
    res.status(201).send({ message: 'Library view saved successfully' });
  } catch (error) {
    console.error('Error saving library view:', error);
    res.status(500).send({ error: 'Failed to save library view' });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
