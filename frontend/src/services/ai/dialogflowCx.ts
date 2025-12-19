import { appConfig } from '../../shared/lib/config';
import { endLangsmithRun, startLangsmithRun } from '../observability/langsmith';
import { logHelicone } from '../observability/helicone';

const buildHeaders = () => ({
  'Content-Type': 'application/json',
});

const makeSessionId = () =>
  `mc-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

export const detectIntent = async ({
  text,
  sessionId = makeSessionId(),
  languageCode = 'en',
}: {
  text: string;
  sessionId?: string;
  languageCode?: string;
}) => {
  if (!appConfig.dialogflow.agentId && !appConfig.dialogflow.agentName) {
    throw new Error('Dialogflow agent is not configured');
  }
  if (!appConfig.googleApiKey) {
    throw new Error('Google API key is not configured');
  }

  const agentPath =
    appConfig.dialogflow.agentName ||
    `projects/${appConfig.dialogflow.projectId}/locations/${appConfig.dialogflow.location}/agents/${appConfig.dialogflow.agentId}`;

  const url = `https://${appConfig.dialogflow.location}-dialogflow.googleapis.com/v3/${agentPath}/sessions/${sessionId}:detectIntent?key=${encodeURIComponent(
    appConfig.googleApiKey
  )}`;

  const body = {
    queryInput: {
      text: { text },
      languageCode,
    },
  };

  const runId = await startLangsmithRun({
    name: 'dialogflow_detect_intent',
    runType: 'tool',
    inputs: { text, sessionId },
  });

  const started = Date.now();
  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  const json = await response.json();
  const latencyMs = Date.now() - started;

  await endLangsmithRun({
    runId,
    outputs: { status: response.status },
    error: response.ok ? undefined : JSON.stringify(json),
  });

  await logHelicone({
    name: 'dialogflow_detect_intent',
    provider: 'dialogflow-cx',
    request: body,
    response: json,
    timingMs: latencyMs,
    status: response.status,
    meta: { agent: agentPath },
  });

  if (!response.ok) {
    throw new Error(json?.error?.message || 'Dialogflow detectIntent failed');
  }

  return { data: json, runId, latencyMs };
};
