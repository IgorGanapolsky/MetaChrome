/**
 * Core DataFlow definitions.
 * A Pipeline consists of a Source -> Transforms -> Sink.
 */

export interface DataRecord<T = any> {
  id: string;
  data: T;
  metadata?: Record<string, any>;
}

export interface Source<T> {
  name: string;
  read(): AsyncGenerator<DataRecord<T>>;
}

export interface Transform<T, U> {
  name: string;
  process(item: DataRecord<T>): AsyncGenerator<DataRecord<U>> | Promise<DataRecord<U> | null>;
}

export interface Sink<T> {
  name: string;
  write(items: AsyncGenerator<DataRecord<T>>): Promise<void>;
}

export class Pipeline<In, Out> {
  constructor(
    private source: Source<In>,
    private transforms: Transform<any, any>[],
    private sink: Sink<Out>
  ) {}

  async run(debug: boolean = false): Promise<void> {
    if (debug) console.log(`[Pipeline] Starting: ${this.source.name}`);
    
    let stream = this.source.read();

    for (const transform of this.transforms) {
      if (debug) console.log(`[Pipeline] Wiring transform: ${transform.name}`);
      stream = this.pipe(stream, transform);
    }

    if (debug) console.log(`[Pipeline] Writing to sink: ${this.sink.name}`);
    await this.sink.write(stream as any);
    
    if (debug) console.log('[Pipeline] Finished.');
  }

  private async *pipe<T, U>(
    input: AsyncGenerator<DataRecord<T>>,
    transform: Transform<T, U>
  ): AsyncGenerator<DataRecord<U>> {
    for await (const item of input) {
      const result = transform.process(item);
      if (result instanceof Promise) {
        const value = await result;
        if (value) yield value;
      } else {
        // It's a generator
        for await (const subItem of (result as AsyncGenerator<DataRecord<U>>)) {
          yield subItem;
        }
      }
    }
  }
}
