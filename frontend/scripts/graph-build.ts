import fs from 'fs';
import path from 'path';
import { extractEntitiesFromText, upsertGraph } from '../src/services/ai/graphBuilder';
import { closeGraphDriver } from '../src/services/ai/graphService';

const DOCS_DIR = path.join(process.cwd(), '../docs');

const processFile = async (filePath: string) => {
  console.log(`Processing ${filePath}...`);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const entities = await extractEntitiesFromText(content);
    console.log(`  Extracted ${entities.nodes.length} nodes, ${entities.edges.length} edges.`);

    if (entities.nodes.length > 0) {
      await upsertGraph(entities);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
};

const main = async () => {
  const targetFile = process.argv[2];

  try {
    if (targetFile) {
      // Process specific file
      const fullPath = path.resolve(process.cwd(), '../docs', targetFile);
      if (fs.existsSync(fullPath)) {
        console.log(`Found 1 documents (target: ${targetFile}).`);
        await processFile(fullPath);
      } else {
        console.error(`File not found: ${fullPath}`);
      }
    } else {
      // Create docs dir if not exists (for testing)
      if (!fs.existsSync(DOCS_DIR)) {
        console.log(`Docs dir not found at ${DOCS_DIR}, skipping bulk build.`);
        return;
      }

      const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith('.md'));
      console.log(`Found ${files.length} documents.`);

      for (const file of files) {
        await processFile(path.join(DOCS_DIR, file));
      }
    }
    console.log('Graph build complete.');
  } catch (error) {
    console.error('Build failed:', error);
  } finally {
    await closeGraphDriver();
  }
};

main();
