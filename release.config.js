module.exports = {
  extends: ['semantic-release-monorepo'],
  branches: ['master'],
  plugins: [
    [
      '@semantic-release/commit-analyzer', {
        preset: 'angular',
        releaseRules: [
          { type: 'refactor', release: 'patch' },
          { type: 'style', release: 'patch' },
          { type: 'break', release: 'major' },
        ],
      },
    ],
    '@semantic-release/release-notes-generator',
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md',
    }],
    '@semantic-release/npm',
    '@semantic-release/github',
    ['@semantic-release/git', {
      assets: [ 'CHANGELOG.md', 'package.json' ],
      message: 'chore(release): ${nextRelease.gitTag} [skip ci]',
    }],
  ],
};
