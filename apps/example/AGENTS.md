<!-- paper:start -->
## Design system (paper)

Components are copied into `src/components/paper` from `../..` (v0.1.0). Config: `paper.json`.

- Before building UI, check what exists: `npx paper list`.
- Before using a component, read its rules and props: `npx paper docs <name>`.
- Add components with `npx paper add <name>`. Do not copy or rewrite them by hand.
- Style with StyleX (`stylex.create`) and the tokens in `src/components/paper/tokens.stylex.ts` (`npx paper tokens`). No raw hex/rgb colors.
- StyleX needs its bundler plugin (e.g. `@stylexjs/unplugin` for Vite/Next, or `@stylexjs/babel-plugin`); without it `stylex.create` throws at runtime.
- Import at least one CSS file from your entry (e.g. `import "./index.css"` in `main.tsx`). The StyleX plugin injects its generated CSS into the bundle's CSS; with no CSS import there is no stylesheet and components render unstyled.
- Run `npx paper check` before committing; it exits non-zero on violations.
- Installed: button, input.
<!-- paper:end -->
