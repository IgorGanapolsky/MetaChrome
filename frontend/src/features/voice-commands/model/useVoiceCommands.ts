import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useCommandStore } from '@/entities/command';
import { useHaptics } from '@/shared/lib';
import { useBrowserControls } from '@/features/browser-controls';
import { createCommandHandlers } from './commandHandlers';

export function useVoiceCommands() {
  const { addCommandLog } = useCommandStore();
  const { impact, notification } = useHaptics();
  const { injectScript } = useBrowserControls();

  const executeCommand = useCallback(
    async (command: string): Promise<string> => {
      impact('medium');

      const cmd = command.toLowerCase();
      const handlers = createCommandHandlers(injectScript);
      let result = '';

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));

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
        Alert.alert('Voice Command', result);
        notification('success');

        return result;
      } catch (e: any) {
        const errorMsg = e.message || 'Command failed';
        addCommandLog({ command, action: 'error', result: errorMsg });
        Alert.alert('Error', errorMsg);
        return errorMsg;
      }
    },
    [addCommandLog, impact, notification, injectScript]
  );

  return {
    executeCommand,
  };
}
