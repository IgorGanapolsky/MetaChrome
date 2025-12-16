/**
 * WebAgentService
 * 
 * Handles interaction with web-based AI agents like Claude, Cursor, ChatGPT.
 * Provides functionality to:
 * - Detect input fields on web pages
 * - Type text into chat interfaces
 * - Read responses from the page
 * - Submit messages
 */

import { RefObject } from 'react';
import { WebView } from 'react-native-webview';

// Known web agent configurations
export interface WebAgentConfig {
  name: string;
  urlPatterns: string[];
  inputSelector: string;
  submitSelector: string;
  responseSelector: string;
  messageContainerSelector: string;
  lastMessageSelector: string;
}

// Pre-configured web agents
export const WEB_AGENTS: Record<string, WebAgentConfig> = {
  claude: {
    name: 'Claude',
    urlPatterns: ['claude.ai', 'anthropic.com'],
    inputSelector: '[contenteditable="true"], textarea[placeholder*="Message"], div[data-placeholder]',
    submitSelector: 'button[type="submit"], button[aria-label*="Send"], button[data-testid="send-button"]',
    responseSelector: '.prose, [data-message-author="assistant"], .assistant-message',
    messageContainerSelector: '[data-testid="conversation"], .conversation-container',
    lastMessageSelector: '[data-message-author="assistant"]:last-child, .assistant-message:last-child',
  },
  chatgpt: {
    name: 'ChatGPT',
    urlPatterns: ['chat.openai.com', 'chatgpt.com'],
    inputSelector: '#prompt-textarea, textarea[data-id="root"]',
    submitSelector: 'button[data-testid="send-button"], button[aria-label="Send message"]',
    responseSelector: '.markdown, [data-message-author-role="assistant"]',
    messageContainerSelector: '.flex-col.items-center',
    lastMessageSelector: '[data-message-author-role="assistant"]:last-child',
  },
  cursor: {
    name: 'Cursor',
    urlPatterns: ['cursor.sh', 'cursor.com'],
    inputSelector: 'textarea, [contenteditable="true"], input[type="text"]',
    submitSelector: 'button[type="submit"], button:contains("Send")',
    responseSelector: '.response, .assistant, .ai-response',
    messageContainerSelector: '.chat-container, .messages',
    lastMessageSelector: '.assistant:last-child, .ai-response:last-child',
  },
  generic: {
    name: 'Generic Chat',
    urlPatterns: ['*'],
    inputSelector: 'textarea, input[type="text"], [contenteditable="true"]',
    submitSelector: 'button[type="submit"], button:contains("Send"), button:contains("Submit")',
    responseSelector: '.response, .message, .reply',
    messageContainerSelector: '.chat, .messages, .conversation',
    lastMessageSelector: '.message:last-child',
  },
};

/**
 * JavaScript to inject into WebView for agent interaction
 */
const createAgentScript = (config: WebAgentConfig) => `
(function() {
  window.MetaChromeAgent = {
    config: ${JSON.stringify(config)},
    
    // Find the input element
    findInput: function() {
      const selectors = this.config.inputSelector.split(', ');
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && this.isVisible(el)) return el;
      }
      return null;
    },
    
    // Find the submit button
    findSubmitButton: function() {
      const selectors = this.config.submitSelector.split(', ');
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && this.isVisible(el)) return el;
      }
      return null;
    },
    
    // Check if element is visible
    isVisible: function(el) {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    },
    
    // Type text into the input
    typeText: function(text) {
      const input = this.findInput();
      if (!input) {
        return { success: false, error: 'Input not found' };
      }
      
      // Focus the input
      input.focus();
      
      // Handle different input types
      if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (input.contentEditable === 'true') {
        input.textContent = text;
        input.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
      }
      
      return { success: true };
    },
    
    // Submit the message
    submit: function() {
      const button = this.findSubmitButton();
      if (button) {
        button.click();
        return { success: true };
      }
      
      // Try pressing Enter on input
      const input = this.findInput();
      if (input) {
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true
        });
        input.dispatchEvent(enterEvent);
        return { success: true };
      }
      
      return { success: false, error: 'Submit button not found' };
    },
    
    // Get the last response
    getLastResponse: function() {
      const selectors = this.config.lastMessageSelector.split(', ');
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          return { 
            success: true, 
            text: el.textContent || el.innerText,
            html: el.innerHTML
          };
        }
      }
      
      // Fallback: get all responses and return the last one
      const responseSelectors = this.config.responseSelector.split(', ');
      for (const selector of responseSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          const last = elements[elements.length - 1];
          return {
            success: true,
            text: last.textContent || last.innerText,
            html: last.innerHTML
          };
        }
      }
      
      return { success: false, error: 'No response found' };
    },
    
    // Wait for a new response
    waitForResponse: function(timeout = 30000) {
      return new Promise((resolve) => {
        const startTime = Date.now();
        const initialResponse = this.getLastResponse();
        const initialText = initialResponse.success ? initialResponse.text : '';
        
        const check = () => {
          const current = this.getLastResponse();
          if (current.success && current.text !== initialText && current.text.length > 0) {
            resolve(current);
            return;
          }
          
          if (Date.now() - startTime > timeout) {
            resolve({ success: false, error: 'Timeout waiting for response' });
            return;
          }
          
          setTimeout(check, 500);
        };
        
        check();
      });
    },
    
    // Get page info
    getPageInfo: function() {
      return {
        url: window.location.href,
        title: document.title,
        hasInput: !!this.findInput(),
        hasSubmit: !!this.findSubmitButton(),
      };
    }
  };
  
  // Notify that agent is ready
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'agent_ready',
    pageInfo: window.MetaChromeAgent.getPageInfo()
  }));
})();
`;

