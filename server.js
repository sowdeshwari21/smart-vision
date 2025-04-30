import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";
import cors from "cors";
import axios from "axios";
import translate from 'google-translate-api-x';
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import Image from "./model/imageModel.js";

// Load environment variables
dotenv.config();

const app = express();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // You'll need to add this to your .env
    api_key: process.env.CLOUDINARY_API,
    api_secret: process.env.CLOUDINARY_SECRET
});

// MongoDB Connection
const db = process.env.MONGO_URL;
mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log("Connected to MongoDB successfully");
})
.catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the process if MongoDB connection fails
});

// Add connection event listeners
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Configure CORS with specific options
app.use(cors({
    origin: 'http://localhost:5173', // Vite's default port
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Configure multer with larger limits and better error handling
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
        files: 1 // Only allow one file
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Add error handling middleware for multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
        }
    }
    next(err);
});

// Add a longer timeout for the server
app.use((req, res, next) => {
    res.setTimeout(120000); // 2 minute timeout for long OCR operations
    next();
});

// Add new endpoint to get latest image data
app.get("/latest-image", async (req, res) => {
    try {
        const latestImage = await Image.findOne()
            .sort({ createdAt: -1 })
            .limit(1);
        
        if (!latestImage) {
            return res.status(404).json({ error: "No images found" });
        }

        res.json(latestImage);
    } catch (error) {
        console.error("Error fetching latest image:", error);
        res.status(500).json({ error: "Error fetching latest image" });
    }
});

// Add new endpoint to get latest image data (for client compatibility)
app.get("/latest", async (req, res) => {
    try {
        const latestImage = await Image.findOne()
            .sort({ createdAt: -1 })
            .limit(1);
        
        if (!latestImage) {
            return res.json({ success: false, message: "No images found" });
        }

        res.json({ 
            success: true, 
            imageData: latestImage
        });
    } catch (error) {
        console.error("Error fetching latest image via /latest endpoint:", error);
        res.status(500).json({ 
            success: false, 
            error: "Error fetching latest image" 
        });
    }
});

// Update the translation endpoint
app.post('/translate', async (req, res) => {
    const { from_text, to_text } = req.body;
    if (!from_text || !to_text) {
        return res.status(400).json({ error: 'Both from_text and to_text are required.' });
    }
    try {
        const result = await translate(from_text, { to: to_text });
        return res.json({
            translated_text: result.text,
            detected_source_language: result.from.language.iso
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Translation failed.', details: error.message });
    }
});

// Update the summarize endpoint
app.post('/summarize', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ 
                error: 'Text is required for summarization' 
            });
        }

        // Split text into sentences
        const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
        
        // Calculate word frequency
        const wordFrequency = {};
        sentences.forEach(sentence => {
            const words = sentence.toLowerCase().split(/\s+/);
            words.forEach(word => {
                if (word.length > 3) { // Ignore short words
                    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                }
            });
        });

        // Calculate sentence scores based on word frequency
        const sentenceScores = sentences.map(sentence => {
            const words = sentence.toLowerCase().split(/\s+/);
            let score = 0;
            words.forEach(word => {
                if (wordFrequency[word]) {
                    score += wordFrequency[word];
                }
            });
            return { sentence, score };
        });

        // Sort sentences by score and take top 30%
        const summaryLength = Math.max(1, Math.floor(sentences.length * 0.3));
        const summary = sentenceScores
            .sort((a, b) => b.score - a.score)
            .slice(0, summaryLength)
            .map(item => item.sentence)
            .join('. ');

        res.status(200).json({
            message: 'Text summarized successfully',
            summary: summary + '.',
            originalLength: text.length,
            summaryLength: summary.length,
            reductionPercentage: ((text.length - summary.length) / text.length * 100).toFixed(2)
        });

    } catch (error) {
        console.error('Summarization error:', error);
        res.status(500).json({ 
            error: 'Error summarizing text', 
            details: error.message 
        });
    }
});

// Add a variable to track the latest upload timestamp
let lastUploadTimestamp = new Date().toISOString();

// Update the upload endpoint with Cloudinary integration
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image file provided" });
        }

        console.log("Processing uploaded image...");
        
        // Upload to Cloudinary
        const cloudinaryResponse = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "ocr_images",
                    resource_type: "auto"
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            uploadStream.end(req.file.buffer);
        });

        console.log("Image uploaded to Cloudinary");

        // Perform OCR
        const result = await Tesseract.recognize(
            req.file.buffer, 
            "eng", 
            {
                logger: progress => {
                    if (progress.status === 'recognizing text') {
                        console.log(`OCR Progress: ${(progress.progress * 100).toFixed(2)}%`);
                    }
                }
            }
        );
        
        console.log("OCR processing complete");
        
        // Calculate confidence
        let avgConfidence = 0;
        if (result.data.words && result.data.words.length > 0) {
            const totalConfidence = result.data.words.reduce((sum, word) => sum + word.confidence, 0);
            avgConfidence = totalConfidence / result.data.words.length;
        } else {
            avgConfidence = result.data.confidence || 0;
        }

        // Save to MongoDB
        const newImage = new Image({
            imageUrl: cloudinaryResponse.secure_url,
            extractedText: result.data.text,
            confidence: avgConfidence
        });

        await newImage.save();
        console.log("Data saved to MongoDB");
        
        // Update last upload timestamp
        lastUploadTimestamp = new Date().toISOString();
        
        res.json({ 
            text: result.data.text,
            confidence: avgConfidence,
            imageUrl: cloudinaryResponse.secure_url,
            timestamp: lastUploadTimestamp
        });
    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).json({ 
            error: "Error processing image",
            details: error.message 
        });
    }
});

// Add a new endpoint to check for new uploads
app.get("/check-upload-trigger", (req, res) => {
    res.json({ 
        lastUploadTimestamp,
        success: true
    });
});

const __dirname = dirname(fileURLToPath(import.meta.url));
  app.use(express.static(path.resolve(__dirname, "./public")));
  
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "./public", "index.html"));
  });

// Remove the previous __dirname declaration and static serving code

// const __dirname = dirname(fileURLToPath(import.meta.url));

// // Add more specific static file serving configuration
// const publicPath = path.join(__dirname, 'public');
// app.use(express.static(publicPath));

// Add error handling for static files
app.use((err, req, res, next) => {
    console.error('Static file error:', err);
    next(err);
});

// Update the catch-all route with error handling
// app.get("*", (req, res) => {
//     const indexPath = path.join(__dirname, 'public', 'index.html');
//     res.sendFile(indexPath, (err) => {
//         if (err) {
//             console.error('Error sending index.html:', err);
//             res.status(500).send('Error loading page');
//         }
//     });
// });

// Move the listen call to the end
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
