export default {
  expoConfig: {
    extra: {
      neo4j: {
        uri: 'bolt://127.0.0.1:7687',
        username: 'neo4j',
        password: 'password'
      },
      vertex: {
        ragLocation: 'us-central1',
        ragCorpus: 'projects/123/locations/us-central1/ragCorpora/456',
        ragBucket: 'gs://test-bucket',
        modelId: 'gemini-pro',
        apiKey: 'test-api-key'
      },
      gcp: {
        projectId: 'test-project'
      },
      observability: {
        langsmithApiKey: 'test',
        langsmithProject: 'test'
      }
    }
  },
  manifest: { extra: {} }
};
