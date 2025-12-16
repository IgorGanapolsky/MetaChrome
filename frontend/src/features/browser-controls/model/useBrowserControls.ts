import { useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export function useBrowserControls() {
  const webViewRef = useRef<WebView>(null);
  const scriptResultRef = useRef<((result: string) => void) | null>(null);

  const injectScript = useCallback((script: string): Promise<string> => {
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
      
      setTimeout(() => {
        if (scriptResultRef.current === resolve) {
          resolve('Timeout - no response');
          scriptResultRef.current = null;
        }
      }, 5000);
    });
  }, []);

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

  return {
    webViewRef,
    injectScript,
    handleWebViewMessage,
  };
}
