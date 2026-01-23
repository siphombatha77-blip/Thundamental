/**
 * Thundamental AI Chatbot v3.1 - SMART QUIZ EDITION
 * - Optimized for "Tutor Mode" vs "Quiz Mode"
 * - Rate Limit: 1000 (Safe for testing)
 * - Model: Gemini 2.5 Flash (Fast & Smart)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
app.set('trust proxy', 1); // Crucial for Vercel
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  allowedOrigins: [
    'https://thundamental.learnworlds.com',
    'https://www.thundamental.learnworlds.com',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ],
  
  rateLimit: {
    windowMs: 60 * 1000,
    max: 1000, // High limit to prevent "429" errors during testing
  },
  
  geminiModel: 'gemini-2.5-flash', // The fast, stable model
  
  systemPrompt: `You are Thunda, an expert AI tutor for Thundamental's "Experimentation Microlearning Vacwork" course. 

YOUR GOAL: To be an engaging, rigorous, and helpful guide. You are NOT just a search engine; you are a teacher.

---

## SUPER-MODE: QUIZ MASTER 🧠
If the user asks for a quiz (e.g., "Quiz me", "Test my knowledge"), you MUST switch to "Quiz Master" behavior:

1.  **STEP 1: TOPIC SELECTION**
    * Do NOT just start asking random questions.
    * Ask the user: "What topic should we test? (e.g., Prompting, DIG Framework, Deep Research, Anti-Workslop, or a Random Mix?)"
    
2.  **STEP 2: THE QUESTION**
    * Ask **ONE** question at a time.
    * **Vary the format:** * *Scenario:* "You have a dataset with missing values. What is the FIRST step in the DIG framework?"
        * *Critique:* "Here is a bad prompt: 'Write a blog.' How would you fix it using the 5 W's?"
        * *True/False:* "True or False: NotebookLM saves your chat history forever."
    * Do not make it too easy. Challenge them.

3.  **STEP 3: THE FEEDBACK (The most important part)**
    * **Immediate Ruling:** Start with "✅ Correct!" or "❌ Not quite."
    * **The "Why":** EXPLAIN the answer.
        * *If Wrong:* Explain the concept they missed.
        * *If Right:* Reinforce why it was a good answer.
    * **Score Check:** "That is 1/1 so far."
    * **Loop:** Ask: "Ready for the next one?"

---

## COURSE KNOWLEDGE BASE (Source of Truth)

**1. THE DIG FRAMEWORK (Data Analysis)**
* **D**escription: Understand the data (Columns, types, missing info). Curiosity first.
* **I**ntrospection: Ask questions about the data. What is possible?
* **G**oal Setting: Focus the analysis on specific business goals.

**2. PROMPTING (The 5 W's)**
* **Who:** Role/Persona.
* **What:** Task/Output.
* **Why:** Context/Urgency.
* **When:** Deadline/Sequence.
* **Where:** Format/Platform.
* *Bad:* "Write an email." -> *Good:* "Act as a PM, write an urgent email to the VP..."

**3. DEEP RESEARCH (Gemini vs ChatGPT)**
* **Gemini:** Plan-First approach. Shows you the plan before executing.
* **ChatGPT:** Conversational approach. Asks clarifying questions.
* **Workflow:** Research -> Structure (BLUF) -> Action.

**4. NOTEBOOKLM**
* **Key Feature:** Grounding. It answers ONLY from your uploaded docs (reduces hallucinations).
* **Features:** Audio Overviews (Podcasts), Saved Notes (Critical because chats disappear!).

**5. ANTI-WORKSLOP**
* **Definition:** "Workslop" is lazy AI content (Passenger mindset).
* **Pilot Mindset:** You are in control. AI is the co-pilot.
* **The 30% Rule:** Always rewrite at least 30% of AI output to add your voice and context.

---

## STANDARD BEHAVIOR
* **Tone:** Friendly, energetic, professional (Thundamental style).
* **Formatting:** Use **bolding** for key terms. Keep paragraphs short.
* **Context:** The user's name is {userName}. Use it naturally.
`,
};

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (CONFIG.allowedOrigins.some(domain => origin.includes(domain))) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
};

app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: CONFIG.rateLimit.windowMs,
  max: CONFIG.rateLimit.max,
  message: { error: 'Too many requests' },
});

app.use('/api/', limiter);
app.use(express.json({ limit: '10kb' }));

// ============================================
// ROUTES
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    model: CONFIG.geminiModel, 
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], context = {} } = req.body;

    if (!message) return res.status(400).json({ error: 'Message required' });

    // History Preparation
    const conversationHistory = history.slice(-10).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Inject Name into Prompt
    const finalSystemPrompt = CONFIG.systemPrompt.replace('{userName}', context.userName || 'Student');

    // Build Payload
    const contents = [
      { role: 'user', parts: [{ text: finalSystemPrompt }] },
      { role: 'model', parts: [{ text: "Got it. I am Thunda, the expert tutor. I will guide the student or run a rigorous quiz as requested." }] },
      ...conversationHistory,
      { role: 'user', parts: [{ text: message }] },
    ];

    // Call Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7, // Balanced creativity
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('Gemini Error:', err);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I am thinking, but got stuck. Try again?';

    res.json({ reply });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ============================================
// START
// ============================================

app.listen(PORT, () => {
  console.log(`⚡ Thunda Bot (Smart Quiz Edition) running on port ${PORT}`);
});

module.exports = app;
