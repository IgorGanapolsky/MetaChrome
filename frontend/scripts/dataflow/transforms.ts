
import { Transform, DataRecord } from './core';

/**
 * Splits text into paragraphs then sentences.
 */
export class SentenceSplitterTransform implements Transform<string, string[]> {
  name = 'SentenceSplitter';

  async *process(item: DataRecord<string>): AsyncGenerator<DataRecord<string[]>> {
    const text = item.data;
    const paragraphs = text
        .replace(/\r\n/g, '\n')
        .split(/\n\s*\n+/)
        .map((p: string) => p.trim())
        .filter(Boolean);

    const sentences = paragraphs.flatMap((p: string) => 
        p
        .replace(/\r\n/g, '\n')
        .split(/(?<=[.!?])\s+/)
        .map((s: string) => s.trim())
        .filter(Boolean)
    );

    yield {
        ...item,
        data: sentences
    };
  }
}

interface Chunk {
    text: string;
    summary_hint: string;
}

/**
 * Chunks sentences into overlapping windows.
 */
export class ChunkingTransform implements Transform<string[], Chunk> {
  name = 'Chunking';

  constructor(private targetWords = 250, private overlapRatio = 0.15) {}

  async *process(item: DataRecord<string[]>): AsyncGenerator<DataRecord<Chunk>> {
    const sentences = item.data;
    let i = 0;
    let chunkIndex = 0;

    while (i < sentences.length) {
        let words = 0;
        let start = i;
        while (i < sentences.length) {
            const sentenceWords = sentences[i].split(/\s+/).filter(Boolean).length;
            if (words + sentenceWords > this.targetWords && words > 0) break; // Break if we would exceed target, unless empty
            
            words += sentenceWords;
            i++;
        }
        
        const end = i;
        const slice = sentences.slice(start, end);
        if (slice.length === 0) break;

        const text = slice.join(' ');
        // summary_hint is heuristic: first 2 sentences.
        const summary_hint = slice.slice(0, 2).join(' ').slice(0, 320);

        yield {
            id: `${item.id}__${chunkIndex++}`,
            data: { text, summary_hint },
            metadata: { ...item.metadata }
        };

        const overlapCount = this.overlapRatio === 0 ? 0 : Math.max(1, Math.round(slice.length * this.overlapRatio));
        i = Math.max(start + 1, end - overlapCount);
    }
  }
}
