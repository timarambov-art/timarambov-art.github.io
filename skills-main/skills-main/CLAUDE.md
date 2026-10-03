# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Bundle CLI via obuild (outputs to dist/)
pnpm dev <args>       # Run CLI from source: e.g. pnpm dev add vercel-labs/agent-skills --list
pnpm test             # Run all tests (vitest)
pnpm test <file>      # Run specific test(s): e.g. pnpm test tests/sanitize-name.test.ts
pnpm type-check       # TypeScript check (no emit)
pnpm format           # Prettier write (required before committing — CI enforces this)
pnpm format:check     # Prettier check without writing
```

> **Node ≥ 22.20.0** and **pnpm** (v10.17.1) are required. The package manager is `pnpm`, not `npm`.

When adding a new agent, also run:

```bash
pnpm run -C scripts validate-agents.ts   # Validate agent definitions
pnpm run -C scripts sync-agents.ts       # Update README.md + package.json keywords
```

## Architecture

The CLI entry point is `src/cli.ts`, which routes subcommands to their modules. The build bundles everything into `dist/` via `obuild`; `bin/cli.mjs` is the published executable.

### Core data flow for `skills add`

```
source argument
    → src/source-parser.ts  (normalize to ParsedSource: github/gitlab/git/local/well-known/download)
    → src/git.ts            (clone to temp dir)
    → src/skills.ts         (discover SKILL.md files inside the clone)
    → src/add.ts            (interactive prompt → user selects agents + skills)
    → src/installer.ts      (write symlinks or copies into each agent's skills dir)
    → src/skill-lock.ts     (update ~/.agents/.skill-lock.json global lock)
    → src/local-lock.ts     (update skills-lock.json project lock, committed to repo)
```

### Key modules

| Module | Role |
|---|---|
| `src/agents.ts` | Defines every supported agent (`AgentConfig`): skill dir paths, detection logic, flags |
| `src/skills.ts` | Discovers `SKILL.md` files within a directory; enforces 3-level depth limit |
| `src/source-parser.ts` | Parses GitHub shorthand, full URLs, SSH, Azure DevOps, local paths into `ParsedSource` |
| `src/installer.ts` | Writes skills (symlink or copy) and implements `listInstalledSkills` |
| `src/skill-lock.ts` | Global lock at `~/.agents/.skill-lock.json` (v3 format); used for update checks |
| `src/local-lock.ts` | Project lock `skills-lock.json` (committed); restored via `skills install` |
| `src/providers/` | Remote skill discovery providers (GitHub, HuggingFace, Mintlify, registry) |
| `src/sanitize.ts` | `sanitizeName()` — path-traversal prevention for skill directory names |
| `src/plugin-manifest.ts` | Discovers skills declared in `.claude-plugin/marketplace.json` or `plugin.json` |

### Two lock files

- **`~/.agents/.skill-lock.json`** — global, machine-local; tracks installed skills with `skillFolderHash` (GitHub tree SHA) for update detection.
- **`skills-lock.json`** — project-local, committed; enables reproducible restores via `skills install`.

Lock file format is **v3**. Reading an older version wipes it; users must reinstall.

### Update checking

`skills check` / `skills update` compare `skillFolderHash` in the global lock against the current GitHub Trees API response. Auth order: anonymous → `GITHUB_TOKEN`/`GH_TOKEN` env → `gh api` (without exposing the token) → authenticated Git clone fallback.

### Skill discovery depth

`src/skills.ts` walks known container directories (e.g. `skills/`, `.claude/skills/`) up to **3 levels deep** by default. Pass `--full-depth` to also search outside these containers.

### Adding a new agent

1. Add an `AgentConfig` entry in `src/agents.ts`
2. Run validate + sync scripts (see Commands above)
3. The sync scripts update `README.md` and `package.json` keywords automatically — don't edit those by hand
