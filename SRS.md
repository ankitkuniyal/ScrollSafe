# Software Requirements Specification (SRS) - ScrollSafe

## 1. Introduction
### 1.1 Purpose
The purpose of this document is to provide a detailed description of the ScrollSafe project. It outlines the system's functional and non-functional requirements, architecture, and the technology stack utilized to build an AI-powered fact-checking ecosystem.

### 1.2 Scope
ScrollSafe is a multi-platform tool (Chrome Extension + Web Application) designed to combat misinformation. It enables users to verify claims in text, images, audio, and video formats in real-time by leveraging multi-modal AI models, historical vector databases, and live news verification.

## 2. Overall Description
### 2.1 Project Overview
ScrollSafe integrates several cutting-edge AI technologies to provide a high-confidence fact-checking platform. It doesn't just check text; it "sees" images, "hears" audio deepfakes, and "analyzes" video content on platforms like YouTube and X.

### 2.2 Technology Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide React (Icons), Framer Motion (Animations).
- **Backend**: Node.js, Express.js.
- **AI/ML**:
    - **Google Gemini (Gen-3 Flash)**: Primary engine for multi-modal context extraction and final reasoning.
    - **Transformers.js (Xenova)**: Local embedding generation (all-MiniLM-L6-v2).
    - **Qdrant**: Vector database for hyper-fast historical claim matching.
- **APIs**:
    - **SerpApi (Google Lens/News)**: Live web search and visual context extraction.
- **Extension**: Chrome Extension Manifest V3 (Vanilla JS, CSS).

## 3. System Architecture
ScrollSafe follows a modular architecture:
1.  **Injected UI (Extension)**: Floating glassmorphism buttons and cards injected into active tabs.
2.  **Background Processor**: Handles communication between the extension and the ScrollSafe API.
3.  **API Gateway**: Node.js server managing authentication, request routing, and orchestration.
4.  **AI Orchestrator**: Aggregates data from historical (Qdrant) and live (SerpApi) sources to generate a final AI verdict.

## 4. Functional Requirements
### 4.1 Feature Set
- **Text Fact-Checking**: Highlighting text and clicking the "Check with ScrollSafe" button.
- **Image Intelligence**: Right-click context menu for any image to trigger Google Lens + Gemini Vision analysis.
- **Audio Deepfake Detection**: Uploading audio files to detect AI-generated speech and transcribe content.
- **Video Analysis**: 
    - Dedicated buttons on YouTube Shorts, regular YouTube videos, and X (Twitter) videos.
    - Extracts visual and auditory claims to verify against live news.
- **Premium Reports**: Generating detailed logic summaries with confidence scores and source attributions.
- **Dark/Light Mode**: Full theme customization across web and extension interfaces.

### 4.2 User Workflow
1.  User triggers a check (Selecting text / Clicking video button / Uploading file).
2.  System extracts context (OCR, Vision, Transcription, or Vector Search).
3.  System checks Qdrant for historical matches.
4.  If no high-confidence match, system fetches breaking news from SerpApi.
5.  Gemini synthesizes all evidence into a "True/False/Uncertain" verdict.
6.  User receives a glassmorphism report card with a link to a full detailed report.

## 5. Non-Functional Requirements
- **Performance**: Highlighting-to-result latency should be < 3 seconds for text claims.
- **Scalability**: Backend should handle concurrent AI requests using asymmetric processing.
- **Usability**: "Aesthetics-First" design with a premium, state-of-the-art feel.
- **Accuracy**: Verdicts must cite real-world sources and avoid AI hallucinations via strict prompting of evidence.

## 6. Document History
| Version | Date | Description |
| :--- | :--- | :--- |
| v1.0 | 2026-04-18 | Initial SRS draft for ScrollSafe Ecosystem |
