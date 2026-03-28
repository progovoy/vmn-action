# VMN Action

[![vmn: automatic versioning](https://img.shields.io/badge/vmn-automatic%20versioning-blue)](https://github.com/progovoy/vmn)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-vmn--action-green)](https://github.com/marketplace/actions/automated-versioning)

Automated semantic versioning for GitHub Actions, powered by [vmn](https://github.com/progovoy/vmn).

Language-agnostic, git-tag-based versioning with support for monorepos, multi-app, release candidates, and conventional commits.

## Quick Start

```yaml
name: Version Stamp

on:
  push:
    branches: [main]

jobs:
  stamp:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # vmn needs full git history

      - id: vmn
        uses: progovoy/vmn-action@latest
        with:
          app-name: my_app
          do-stamp: true
          stamp-mode: patch
        env:
          GITHUB_TOKEN: ${{ github.token }}

      - run: echo "Stamped version ${{ steps.vmn.outputs.verstr }}"
```

## Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `app-name` | string | Yes | — | Name of the app to stamp |
| `do-stamp` | boolean | No | `false` | Perform a version stamp |
| `stamp-mode` | choice | No | `none` | Release mode: `major`, `minor`, `patch`, or `none` |
| `release-candidate` | boolean | No | `false` | Enter release candidate mode |
| `prerelease-name` | string | No | `rc` | Prerelease suffix (e.g., `rc` produces `1.2.3-rc.1`) |
| `release` | boolean | No | `false` | Release a prerelease version to final |
| `stamp-from-version` | string | No | — | Override the base version for stamping |
| `skip-version` | boolean | No | `false` | Skip versions between release candidates |
| `do-gen` | boolean | No | `false` | Generate a version file from a Jinja2 template |
| `gen-template-path` | string | No | — | Path to Jinja2 template file |
| `gen-output-path` | string | No | — | Path for generated output file |
| `gen-custom-yaml-path` | string | No | — | Path to custom YAML params file |
| `show-log-on-error` | boolean | No | `false` | Show vmn log on error |
| `debug-mode` | boolean | No | `false` | Enable extra debug logging |
| `install-nonstable-vmn-version` | boolean | No | `false` | Install latest RC version of vmn |

## Outputs

| Output | Description |
|--------|-------------|
| `verstr` | The version string after stamping (e.g., `1.2.3`) |
| `dirty` | `true` if changes exist since last stamp |
| `is_in_rc_mode` | `true` if the app is in release candidate mode |
| `verbose_yaml` | Full `vmn show --verbose` output as YAML |

## Examples

### Basic Stamp

Stamp a patch version on every push to main:

```yaml
name: Stamp Version

on:
  push:
    branches: [main]

jobs:
  stamp:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - id: vmn
        uses: progovoy/vmn-action@latest
        with:
          app-name: my_app
          do-stamp: true
          stamp-mode: patch
        env:
          GITHUB_TOKEN: ${{ github.token }}

      - run: echo "Version: ${{ steps.vmn.outputs.verstr }}"
```

### Manual Stamp with Mode Selection

Use `workflow_dispatch` to choose the release mode at trigger time:

```yaml
name: Manual Stamp

on:
  workflow_dispatch:
    inputs:
      stamp_mode:
        type: choice
        description: Release mode
        options:
          - patch
          - minor
          - major
        required: true

jobs:
  stamp:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - id: vmn
        uses: progovoy/vmn-action@latest
        with:
          app-name: my_app
          do-stamp: true
          stamp-mode: ${{ inputs.stamp_mode }}
        env:
          GITHUB_TOKEN: ${{ github.token }}

      - run: echo "Version: ${{ steps.vmn.outputs.verstr }}"
```

### Release Candidate Workflow

RC workflows have three phases:

**1. First RC** — Start a release candidate from a released version:

```yaml
- uses: progovoy/vmn-action@latest
  with:
    app-name: my_app
    do-stamp: true
    stamp-mode: minor          # The bump for the eventual release
    release-candidate: true
  env:
    GITHUB_TOKEN: ${{ github.token }}
# Result: 1.2.0-rc.1
```

**2. Subsequent RCs** — Increment the RC number (no stamp-mode needed):

```yaml
- uses: progovoy/vmn-action@latest
  with:
    app-name: my_app
    do-stamp: true
    release-candidate: true
  env:
    GITHUB_TOKEN: ${{ github.token }}
# Result: 1.2.0-rc.2, 1.2.0-rc.3, ...
```

**3. Release** — Promote the RC to a final release:

```yaml
- uses: progovoy/vmn-action@latest
  with:
    app-name: my_app
    do-stamp: true
    release: true
  env:
    GITHUB_TOKEN: ${{ github.token }}
# Result: 1.2.0
```

### Monorepo / Multi-App

Stamp multiple apps independently in one workflow:

```yaml
jobs:
  stamp:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [frontend, backend, api-gateway]
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - id: vmn
        uses: progovoy/vmn-action@latest
        with:
          app-name: ${{ matrix.app }}
          do-stamp: true
          stamp-mode: patch
        env:
          GITHUB_TOKEN: ${{ github.token }}

      - run: echo "${{ matrix.app }} version: ${{ steps.vmn.outputs.verstr }}"
```

### Version File Generation

Generate a version file from a Jinja2 template:

```yaml
- uses: progovoy/vmn-action@latest
  with:
    app-name: my_app
    do-gen: true
    gen-template-path: version.jinja2
    gen-output-path: version.txt
  env:
    GITHUB_TOKEN: ${{ github.token }}

- run: cat version.txt
```

## Permissions

The action requires a `GITHUB_TOKEN` environment variable for:
- Permission checks (verifies the triggering user has write access)
- Git operations (push tags)

The default `${{ github.token }}` works for most cases. For cross-repo scenarios, use a Personal Access Token with `repo` scope.

## Important Notes

- Always use `fetch-depth: 0` in `actions/checkout` — vmn needs the full git history to find previous version tags.
- The action automatically runs `vmn init` and `vmn init-app` if they haven't been run yet.
- Version information is stored in git tags, not in files — your repo stays clean.

## Links

- [vmn CLI documentation](https://github.com/progovoy/vmn) — full feature reference
- [vmn on PyPI](https://pypi.org/project/vmn/) — install locally with `pip install vmn`
- [Report an issue](https://github.com/progovoy/vmn-action/issues)
