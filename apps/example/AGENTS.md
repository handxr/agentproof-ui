<!-- paper:start -->
## Design system (paper)

Components are copied into `src/components/paper` from `../..` (v0.1.0). Config: `paper.json`.

- Before building UI, check what exists: `npx paper list`.
- Before using a component, read its rules and props: `npx paper docs <name>`.
- Add components with `npx paper add <name>`. Do not copy or rewrite them by hand.
- Style with StyleX (`stylex.create`) and the tokens in `src/components/paper/tokens.stylex.ts` (`npx paper tokens`). No raw hex or rgb colors.
- StyleX needs its bundler plugin: `@stylexjs/unplugin` for Vite or Next, or `@stylexjs/babel-plugin`. Without it, `stylex.create` throws at runtime.
- Import at least one CSS file from your entry, for example `import "./index.css"` in `main.tsx`. The StyleX plugin adds its CSS to the bundle's stylesheet. With no CSS import, there is no stylesheet, and components render unstyled.
- Run `npx paper check` before you commit. It exits non-zero on violations.
- Installed: button, input.
<!-- paper:end -->
