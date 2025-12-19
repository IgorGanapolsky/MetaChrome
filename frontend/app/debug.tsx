import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { detectIntent, generateWithRag, retrieveContexts } from '@/services';
import { appConfig } from '@/shared/lib/config';

const prettyJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export default function DebugScreen() {
  const [prompt, setPrompt] = useState('Summarize the release checklist.');
  const [dfText, setDfText] = useState('Hello MetaChrome');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const configSummary = useMemo(
    () => ({
      gcpProjectId: appConfig.gcpProjectId || '(missing)',
      dialogflowAgent: appConfig.dialogflow.agentName || appConfig.dialogflow.agentId || '(missing)',
      dialogflowLocation: appConfig.dialogflow.location,
      vertexRagCorpus: appConfig.vertex.ragCorpus || '(missing)',
      vertexRagLocation: appConfig.vertex.ragLocation,
      vertexModel: appConfig.vertex.modelId,
      langsmithTracing: appConfig.observability.langsmithTracing,
      heliconeEnabled: Boolean(appConfig.observability.heliconeApiKey),
    }),
    []
  );

  const handleRagRetrieve = async () => {
    setLoading(true);
    try {
      const response = await retrieveContexts(prompt);
      setResult(prettyJson(response.data));
    } catch (error) {
      setResult(String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRagGenerate = async () => {
    setLoading(true);
    try {
      const response = await generateWithRag(prompt);
      setResult(prettyJson(response.data));
    } catch (error) {
      setResult(String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDetectIntent = async () => {
    setLoading(true);
    try {
      const response = await detectIntent({ text: dfText });
      setResult(prettyJson(response.data));
    } catch (error) {
      setResult(String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>MetaChrome Debug</Text>
        <Text style={styles.subtitle}>RAG, Dialogflow CX, and Tracing</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Config</Text>
          <Text style={styles.code}>{prettyJson(configSummary)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vertex RAG</Text>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            style={styles.input}
            placeholder="Ask about docs..."
            placeholderTextColor="#6B7280"
            multiline
          />
          <View style={styles.row}>
            <TouchableOpacity style={styles.button} onPress={handleRagRetrieve} disabled={loading}>
              <Text style={styles.buttonText}>Retrieve Contexts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleRagGenerate} disabled={loading}>
              <Text style={styles.buttonText}>Generate with RAG</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dialogflow CX</Text>
          <TextInput
            value={dfText}
            onChangeText={setDfText}
            style={styles.input}
            placeholder="Say something..."
            placeholderTextColor="#6B7280"
            multiline
          />
          <TouchableOpacity style={styles.button} onPress={handleDetectIntent} disabled={loading}>
            <Text style={styles.buttonText}>Detect Intent</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Result</Text>
          <Text style={styles.code}>{result || 'No output yet.'}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: -8,
  },
  card: {
    backgroundColor: '#13141B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 10,
  },
  cardTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    minHeight: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 10,
    color: '#F9FAFB',
    backgroundColor: '#0F1117',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  buttonActive: {
    backgroundColor: '#0EA5E9',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  code: {
    color: '#D1D5DB',
    fontFamily: 'Menlo',
    fontSize: 12,
  },
});
