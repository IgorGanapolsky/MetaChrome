import { appConfig } from '../../shared/lib/config';
import { endLangsmithRun, startLangsmithRun } from '../observability/langsmith';
import { logHelicone } from '../observability/helicone';

const buildHeaders = () => ({
  'Content-Type': 'application/json',
});

const withApiKey = (url: string) =>
  appConfig.vertex.apiKey
    ? `${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(
        appConfig.vertex.apiKey
      )}`
    : url;

const vertexBaseUrlV1 = () =>
  `https://${appConfig.vertex.ragLocation}-aiplatform.googleapis.com/v1`;
const vertexBaseUrlV1beta1 = () =>
  `https://${appConfig.vertex.ragLocation}-aiplatform.googleapis.com/v1beta1`;

export const retrieveContexts = async (query: string) => {
  if (!appConfig.vertex.apiKey) {
    throw new Error('Vertex API key is not configured');
  }
  if (!appConfig.vertex.ragCorpus) {
    throw new Error('Vertex RAG corpus is not configured');
  }
  if (!appConfig.gcpProjectId) {
    throw new Error('GCP project ID is not configured');
  }
  const url = withApiKey(
    `${vertexBaseUrlV1beta1()}/projects/${appConfig.gcpProjectId}/locations/${appConfig.vertex.ragLocation}:retrieveContexts`
  );

  const body = {
    vertexRagStore: {
      ragResources: [
        {
          ragCorpus: appConfig.vertex.ragCorpus,
        },
      ],
    },
    query: {
      text: query,
    },
  };

  const runId = await startLangsmithRun({
    name: 'vertex_rag_retrieve',
    runType: 'tool',
    inputs: { query },
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
    name: 'vertex_rag_retrieve',
    provider: 'vertex-ai',
    request: body,
    response: json,
    timingMs: latencyMs,
    status: response.status,
    meta: { corpus: appConfig.vertex.ragCorpus },
  });

  if (!response.ok) {
    throw new Error(json?.error?.message || 'Vertex RAG retrieve failed');
  }

  return { data: json, runId, latencyMs };
};

export const generateWithRag = async (prompt: string) => {
  if (!appConfig.vertex.apiKey) {
    throw new Error('Vertex API key is not configured');
  }
  if (!appConfig.vertex.ragCorpus) {
    throw new Error('Vertex RAG corpus is not configured');
  }
  if (!appConfig.gcpProjectId) {
    throw new Error('GCP project ID is not configured');
  }
  const model = appConfig.vertex.modelId;
  const url = withApiKey(
    `${vertexBaseUrlV1()}/projects/${appConfig.gcpProjectId}/locations/${appConfig.vertex.ragLocation}/publishers/google/models/${model}:generateContent`
  );

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    tools: [
      {
        retrieval: {
          vertex_rag_store: {
            rag_resources: [{ rag_corpus: appConfig.vertex.ragCorpus }],
          },
        },
      },
    ],
  };

  const runId = await startLangsmithRun({
    name: 'vertex_rag_generate',
    runType: 'llm',
    inputs: { prompt, model },
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
    name: 'vertex_rag_generate',
    provider: 'vertex-ai',
    request: body,
    response: json,
    timingMs: latencyMs,
    status: response.status,
    meta: { corpus: appConfig.vertex.ragCorpus, model },
  });

  if (!response.ok) {
    throw new Error(json?.error?.message || 'Vertex RAG generation failed');
  }

  return { data: json, runId, latencyMs };
};
