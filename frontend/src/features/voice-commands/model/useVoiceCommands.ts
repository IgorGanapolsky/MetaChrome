import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useCommandStore } from '@/entities/command';
import { useCustomCommandStore, CustomVoiceCommand } from '@/entities/custom-command';
import { useHaptics, trackEvent, AnalyticsEvents } from '@/shared/lib';
import { useBrowserControls } from '@/features/browser-controls';
import { createCommandHandlers } from './commandHandlers';

export function useVoiceCommands() {
  const { addCommandLog } = useCommandStore();
  const { findMatchingCommand, metaRayBanSettings } = useCustomCommandStore();
  const { impact, notification } = useHaptics();
  const { injectScript } = useBrowserControls();

  const executeCustomCommand = useCallback(
    async (command: CustomVoiceCommand): Promise<string> => {
      const handlers = createCommandHandlers(injectScript);

      switch (command.actionType) {
        case 'navigate':
          // Navigate to URL - would need to update tab store
          return `Navigating to ${command.actionTarget}`;

        case 'switch_tab':
          return handlers.handleSwitchTab(`switch to ${command.actionTarget}`);

        case 'scroll':
          return await handlers.handleScroll(`scroll ${command.actionTarget}`);

        case 'read':
          return await handlers.handleRead(command.actionTarget);

        case 'search':
          // Would open search with the query
          return `Searching for: ${command.actionTarget}`;

        case 'refresh':
          await injectScript('window.location.reload(); "Refreshed"');
          return 'Page refreshed';

        case 'close_tab':
          return 'Tab closed';

        case 'new_tab':
          return `Opening new tab: ${command.actionTarget}`;

        case 'custom_script':
          const result = await injectScript(command.actionTarget);
          return result || 'Script executed';

        default:
          return `Executed: ${command.description}`;
      }
    },
    [injectScript]
  );

  const executeCommand = useCallback(
    async (command: string): Promise<string> => {
      // Apply haptic feedback if enabled
      if (metaRayBanSettings.hapticFeedbackEnabled) {
        impact('medium');
      }

      const cmd = command.toLowerCase();
      const handlers = createCommandHandlers(injectScript);
      let result = '';

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));

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
        } else if (cmd.includes('switch') || cmd.includes('open') || cmd.includes('go to')) {
          result = handlers.handleSwitchTab(cmd);
        } else if (cmd.includes('scroll')) {
          result = await handlers.handleScroll(cmd);
        } else if (cmd.includes('tabs') || cmd.includes('list')) {
          result = handlers.handleListTabs();
        } else {
          result = `Got: ${command}`;
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
      } catch (e: any) {
        const errorMsg = e.message || 'Command failed';
        addCommandLog({ command, action: 'error', result: errorMsg });
        Alert.alert('Error', errorMsg);
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
    ]
  );

  return {
    executeCommand,
    executeCustomCommand,
  };
}