/**
 * JavaScript commands to execute in WebView
 */
export const WebAgentCommands = {
  typeAndSubmit: (text: string) => `
    (function() {
      const result = window.MetaChromeAgent.typeText(${JSON.stringify(text)});
      if (result.success) {
        setTimeout(() => {
          const submitResult = window.MetaChromeAgent.submit();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'submit_result',
            ...submitResult
          }));
        }, 100);
      } else {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'type_error',
          ...result
        }));
      }
    })();
  `,
  
  getResponse: () => `
    (function() {
      const result = window.MetaChromeAgent.getLastResponse();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'response',
        ...result
      }));
    })();
  `,
  
  waitForResponse: (timeout: number = 30000) => `
    (function() {
      window.MetaChromeAgent.waitForResponse(${timeout}).then(result => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'response',
          ...result
        }));
      });
    })();
  `,
  
  getPageInfo: () => `
    (function() {
      const info = window.MetaChromeAgent.getPageInfo();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'page_info',
        ...info
      }));
    })();
  `,
};

/**
 * WebAgentService class
 */
class WebAgentService {
  private webViewRef: RefObject<WebView> | null = null;
  private currentConfig: WebAgentConfig = WEB_AGENTS.generic;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private pendingResponse: ((text: string) => void) | null = null;

  /**
   * Set the WebView reference
   */
  setWebViewRef(ref: RefObject<WebView | null>): void {
    this.webViewRef = ref as RefObject<WebView>;
  }

  /**
   * Detect which web agent is being used based on URL
   */
  detectAgent(url: string): WebAgentConfig {
    for (const [key, config] of Object.entries(WEB_AGENTS)) {
      if (key === 'generic') continue;
      
      for (const pattern of config.urlPatterns) {
        if (url.toLowerCase().includes(pattern.toLowerCase())) {
          this.currentConfig = config;
          return config;
        }
      }
    }
    
    this.currentConfig = WEB_AGENTS.generic;
    return WEB_AGENTS.generic;
  }

  /**
   * Get the injection script for the current agent
   */
  getInjectionScript(): string {
    return createAgentScript(this.currentConfig);
  }

  /**
   * Execute JavaScript in the WebView
   */
  private executeScript(script: string): void {
    if (this.webViewRef?.current) {
      this.webViewRef.current.injectJavaScript(script);
    }
  }

  /**
   * Handle messages from WebView
   */
  handleMessage(event: { nativeEvent: { data: string } }): void {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      // Call registered handlers
      const handler = this.messageHandlers.get(data.type);
      if (handler) {
        handler(data);
      }

      // Handle response for pending requests
      if (data.type === 'response' && this.pendingResponse) {
        this.pendingResponse(data.text || '');
        this.pendingResponse = null;
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
    }
  }

  /**
   * Register a message handler
   */
  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Type text into the chat input and submit
   */
  async sendMessage(text: string): Promise<void> {
    this.executeScript(WebAgentCommands.typeAndSubmit(text));
  }

  /**
   * Get the last response from the chat
   */
  async getLastResponse(): Promise<string> {
    return new Promise((resolve) => {
      this.pendingResponse = resolve;
      this.executeScript(WebAgentCommands.getResponse());
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingResponse) {
          this.pendingResponse = null;
          resolve('');
        }
      }, 5000);
    });
  }

  /**
   * Send a message and wait for response
   */
  async sendAndWaitForResponse(text: string, timeout: number = 30000): Promise<string> {
    return new Promise((resolve) => {
      this.pendingResponse = resolve;
      
      // Send the message
      this.executeScript(WebAgentCommands.typeAndSubmit(text));
      
      // Wait for response
      setTimeout(() => {
        this.executeScript(WebAgentCommands.waitForResponse(timeout));
      }, 500);
      
      // Overall timeout
      setTimeout(() => {
        if (this.pendingResponse) {
          this.pendingResponse = null;
          resolve('');
        }
      }, timeout + 5000);
    });
  }

  /**
   * Get current page info
   */
  getPageInfo(): void {
    this.executeScript(WebAgentCommands.getPageInfo());
  }
}

// Singleton instance
export const webAgentService = new WebAgentService();
