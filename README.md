<p align="center">
  <img src="frontend/public/favicon.svg" alt="ScrollSafe Logo" width="96" height="96" />
</p>

# ScrollSafe

> [!NOTE]
> For a detailed architectural breakdown of fact-checking pipeline execution, AI models, vector search, and routing decisions, check out the [SRS System Requirements Specification](./SRS.md).

> [!WARNING]
> **API Configuration Notice**: ScrollSafe requires valid credentials for Google Gemini (using model `gemini-3.1-flash-lite`), Qdrant Cloud Database, and SerpApi (Google Lens/News engine integration) to perform multi-modal verification. Please verify that your local `.env` files are configured appropriately (see Configuration).

**ScrollSafe** is a state-of-the-art fact-checking ecosystem that combines historical database records, real-time news retrieval, and multi-modal AI models to combat misinformation across text, images, audio, and video formats. It functions as a lightweight browser extension that provides premium on-page context overlays and in-depth report generation.

---

## 🚀 Key Features

*   **Multi-Modal AI Fact-Checking Ecosystem**: Integrates live news databases, historical records, and Google Generative AI to analyze text highlights, image metadata, audio recordings, and video feeds.
*   **Context Menu Trigger Integration**: Right-click text selections, images, or links to trigger analysis seamlessly via the native browser context menu, eliminating disruptive overlay buttons.
*   **Automated Audio Deepfake Preprocessor**: Transcribes audio uploads and runs vocal frequency checks to detect AI-generated voice synthesis and deepfake anomalies prior to fact-checking.
*   **Dynamic Video & YouTube Shorts Scanners**: Periodically scans the page DOM for YouTube Shorts, X (Twitter) media, and video frames, injecting customized floating analysis triggers.
*   **Dense Vector Embedding Pipeline**: Claims are vectorized locally on the server using a 384-dimensional native transformer model (`Xenova/all-MiniLM-L6-v2`) via `@xenova/transformers`.
*   **Hybrid Search Memory**: Queries vector databases (Qdrant) first; if a match of &ge; 85% is resolved, the system returns results instantly, saving API cost. Otherwise, it falls back to SerpApi (Google News engine) query parsing.
*   **Structured JSON Schema Output**: Constraints are strictly enforced on Gemini responses via JSON schemas, returning a solid verdict (`TRUE`, `FALSE`, or `UNCERTAIN`), a confidence score, and clear source references.
*   **Premium Glassmorphism UI**: Beautiful tailwind dashboards and overlay reports styled with premium translucent panels, custom layouts, and interactive confidence dials.

---

## 🛠️ Tech Stack

*   **Browser Extension**: Vanilla Javascript, CSS Glassmorphism, Manifest V3, Chrome APIs (Context Menus, Runtime Message, Storage)
*   **Backend Service**: Node.js, Express, Multer, dotenv, CORS
*   **Frontend App**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons, canvas-confetti
*   **AI Orchestration**: Google Gen AI SDK (`@google/genai` + `gemini-3.1-flash-lite`), Xenova Transformers (`all-MiniLM-L6-v2`)
*   **Database & Storage**: Qdrant Vector Cloud Database, Local Memory Caching
*   **Web Verification**: SerpApi (Google Lens & Google News Engine), Azure Translator API (Microsoft Cognitive Services)

---

## 📂 Project Architecture & Data Flows

### 1. System Architecture Diagram
This diagram illustrates the physical and logical layout of the ScrollSafe platform, mapping client interactions, middleware limits, routes, context resolution, knowledge retrieval, and third-party APIs:

