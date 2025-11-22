# IntelliDocs

**IntelliDocs** is an intelligent document analysis platform that transforms static PDFs into interactive conversations. Powered by Retrieval-Augmented Generation (RAG), it allows users to upload documents, extract insights, and verify facts using real-time web search.

## 🚀 Features

- **📄 Smart PDF Analysis**: Upload documents for automated text extraction, chunking, and vector embedding.
- **💬 Context-Aware Chat**: Ask questions and get accurate answers cited directly from your documents.
- **🌐 Hybrid Search**: Toggle "Web Search" to combine document context with live internet data for comprehensive answers.
- **⚡ Real-Time Streaming**: Experience instant feedback with typewriter-style streaming responses.
- **🔒 Secure & Persistent**: Robust authentication with session management and saved chat history.
- **🎨 Modern UI**: Fully responsive design with Dark/Light mode support and a custom PDF viewer.

## 🛠️ Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Backend:** Flask (Python), Celery (Async Workers)
- **Database:** PostgreSQL (Data), Redis (Queue), ChromaDB (Vectors)
- **AI Models:** Gemini 1.5 Pro/Flash, Sentence-Transformers

## 🏁 Getting Started

### Prerequisites
- Node.js
- Python
- Docker (for Database & Queue)

### 1. Infrastructure
Start the database and message broker:
```bash
docker-compose up -d db redis
```

### 2. Backend Setup
Navigate to the server directory:
```bash
cd app/server
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Update the `.env` file in `app/server/` with your credentials:
```env
FLASK_SECRET=dev-secret
POSTGRES_HOST=localhost
POSTGRES_DB=DB_NAME
POSTGRES_USER=username
POSTGRES_PASSWORD=password
REDIS_URL=URL
GEMINI_API_KEY=GEMINI_KEY
SERPER_API_KEY=SERPER_API
```

Run the API Server (Terminal A):
```bash
python app.py
```

Run the Celery Worker (Terminal B):
```bash
# Windows
celery -A tasks.celery worker --pool=solo --loglevel=info

# Mac/Linux
celery -A tasks.celery worker --loglevel=info
```

### 3. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend/app
```

Install dependencies:
```bash
npm install --legacy-peer-deps
```

Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to use the app.

## 📄 License

This project is licensed under the MIT License.