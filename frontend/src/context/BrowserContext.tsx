import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { WebView } from 'react-native-webview';

export interface BrowserTab {
  id: string;
  name: string;
  url: string;
  icon: string;
}

interface BrowserContextType {
  tabs: BrowserTab[];
  activeTabId: string | null;
  webViewRef: React.RefObject<WebView>;
  addTab: (tab: Omit<BrowserTab, 'id'>) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  executeCommand: (command: string) => Promise<string>;
  injectScript: (script: string) => Promise<string>;
  commandHistory: CommandLog[];
  addCommandLog: (log: Omit<CommandLog, 'id' | 'timestamp'>) => void;
}

export interface CommandLog {
  id: string;
  command: string;
  action: string;
  result: string;
  timestamp: Date;
}

const BrowserContext = createContext<BrowserContextType | null>(null);

const defaultTabs: BrowserTab[] = [
  { id: '1', name: 'Claude', url: 'https://claude.ai', icon: 'chatbubble-ellipses' },
  { id: '2', name: 'Cursor', url: 'https://cursor.com', icon: 'code-slash' },
  { id: '3', name: 'GitHub', url: 'https://github.com', icon: 'logo-github' },
];

export function BrowserProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<BrowserTab[]>(defaultTabs);
  const [activeTabId, setActiveTabId] = useState<string | null>('1');
  const [commandHistory, setCommandHistory] = useState<CommandLog[]>([]);
  const webViewRef = useRef<WebView>(null);
  const scriptResultRef = useRef<((result: string) => void) | null>(null);

  const addTab = useCallback((tab: Omit<BrowserTab, 'id'>) => {
    const newTab: BrowserTab = {
      ...tab,
      id: Date.now().toString(),
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const removeTab = useCallback((id: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (activeTabId === id && newTabs.length > 0) {
        setActiveTabId(newTabs[0].id);
      }
      return newTabs;
    });
  }, [activeTabId]);

  const setActiveTab = useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  const injectScript = useCallback((script: string): Promise<string> => {
    // On web, WebView doesn't exist - return mock response
    if (Platform.OS === 'web') {
      return Promise.resolve('Web preview - use mobile for real browser');
    }
    
    return new Promise((resolve) => {
      scriptResultRef.current = resolve;
      const wrappedScript = `
        (function() {
          try {
            const result = ${script};
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scriptResult', result: result || 'done' }));
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scriptResult', result: 'Error: ' + e.message }));
          }
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(wrappedScript);
      
      // Timeout fallback
      setTimeout(() => {
        if (scriptResultRef.current === resolve) {
          resolve('Timeout - no response');
          scriptResultRef.current = null;
        }
      }, 5000);
    });
  }, []);

  const executeCommand = useCallback(async (command: string): Promise<string> => {
    const cmd = command.toLowerCase();
    let action = '';
    let result = '';

    // Switch tab commands
    if (cmd.includes('switch to') || cmd.includes('open') || cmd.includes('go to')) {
      const tabNames = ['claude', 'cursor', 'github', 'chatgpt', 'google'];
      for (const name of tabNames) {
        if (cmd.includes(name)) {
          const tab = tabs.find(t => t.name.toLowerCase().includes(name));
          if (tab) {
            setActiveTab(tab.id);
            action = 'switch_tab';
            result = `Switched to ${tab.name}`;
          } else {
            action = 'switch_tab';
            result = `Tab ${name} not found`;
          }
          break;
        }
      }
    }
    // Read content commands
    else if (cmd.includes('read') || cmd.includes('what does it say')) {
      action = 'read_content';
      if (cmd.includes('last response') || cmd.includes('latest')) {
        const text = await injectScript(`
          (function() {
            // Try common AI chat selectors
            const selectors = [
              '[data-testid="assistant-message"]:last-child',
              '.assistant-message:last-child',
              '.response:last-child',
              '.message.assistant:last-child',
              'article:last-child p',
              '.prose:last-child'
            ];
            for (const sel of selectors) {
              const el = document.querySelector(sel);
              if (el) return el.innerText.substring(0, 500);
            }
            // Fallback: get last substantial text block
            const paragraphs = document.querySelectorAll('p, div.text, article');
            if (paragraphs.length > 0) {
              return paragraphs[paragraphs.length - 1].innerText.substring(0, 500);
            }
            return 'Could not find response text';
          })()
        `);
        result = text;
      } else {
        const text = await injectScript(`document.body.innerText.substring(0, 500)`);
        result = text;
      }
    }
    // Send/reply commands
    else if (cmd.includes('reply') || cmd.includes('send') || cmd.includes('type')) {
      action = 'send_message';
      // Extract the message after "reply" or "send" or "type"
      const match = cmd.match(/(?:reply|send|type)\s*[:\s]*["']?(.+?)["']?$/i);
      const message = match ? match[1].trim() : '';
      
      if (message) {
        const sendResult = await injectScript(`
          (function() {
            const selectors = [
              'textarea[placeholder*="message"]',
              'textarea[placeholder*="Message"]',
              'textarea',
              'input[type="text"]',
              '[contenteditable="true"]'
            ];
            for (const sel of selectors) {
              const input = document.querySelector(sel);
              if (input) {
                input.focus();
                input.value = '${message.replace(/'/g, "\\'")}' ;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                // Try to find and click send button
                const sendBtns = document.querySelectorAll('button[type="submit"], button[aria-label*="send"], button[aria-label*="Send"]');
                if (sendBtns.length > 0) {
                  sendBtns[sendBtns.length - 1].click();
                  return 'Sent: ${message.replace(/'/g, "\\'")}' ;
                }
                return 'Typed but could not find send button';
              }
            }
            return 'Could not find input field';
          })()
        `);
        result = sendResult;
      } else {
        result = 'No message to send';
      }
    }
    // Scroll commands
    else if (cmd.includes('scroll')) {
      action = 'scroll';
      if (cmd.includes('up') || cmd.includes('top')) {
        await injectScript(`window.scrollBy(0, -500); 'Scrolled up'`);
        result = 'Scrolled up';
      } else if (cmd.includes('down') || cmd.includes('bottom')) {
        await injectScript(`window.scrollBy(0, 500); 'Scrolled down'`);
        result = 'Scrolled down';
      } else {
        await injectScript(`window.scrollBy(0, 300); 'Scrolled'`);
        result = 'Scrolled';
      }
    }
    // Click commands
    else if (cmd.includes('click')) {
      action = 'click';
      const match = cmd.match(/click\s+(?:on\s+)?["']?(.+?)["']?$/i);
      const target = match ? match[1].trim() : '';
      
      if (target) {
        const clickResult = await injectScript(`
          (function() {
            const elements = document.querySelectorAll('button, a, [role="button"]');
            for (const el of elements) {
              if (el.innerText.toLowerCase().includes('${target.toLowerCase()}')) {
                el.click();
                return 'Clicked: ' + el.innerText.substring(0, 50);
              }
            }
            return 'Could not find element: ${target}';
          })()
        `);
        result = clickResult;
      } else {
        result = 'No click target specified';
      }
    }
    // Close tab
    else if (cmd.includes('close tab') || cmd.includes('close this')) {
      action = 'close_tab';
      if (activeTabId && tabs.length > 1) {
        const closedTab = tabs.find(t => t.id === activeTabId);
        removeTab(activeTabId);
        result = `Closed ${closedTab?.name || 'tab'}`;
      } else {
        result = 'Cannot close the last tab';
      }
    }
    // List tabs
    else if (cmd.includes('what tabs') || cmd.includes('list tabs')) {
      action = 'list_tabs';
      result = `You have ${tabs.length} tabs: ${tabs.map(t => t.name).join(', ')}`;
    }
    // Default
    else {
      action = 'unknown';
      result = `Command not recognized: ${command}`;
    }

    return result;
  }, [tabs, activeTabId, setActiveTab, removeTab, injectScript]);

  const addCommandLog = useCallback((log: Omit<CommandLog, 'id' | 'timestamp'>) => {
    setCommandHistory(prev => [{
      ...log,
      id: Date.now().toString(),
      timestamp: new Date(),
    }, ...prev].slice(0, 20));
  }, []);

  // Handle messages from WebView
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'scriptResult' && scriptResultRef.current) {
        scriptResultRef.current(data.result);
        scriptResultRef.current = null;
      }
    } catch (e) {
      console.error('WebView message parse error:', e);
    }
  }, []);

  const value: BrowserContextType = {
    tabs,
    activeTabId,
    webViewRef,
    addTab,
    removeTab,
    setActiveTab,
    executeCommand,
    injectScript,
    commandHistory,
    addCommandLog,
  };

  return (
    <BrowserContext.Provider value={value}>
      {children}
    </BrowserContext.Provider>
  );
}

export function useBrowser() {
  const context = useContext(BrowserContext);
  if (!context) {
    throw new Error('useBrowser must be used within BrowserProvider');
  }
  return context;
}
