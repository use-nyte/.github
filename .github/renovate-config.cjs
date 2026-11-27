module.exports = {
  platform: "github",
  repositories: [
    "use-nyte/.github",
    "use-nyte/docs",
    "use-nyte/eslint-config",
    "use-nyte/prettier-config",
    "use-nyte/nyte",
    "use-nyte/nyte-server",
    "use-nyte/nyte-ui",
    "use-nyte/nyte-web"
  ],
  onboarding: false,
  requireConfig: "ignored",
  dependencyDashboard: { enabled: false },
  automerge: false,
  branchPrefix: "renovate/",
  semanticCommits: "enabled",
  semanticCommitType: "chore",
  semanticCommitScope: "deps",
  prCreation: "immediate",
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
