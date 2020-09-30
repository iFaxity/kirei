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
 * @param {ExcludeOptions} opts Options to pass
 * @returns {boolean}
 */
export default function compileExclude(opts: ExcludeOptions): (filename: string) => boolean {
  const exclude = new TestExclude({
    cwd: opts.cwd,
    include: opts.include,
    exclude: opts.exclude,
    extension: opts.extension,
    excludeNodeModules: opts.excludeNodeModules,
  });

  return (filename: string) => !exclude.shouldInstrument(filename);
}
