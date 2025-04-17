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

// Translation endpoint
app.post('/translate', async (req, res) => {
    try {
        const { targetLang } = req.body;
        
        if (!targetLang) {
            return res.status(400).json({ error: 'Target language is required' });
        }

        // Get the latest image data from MongoDB
        const latestImage = await Image.findOne().sort({ createdAt: -1 });
        
        if (!latestImage) {
            return res.status(404).json({ error: 'No images found in database' });
        }

        console.log('Original text:', latestImage.extractedText);
        console.log('Target language:', targetLang);

        // Use Google Translate API
        const translation = await translate(latestImage.extractedText, {
            to: targetLang,
            from: 'auto'
        });

        console.log('Translation successful:', translation);

        res.json({
            translatedText: translation.text,
            from: translation.from.language.iso,
            engine: 'Google Translate'
        });
    } catch (error) {
        console.error('Translation error:', error);
        
        // Fallback to dictionary translation if Google Translate fails
        try {
            const latestImage = await Image.findOne().sort({ createdAt: -1 });
            if (!latestImage) {
                throw new Error('No images found in database');
            }

            const translation = await translate(latestImage.extractedText, {
                to: req.body.targetLang,
                from: 'auto',
                fallback: true
            });

            console.log('Fallback translation successful:', translation);

            res.json({
                translatedText: translation.text,
                from: translation.from.language.iso,
                engine: 'Dictionary Fallback'
            });
        } catch (fallbackError) {
            console.error('Fallback translation error:', fallbackError);
            res.status(500).json({ error: 'Translation failed' });
        }
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

// Modified summarize endpoint to work with latest image text
app.post("/summarize", async (req, res) => {
    try {
        // Get the latest image data
        const latestImage = await Image.findOne()
            .sort({ createdAt: -1 })
            .limit(1);
        
        if (!latestImage) {
            return res.status(404).json({ error: "No images found to summarize" });
        }

        const text = latestImage.extractedText;
    console.log("Received summarization request for text of length:", text.length);
    
        // Simple validation
        if (text.length < 10) {
            return res.status(400).json({ 
                error: "Text too short to summarize",
                summary: text,
                imageUrl: latestImage.imageUrl,
                confidence: latestImage.confidence,
                createdAt: latestImage.createdAt
            });
        }
        
        // Split text into sentences with more robust regex
        const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
        
        console.log(`Text contains ${sentences.length} sentences`);
        
        if (sentences.length <= 3) {
            console.log("Text is already concise, returning original");
            return res.json({ 
                summary: text,
                imageUrl: latestImage.imageUrl,
                confidence: latestImage.confidence,
                createdAt: latestImage.createdAt
            });
        }
        
        // Score sentences
        const scoredSentences = sentences.map((sentence, index) => {
            const cleanSentence = sentence.trim().replace(/\s+/g, " ");
            
            const positionScore = (index === 0 || index === sentences.length - 1) ? 2 : 
                                 (index < 3) ? 1.5 : 1;
            
            const words = cleanSentence.split(/\s+/).length;
            const lengthScore = (words > 5 && words < 25) ? 1.5 : 
                              (words <= 5) ? 0.8 : 1;
            
            const importantWords = ["important", "significant", "key", "main", "crucial", "essential", 
                                  "primary", "critical", "vital", "necessary", "fundamental"];
            const containsImportantWord = importantWords.some(word => 
                cleanSentence.toLowerCase().includes(word)
            );
            const importanceScore = containsImportantWord ? 1.7 : 1;
            
            const totalScore = positionScore * lengthScore * importanceScore;
            
            return { sentence: cleanSentence, score: totalScore, originalIndex: index };
        });
        
        const sortedSentences = [...scoredSentences].sort((a, b) => b.score - a.score);
        const summaryLength = Math.max(2, Math.min(Math.ceil(sentences.length * 0.3), 5));
        const topSentences = sortedSentences.slice(0, summaryLength);
        
        const orderedSummary = topSentences
            .sort((a, b) => a.originalIndex - b.originalIndex)
            .map(item => item.sentence)
            .join(" ");
        
        console.log("Summarization complete: Original", text.length, "chars →", orderedSummary.length, "chars");
        
        res.json({ 
            summary: orderedSummary,
            originalLength: text.length,
            summaryLength: orderedSummary.length,
            compressionRate: Math.round((1 - orderedSummary.length / text.length) * 100),
            imageUrl: latestImage.imageUrl,
            confidence: latestImage.confidence,
            createdAt: latestImage.createdAt
        });
    } catch (error) {
        console.error("Error during summarization:", error);
        
        try {
            const latestImage = await Image.findOne()
                .sort({ createdAt: -1 })
                .limit(1);
            
            const simpleSummary = latestImage.extractedText.split('.').slice(0, 3).join('.') + '.';
            console.log("Using basic fallback summarization");
            res.json({ 
                summary: simpleSummary,
                fallback: true,
                imageUrl: latestImage.imageUrl,
                confidence: latestImage.confidence,
                createdAt: latestImage.createdAt
            });
        } catch (fallbackError) {
            console.error("Even fallback summarization failed:", fallbackError);
            res.status(500).json({ 
                error: "Summarization failed",
                details: fallbackError.message
            });
        }
    }
});

// Add a new endpoint to check for new uploads
app.get("/check-upload-trigger", (req, res) => {
    res.json({ 
        lastUploadTimestamp,
        success: true
    });
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
