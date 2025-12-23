import { retrieveGraphContext, closeGraphDriver } from '../src/services/ai/graphService';

async function testRetrieval() {
  const query = "GraphRAG System";
  console.log(`Testing retrieval for query: "${query}"...`);
  
  try {
    const context = await retrieveGraphContext(query);
    console.log('--- Retrieved Context ---');
    console.log(context);
    console.log('-------------------------');
    
    if (context.length > 0) {
      console.log('✅ Retrieval Test Passed: Context returned.');
    } else {
      console.log('⚠️ Retrieval Test: No context found (Expected if graph is empty).');
    }
  } catch (error) {
    console.error('❌ Retrieval Test Failed:', error);
  } finally {
    await closeGraphDriver();
  }
}

testRetrieval();
