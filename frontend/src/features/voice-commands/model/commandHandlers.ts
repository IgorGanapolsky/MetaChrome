import { useTabStore } from '@/entities/tab';

export function createCommandHandlers(injectScript: (script: string) => Promise<string>) {
  const getState = () => useTabStore.getState();

  return {
    handleRead: async (cmd: string): Promise<string> => {
      if (cmd.includes('last response') || cmd.includes('latest')) {
        const text = await injectScript(`
          (function() {
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
            const paragraphs = document.querySelectorAll('p, div.text, article');
            if (paragraphs.length > 0) {
              return paragraphs[paragraphs.length - 1].innerText.substring(0, 500);
            }
            return 'Could not find response text';
          })()
        `);
        return text;
      } else {
        const text = await injectScript(`document.body.innerText.substring(0, 500)`);
        return text;
      }
    },

    handleSwitchTab: (cmd: string): string => {
      const { tabs, setActiveTab } = getState();
      const tabNames = ['claude', 'cursor', 'github', 'chatgpt', 'google'];
      for (const name of tabNames) {
        if (cmd.includes(name)) {
          const tab = tabs.find((t) => t.name.toLowerCase().includes(name));
          if (tab) {
            setActiveTab(tab.id);
            return `Switched to ${tab.name}`;
          }
          return `Tab ${name} not found`;
        }
      }
      return 'Tab not found';
    },

    handleScroll: async (cmd: string): Promise<string> => {
      if (cmd.includes('up') || cmd.includes('top')) {
        await injectScript(`window.scrollBy(0, -500); 'Scrolled up'`);
        return 'Scrolled up';
      } else if (cmd.includes('down') || cmd.includes('bottom')) {
        await injectScript(`window.scrollBy(0, 500); 'Scrolled down'`);
        return 'Scrolled down';
      } else {
        await injectScript(`window.scrollBy(0, 300); 'Scrolled'`);
        return 'Scrolled';
      }
    },

    handleListTabs: (): string => {
      const { tabs } = getState();
      return `${tabs.length} tabs: ${tabs.map((t) => t.name).join(', ')}`;
    },
  };
}
