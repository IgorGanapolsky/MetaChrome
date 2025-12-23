import neo4j, { Driver, Session } from 'neo4j-driver';
import { appConfig } from '../../shared/lib/config';

let driver: Driver | null = null;

export const getGraphDriver = (): Driver => {
  if (!driver) {
    const { uri, username, password } = appConfig.neo4j || {};
    // Fallback to local defaults if config is missing (dev mode)
    const dbUri = uri || 'bolt://localhost:7687';
    const dbUser = username || 'neo4j';
    const dbPass = password || 'password';

    driver = neo4j.driver(dbUri, neo4j.auth.basic(dbUser, dbPass), { encrypted: false });
  }
  return driver;
};

export const closeGraphDriver = async () => {
  if (driver) {
    await driver.close();
    driver = null;
  }
};

export const runCypher = async (query: string, params: Record<string, any> = {}) => {
  const driver = getGraphDriver();
  const session: Session = driver.session();
  try {
    const result = await session.run(query, params);
    return result.records.map((record: any) => record.toObject());
  } finally {
    await session.close();
  }
};

export const retrieveGraphContext = async (query: string): Promise<string> => {
  // Simple extraction of entities from query for lookup
  const words = query.split(/\s+/).map((w) => w.replace(/[^a-zA-Z0-9]/g, ''));

  // 1-hop retrieval query
  // Find nodes matching keywords (fuzzy), then find their neighbors
  const cypher = `
    MATCH (n:Entity)
    WHERE ANY(word IN $words WHERE toLower(n.id) CONTAINS toLower(word)) 
       OR toLower(n.description) CONTAINS toLower($query)
       OR toLower(n.id) CONTAINS toLower($query)
    WITH n
    MATCH (n)-[r]-(neighbor)
    RETURN n, r, neighbor
    LIMIT 20
  `;

  const records = await runCypher(cypher, { words, query });

  if (records.length === 0) return '';

  // Format context text
  const contextLines = records.map((rec: any) => {
    const n = rec.n.properties;
    const r = rec.r.properties;
    const target = rec.neighbor.properties;
    const type = rec.r.type;
    return `${n.id} (${n.type}) --[${type}: ${r.description || ''}]--> ${target.id} (${target.type})`;
  });

  return [...new Set(contextLines)].join('\n');
};
