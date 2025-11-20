import { GoogleGenAI, Chat } from "@google/genai";
import { Message, BibleVersion } from "../types";

// Initialize the client
// process.env.API_KEY is guaranteed to be available by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatSession: Chat | null = null;

export const initializeChat = (version: BibleVersion = BibleVersion.ESV, history: Message[] = []): Chat => {
  // System instruction to simulate a RAG environment by strictly prioritizing retrieval and citation.
  const systemInstruction = `
    You are Biblia AI, a specialized assistant dedicated to Bible study and theological clarity.
    
    Your Goal: Answer user questions by retrieving and synthesizing relevant biblical texts.

    **Identity & Origins**:
    - You are Biblia AI.
    - If asked about your creation, model, or origin, state that you are Biblia AI, an assistant specialized in scripture analysis. 
    - Do NOT describe yourself as a generic language model trained by Google.
    
    Rules for Response:
    1. **Source of Truth**: Your primary data source is the Bible. Use the ${version} translation unless requested otherwise.
    2. **Citation First**: You MUST cite specific verses (Book Chapter:Verse) to support every theological claim or answer.
    3. **Format**:
       - Use Markdown.
       - Use > Blockquotes for direct scripture text.
       - Bold (**text**) the verse references.
    4. **Process**:
       - First, mentally "retrieve" the most relevant passages.
       - Present these passages clearly.
       - Explain the context and application.
    5. **Tone**: Scholarly, respectful, theological, and warm. Avoid denominational bias unless asked for a specific viewpoint (e.g., "What do Catholics believe about X?").
    
    Example Output Format:
    "Here is what the Bible says regarding [Topic]:
    
    > **John 3:16** "For God so loved the world..."
    
    This verse indicates that..."
  `;

  // Convert internal Message format to Gemini history format
  // Filter out streaming, empty, AND pending messages (offline queue)
  const formattedHistory = history
    .filter(msg => !msg.isStreaming && msg.content.trim() !== '' && msg.status !== 'pending')
    .map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.3, // Lower temperature for more accurate retrieval/quoting
    },
    history: formattedHistory
  });

  return chatSession;
};

export const sendMessageStream = async (
  message: string,
  onChunk: (text: string) => void
): Promise<void> => {
  if (!chatSession) {
    initializeChat();
  }

  const MAX_RETRIES = 3;
  const BASE_DELAY = 2000; // Start with 2 seconds delay
  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await chatSession!.sendMessageStream({ message });
      
      for await (const chunk of result) {
        // chunk is technically a GenerateContentResponse-like object in the new SDK iterator
        // but strict types might vary, safe to access .text
        const text = chunk.text;
        if (text) {
          onChunk(text);
        }
      }
      return; // Success, exit loop
    } catch (error: any) {
      lastError = error;
      
      // Check for retryable errors (503 Service Unavailable, 500 Internal Server Error, or "overloaded")
      const msg = error.message || '';
      const isRetryable = 
        msg.includes('503') || 
        msg.includes('500') || 
        msg.includes('overloaded') ||
        msg.includes('unavailable') ||
        error.status === 503 || 
        error.status === 500;

      if (!isRetryable || attempt === MAX_RETRIES) {
        break; // Don't retry if not retryable or max retries reached
      }

      const delay = BASE_DELAY * Math.pow(2, attempt); // 2s, 4s, 8s
      console.warn(`Gemini API service unavailable (attempt ${attempt + 1}/${MAX_RETRIES}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error("Error sending message to Gemini after retries:", lastError);
  throw lastError;
};

export const resetChat = () => {
  chatSession = null;
};

export const generateChatSummary = async (messages: Message[]): Promise<string> => {
  if (messages.length === 0) return "No conversation to summarize.";

  const conversationText = messages
    .filter(m => !m.isStreaming && m.status !== 'pending')
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  // Re-instantiate strict client for summary to avoid messing with chat history state
  const summaryAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await summaryAi.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Please provide a concise theological summary of the following conversation. 
        Focus on:
        1. The main questions asked.
        2. Key scripture verses referenced (citations only).
        3. The core spiritual or theological conclusions reached.
        
        Format the output as a clean Markdown summary with bullet points.
        
        Conversation:
        ${conversationText}
      `
    });
    return response.text || "Could not generate summary.";
  } catch (error: any) {
    console.error("Summary generation failed:", error);
    throw error;
  }
};