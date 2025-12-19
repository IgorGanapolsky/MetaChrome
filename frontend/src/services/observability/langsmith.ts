import { appConfig } from '../../shared/lib/config';

const LANGSMITH_BASE_URL = 'https://api.smith.langchain.com';

type RunType = 'tool' | 'chain' | 'llm';

const makeRunId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16);
    const value = char === 'x' ? rand : (rand % 4) + 8;
    return value.toString(16);
  });

const shouldTrace = () =>
  Boolean(appConfig.observability.langsmithApiKey) && appConfig.observability.langsmithTracing;

export const startLangsmithRun = async ({
  name,
  runType,
  inputs,
}: {
  name: string;
  runType: RunType;
  inputs: Record<string, unknown>;
}) => {
  if (!shouldTrace()) return null;

  const runId = makeRunId();
  await fetch(`${LANGSMITH_BASE_URL}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': appConfig.observability.langsmithApiKey,
    },
    body: JSON.stringify({
      id: runId,
      name,
      run_type: runType,
      project_name: appConfig.observability.langsmithProject,
      start_time: new Date().toISOString(),
      inputs,
    }),
  }).catch(() => null);

  return runId;
};

export const endLangsmithRun = async ({
  runId,
  outputs,
  error,
}: {
  runId: string | null;
  outputs?: Record<string, unknown>;
  error?: string;
}) => {
  if (!runId || !shouldTrace()) return;

  await fetch(`${LANGSMITH_BASE_URL}/runs/${runId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': appConfig.observability.langsmithApiKey,
    },
    body: JSON.stringify({
      end_time: new Date().toISOString(),
      outputs: outputs || {},
      error,
    }),
  }).catch(() => null);
};
