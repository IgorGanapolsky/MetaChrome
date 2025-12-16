import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useCommandStore } from '@/entities/command';
import { useCustomCommandStore, CustomVoiceCommand } from '@/entities/custom-command';
import { useTabStore } from '@/entities/tab';
import { useHaptics, trackEvent, AnalyticsEvents } from '@/shared/lib';
import { useBrowserControls } from '@/features/browser-controls';
import { createCommandHandlers } from './commandHandlers';

// Helper to generate unique tab IDs
const generateTabId = () => `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to create a proper tab object
const createTab = (name: string, url: string) => ({
  id: generateTabId(),
  name,
  url,
  icon: 'globe-outline' as const,
});

export function useVoiceCommands() {
  const { addCommandLog } = useCommandStore();
  const { findMatchingCommand, metaRayBanSettings } = useCustomCommandStore();
  const { tabs, activeTabId, addTab, setActiveTab } = useTabStore();
  const { impact, notification } = useHaptics();
  const { injectScript } = useBrowserControls();

  /**
   * Speak text aloud (for voice feedback)
   */
  const speakResponse = useCallback(
    async (text: string) => {
      if (metaRayBanSettings.voiceFeedbackEnabled) {
        // Voice feedback would be implemented here
        // For now, just log in dev mode
        if (__DEV__) {
          console.log('[Voice]', text.substring(0, 100));
        }
      }
    },
    [metaRayBanSettings.voiceFeedbackEnabled]
  );

  /**
   * Type a message into a web agent (Claude, Cursor, ChatGPT) and get response
   */
  const typeIntoWebAgent = useCallback(
    async (message: string): Promise<string> => {
      try {
        // Web agent integration would be implemented here
        // For now, return a placeholder
        const result = `Sent: "${message}" - Web agent integration coming soon`;
        await speakResponse(result);
        return result;
      } catch (error) {
        return `Failed to send message: ${error}`;
      }
    },
    [speakResponse]
  );

  /**
   * Execute a custom voice command
   */
  const executeCustomCommand = useCallback(
    async (command: CustomVoiceCommand): Promise<string> => {
      const handlers = createCommandHandlers(injectScript);

      switch (command.actionType) {
        case 'navigate': {
          // Navigate to URL
          const url = command.actionTarget.startsWith('http') 
            ? command.actionTarget 
            : `https://${command.actionTarget}`;
          
          const activeTab = tabs.find((t) => t.id === activeTabId);
          if (activeTab) {
            // Update current tab by removing and re-adding with new URL
            useTabStore.getState().removeTab(activeTabId!);
            addTab(createTab(command.actionTarget, url));
          } else {
            // Create new tab
            addTab(createTab(command.actionTarget, url));
          }
          
          const result = `Navigating to ${command.actionTarget}`;
          await speakResponse(result);
          return result;
        }

        case 'switch_tab':
          return handlers.handleSwitchTab(`switch to ${command.actionTarget}`);

        case 'scroll':
          return await handlers.handleScroll(`scroll ${command.actionTarget}`);

        case 'read':
          return await handlers.handleRead(command.actionTarget);

        case 'search': {
          // Open Google search
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(command.actionTarget)}`;
          addTab(createTab(`Search: ${command.actionTarget}`, searchUrl));
          const result = `Searching for: ${command.actionTarget}`;
          await speakResponse(result);
          return result;
        }

        case 'refresh':
          await injectScript('window.location.reload(); "Refreshed"');
          await speakResponse('Page refreshed');
          return 'Page refreshed';

        case 'close_tab': {
          if (activeTabId) {
            useTabStore.getState().removeTab(activeTabId);
          }
          await speakResponse('Tab closed');
          return 'Tab closed';
        }

        case 'new_tab': {
          const url = command.actionTarget.startsWith('http')
            ? command.actionTarget
            : `https://${command.actionTarget}`;
          addTab(createTab(command.actionTarget || 'New Tab', url));
          const result = `Opening new tab: ${command.actionTarget}`;
          await speakResponse(result);
          return result;
        }

        case 'custom_script': {
          const scriptResult = await injectScript(command.actionTarget);
          return scriptResult || 'Script executed';
        }

        default:
          return `Executed: ${command.description}`;
      }
    },
    [injectScript, tabs, activeTabId, addTab, speakResponse]
  );

  /**
   * Main command execution function
   */
  const executeCommand = useCallback(
    async (command: string): Promise<string> => {
      // Apply haptic feedback if enabled
      if (metaRayBanSettings.hapticFeedbackEnabled) {
        impact('medium');
      }

      const cmd = command.toLowerCase().trim();
      const handlers = createCommandHandlers(injectScript);
      let result = '';

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Check for "type" or "send" commands for web agents
        if (cmd.startsWith('type ') || cmd.startsWith('send ') || cmd.startsWith('ask ')) {
          const message = command.substring(command.indexOf(' ') + 1);
          result = await typeIntoWebAgent(message);
          addCommandLog({
            command,
            action: 'web_agent_type',
            result,
          });
          notification('success');
          return result;
        }

        // Check for "read response" or "what did it say"
        if (cmd.includes('read response') || cmd.includes('what did') || cmd.includes('read reply')) {
          // Web agent response reading would be implemented here
          result = 'No response found - Web agent integration coming soon';
          await speakResponse(result);
          addCommandLog({ command, action: 'read_response', result });
          notification('success');
          return result;
        }

        // First, check for matching custom commands
        const customCommand = findMatchingCommand(cmd);
        if (customCommand) {
          result = await executeCustomCommand(customCommand);
          addCommandLog({
            command,
            action: `custom:${customCommand.actionType}`,
            result,
          });

          trackEvent({
            name: AnalyticsEvents.VOICE_COMMAND_EXECUTED,
            properties: {
              command,
              type: 'custom',
              actionType: customCommand.actionType,
            },
          });

          // Show feedback
          if (metaRayBanSettings.voiceFeedbackEnabled) {
            Alert.alert('Voice Command', result);
          }
          notification('success');
          return result;
        }

        // Fall back to built-in command handling
        if (cmd.includes('read')) {
          result = await handlers.handleRead(cmd);
          await speakResponse(result);
        } else if (cmd.includes('switch') || cmd.includes('go to tab')) {
          result = handlers.handleSwitchTab(cmd);
          await speakResponse(result);
        } else if (cmd.includes('scroll')) {
          result = await handlers.handleScroll(cmd);
        } else if (cmd.includes('tabs') || cmd.includes('list')) {
          result = handlers.handleListTabs();
          await speakResponse(result);
        } else if (cmd.includes('new tab')) {
          addTab(createTab('New Tab', 'https://www.google.com'));
          result = 'Opened new tab';
          await speakResponse(result);
        } else if (cmd.includes('close tab')) {
          if (activeTabId) {
            useTabStore.getState().removeTab(activeTabId);
          }
          result = 'Tab closed';
          await speakResponse(result);
        } else if (cmd.includes('refresh') || cmd.includes('reload')) {
          await injectScript('window.location.reload(); "Refreshed"');
          result = 'Page refreshed';
          await speakResponse(result);
        } else if (cmd.startsWith('open ') || cmd.startsWith('go to ')) {
          // Extract URL or site name
          const target = command.substring(command.indexOf(' ') + 1).trim();
          let url = target;
          
          // Handle common sites
          if (!target.includes('.')) {
            url = `https://www.${target}.com`;
          } else if (!target.startsWith('http')) {
            url = `https://${target}`;
          }
          
          addTab(createTab(target, url));
          result = `Opening ${target}`;
          await speakResponse(result);
        } else if (cmd.startsWith('search ')) {
          const query = command.substring(7).trim();
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          addTab(createTab(`Search: ${query}`, searchUrl));
          result = `Searching for: ${query}`;
          await speakResponse(result);
        } else {
          result = `Command not recognized: ${command}`;
          await speakResponse(result);
        }

        addCommandLog({ command, action: 'executed', result });

        trackEvent({
          name: AnalyticsEvents.VOICE_COMMAND_EXECUTED,
          properties: {
            command,
            type: 'builtin',
            result: result.substring(0, 50), // Truncate long results
          },
        });

        if (metaRayBanSettings.voiceFeedbackEnabled) {
          Alert.alert('Voice Command', result);
        }
        notification('success');

        return result;
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : 'Command failed';
        addCommandLog({ command, action: 'error', result: errorMsg });
        await speakResponse(`Error: ${errorMsg}`);
        return errorMsg;
      }
    },
    [
      addCommandLog,
      impact,
      notification,
      injectScript,
      findMatchingCommand,
      executeCustomCommand,
      metaRayBanSettings,
      typeIntoWebAgent,
      speakResponse,
      addTab,
      activeTabId,
    ]
  );

  return {
    executeCommand,
    executeCustomCommand,
    typeIntoWebAgent,
    speakResponse,
  };
}
