import { ChunkingTransform, SentenceSplitterTransform } from '../transforms';

describe('SentenceSplitterTransform', () => {
  it('splits text into sentences', async () => {
    const transform = new SentenceSplitterTransform();
    const input = { id: '1', data: 'Hello world. This is a test! How are you?' };

    const generator = transform.process(input);
    // It's a generator, so we iterate
    let result: any[] = [];
    if ('next' in generator) {
      // AsyncGenerator check
      for await (const item of generator) {
        result.push(item);
      }
    }

    expect(result).toHaveLength(1); // One input -> one output record containing array of sentences
    expect(result[0].data).toEqual(['Hello world.', 'This is a test!', 'How are you?']);
  });
});

describe('ChunkingTransform', () => {
  it('chunks sentences into windows', async () => {
    const transform = new ChunkingTransform(5, 0); // small target words, no overlap
    const sentences = ['One two.', 'Three four.', 'Five six.', 'Seven eight.'];
    const input = { id: '1', data: sentences };

    const generator = transform.process(input);
    let result: any[] = [];
    if ('next' in generator) {
      for await (const item of generator) {
        result.push(item);
      }
    }

    // 'One two. Three four.' = 4 words. 'Five six.' adds 2 => 6 > 5. So chunk 1 ends.
    // Expect chunk 1: "One two. Three four."
    // Expect chunk 2: "Five six. Seven eight."

    expect(result).toHaveLength(2);
    expect(result[0].data.text).toBe('One two. Three four.');
    expect(result[1].data.text).toBe('Five six. Seven eight.');
  });
});
