/**
 * Thundamental AI Chatbot Widget - Simplified Version
 * Always shows on every page
 */

(function() {
  'use strict';

  // Configuration
  var API_URL = 'https://thundamental.vercel.app/api/chat';
  var BOT_NAME = 'Thunda';

  // Inject CSS
  var css = document.createElement('style');
  css.textContent = `
    #thunda-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f5c518, #e6b800);
      border: 2px solid #1a1a1a;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s;
    }
    #thunda-btn:hover { transform: scale(1.1); }
    #thunda-btn svg { width: 28px; height: 28px; fill: #1a1a1a; }
    
    #thunda-chat {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 360px;
      height: 480px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      border: 2px solid #1a1a1a;
      display: none;
      flex-direction: column;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #thunda-chat.open { display: flex; }
    
    #thunda-header {
      padding: 16px;
      background: #f5c518;
      border-bottom: 2px solid #1a1a1a;
      border-radius: 14px 14px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #thunda-header h3 { margin: 0; font-size: 16px; color: #1a1a1a; }
    #thunda-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #1a1a1a;
    }
    
    #thunda-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .thunda-msg {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
    }
    .thunda-msg.user {
      align-self: flex-end;
      background: #f5c518;
      color: #1a1a1a;
    }
    .thunda-msg.bot {
      align-self: flex-start;
      background: #f0f0f0;
      color: #1a1a1a;
    }
    
    #thunda-input-area {
      padding: 12px;
      border-top: 2px solid #eee;
      display: flex;
      gap: 8px;
    }
    #thunda-input {
      flex: 1;
      padding: 10px 14px;
      border: 2px solid #ddd;
      border-radius: 20px;
      font-size: 14px;
      outline: none;
    }
    #thunda-input:focus { border-color: #f5c518; }
    #thunda-send {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #f5c518;
      border: 2px solid #1a1a1a;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #thunda-send svg { width: 18px; height: 18px; fill: #1a1a1a; }
    
    .thunda-typing {
      display: flex;
      gap: 4px;
      padding: 10px 14px;
      background: #f0f0f0;
      border-radius: 12px;
      align-self: flex-start;
    }
    .thunda-typing span {
      width: 8px;
      height: 8px;
      background: #999;
      border-radius: 50%;
      animation: bounce 1.4s infinite;
    }
    .thunda-typing span:nth-child(2) { animation-delay: 0.2s; }
    .thunda-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }
    
    @media (max-width: 480px) {
      #thunda-chat {
        width: calc(100% - 32px);
        right: 16px;
        bottom: 90px;
        height: 60vh;
      }
    }
  `;
  document.head.appendChild(css);

  // Get user name from LearnWorlds data
  var userName = 'there';
  try {
    var dataEl = document.getElementById('thunda-user-data');
    if (dataEl) {
      var data = JSON.parse(dataEl.textContent);
      if (data.name && data.name.indexOf('{{') === -1) {
        userName = data.name.split(' ')[0];
      }
    }
  } catch(e) {}

  // Create toggle button
  var btn = document.createElement('button');
  btn.id = 'thunda-btn';
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>';
  document.body.appendChild(btn);

  // Create chat window
  var chat = document.createElement('div');
  chat.id = 'thunda-chat';
  chat.innerHTML = `
    <div id="thunda-header">
      <h3>⚡ ${BOT_NAME}</h3>
      <button id="thunda-close">&times;</button>
    </div>
    <div id="thunda-messages"></div>
    <div id="thunda-input-area">
      <input type="text" id="thunda-input" placeholder="Type a message...">
      <button id="thunda-send"><svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg></button>
    </div>
  `;
  document.body.appendChild(chat);

  var messages = document.getElementById('thunda-messages');
  var input = document.getElementById('thunda-input');
  var isOpen = false;
  var history = [];

  // Add welcome message
  addMessage('bot', `Hey ${userName}! 👋 I'm ${BOT_NAME}, your AI learning guide. Ask me anything about the course!`);

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
    
    input.value = '';
    addMessage('user', text);
    
    // Show typing
    var typing = document.createElement('div');
    typing.className = 'thunda-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    // Call API
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
      addMessage('bot', data.reply || 'Sorry, something went wrong.');
    })
    .catch(function() {
      typing.remove();
      addMessage('bot', 'Sorry, I could not connect. Please try again.');
    });
  }

  function addMessage(role, text) {
    var div = document.createElement('div');
    div.className = 'thunda-msg ' + role;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    history.push({ role: role === 'bot' ? 'assistant' : 'user', content: text });
  }

  document.getElementById('thunda-send').onclick = sendMessage;
  input.onkeypress = function(e) {
    if (e.key === 'Enter') sendMessage();
  };

  console.log('[Thunda] Chatbot loaded successfully!');
})();
