import TestExclude from 'test-exclude';

interface SkipConfig {
  include?: string|string[];
  exclude?: string|string[];
  extension?: string|string[];
  excludeNodeModules?: boolean,
}

function compileSkip(opts: SkipConfig): (filename: string) => boolean {
  const exclude = new TestExclude({
    cwd: process.cwd(),
    include: opts.include,
    exclude: opts.exclude,
    extension: opts.extension,
    excludeNodeModules: opts.excludeNodeModules,
  });

  return (filename: string) => exclude.shouldInstrument(filename);
}

export = compileSkip;
