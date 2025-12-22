/**
 * Minimal REST client using Discovery Engine search as a CLI “agent” over our RAG data store.
 * Auth via gcloud access token; zero external deps.
 *
 * Endpoint:
 * POST https://discoveryengine.googleapis.com/v1/projects/claude-code-learning/locations/global/collections/default_collection/dataStores/claude-code-lessons/servingConfigs/default_search:search
 */

export type AgentResponse = {
  text?: string;
  raw: any;
  reliability?: number;
};

const PROJECT = 'claude-code-learning';
const DATA_STORE = 'claude-code-lessons';
const HOST = 'https://discoveryengine.googleapis.com';

async function getAccessToken(): Promise<string> {
  const { execSync } = await import('node:child_process');
  return execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
}

export async function queryAgent(prompt: string): Promise<AgentResponse> {
  const token = await getAccessToken();
  const url = `${HOST}/v1/projects/${PROJECT}/locations/global/collections/default_collection/dataStores/${DATA_STORE}/servingConfigs/default_search:search`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: prompt,
      pageSize: 5,
      contentSearchSpec: {
        snippetSpec: { returnSnippet: true },
        summarySpec: { summaryResultCount: 1 },
      },
    }),
  });

  if (!resp.ok) {
    const errTxt = await resp.text();
    throw new Error(`Agent query failed: ${resp.status} ${errTxt}`);
  }

  const data = await resp.json();
  const summary = data?.summary?.summaryText;
  const snippet =
    data?.results?.[0]?.document?.derivedStructData?.snippet ||
    data?.results?.[0]?.document?.snippets?.[0]?.snippet;

  // Simple reliability: average of top-3 similarity scores (if present)
  const sims = (data?.results || [])
    .slice(0, 3)
    .map((r: any) => r?.rankSignals?.semanticSimilarityScore)
    .filter((x: any) => typeof x === 'number');
  const reliability =
    sims.length > 0
      ? Math.max(0, Math.min(1, sims.reduce((a: number, b: number) => a + b, 0) / sims.length))
      : 0;

  // Fail-closed if reliability is low
  const text = reliability >= 0.35 ? summary || snippet : undefined;

  return { text, raw: data, reliability };
}
