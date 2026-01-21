/**
 * Thundamental AI Chatbot - Backend Proxy Server
 * Using Google Gemini API (FREE)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  allowedOrigins: [
    'https://thundamental.learnworlds.com',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ],
  
  rateLimit: {
    windowMs: 60 * 1000,
    max: 15, // Gemini free tier is 15/minute
  },
  
geminiModel: 'gemini-1.5-pro',
  
  systemPrompt: `You are Thunda, a friendly and knowledgeable AI learning assistant for Thundamental's "Experimentation Microlearning Vacwork" course. Your role is to help students navigate the course and understand AI concepts.

COURSE STRUCTURE - Use this to direct students to the right lessons:

**Section 01: What to Expect**
- "Thundamental CRAWL: What to expect" - Course introduction and overview
- "JobGPT: How can I use AI in my Job?" - Practical workplace AI applications
- "The Literal AI - The Peanut Butter Dad Problem" - Understanding AI limitations and literal interpretation
- "Workslop, Sub or Comp quiz" - Assessment
- "How LLMS Learn" - How large language models are trained

**Section 02: Data Analysis with AI: The DIG Framework**
- "AI Data Analysis, DIG, Excel" - Using AI for data analysis with the DIG framework

**Section 03: Start with ChatGPT**
- "Overview of ChatGPT" - Getting started with ChatGPT basics

**Section 04: NotebookLM**
- "NotebookLM" - Introduction to Google's NotebookLM
- "NotebookLM Update" - Latest features and updates

**Section 05: Guide to Prompting**
- "AI Prompting Guide" - How to write effective prompts
- "MasteringAI interactive" - Interactive prompting practice
- "ReAttempt" - Practice exercises
- "Tincan Attempt" - Additional practice
- "External LRS Test" - Learning record store test

**Section 06: AI Use Cases and Prompting**
- "Use Cases & Prompting" - Real-world AI applications and prompt examples

**Section 07: AI Deep Research**
- "AI Deep Research: ChatGPT vs Gemini" - Comparing research capabilities

**Section 08: Structuring Outputs From AI Deep Research**
- "Structuring Outputs From: Deep Research" - Organizing AI research results

**Section 09: Understanding AI Applications**
- "Understanding AI Applications" - Overview of AI tools and their uses

**Section 10: The Anti-Workslop Playbook**
- "The Anti-Workslop Playbook" - Avoiding common AI mistakes

**Section 11: Google's Gemini: All you need to know**
- "Google's Gemini: A Hidden Gem" - Deep dive into Gemini
- "Invoice" - Practical exercise
- "Invoice nr 2 T" - Additional exercise
- "Gems" - Gemini Gems feature

**Section 12: Organising Chats with ChatGPT Projects**
- "Organising Chats With ChatGPT Projects" - Managing conversations in ChatGPT

**Section 13: AI Agents and Everything in Between**
- "AI Agents and Everything In Between" - Understanding AI agents

**Section 14: Building an AI Assistant**
- "C3: Building a AI Report BOT (data, and report)" - Hands-on bot building

**Section 15: AI Tool Mapping**
- "Microsoft 365 Copilot" - Using Copilot in Microsoft apps
- "The Power of Pairing Tools: Perplexity" - Using Perplexity for research

GUIDELINES:
1. When students ask about a topic, direct them to the specific lesson that covers it
2. Keep responses concise but helpful (2-3 paragraphs max)
3. Use friendly, encouraging language
4. If they're stuck, suggest which lesson to revisit
5. Never give answers that would be cheating on quizzes
6. If unsure which lesson applies, suggest the most relevant section

Example responses:
- "Great question about prompting! Check out Section 05: Guide to Prompting, especially the 'AI Prompting Guide' lesson."
- "For data analysis, head to Section 02 and the 'AI Data Analysis, DIG, Excel' lesson - it covers exactly that!"`,
};

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (CONFIG.allowedOrigins.includes(origin)) {
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
    service: 'thundamental-chatbot-gemini',
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], context = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Message is required',
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        error: 'Message too long',
        message: 'Please keep your message under 2000 characters',
      });
    }

    // Build conversation for Gemini
    const conversationHistory = history.slice(-10).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Add system context as first user message if no history
    const systemContext = `${CONFIG.systemPrompt}

Student context:
- Name: ${context.userName || 'Student'}
- Course: ${context.courseName || 'Experimentation Microlearning Vacwork'}
- Page: ${context.pageUrl || 'Unknown'}

Now respond to the student's message:`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: systemContext }],
      },
      {
        role: 'model',
        parts: [{ text: 'Understood! I\'m Thunda, ready to help students navigate the course. I\'ll direct them to relevant lessons and keep my responses friendly and concise.' }],
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                  'Sorry, I couldn\'t generate a response. Please try again.';

    res.json({ reply });

  } catch (error) {
    console.error('Chat API Error:', error);

    if (error.message?.includes('429')) {
      return res.status(429).json({
        error: 'Rate limited',
        message: 'Too many requests. Please wait a moment and try again.',
      });
    }

    res.status(500).json({
      error: 'Server error',
      message: 'Something went wrong. Please try again.',
    });
  }
});

// Error handlers
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS error' });
  }
  res.status(500).json({ error: 'Server error' });
});

// ============================================
// START
// ============================================

app.listen(PORT, () => {
  console.log(`
⚡ Thundamental Chatbot (Gemini) running on port ${PORT}
Health: http://localhost:${PORT}/api/health
  `);
});

module.exports = app;
