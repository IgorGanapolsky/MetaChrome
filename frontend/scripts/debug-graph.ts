import { runCypher, closeGraphDriver } from '../src/services/ai/graphService';

async function debug() {
  console.log('Debugging Graph Content...');
  try {
    const result = await runCypher('MATCH (n) RETURN n LIMIT 50');
    console.log(`Found ${result.length} nodes.`);
    result.forEach((r: any, i: number) => {
      console.log(`[${i}]`, JSON.stringify(r.n.properties));
    });
  } catch (e) {
    console.error('Debug failed:', e);
  } finally {
    await closeGraphDriver();
  }
}

debug();
