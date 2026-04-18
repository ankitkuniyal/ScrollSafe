# ScrollSafe: Multi-Modal AI Fact-Checking Ecosystem

ScrollSafe is a state-of-the-art fact-checking platform that combines historical records, live news, and multi-modal AI to combat misinformation across text, images, audio, and video.

## 🚀 Features

- **Text Analysis**: Highlight any text on the web to instantly verify its authenticity.
- **Image Context**: "See" what an image is about using Google Lens and Gemini Vision.
- **Audio Deepfake Detection**: Analyze uploaded audio to detect AI-generated synthetic speech.
- **Video Fact-Checking**: Dedicated analysis for YouTube Shorts, standard videos, and X (Twitter) media.
- **Premium Glassmorphism UI**: A beautiful, non-intrusive extension interface with smooth animations.
- **Detailed Reports**: In-depth logic breakdowns with confidence scores and source attributions.

## 🛠️ Technology Stack

- **Extension**: Vanilla JavaScript, Manifest V3, CSS Glassmorphism.
- **Frontend**: React (Vite), Framer Motion, Tailwind CSS.
- **Backend**: Node.js, Express, Qdrant (Vector DB).
- **AI Models**: Google Gemini (Gen-3 Flash), Transformers.js (Local Embeddings).
- **External APIs**: SerpApi (Google Lens/News).

## 📦 Project Structure

- `extension/`: The Chrome extension source code.
- `frontend/`: The React-based web application.
- `backend/`: The Node.js server and AI orchestration logic.

## 🏁 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env # Add your API keys (GEMINI, SERPAPI, QDRANT)
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Extension Setup
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select the `extension/` folder in this repository.

## 📄 License
ScrollSafe is proprietary. All rights reserved.
