import Constants from 'expo-constants';

type AppExtra = {
  gcp?: { projectId?: string };
  dialogflow?: { agentId?: string; agentName?: string; location?: string; projectId?: string };
  vertex?: {
    ragLocation?: string;
    ragCorpus?: string;
    ragBucket?: string;
    modelId?: string;
    apiKey?: string;
  };
  observability?: {
    langsmithApiKey?: string;
    langsmithProject?: string;
    langsmithTracing?: string | boolean;
    heliconeApiKey?: string;
    heliconeEndpoint?: string;
  };
  googleApiKey?: string;
};

const extra = (Constants.expoConfig?.extra ||
  // @ts-expect-error - manifest is defined in classic Expo runtime
  Constants.manifest?.extra ||
  {}) as AppExtra;

const toBool = (value: unknown) => value === true || value === 'true';

export const appConfig = {
  gcpProjectId: extra.gcp?.projectId || '',
  dialogflow: {
    agentId: extra.dialogflow?.agentId || '',
    agentName: extra.dialogflow?.agentName || '',
    location: extra.dialogflow?.location || 'us-central1',
    projectId: extra.dialogflow?.projectId || extra.gcp?.projectId || '',
  },
  vertex: {
    ragLocation: extra.vertex?.ragLocation || 'europe-west4',
    ragCorpus: extra.vertex?.ragCorpus || '',
    ragBucket: extra.vertex?.ragBucket || '',
    modelId: extra.vertex?.modelId || 'gemini-2.5-flash',
    apiKey: extra.vertex?.apiKey || '',
  },
  observability: {
    langsmithApiKey: extra.observability?.langsmithApiKey || '',
    langsmithProject: extra.observability?.langsmithProject || 'MetaChrome',
    langsmithTracing: toBool(extra.observability?.langsmithTracing),
    heliconeApiKey: extra.observability?.heliconeApiKey || '',
    heliconeEndpoint:
      extra.observability?.heliconeEndpoint || 'https://api.worker.helicone.ai/custom/v1/log',
  },
  googleApiKey: extra.googleApiKey || '',
};
