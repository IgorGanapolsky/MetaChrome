import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { Sink, DataRecord } from './core';

export class JsonLineSink implements Sink<any> {
  name = 'JsonLineSink';
  constructor(private outputPath: string) {}

  async write(items: AsyncGenerator<DataRecord<any>>): Promise<void> {
    const fileStream = fs.createWriteStream(this.outputPath, { flags: 'w' });

    for await (const item of items) {
      const line = JSON.stringify(this.formatForVertex(item));
      fileStream.write(line + '\n');
    }

    fileStream.end();
  }

  private formatForVertex(item: DataRecord<any>) {
    // Adapt internal format to Vertex AI JSONL structure
    // structure from chunk-docs.js
    // id, structData: { source, summary_hint }, content: { mimeType, rawBytes }
    return {
      id: item.id.replace(/[^a-zA-Z0-9_]/g, '_'), // Ensure valid ID
      structData: {
        source: item.metadata?.fileName || 'unknown',
        summary_hint: item.data.summary_hint,
      },
      content: {
        mimeType: 'text/plain',
        rawBytes: Buffer.from(item.data.text).toString('base64'),
      },
    };
  }
}

export class VertexAISink implements Sink<any> {
  name = 'VertexAISink';

  constructor(
    private bucketUri: string,
    private dataStoreResource: string,
    private host = 'https://us-discoveryengine.googleapis.com'
  ) {}

  async write(items: AsyncGenerator<DataRecord<any>>): Promise<void> {
    // Vertex AI import expects a file in GCS.
    // We write a temp JSONL file, upload, then trigger import.

    const tempFile = path.join(os.tmpdir(), `metachrome-chunks-${Date.now()}.jsonl`);

    console.log('[VertexAISink] Writing local temp file...');
    const lines: string[] = [];
    for await (const item of items) {
      const line = JSON.stringify({
        id: item.id.replace(/[^a-zA-Z0-9_]/g, '_'),
        structData: {
          source: item.metadata?.fileName || 'unknown',
          summary_hint: item.data.summary_hint,
        },
        content: {
          mimeType: 'text/plain',
          rawBytes: Buffer.from(item.data.text).toString('base64'),
        },
      });
      lines.push(line);
    }
    fs.writeFileSync(tempFile, lines.join('\n') + '\n', { encoding: 'utf8' });

    console.log(`[VertexAISink] Uploading to ${this.bucketUri}...`);
    this.run(`gsutil cp ${tempFile} ${this.bucketUri}`);

    console.log('[VertexAISink] Triggering Import...');
    await this.triggerImport();

    // Cleanup
    fs.unlinkSync(tempFile);
  }

  private async triggerImport() {
    const url = `${this.host}/v1/${this.dataStoreResource}:import`;
    const body = {
      gcsSource: { inputUris: [this.bucketUri] },
      reconciliationMode: 'INCREMENTAL',
    };

    const token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
    const cmd = `curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d '${JSON.stringify(body)}' "${url}"`;

    this.run(cmd);
  }

  private run(cmd: string) {
    // In a real DataFlow, we might want this to be async/observable, but execSync is fine for now
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd(), shell: '/bin/bash' });
  }
}
