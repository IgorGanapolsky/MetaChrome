import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserEvent = {
  type: string; // e.g., 'tab_open', 'voice_command', 'nav_start'
  payload?: Record<string, any>;
  ts: number; // epoch millis
};

export type PredictedIntent = {
  intent: string;
  confidence: number; // 0..1
  evidence?: string;
};

const STORAGE_KEY = '@metachrome:event_buffer';
const MAX_EVENTS = 50;

/**
 * Append an event to the rolling buffer (size-limited, persisted).
 */
export async function addEvent(event: UserEvent): Promise<void> {
  const existing = await loadEvents();
  const next = [...existing, event].slice(-MAX_EVENTS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/**
 * Load recent events (most recent last).
 */
export async function getRecentEvents(): Promise<UserEvent[]> {
  return loadEvents();
}

/**
 * Predict next intents using a simple frequency-based transition model.
 * This is lightweight (no extra deps) and safe for on-device/offline use.
 */
export async function predictNextIntents(): Promise<PredictedIntent[]> {
  const events = await loadEvents();
  if (events.length < 2) return [];

  // Build transition counts type -> next.type
  const counts: Record<string, Record<string, number>> = {};
  for (let i = 0; i < events.length - 1; i++) {
    const a = events[i].type;
    const b = events[i + 1].type;
    counts[a] = counts[a] || {};
    counts[a][b] = (counts[a][b] || 0) + 1;
  }

  const last = events[events.length - 1].type;
  const nextCounts = counts[last] || {};
  const total = Object.values(nextCounts).reduce((s, v) => s + v, 0);
  if (total === 0) return [];

  return Object.entries(nextCounts)
    .map(([intent, c]) => ({
      intent,
      confidence: c / total,
      evidence: `Seen ${c} of ${total} transitions after ${last}`,
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

async function loadEvents(): Promise<UserEvent[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as UserEvent[];
  } catch (_) {
    // fall through
  }
  return [];
}
