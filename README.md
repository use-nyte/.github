# .github

This repository hosts shared GitHub workflows for the `use-nyte` org.

To use the Node.js formatting workflow from another repository, add a small caller workflow like this:

```yaml
name: Format Node.js Code

on:
  pull_request:
    branches:
      - main

permissions:
  contents: write

jobs:
  format:
    uses: use-nyte/.github/.github/workflows/format-nodejs.yml@v1
    with:
      working-directory: .
    secrets: inherit
```

Pin the `uses:` reference to a released tag like `v1` so every repo gets a stable workflow version.

If a package lives in a subdirectory, change `working-directory` to that path.