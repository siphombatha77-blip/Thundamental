/**
 * Thundamental AI Chatbot Widget
 * A lightweight, embeddable chat interface for LearnWorlds
 * 
 * @version 1.0.0
 * @license MIT
 */

(function() {
  'use strict';
  const CONFIG = {
    // Backend proxy URL - UPDATE THIS after deployment
    apiEndpoint: 'https://thundamental.vercel.app/api/chat',
    // Course slugs where the bot should appear
    activeCourses: [
      '/course/experimentation-microlearning-vacwork-dec-2025',
    ],
    
    // Set to true to show on all pages (for testing)
    // CHANGE TO false AFTER TESTING IS COMPLETE
    showOnAllPages: false,
    
    // Bot personality
    botName: 'Thunda',
    welcomeMessage: "Hey {name}! 👋 I'm Thunda, your AI learning guide for this course. Ask me anything - like which lesson covers a topic, how to use a specific AI tool, or if you're stuck on something. What can I help you with?",
    
    // UI settings
    position: 'bottom-right', // 'bottom-right' or 'bottom-left'
    theme: 'dark',
    
    // Storage key for message history
    storageKey: 'thundamental_chat_history',
    
    // Max messages to keep in history
    maxHistoryLength: 50,
    
    // Typing indicator delay (ms)
    typingDelay: 500,
  };

  // ============================================
  // STYLES (Embedded CSS)
  // ============================================
  
  const STYLES = `
    /* CSS Custom Properties - Thundamental White/Yellow/Black Theme */
    :root {
      --thunda-primary: #ffffff;
      --thunda-secondary: #f8f9fa;
      --thunda-accent: #f5c518;
      --thunda-accent-hover: #e6b800;
      --thunda-highlight: #fff8e1;
      --thunda-text: #1a1a1a;
      --thunda-text-muted: #6b7280;
      --thunda-border: rgba(0, 0, 0, 0.1);
      --thunda-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      --thunda-radius: 16px;
      --thunda-radius-sm: 12px;
      --thunda-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }

    /* Toggle Button */
    #thunda-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f5c518 0%, #e6b800 100%);
      border: 2px solid #1a1a1a;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    }

    #thunda-toggle:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 30px rgba(0, 0, 0, 0.25);
    }

    #thunda-toggle:active {
      transform: scale(0.95);
    }

    #thunda-toggle svg {
      width: 28px;
      height: 28px;
      fill: #1a1a1a;
      transition: transform 0.3s ease;
    }

    #thunda-toggle.open svg {
      transform: rotate(90deg);
    }

    /* Notification Badge */
    #thunda-toggle .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 20px;
      height: 20px;
      background: #4ade80;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 600;
      color: #0d0d1a;
      display: none;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    /* Chat Window Container */
    #thunda-chat {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 380px;
      height: 520px;
      max-height: calc(100vh - 140px);
      background: var(--thunda-primary);
      border-radius: var(--thunda-radius);
      box-shadow: var(--thunda-shadow);
      border: 2px solid #1a1a1a;
      display: flex;
      flex-direction: column;
      z-index: 999999;
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: var(--thunda-font);
      overflow: hidden;
    }

    #thunda-chat.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }

    /* Chat Header */
    #thunda-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: #ffffff;
      border-bottom: 2px solid #f5c518;
    }

    #thunda-header .bot-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    #thunda-header .bot-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f5c518, #e6b800);
      border: 2px solid #1a1a1a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    #thunda-header .bot-details h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--thunda-text);
    }

    #thunda-header .bot-details span {
      font-size: 12px;
      color: var(--thunda-text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    #thunda-header .bot-details span::before {
      content: '';
      width: 6px;
      height: 6px;
      background: #4ade80;
      border-radius: 50%;
    }

    #thunda-header .close-btn {
      background: none;
      border: none;
      color: var(--thunda-text-muted);
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    #thunda-header .close-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--thunda-text);
    }

    #thunda-header .close-btn svg {
      width: 18px;
      height: 18px;
    }

    /* Messages Container */
    #thunda-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scroll-behavior: smooth;
    }

    #thunda-messages::-webkit-scrollbar {
      width: 6px;
    }

    #thunda-messages::-webkit-scrollbar-track {
      background: transparent;
    }

    #thunda-messages::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }

    /* Message Bubbles */
    .thunda-message {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: var(--thunda-radius-sm);
      font-size: 14px;
      line-height: 1.5;
      animation: messageIn 0.3s ease;
    }

    @keyframes messageIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .thunda-message.user {
      align-self: flex-end;
      background: linear-gradient(135deg, #f5c518, #e6b800);
      color: #1a1a1a;
      border-bottom-right-radius: 4px;
    }

    .thunda-message.bot {
      align-self: flex-start;
      background: #f8f9fa;
      color: #1a1a1a;
      border: 1px solid #e5e7eb;
      border-bottom-left-radius: 4px;
    }

    .thunda-message.bot p {
      margin: 0 0 8px 0;
    }

    .thunda-message.bot p:last-child {
      margin-bottom: 0;
    }

    .thunda-message.bot code {
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', Consolas, monospace;
      font-size: 13px;
    }

    .thunda-message.bot pre {
      background: rgba(0, 0, 0, 0.3);
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 8px 0;
    }

    .thunda-message.bot pre code {
      background: none;
      padding: 0;
    }

    .thunda-message .timestamp {
      font-size: 10px;
      color: var(--thunda-text-muted);
      margin-top: 6px;
      opacity: 0.7;
    }

    /* Typing Indicator */
    .thunda-typing {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 16px;
      background: var(--thunda-secondary);
      border-radius: var(--thunda-radius-sm);
      align-self: flex-start;
      max-width: 80px;
    }

    .thunda-typing span {
      width: 8px;
      height: 8px;
      background: var(--thunda-text-muted);
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }

    .thunda-typing span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .thunda-typing span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
      }
      30% {
        transform: translateY(-6px);
        opacity: 1;
      }
    }

    /* Input Area */
    #thunda-input-area {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: #ffffff;
      border-top: 2px solid #f5c518;
    }

    #thunda-input {
      flex: 1;
      background: #f8f9fa;
      border: 2px solid #e5e7eb;
      border-radius: 24px;
      padding: 12px 18px;
      font-size: 14px;
      color: #1a1a1a;
      outline: none;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    #thunda-input::placeholder {
      color: #9ca3af;
    }

    #thunda-input:focus {
      border-color: #f5c518;
      background: #ffffff;
    }

    #thunda-send {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f5c518, #e6b800);
      border: 2px solid #1a1a1a;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    #thunda-send:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    #thunda-send:active {
      transform: scale(0.95);
    }

    #thunda-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    #thunda-send svg {
      width: 20px;
      height: 20px;
      fill: #1a1a1a;
      margin-left: 2px;
    }

    /* Quick Actions (Optional) */
    #thunda-quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 0 20px 16px;
    }

    .quick-action {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--thunda-border);
      border-radius: 20px;
      padding: 8px 14px;
      font-size: 12px;
      color: var(--thunda-text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .quick-action:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--thunda-text);
      border-color: var(--thunda-accent);
    }

    /* Mobile Responsive */
    @media (max-width: 480px) {
      #thunda-chat {
        width: calc(100% - 32px);
        right: 16px;
        bottom: 90px;
        height: calc(100vh - 120px);
        max-height: none;
        border-radius: var(--thunda-radius-sm);
      }

      #thunda-toggle {
        right: 16px;
        bottom: 16px;
        width: 56px;
        height: 56px;
      }
    }

    /* Position: Bottom Left */
    .thunda-position-left #thunda-toggle,
    .thunda-position-left #thunda-chat {
      right: auto;
      left: 24px;
    }

    @media (max-width: 480px) {
      .thunda-position-left #thunda-toggle,
      .thunda-position-left #thunda-chat {
        left: 16px;
      }
    }
  `;

  // ============================================
  // ICONS (SVG)
  // ============================================
  
  const ICONS = {
    chat: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    send: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
    minimize: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 13H5v-2h14v2z"/></svg>`,
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  /**
   * Get user data from LearnWorlds Liquid tags
   */
  function getUserData() {
    const dataElement = document.getElementById('thunda-user-data');
    if (dataElement) {
      try {
        const data = JSON.parse(dataElement.textContent);
        return {
          name: data.name && data.name !== '{{USER.NAME}}' ? data.name : 'Student',
          email: data.email && data.email !== '{{USER.EMAIL}}' ? data.email : null,
          course: data.courseName && data.courseName !== '{{COURSE.NAME}}' ? data.courseName : null,
        };
      } catch (e) {
        console.warn('[Thunda] Could not parse user data:', e);
      }
    }
    return { name: 'Student', email: null, course: null };
  }

  /**
   * Check if the bot should be active on current page
   */
  function shouldActivate() {
    if (CONFIG.showOnAllPages) return true;
    
    const currentPath = window.location.pathname;
    return CONFIG.activeCourses.some(slug => currentPath.includes(slug));
  }

  /**
   * Load message history from localStorage
   */
  function loadHistory() {
    try {
      const stored = localStorage.getItem(CONFIG.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[Thunda] Could not load history:', e);
    }
    return [];
  }

  /**
   * Save message history to localStorage
   */
  function saveHistory(messages) {
    try {
      const trimmed = messages.slice(-CONFIG.maxHistoryLength);
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('[Thunda] Could not save history:', e);
    }
  }

  /**
   * Format timestamp
   */
  function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }

  /**
   * Simple markdown parser for bot responses
   */
  function parseMarkdown(text) {
    return text
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      // Wrap in paragraph
      .replace(/^(.+)$/, '<p>$1</p>');
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // CHATBOT CLASS
  // ============================================
  
  class ThundaChatbot {
    constructor() {
      this.isOpen = false;
      this.isLoading = false;
      this.messages = loadHistory();
      this.userData = getUserData();
      this.elements = {};
      
      this.init();
    }

    /**
     * Initialize the chatbot
     */
    init() {
      this.injectStyles();
      this.createWidget();
      this.attachEventListeners();
      this.renderMessages();
      
      // Show welcome message if no history
      if (this.messages.length === 0) {
        const welcomeMsg = CONFIG.welcomeMessage.replace('{name}', this.userData.name);
        this.addMessage('bot', welcomeMsg);
      }
      
      console.log('[Thunda] Chatbot initialized for', this.userData.name);
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
      const style = document.createElement('style');
      style.id = 'thunda-styles';
      style.textContent = STYLES;
      document.head.appendChild(style);
    }

    /**
     * Create the widget DOM elements
     */
    createWidget() {
      // Create container with position class
      const container = document.createElement('div');
      container.id = 'thunda-container';
      if (CONFIG.position === 'bottom-left') {
        container.classList.add('thunda-position-left');
      }

      // Toggle Button
      const toggle = document.createElement('button');
      toggle.id = 'thunda-toggle';
      toggle.setAttribute('aria-label', 'Open chat');
      toggle.innerHTML = `${ICONS.chat}<span class="badge">1</span>`;
      this.elements.toggle = toggle;

      // Chat Window
      const chat = document.createElement('div');
      chat.id = 'thunda-chat';
      chat.setAttribute('role', 'dialog');
      chat.setAttribute('aria-label', 'Chat with Thunda');

      // Header
      const header = document.createElement('div');
      header.id = 'thunda-header';
      header.innerHTML = `
        <div class="bot-info">
          <div class="bot-avatar">⚡</div>
          <div class="bot-details">
            <h3>${CONFIG.botName}</h3>
            <span>Online • Ready to help</span>
          </div>
        </div>
        <button class="close-btn" aria-label="Minimize chat">
          ${ICONS.minimize}
        </button>
      `;
      this.elements.closeBtn = header.querySelector('.close-btn');

      // Messages Area
      const messages = document.createElement('div');
      messages.id = 'thunda-messages';
      messages.setAttribute('role', 'log');
      messages.setAttribute('aria-live', 'polite');
      this.elements.messages = messages;

      // Input Area
      const inputArea = document.createElement('div');
      inputArea.id = 'thunda-input-area';
      inputArea.innerHTML = `
        <input 
          type="text" 
          id="thunda-input" 
          placeholder="Type your message..."
          aria-label="Message input"
        >
        <button id="thunda-send" aria-label="Send message">
          ${ICONS.send}
        </button>
      `;
      this.elements.input = inputArea.querySelector('#thunda-input');
      this.elements.sendBtn = inputArea.querySelector('#thunda-send');

      // Assemble
      chat.appendChild(header);
      chat.appendChild(messages);
      chat.appendChild(inputArea);
      this.elements.chat = chat;

      container.appendChild(toggle);
      container.appendChild(chat);
      document.body.appendChild(container);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
      // Toggle button
      this.elements.toggle.addEventListener('click', () => this.toggleChat());
      
      // Close button
      this.elements.closeBtn.addEventListener('click', () => this.closeChat());
      
      // Send button
      this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
      
      // Enter key
      this.elements.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Close on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.closeChat();
        }
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (this.isOpen && 
            !this.elements.chat.contains(e.target) && 
            !this.elements.toggle.contains(e.target)) {
          this.closeChat();
        }
      });
    }

    /**
     * Toggle chat window
     */
    toggleChat() {
      if (this.isOpen) {
        this.closeChat();
      } else {
        this.openChat();
      }
    }

    /**
     * Open chat window
     */
    openChat() {
      this.isOpen = true;
      this.elements.chat.classList.add('open');
      this.elements.toggle.classList.add('open');
      this.elements.toggle.setAttribute('aria-label', 'Close chat');
      this.elements.input.focus();
      this.scrollToBottom();
    }

    /**
     * Close chat window
     */
    closeChat() {
      this.isOpen = false;
      this.elements.chat.classList.remove('open');
      this.elements.toggle.classList.remove('open');
      this.elements.toggle.setAttribute('aria-label', 'Open chat');
    }

    /**
     * Add a message to the chat
     */
    addMessage(role, content, save = true) {
      const message = {
        role,
        content,
        timestamp: new Date().toISOString(),
      };

      this.messages.push(message);
      
      if (save) {
        saveHistory(this.messages);
      }

      this.renderMessage(message);
      this.scrollToBottom();
    }

    /**
     * Render a single message
     */
    renderMessage(message) {
      const el = document.createElement('div');
      el.className = `thunda-message ${message.role}`;
      
      if (message.role === 'bot') {
        el.innerHTML = parseMarkdown(escapeHtml(message.content));
      } else {
        el.textContent = message.content;
      }

      // Add timestamp
      const time = document.createElement('div');
      time.className = 'timestamp';
      time.textContent = formatTime(new Date(message.timestamp));
      el.appendChild(time);

      this.elements.messages.appendChild(el);
    }

    /**
     * Render all messages
     */
    renderMessages() {
      this.elements.messages.innerHTML = '';
      this.messages.forEach(msg => this.renderMessage(msg));
    }

    /**
     * Show typing indicator
     */
    showTyping() {
      const typing = document.createElement('div');
      typing.className = 'thunda-typing';
      typing.id = 'thunda-typing-indicator';
      typing.innerHTML = '<span></span><span></span><span></span>';
      this.elements.messages.appendChild(typing);
      this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTyping() {
      const typing = document.getElementById('thunda-typing-indicator');
      if (typing) {
        typing.remove();
      }
    }

    /**
     * Scroll messages to bottom
     */
    scrollToBottom() {
      requestAnimationFrame(() => {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
      });
    }

    /**
     * Send a message to the backend
     */
    async sendMessage() {
      const content = this.elements.input.value.trim();
      
      if (!content || this.isLoading) return;

      // Clear input
      this.elements.input.value = '';
      
      // Add user message
      this.addMessage('user', content);

      // Set loading state
      this.isLoading = true;
      this.elements.sendBtn.disabled = true;

      // Show typing indicator after delay
      setTimeout(() => {
        if (this.isLoading) {
          this.showTyping();
        }
      }, CONFIG.typingDelay);

      try {
        // Prepare conversation history for API
        const history = this.messages.slice(-10).map(m => ({
          role: m.role === 'bot' ? 'assistant' : 'user',
          content: m.content,
        }));

        const response = await fetch(CONFIG.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            history: history,
            context: {
              userName: this.userData.name,
              userEmail: this.userData.email,
              courseName: this.userData.course,
              pageUrl: window.location.href,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        this.hideTyping();
        this.addMessage('bot', data.reply || data.message || 'I received your message!');

      } catch (error) {
        console.error('[Thunda] API Error:', error);
        this.hideTyping();
        
        // Fallback response for demo/testing
        this.addMessage('bot', 
          "I'm having trouble connecting to my brain right now 🧠 " +
          "This might be because the backend isn't set up yet. " +
          "Please try again in a moment, or contact support if the issue persists."
        );
      } finally {
        this.isLoading = false;
        this.elements.sendBtn.disabled = false;
        this.elements.input.focus();
      }
    }

    /**
     * Clear chat history
     */
    clearHistory() {
      this.messages = [];
      saveHistory([]);
      this.elements.messages.innerHTML = '';
      
      // Re-show welcome message
      const welcomeMsg = CONFIG.welcomeMessage.replace('{name}', this.userData.name);
      this.addMessage('bot', welcomeMsg);
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  
  /**
   * Initialize when DOM is ready
   */
  function initialize() {
    // Check if we should activate
    if (!shouldActivate()) {
      console.log('[Thunda] Bot not active on this page');
      return;
    }

    // Check if already initialized
    if (document.getElementById('thunda-container')) {
      console.warn('[Thunda] Already initialized');
      return;
    }

    // Create chatbot instance
    window.ThundaChatbot = new ThundaChatbot();
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
