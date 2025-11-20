# Biblia AI 🕊️

Biblia AI is a specialized scripture retrieval-augmented generation (RAG) assistant designed for theological study and clarity. It leverages Google's Gemini 2.5 Flash model to provide accurate, citation-focused answers to biblical questions with a focus on context and application.

## Features

- **Scripture-First Analysis**: Prioritizes direct Bible citations (Book Chapter:Verse) for every theological claim, ensuring answers are grounded in text.
- **Multi-Version Context**: seamless switching between ESV, KJV, NIV, and NASB translation contexts to explore nuances in wording.
- **Voice Input**: Integrated speech recognition allows users to ask questions naturally.
- **Resilient Offline Mode**:
  - Automatically detects network status.
  - Queues messages sent while offline.
  - Auto-syncs when connectivity is restored.
- **Bookmarking System**: Save impactful theological insights or verse explanations to a dedicated sidebar for later reflection.
- **Conversation Summarization**: Generate concise, bulleted theological summaries of long chat sessions using AI.
- **Refined Aesthetics**: A distraction-free interface built with `Crimson Pro` serif typography and parchment-inspired colors suited for reading.

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI Integration**: Google GenAI SDK (`@google/genai`)
- **Icons**: Lucide React
- **Markdown**: React Markdown (custom blockquote styling for scriptures)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Google Gemini API Key obtained from Google AI Studio

### Installation

1. Clone the project.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment:
   - Ensure `process.env.API_KEY` is available to the build (e.g., via a `.env` file or environment variables).
   ```env
   API_KEY=your_actual_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage Guide

1. **Ask a Question**: Type or speak queries like *"What does the Bible say about anxiety?"* or *"Explain the parable of the Sower."*
2. **Change Version**: Use the dropdown in the header to change the AI's reference text (e.g., KJV for traditional wording).
3. **Summarize**: Click the document icon in the header to get a high-level summary of the theological points discussed so far.
4. **Bookmark**: Click the bookmark ribbon on any message to save it. Access saved items via the folder icon in the header.

## License

MIT