```mermaid
graph TB
    subgraph Client_Side ["Client Side (Extension & Web UI)"]
        UI["User Interface (DOM Context Menu / Overlays)"]
        ExtBg["Extension Background Worker (background.js)"]
        ReactUI["Web UI Dashboard (React / Vite)"]
    end

    subgraph API_Gateway ["Backend API Gateway (Express Node.js)"]
        Router["Express Router (server.js)"]
        Routes["Fact-Check Routes (factCheckRoutes.js)"]
        T_MW["Translation Middleware (translationMiddleware.js)"]
        A_MW["Audio Preprocessor (processAudioFactCheck)"]
        V_MW["Video Preprocessor (processVideoFactCheck)"]
        Ctrl["Fact-Check Controller (processFactCheck)"]
    end

    subgraph Data_Layer ["Data Persistence & Local AI"]
        Embed["Local Embeddings (Transformers.js)"]
        Qdrant[("Qdrant Vector Database")]
    end

    subgraph External_APIs ["Third-Party External APIs"]
        GeminiAI["Google Gemini API (gemini-3.1-flash-lite)"]
        SerpLens["SerpApi: Google Lens Engine"]
        SerpNews["SerpApi: Google News Engine"]
        AzureTrans["Azure Translator API"]
    end

    %% Client and Router flows
    UI -->|1. Right-Click Context Menu Request| ExtBg
    ExtBg -->|POST /api/fact-check| Router
    ExtBg -->|POST /api/fact-check/audio| Router
    ExtBg -->|POST /api/fact-check/video| Router
    ReactUI -->|API Requests| Router

    %% Router routing
    Router --> Routes
    Routes -->|Text / Image / Link| T_MW
    Routes -->|Audio Upload| A_MW
    Routes -->|Video Upload / Url| V_MW

    %% Middleware details
    A_MW -->|Audio deepfake check & transcription| GeminiAI
    A_MW -->|Enriched claim payload| T_MW
    V_MW -->|Dialogue & visual summary| GeminiAI
    V_MW -->|Enriched claim payload| T_MW

    %% Translation
    T_MW -->|Ocp-Apim-Subscription-Key request| AzureTrans
    T_MW -->|Translated Claim| Ctrl

    %% Controller processing
    Ctrl -->|Resolve Image URLs| SerpLens
    Ctrl -->|Locally vectorize text| Embed
    Embed <--> Qdrant

    %% Fallbacks & Evaluation
    Ctrl -->|If DB similarity < 85%, search news| SerpNews
    Ctrl -->|Evaluate unified claim & evidence| GeminiAI

    %% Result back
    Ctrl -->|Verdict Response Payload| ExtBg
    ExtBg -->|Render Glassmorphic Card| UI
    ExtBg -->|Open full details| ReactUI

    %% Style definitions
    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,rx:8px,ry:8px,color:#0369a1;
    classDef auth fill:#faf5ff,stroke:#d8b4fe,stroke-width:2px,rx:8px,ry:8px,color:#6b21a8;
    classDef server fill:#f5f3ff,stroke:#c084fc,stroke-width:2px,rx:8px,ry:8px,color:#5b21b6;
    classDef database fill:#ecfdf5,stroke:#34d399,stroke-width:2px,rx:8px,ry:8px,color:#065f46;
    classDef external fill:#fff7ed,stroke:#fb923c,stroke-width:2px,rx:8px,ry:8px,color:#9a3412;
    
    class UI,ExtBg,ReactUI client;
    class GeminiAI auth;
    class Router,Routes,T_MW,A_MW,V_MW,Ctrl server;
    class Embed,Qdrant database;
    class SerpLens,SerpNews,AzureTrans external;
```

### 2. Data Flow Diagram (DFD Level 1)
This Data Flow Diagram tracks the movement of information across the boundaries between external entities, background processes, database layers, and final destinations:

```mermaid
graph LR
    subgraph Entities ["External Entities"]
        User["👤 End User / Web Page"]
        GeminiService["🧠 Google Gemini API"]
        SerpService["🔍 SerpApi Service"]
    end

    subgraph Process_Layer ["Data Flow Processes"]
        P1["1.0 Extract Selection & Media (Extension)"]
        P2["2.0 Route Request & Preprocess (Express Server)"]
        P3["3.0 Vectorize & Query Memory (Transformers + Qdrant)"]
        P4["4.0 Fetch Lens & News Context (SerpApi)"]
        P5["5.0 Orchestrate AI Reasoning (Gemini Client)"]
    end

    subgraph Data_Stores ["Data Stores"]
        DS1[("Qdrant: scrollsafe_claims")]
        DS2[("Extension Cache")]
    end

    %% Data Flow 1: Context Capture
    User -->|Text selection / Image URL / Audio upload / Video| P1
    P1 -->|Background messaging| P2
    P2 -->|Save/Lookup local cache| DS2

    %% Data Flow 2: In-Memory / Vector DB Lookup
    P2 -->|Generate Embedding| P3
    P3 -->|Vector Search| DS1
    DS1 -->|Top Similarity Results| P3

    %% Data Flow 3: External Search
    P3 -->|If similarity < 85%, search news| P4
    P4 -->|Request Lens or News| SerpService
    SerpService -->|Web page contexts & articles| P4

    %% Data Flow 4: Orchestrate Final AI
    P2 & P3 & P4 -->|Consolidated Evidence & Prompt| P5
    P5 -->|Evaluate Claim| GeminiService
    GeminiService -->|Structured JSON Verdict| P5

    %% Data Flow 5: Results UI
    P5 -->|Formatted Response| P1
    P1 -->|Glassmorphic Report Card| User

    %% Style definitions
    classDef entity fill:#fff7ed,stroke:#fb923c,stroke-width:2px,rx:8px,ry:8px,color:#9a3412;
    classDef process fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,rx:8px,ry:8px,color:#0369a1;
    classDef store fill:#ecfdf5,stroke:#34d399,stroke-width:2px,rx:8px,ry:8px,color:#065f46;
    
    class User,GeminiService,SerpService entity;
    class P1,P2,P3,P4,P5 process;
    class DS1,DS2 store;
```

