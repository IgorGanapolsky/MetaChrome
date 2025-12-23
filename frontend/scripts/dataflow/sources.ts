import fs from 'fs';
import path from 'path';
import { Source, DataRecord } from './core';

export class FileSource implements Source<string> {
  name = 'FileSource';

  constructor(
    private rootPaths: string[],
    private extensions: string[] = ['.md', '.mdx', '.txt']
  ) {}

  async *read(): AsyncGenerator<DataRecord<string>> {
    const files = this.rootPaths.flatMap((p) => this.listFiles(p));

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      yield {
        id: file,
        data: content,
        metadata: {
          filePath: file,
          fileName: path.basename(file),
          extension: path.extname(file),
        },
      };
    }
  }

  private listFiles(root: string): string[] {
    if (!fs.existsSync(root)) return [];
    const stat = fs.statSync(root);
    if (stat.isFile()) return [root];

    return fs
      .readdirSync(root)
      .flatMap((f) => this.listFiles(path.join(root, f)))
      .filter((f) => this.extensions.some((ext) => f.toLowerCase().endsWith(ext)));
  }
}
