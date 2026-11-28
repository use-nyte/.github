const repositories = [
  "use-nyte/.github",
  "use-nyte/docs",
  "use-nyte/eslint-config",
  "use-nyte/prettier-config",
  "use-nyte/nyte",
  "use-nyte/nyte-server",
  "use-nyte/nyte-ui",
  "use-nyte/nyte-web"
];
const refreshOnly = process.env.RENOVATE_REFRESH_ONLY === "true";
const targetRepository = process.env.RENOVATE_TARGET_REPOSITORY;

if (refreshOnly && !repositories.includes(targetRepository)) {
  throw new Error("Renovate refresh requires a configured Nyte repository");
}

module.exports = {
  platform: "github",
  extends: ["mergeConfidence:all-badges"],
  repositories: refreshOnly ? [targetRepository] : repositories,
  mode: refreshOnly ? "silent" : "full",
  onboarding: false,
  requireConfig: "ignored",
  dependencyDashboard: { enabled: false },
  automerge: false,
  branchPrefix: "renovate/",
  semanticCommits: "enabled",
  semanticCommitType: "chore",
  semanticCommitScope: "deps",
  prBodyTemplate:
    "{{{header}}}{{{table}}}{{{warnings}}}{{{controls}}}{{{notes}}}{{{changelogs}}}{{{configDescription}}}{{{footer}}}",
  prCreation: "immediate",
  prHourlyLimit: 0,
  rebaseWhen: "conflicted",
  hostRules: [
    {
      hostType: "npm",
      matchHost: "npm.pkg.github.com",
      token: process.env.RENOVATE_PACKAGE_REGISTRY_TOKEN
    }
  ],
  packageRules: [
    { matchDatasources: ["node-version"], groupName: "Node.js" },
    { matchPackageNames: ["pnpm"], groupName: "pnpm" },
    {
      matchDatasources: ["npm"],
      matchPackageNames: ["!@use-nyte/**"],
      minimumReleaseAge: "1 day",
      internalChecksFilter: "strict"
    },
    {
      matchManagers: ["npm"],
      matchDepTypes: ["dependencies", "devDependencies", "optionalDependencies"],
      rangeStrategy: "bump"
    },
    { matchManagers: ["github-actions"], pinDigests: false },
    {
      matchRepositories: ["use-nyte/nyte"],
      matchManagers: ["dockerfile"],
      matchDatasources: ["docker"],
      matchFileNames: ["Dockerfile"],
      pinDigests: true
    }
  ],
  customManagers: [
    {
      customType: "regex",
      managerFilePatterns: ["/(^|/)Dockerfile$/"],
      matchStrings: ["npm install --global pnpm@(?<currentValue>[0-9]+\\.[0-9]+\\.[0-9]+)"],
      depNameTemplate: "pnpm",
      datasourceTemplate: "npm"
    }
  ]
};
