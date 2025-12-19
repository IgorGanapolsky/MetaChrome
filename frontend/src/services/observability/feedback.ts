import { appConfig } from '../../shared/lib/config';

type FeedbackPayload = {
  runId: string;
  helpful: boolean;
  source: 'rag' | 'dialogflow';
  latencyMs: number;
};

const LANGSMITH_BASE_URL = 'https://api.smith.langchain.com';

export const logFeedback = async (payload: FeedbackPayload) => {
  if (!appConfig.observability.langsmithApiKey) return;

  await fetch(`${LANGSMITH_BASE_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': appConfig.observability.langsmithApiKey,
    },
    body: JSON.stringify({
      run_id: payload.runId,
      key: 'thumbs',
      score: payload.helpful ? 1 : 0,
      comment: payload.source,
      metadata: {
        latencyMs: payload.latencyMs,
        source: payload.source,
      },
    }),
  }).catch(() => null);
};
