import TestExclude from 'test-exclude';

interface ExcludeOptions {
  cwd?: string;
  include?: string|string[];
  exclude?: string|string[];
  extension?: string|string[];
  excludeNodeModules?: boolean,
}

/**
 * Compiles an exclusion pattern matcher from test-exclude
 * @param opts - Options to pass to the exclude matcher
 * @returns A function that returns true if file should not be compiled
 */
export function compileExclude(opts: ExcludeOptions): (filename: string) => boolean {
  const exclude = new TestExclude({
    cwd: opts.cwd,
    include: opts.include,
    exclude: opts.exclude,
    extension: opts.extension,
    excludeNodeModules: opts.excludeNodeModules,
  });

  return (filename: string) => !exclude.shouldInstrument(filename);
}
