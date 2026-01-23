/**
 * Thundamental AI Chatbot v2 - Final Edition
 * With Suggested Questions + Quiz Mode
 */
(function() {
  'use strict';

  // --- CONFIGURATION ---
  var API_URL = 'https://thundamental.vercel.app/api/chat';
  var BOT_NAME = 'Thunda';
  
  // Ghost Mode: Set to null to show to everyone, or ['Name1', 'Name2'] to restrict
  var ALLOWED_USERS = ['Sipho'];
  // ---------------------

  // Get user name
  var userName = 'there';
  try {
    var dataEl = document.getElementById('thunda-user-data');
    if (dataEl) {
      var d = JSON.parse(dataEl.textContent);
      if (d.name && !d.name.includes('{{')) userName = d.name.split(' ')[0];
    }
  } catch(e) {}

  // Ghost mode check
  if (ALLOWED_USERS !== null && !ALLOWED_USERS.includes(userName)) {
    console.log('[Thunda] Hidden for user:', userName);
    return;
  }

  // Inject CSS
  var css = document.createElement('style');
  css.textContent = `
    #thunda-btn {
      position: fixed; bottom: 24px; right: 24px; width: 64px; height: 64px;
      border-radius: 50%; background: linear-gradient(135deg, #f5c518 0%, #e6b800 100%);
      border: 3px solid #1a1a1a; cursor: pointer; z-index: 999999;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.25); transition: all 0.3s ease;
    }
    #thunda-btn:hover { transform: scale(1.08) rotate(-5deg); box-shadow: 0 6px 32px rgba(0,0,0,0.3); }
    #thunda-btn svg { width: 30px; height: 30px; fill: #1a1a1a; }
    
    #thunda-chat {
      position: fixed; bottom: 104px; right: 24px; width: 400px; height: 560px;
      background: #ffffff; border-radius: 20px; border: 3px solid #1a1a1a;
      display: none; flex-direction: column; z-index: 999999;
      box-shadow: 0 12px 48px rgba(0,0,0,0.2); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    }
    #thunda-chat.open { display: flex; animation: slideUp 0.3s ease; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    
    #thunda-header {
      padding: 18px 20px; background: linear-gradient(135deg, #f5c518 0%, #e6b800 100%);
      border-bottom: 3px solid #1a1a1a; display: flex; justify-content: space-between; align-items: center;
    }
    #thunda-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: #1a1a1a; display: flex; align-items: center; gap: 8px; }
    #thunda-close { background: none; border: none; font-size: 28px; cursor: pointer; color: #1a1a1a; line-height: 1; padding: 0; transition: transform 0.2s; }
    #thunda-close:hover { transform: rotate(90deg); }
    
    #thunda-msgs {
      flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;
      background: #fafafa;
    }
    #thunda-msgs::-webkit-scrollbar { width: 6px; }
    #thunda-msgs::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
    
    .t-msg {
      max-width: 85%; padding: 12px 16px; border-radius: 16px;
      font-size: 14px; line-height: 1.5; word-wrap: break-word;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .t-msg.user {
      align-self: flex-end; background: linear-gradient(135deg, #f5c518, #e6b800);
      color: #1a1a1a; border-bottom-right-radius: 4px;
    }
    .t-msg.bot {
      align-self: flex-start; background: #ffffff; color: #1a1a1a;
      border: 2px solid #e8e8e8; border-bottom-left-radius: 4px;
    }
    
    #thunda-suggestions {
      padding: 0 20px 16px; display: flex; flex-direction: column; gap: 8px;
      background: #fafafa;
    }
    #thunda-suggestions.hidden { display: none; }
    .t-suggest-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .t-suggest-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .t-suggest {
      background: #fff; border: 2px solid #f5c518; border-radius: 20px;
      padding: 8px 14px; font-size: 13px; cursor: pointer; color: #1a1a1a;
      transition: all 0.2s; font-weight: 500;
    }
    .t-suggest:hover { background: #f5c518; transform: translateY(-2px); }
    .t-suggest.quiz { border-color: #4CAF50; color: #2e7d32; }
    .t-suggest.quiz:hover { background: #4CAF50; color: white; }
    
    #thunda-input-area {
      padding: 16px 20px; border-top: 2px solid #e8e8e8;
      display: flex; gap: 10px; background: #ffffff;
    }
    #thunda-input {
      flex: 1; padding: 12px 18px; border: 2px solid #e0e0e0;
      border-radius: 24px; font-size: 14px; outline: none; background: #fafafa;
      transition: all 0.2s;
    }
    #thunda-input:focus { border-color: #f5c518; background: #fff; box-shadow: 0 0 0 3px rgba(245,197,24,0.2); }
    #thunda-input::placeholder { color: #999; }
    #thunda-send {
      width: 46px; height: 46px; border-radius: 50%;
      background: linear-gradient(135deg, #f5c518, #e6b800); border: 2px solid #1a1a1a;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    #thunda-send:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    #thunda-send svg { width: 20px; height: 20px; fill: #1a1a1a; margin-left: 2px; }
    
    .t-typing { 
      display: flex; gap: 5px; padding: 12px 16px; background: #fff; 
      border-radius: 16px; align-self: flex-start; border: 2px solid #e8e8e8;
    }
    .t-typing span { 
      width: 8px; height: 8px; background: #f5c518; border-radius: 50%; 
      animation: bounce 1.4s infinite; 
    }
    .t-typing span:nth-child(2) { animation-delay: 0.2s; }
    .t-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-8px); } }
    
    @media (max-width: 480px) {
      #thunda-chat { width: calc(100% - 32px); right: 16px; height: 75vh; max-height: 600px; }
      #thunda-btn { width: 56px; height: 56px; bottom: 20px; right: 20px; }
    }
  `;
  document.head.appendChild(css);

  // Suggested questions organized by category
  var learnSuggestions = [
    "What is the DIG Framework?",
    "How do I write better prompts?",
    "Explain Deep Research",
    "ChatGPT vs Gemini differences"
  ];
  
  var quizSuggestions = [
    "🎯 Quiz me on DIG Framework",
    "🎯 Test my prompting skills",
    "🎯 Quiz me on Anti-Workslop"
  ];

  // Create toggle button
  var btn = document.createElement('button');
  btn.id = 'thunda-btn';
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>';
  btn.setAttribute('aria-label', 'Open Thunda chat');
  document.body.appendChild(btn);

  // Create chat window
  var chat = document.createElement('div');
  chat.id = 'thunda-chat';
  chat.innerHTML = `
    <div id="thunda-header">
      <h3>⚡ ${BOT_NAME}</h3>
      <button id="thunda-close" aria-label="Close">&times;</button>
    </div>
    <div id="thunda-msgs"></div>
    <div id="thunda-suggestions">
      <div class="t-suggest-label">💡 Ask me about...</div>
      <div class="t-suggest-row" id="thunda-learn-row"></div>
      <div class="t-suggest-label" style="margin-top: 12px;">🧠 Test your knowledge</div>
      <div class="t-suggest-row" id="thunda-quiz-row"></div>
    </div>
    <div id="thunda-input-area">
      <input type="text" id="thunda-input" placeholder="Ask anything or request a quiz..." aria-label="Message">
      <button id="thunda-send" aria-label="Send">
        <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(chat);

  var msgs = document.getElementById('thunda-msgs');
  var suggestionsEl = document.getElementById('thunda-suggestions');
  var learnRow = document.getElementById('thunda-learn-row');
  var quizRow = document.getElementById('thunda-quiz-row');
  var input = document.getElementById('thunda-input');
  var history = [];
  var isOpen = false;
  var suggestionsVisible = true;

  // Render suggestion buttons
  function renderSuggestions() {
    learnRow.innerHTML = '';
    quizRow.innerHTML = '';
    
    learnSuggestions.forEach(function(q) {
      var b = document.createElement('button');
      b.className = 't-suggest';
      b.textContent = q;
      b.onclick = function() { askQuestion(q); };
      learnRow.appendChild(b);
    });
    
    quizSuggestions.forEach(function(q) {
      var b = document.createElement('button');
      b.className = 't-suggest quiz';
      b.textContent = q;
      b.onclick = function() { askQuestion(q); };
      quizRow.appendChild(b);
    });
    
    suggestionsEl.classList.remove('hidden');
    suggestionsVisible = true;
  }

  function hideSuggestions() {
    if (suggestionsVisible) {
      suggestionsEl.classList.add('hidden');
      suggestionsVisible = false;
    }
  }

  function askQuestion(text) {
    input.value = text;
    sendMessage();
  }

  function addMessage(role, text) {
    var div = document.createElement('div');
    div.className = 't-msg ' + role;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    history.push({ role: role === 'bot' ? 'assistant' : 'user', content: text });
  }

  // Welcome message
  addMessage('bot', `Hey ${userName}! 👋 I'm ${BOT_NAME}, your AI tutor for this course.\n\nI can explain concepts like the DIG Framework, help with prompting, guide you through tools like NotebookLM and ChatGPT — or quiz you to test your knowledge!\n\nWhat would you like to do?`);
  renderSuggestions();

  // Toggle chat
  btn.onclick = function() {
    isOpen = !isOpen;
    chat.classList.toggle('open', isOpen);
    if (isOpen) input.focus();
  };

  document.getElementById('thunda-close').onclick = function() {
    isOpen = false;
    chat.classList.remove('open');
  };

  // Send message
  function sendMessage() {
    var text = input.value.trim();
    if (!text) return;
    
    hideSuggestions();
    input.value = '';
    addMessage('user', text);
    
    // Typing indicator
    var typing = document.createElement('div');
    typing.className = 't-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: history.slice(-10),
        context: { userName: userName }
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      typing.remove();
      if (data.reply) {
        addMessage('bot', data.reply);
      } else if (data.error) {
        addMessage('bot', 'Oops! ' + (data.message || 'Something went wrong. Try again?'));
      } else {
        addMessage('bot', 'Hmm, I didn\'t get a response. Please try again!');
      }
    })
    .catch(function(err) {
      typing.remove();
      addMessage('bot', 'Connection issue! Please check your internet and try again.');
      console.error('[Thunda] Error:', err);
    });
  }

  document.getElementById('thunda-send').onclick = sendMessage;
  input.onkeypress = function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Close on escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
      chat.classList.remove('open');
    }
  });

  console.log('[Thunda] Chatbot v2 loaded for:', userName);
})();
