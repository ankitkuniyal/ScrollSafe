import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'node:dns';
import factCheckRoutes from './routes/factCheckRoutes.js';
import { loadEmbeddingModel } from './services/embeddingService.js';

// Set DNS to prefer IPv4 (fixes many ConnectTimeoutError issues on Mac/Node)
dns.setDefaultResultOrder('ipv4first');

// Initialize env vars from .env file
dotenv.config();

const app = express();
app.use(cors()); // Allow requests from any origin (e.g. the browser extension)
app.use(express.json()); // Parse incoming JSON request bodies

// Pre-load the local embedding AI model asynchronously
loadEmbeddingModel();

app.get("/", (req, res) => {
    res.send("Welcome to ScrollSafe Backend API");
});

// Map routes using the Fact Check Router
app.use('/api/fact-check', factCheckRoutes);

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 ScrollSafe Backend API is running on http://localhost:${PORT}`);
});
