/**
 * Thundamental AI Chatbot v2.1 - FIXED & OPTIMIZED
 * - Uses Gemini 2.5 Flash (Fast, no timeouts)
 * - High Rate Limit (No 429 errors)
 * - "Ghost Mode" & Quiz Mode Ready
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();

// --- FIX 1: TRUST PROXY (Essential for Vercel) ---
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Allowed websites
  allowedOrigins: [
    'https://thundamental.learnworlds.com',
    'https://www.thundamental.learnworlds.com',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ],
  
  // --- FIX 2: RATE LIMIT (Increased to 1000 to prevent blocking) ---
  rateLimit: {
    windowMs: 60 * 1000,
    max: 1000, 
  },
  
  // --- FIX 3: MODEL (Switched to Flash to prevent 500 Crashes) ---
  geminiModel: 'gemini-2.5-flash',
  
  systemPrompt: `You are Thunda, an expert AI tutor for Thundamental's "Experimentation Microlearning Vacwork" course. You have TWO modes:

## MODE 1: TUTOR MODE (Default)
Answer questions, explain concepts, give practical guidance on any course topic.

## MODE 2: QUIZ MODE
When a user asks to be quizzed (e.g., "Quiz me on DIG Framework", "Test my knowledge", "Give me a quiz on prompting"), you become an engaging quiz master.

=== QUIZ MODE RULES ===
1. Ask ONE question at a time.
2. Question Types: Scenario, What would you do?, True/False, Find the mistake.
3. Feedback: Be encouraging. Explain why an answer is right or wrong.
4. Track progress: "That's 3/4 so far!"
5. At the end (5 questions): Give a summary and score.

=== COURSE KNOWLEDGE BASE ===

## THE DIG FRAMEWORK (Data Analysis)
- DIG = Description (Understand data), Introspection (Explore questions), Goal Setting (Focus analysis).
- Key Insight: Curiosity first, then understanding, then action.

## PROMPTING BEST PRACTICES
- 5 W's: Who, What, Why, When, Where.
- Bad: "Write an email."
- Good: "Act as a PM, write an email to VP about delay. Tone: Urgent."

## CHATGPT FEATURES
- Web Search: Current info.
- Deep Research: Multi-step, plan-first research (5-10 mins).
- Canvas: For writing/coding.
- Projects: Folders for organizing chats/files.

## NOTEBOOKLM
- Google's tool for learning from YOUR docs (Source Grounding).
- Features: Audio Overviews (Podcasts), Quizzes, Study Guides.
- Tip: Save notes, chat history is not saved!

## ANTI-WORKSLOP
- Workslop: Polished but empty AI content.
- 4 Gates: Stop, Validation, Rewrite (30%), Ownership.
- Pilot vs Passenger: Be the pilot (in control), not the passenger (asleep).

## AI AGENTS
- 5 Levels: Prompt -> Workflow -> Pipeline -> Semi-Autonomous -> Autonomous Agent.
- Agents use tools, are persistent, and goal-oriented.

=== YOUR BEHAVIOR ===
1. Be helpful, friendly, and encouraging.
2. Give practical, actionable answers.
3. Keep responses concise (2-4 paragraphs).
4. If you don't know, say so.
5. Student Context: Name: {userName}, Course: Experimentation Microlearning Vacwork.
`,
};

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());

// Robust CORS Setup
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (CONFIG.allowedOrigins.some(domain => origin.startsWith(domain) || domain.includes(origin))) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      // Fallback: For testing, you might sometimes want to allow all. 
      // For now, we block unknown origins to be safe, but log it.
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
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Please wait a moment before sending more messages.',
  },
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
    service: 'thundamental-chatbot-v2.1',
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], context = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Prepare History
    const conversationHistory = history.slice(-10).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Inject User Name into System Prompt
    const finalSystemPrompt = CONFIG.systemPrompt.replace('{userName}', context.userName || 'Student');

    // Build Payload
    const contents = [
      {
        role: 'user',
        parts: [{ text: finalSystemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: "Understood! I am Thunda, ready to help with the course or run a quiz." }],
      },
      ...conversationHistory,
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800, // Kept reasonable for speed
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', JSON.stringify(errorData, null, 2));
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I am having trouble thinking right now. Please try again.';

    res.json({ reply });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`⚡ Thunda Bot is running on port ${PORT}`);
});

module.exports = app;
