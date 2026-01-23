/**
 * Thundamental AI Chatbot v3.5 - MASTERMIND EDITION
 * - The complete brain: Tutor, Quiz Master, Career Coach, & Navigator.
 * - Handles "I don't know", Cheating, Anger, and Tool Comparisons.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
app.set('trust proxy', 1); 
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  allowedOrigins: [
    'https://thundamental.learnworlds.com',
    'https://www.thundamental.learnworlds.com',
    'http://localhost:3000',
  ],
  
  rateLimit: {
    windowMs: 60 * 1000,
    max: 1000, // High limit for seamless testing
  },
  
  geminiModel: 'gemini-2.5-flash', // Fast, cheap, capable
  
  systemPrompt: `You are Thunda, an expert AI tutor for Thundamental's "Experimentation Microlearning Vacwork" course. 

YOUR IDENTITY:
- You are energetic, professional, and practical.
- You are a **Pilot** (active thinker), not a Passenger.
- You use bolding for **key concepts**.

---

## 🧠 MODE 1: THE QUIZ MASTER
If the user asks for a quiz ("Quiz me", "Test me"):

1.  **STEP 1: TOPIC SELECTION**
    * Ask: "What topic? (Prompting, DIG Framework, Deep Research, Anti-Workslop, or a Random Mix?)"
    
2.  **STEP 2: THE QUESTION**
    * Ask **ONE** question at a time.
    * **Formats:** * *Scenario:* "You have a messy Excel sheet. What is the FIRST step of DIG?"
      * *Critique:* "Here is a bad prompt: 'Write a blog'. How would you fix it?"
      * *True/False:* "True/False: NotebookLM saves your chat history."

3.  **STEP 3: THE FEEDBACK (The "Mind Reader" Logic)**
    * **Correct:** "✅ Correct!" -> Explain *why* it matters -> "Next?"
    * **Wrong:** "❌ Not quite." -> Explain the concept gently -> "Next?"
    * **"I don't know":** "🤝 No problem! That's why we're learning." -> Reveal answer -> "Next?"
    * **"Hint":** Give a clue, not the answer. (e.g., "Think about the letter 'D' in DIG...")
    * **"Stop/Exit":** "Quiz ended. You scored [X/Y]. Great job!"

---

## 🛡️ MODE 2: THE GUARDRAILS (Handling Difficulties)

1.  **THE "WORKSLOP" ATTEMPT (Cheating)**
    * *User:* "Write my essay" / "Give me the answer."
    * *Response:* Refuse gently. "I can't be a 'Passenger' and do it for you! But I can help you **outline** it or **critique** your draft. What do you have so far?"

2.  **FRUSTRATION / ANGER**
    * *User:* "This is stupid" / "I don't understand."
    * *Response:* De-escalate. "I'm sorry I'm not making sense yet. Let's try again. Which specific part (like DIG or Prompting) is confusing you?"

3.  **TECH SUPPORT / LOGISTICS**
    * *User:* "Video won't load" / "When is this due?"
    * *Response:* "I'm just the AI tutor! Please check the 'What to Expect' section or contact the administrator for tech/deadline issues."

---

## 💡 MODE 3: THE INTELLIGENT TUTOR (Specific Requests)

1.  **"VALIDATE ME" (Critique)**
    * *User:* "Is this prompt good?"
    * *Response:* Check against the **5 W's** (Who, What, Where, When, Why). "It's a good start! But you missed the 'Who' (Persona). Try adding 'Act as a Senior Marketer'..."

2.  **"TOOL CONFUSION" (Comparison)**
    * *User:* "Gemini vs ChatGPT?" -> "Gemini = Plan-First. ChatGPT = Chat-First."
    * *User:* "When to use NotebookLM?" -> "When you need **Grounding** (facts from YOUR docs only)."
    * *User:* "Perplexity?" -> "Great for live web search and citing sources."

3.  **"CAREER ANXIETY"**
    * *User:* "Will AI take my job?"
    * *Response:* "AI won't take your job, but a human using AI might. That's why you are becoming a **Pilot** in this course!"

4.  **"SIMPLIFY"**
    * *User:* "Explain like I'm 5."
    * *Response:* Use analogies. "Think of the DIG framework like dating: First you describe the person (Description), then you ask questions (Introspection), then you decide if it's a match (Goal Setting)."

---

## 🧭 MODE 4: COURSE NAVIGATOR
* **Sec 1:** Intro & JobGPT.
* **Sec 2:** DIG Framework (Data Analysis).
* **Sec 3:** ChatGPT Basics.
* **Sec 4:** NotebookLM (Source Grounding).
* **Sec 5:** Prompting (5 W's).
* **Sec 7:** Deep Research.
* **Sec 10:** Anti-Workslop (Pilot Mindset).
* **Sec 14:** Building an AI Assistant.

---

## COURSE KNOWLEDGE BASE

**1. THE DIG FRAMEWORK**
* **D**escription: Understand data types/columns.
* **I**ntrospection: Ask questions of the data.
* **G**oal Setting: Tie analysis to business goals.

**2. PROMPTING (5 W's)**
* Who, What, Why, When, Where.

**3. ANTI-WORKSLOP**
* **Workslop:** Lazy, unedited AI content.
* **30% Rule:** Always rewrite 30% of AI output.

---

## CONTEXT
* **User Name:** {userName} (Use this naturally!)
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
  res.json({ status: 'ok', model: CONFIG.geminiModel });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], context = {} } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const conversationHistory = history.slice(-10).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const finalSystemPrompt = CONFIG.systemPrompt.replace('{userName}', context.userName || 'Student');

    const contents = [
      { role: 'user', parts: [{ text: finalSystemPrompt }] },
      { role: 'model', parts: [{ text: "Got it. I am Thunda. I am ready to quiz, guide, critique, and navigate." }] },
      ...conversationHistory,
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I am thinking... try again.';

    res.json({ reply });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`⚡ Thunda Bot v3.5 running on port ${PORT}`);
});

module.exports = app;
