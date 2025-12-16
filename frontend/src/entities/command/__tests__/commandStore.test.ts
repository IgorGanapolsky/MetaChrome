import { renderHook, act } from '@testing-library/react-native';
import { useCommandStore } from '../model/commandStore';
import type { CommandLog } from '../model/types';

describe('CommandStore', () => {
  beforeEach(() => {
    const { commandHistory } = useCommandStore.getState();
    useCommandStore.setState({ commandHistory: [] });
  });

  it('should initialize with empty command history', () => {
    const { result } = renderHook(() => useCommandStore());
    expect(result.current.commandHistory).toHaveLength(0);
  });

  it('should add a command log', () => {
    const { result } = renderHook(() => useCommandStore());
    const log: Omit<CommandLog, 'id' | 'timestamp'> = {
      command: 'read last response',
      action: 'executed',
      result: 'Success',
    };

    act(() => {
      result.current.addCommandLog(log);
    });

    expect(result.current.commandHistory).toHaveLength(1);
    expect(result.current.commandHistory[0].command).toBe('read last response');
    expect(result.current.commandHistory[0].action).toBe('executed');
    expect(result.current.commandHistory[0].result).toBe('Success');
    expect(result.current.commandHistory[0].id).toBeDefined();
    expect(result.current.commandHistory[0].timestamp).toBeInstanceOf(Date);
  });

  it('should limit command history to 20 entries', () => {
    const { result } = renderHook(() => useCommandStore());

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addCommandLog({
          command: `command ${i}`,
          action: 'executed',
          result: `result ${i}`,
        });
      }
    });

    expect(result.current.commandHistory).toHaveLength(20);
    expect(result.current.commandHistory[0].command).toBe('command 24');
  });

  it('should prepend new logs to history', () => {
    const { result } = renderHook(() => useCommandStore());

    act(() => {
      result.current.addCommandLog({
        command: 'first',
        action: 'executed',
        result: 'result1',
      });
      result.current.addCommandLog({
        command: 'second',
        action: 'executed',
        result: 'result2',
      });
    });

    expect(result.current.commandHistory[0].command).toBe('second');
    expect(result.current.commandHistory[1].command).toBe('first');
  });
});
