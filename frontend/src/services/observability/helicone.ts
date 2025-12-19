import { appConfig } from '../../shared/lib/config';

type HeliconeLogPayload = {
  name: string;
  provider: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  timingMs: number;
  status: number;
  meta?: Record<string, unknown>;
};

export const logHelicone = async (payload: HeliconeLogPayload) => {
  if (!appConfig.observability.heliconeApiKey) return;

  const end = Date.now();
  const start = Math.max(end - payload.timingMs, 0);

  await fetch(appConfig.observability.heliconeEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${appConfig.observability.heliconeApiKey}`,
    },
    body: JSON.stringify({
      providerRequest: {
        url: 'custom-model-nopath',
        json: payload.request,
        meta: {
          name: payload.name,
          provider: payload.provider,
          ...(payload.meta || {}),
        },
      },
      providerResponse: {
        status: payload.status,
        headers: {},
        json: payload.response,
      },
      timing: {
        startTime: {
          seconds: Math.floor(start / 1000),
          milliseconds: start % 1000,
        },
        endTime: {
          seconds: Math.floor(end / 1000),
          milliseconds: end % 1000,
        },
      },
    }),
  }).catch(() => null);
};
