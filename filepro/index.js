// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib'); // Import PDF-Lib for PDF manipulation
const fetch = require('node-fetch'); // For fetching the PDF
require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const { exec } = require('child_process');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json()); // Parse JSON data

// CORS Configuration
const corsOptions = {
  origin: '*',  // Allow all origins temporarily for debugging
  methods: ['GET', 'POST'],
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

    // Encode the PDF link to Base64
    const encodedPdfLink = encodeUrl(libraryView.pdf_link); // Encode to Base64
    res.status(200).send({ pdf_link: encodedPdfLink }); // Send the Base64 encoded link
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

// Endpoint: /getfetchdata

app.get("/getfetchdata", async (req, res) => {
  const origin = req.get("Origin");

  if (origin !== "https://coodecrafters.github.io") {
    return res.status(403).send({ error: "What are you trying to access?" });
  }

  try {
    const { isbn, prn_no } = req.query;

    if (!isbn || !prn_no) {
      return res.status(400).send({ error: "Both ISBN and PRN number are required" });
    }

    // Fetch profile
    const profile = await Profile.findOne({ prn_no });
    if (!profile) {
      return res.status(404).send({ error: "Profile not found" });
    }

    // Fetch library view
    const libraryView = await LibraryView.findOne({ isbn });
    if (!libraryView) {
      return res.status(404).send({ error: "Library view not found for the given ISBN" });
    }

    const pdfUrl = libraryView.pdf_link;

    // Fetch PDF as a binary buffer
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      console.error("Failed to fetch PDF file");
      return res.status(500).send({ error: "Failed to fetch the PDF file" });
    }

    // Load PDF in chunks
    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const watermarkText = prn_no;

    // Use a standard font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const watermarkOptions = {
      color: rgb(0.8, 0.8, 0.8),
      size: 7,
      rotate: degrees(45),
    };

    const maxWatermarks = 15;
    const chunkSize = Math.ceil(pages.length / 4); // Divide into 4 chunks

    for (let i = 0; i < pages.length; i += chunkSize) {
      const chunk = pages.slice(i, i + chunkSize);
      chunk.forEach((page) => {
        const { width, height } = page.getSize();
        const rows = Math.ceil(Math.sqrt(maxWatermarks));
        const cols = Math.ceil(maxWatermarks / rows);
        const xSpacing = width / cols;
        const ySpacing = height / rows;

        let count = 0;
        for (let row = 0; row < rows && count < maxWatermarks; row++) {
          for (let col = 0; col < cols && count < maxWatermarks; col++) {
            const xPos = xSpacing * col + 50;
            const yPos = ySpacing * row + 50;

            page.drawText(watermarkText, {
              x: xPos,
              y: yPos,
              font: font,
              size: watermarkOptions.size,
              color: watermarkOptions.color,
              rotate: watermarkOptions.rotate,
            });

            count++;
          }
        }
      });
    }

    const watermarkedPdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=watermarked.pdf");
    res.send(Buffer.from(watermarkedPdfBytes));
  } catch (error) {
    console.error("Error in /getfetchdata:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});

module.exports = app;

// Define the /heartbeat endpoint
app.get('/heartbeat', (req, res) => {
  res.status(200).send('Server is alive');
});
// Define the BookReview schema
const reviewSchema = new mongoose.Schema({
  isbn: {
    type: String,
    required: true,
    unique: true, // Ensure each ISBN is unique
  },
  reviews: [
    {
      comment: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now, // Automatically set the timestamp for each review
      },
    },
  ],
});

// Create the BookReview model
const BookReview = mongoose.model('BookReview', reviewSchema);

// Route for saving a review (POST)
app.post('/savereview', async (req, res) => {
  const { isbn } = req.query;  // Get ISBN from query string
  const { comment } = req.body;  // Get comment from request body
  // Validate the incoming request
  if (!isbn) {
    return res.status(400).json({ message: 'ISBN is required' });
  }

  if (!comment) {
    return res.status(400).json({ message: 'Comment is required' });
  }

  try {
    // Check if book review already exists for the ISBN
    let bookReview = await BookReview.findOne({ isbn });

    if (!bookReview) {
      // If no reviews exist for this ISBN, create a new entry
      bookReview = new BookReview({
        isbn,
        reviews: [{ comment }],
      });
    } else {
      // If reviews already exist, add a new review to the reviews array
      bookReview.reviews.push({ comment });
    }

    // Save the review to the database
    await bookReview.save();
    res.status(200).json({ message: 'Review saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving review' });
  }
});

// Endpoint to get reviews for a specific ISBN
app.get('/getreview', async (req, res) => {
  const { isbn } = req.query;

  // Validate ISBN query parameter
  if (!isbn) {
    return res.status(400).json({ message: 'ISBN is required' });
  }

  try {
    // Find the book review by ISBN
    const bookReview = await BookReview.findOne({ isbn });

    if (!bookReview) {
      return res.status(404).json({ message: 'No reviews found for this ISBN' });
    }

    // Return the reviews along with their timestamps
    res.status(200).json(bookReview.reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});


// Define Rating Schema inline (without a separate module)
const ratingSchema = new mongoose.Schema({
  isbn: { type: String, required: true },
  userId: { type: String, required: true }, // userId will be prn_no from sessionStorage
  rating: { type: Number, required: true, min: 1, max: 5 },
});

const Rating = mongoose.model('Rating', ratingSchema);

// 📌 Submit Rating Endpoint
app.post('/submitrating', async (req, res) => {
  try {
    const { isbn } = req.params;
    const { rating, userId } = req.body; // userId = prn_no from frontend sessionStorage

    if (!rating || !userId) {
      return res.status(400).json({ error: "Rating and userId (prn_no) are required." });
    }

    // Check if user already rated the book
    let existingRating = await Rating.findOne({ isbn, userId });

    if (existingRating) {
      existingRating.rating = rating;
      await existingRating.save();
      return res.json({ message: "Rating updated successfully" });
    } else {
      const newRating = new Rating({ isbn, userId, rating });
      await newRating.save();
      return res.json({ message: "Rating submitted successfully" });
    }
  } catch (error) {
    console.error("Error submitting rating:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 📌 Retrieve Rating Endpoint
app.get('/retrieverating', async (req, res) => {
  try {
    const { isbn } = req.params;
    const ratings = await Rating.find({ isbn });

    if (ratings.length === 0) {
      return res.json({ averageRating: 0, totalRatings: 0 });
    }

    // Calculate average rating
    const totalRatings = ratings.length;
    const sumRatings = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = sumRatings / totalRatings;

    res.json({ averageRating, totalRatings });
  } catch (error) {
    console.error("Error retrieving rating:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
