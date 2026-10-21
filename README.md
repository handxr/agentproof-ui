# agentproof-ui

A minimalist, agent-first React design system. Black on white, Geist, lots of air, a 35rem column (the style of [juanhander.com](https://www.juanhander.com/)). Styled with [StyleX](https://stylexjs.com).

Like shadcn, the CLI copies component code into your project. You own the copy; agents read real code, not a black box in `node_modules`.

## Use it

```sh
npx paper init                 # paper.json, src/components/paper/tokens.stylex.ts, AGENTS.md section
npx paper add button input     # copy components
npx paper docs button          # summary, when to use, practices, props, examples (--json for agents)
npx paper check                # fails on raw colors outside tokens
```

You need `@stylexjs/stylex` and a StyleX bundler plugin (for Vite: `@stylexjs/unplugin`).

## Fork it

Everything lives in this repo. Point the CLI at your fork: `npx paper init --registry github:you/agentproof-ui`
(or a local path / URL to a `registry.json`). Edit `tokens/tokens.json` and the components, run `pnpm generate`.

## For LLMs

[`llms.txt`](llms.txt) is the index; [`llms-full.txt`](llms-full.txt) has every component's docs and examples.

## Develop

Node 22, pnpm. `pnpm install && pnpm check`. See [AGENTS.md](AGENTS.md) and [DESIGN.md](DESIGN.md).

## License

MIT