### 3. Data Flow Diagram (DFD Level 2 - AI Processing Pipeline)
This Level 2 DFD decomposes **Process 5.0 (Orchestrate AI Reasoning)** to illustrate the detailed data routing, prompt construction, security checks, and response packaging:

```mermaid
graph TD
    %% Inputs
    ClaimContext["📝 Cleaned Claim Context"] --> P51["5.1 Build System Instruction Prompt"]
    EvidenceBlock["🗂️ Qdrant + Live News Context"] --> P51
    ImagePayload["🖼️ Base64 Image (Optional)"] --> P52["5.2 Invoke Gemini Multimodal Model"]

    %% Process 5.1
    P51 -->|Formatted Prompt| P52

    %% Process 5.2
    P52 -->|Raw Model Output| P53["5.3 Validate Structured JSON MimeType"]
    JSONSchema["📋 Verdict Response Schema"] --> P53

    %% Process 5.3
    P53 -->|Validation/Quota Error| P54["5.4 Handle Retry / Fallback"]
    P53 -->|Validation Success| P55["5.5 Package Fact Check Response"]

    %% Process 5.4
    P54 -->|Exponential Backoff or Default Response| P55

    %% Outputs of 5.5
    P55 -->|Response Payload| ExtBg["Extension background.js"]
    ExtBg -->|Render Result Card| UI["DOM Result Card"]
    ExtBg -->|Populate Details| Tab["detail.html Page"]

    %% Style definitions
    classDef input fill:#fff7ed,stroke:#fb923c,stroke-width:2px,rx:8px,ry:8px,color:#9a3412;
    classDef process fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,rx:8px,ry:8px,color:#0369a1;
    classDef external fill:#f5f3ff,stroke:#c084fc,stroke-width:2px,rx:8px,ry:8px,color:#5b21b6;
    
    class ClaimContext,EvidenceBlock,ImagePayload,JSONSchema input;
    class P51,P52,P53,P54,P55 process;
    class ExtBg,UI,Tab external;
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the `backend` directory and configure the following variables:

```env
# Google Gemini API Credentials
GEMINI_API_KEY="AIzaSyA-..."

# SerpApi API Credentials (For Google Lens & Google News)
SERPAPI_API_KEY="c16b87..."

# Azure Cognitive Services Translator Credentials (Optional fallback)
AZURE_TRANSLATOR_KEY="EbXsTx..."
AZURE_TRANSLATOR_REGION="centralindia"

# Qdrant Database Credentials (Defaults are supplied in code but configurable)
QDRANT_URL="https://..."
QDRANT_API_KEY="eyJ..."
```

---

## 🏃 Getting Started

### 1. Run the Backend Server
Navigate to the backend directory, install the required packages, and launch the Express endpoint:
```bash
cd backend
npm install
npm start
```
The server will boot up and load the local Embedding model asynchronously on `http://localhost:3000`.

### 2. Run the Frontend App
Navigate to the frontend directory, install the required packages, and run the development bundle:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173` (or the port specified in console) to view the detail report dashboard.

### 3. Load the Browser Extension
1. Open Google Chrome (or any Chromium browser) and navigate to `chrome://extensions/`.
2. Enable the **Developer Mode** toggle in the top-right corner.
3. Click the **Load unpacked** button in the top-left.
4. Select the `extension/` subdirectory within this repository.
5. Highlight any text on screen, right-click, and select **Check with ScrollSafe**!

---

## 📄 License
ScrollSafe is proprietary. All rights reserved.
