# Beast Diagnostics

Stable codes with `SourceSpan { start: {offset,line,column}, end }`. Fix in BTSX; inspect generated TSRX if Octane later errors.

## Parser errors (indentation / declaration)

| Code / message | Cause | Fix |
| --- | --- | --- |
| Indentation error | Child not indented > parent | Align to 2-space indent; parent `main.app` → child `p.eyebrow` at +2 |
| `Invalid props` / empty props | `props {}` or `props : {}` | `props { title, links }: Props` with typed `Props` |
| `Invalid import` / empty import | `import` with no code | `import X from "./Y.btsx"` |
| `Invalid module` / empty module | `module` with no body | Add `interface Props` or `const` inside `module` indent |
| `Invalid setup` / empty setup | `setup` with no code | Add hooks: `const [x,setX]=useState(0)` |
| Duplicate/misplaced declarations | Two `props` or `props` after template | One `props`, before template; `import→module→props→setup→template` |

Source-located: `file:line:column` points to offending token.

## Element errors

| Code | Cause | Fix |
| --- | --- | --- |
| Empty fragment | `fragment` with no body | Give body or remove |
| Empty style | `style` with no body | Add CSS block |
| Empty spread | `div(...)` with no `{ ...x }` | Use `div({ ...props })` |
| Non-spread braces | `div({ x })` | `div({ ...x })` |
| Invalid element syntax | `div.` or `div#` with empty | `div.app` or `div#app` |

## Control-flow errors

| Code | Cause | Fix |
| --- | --- | --- |
| Orphan empty | `empty` without `each` | Align `empty` under `each` |
| Empty empty branch | `empty` with no body | Add fallback |
| Invalid loop | `each` with no `in` or no body | `each item in items key item.id` + indented body |
| Empty switch / arm | `switch` with no body, `case` no expr | `switch v` / `case "a"` + body |
| Duplicate default | Two `default` | One `default` |
| Orphan case/default | `case` outside `switch` | Nest inside `switch` |
| Invalid try header | `try` with expr | Bare `try` |
| Missing continuation | `try` body with no `pending`/`catch` | Add `pending` or `catch err` |
| Duplicate pending/catch | Two same | One each; `pending` before `catch` |
| Orphan pending/catch | Without `try` | Nest under `try` |

## Component errors

| Code | Cause | Fix |
| --- | --- | --- |
| Missing component name | `component` with no name | `component Card` |
| Lowercase name | `component card` | Capitalized `Card` |
| Empty body / missing template | No indented body | Indent template under `component` |

## Generator / Octane passthrough

- `Component name derived from filename` → filename must sanitize to PascalCase component
- Octane compiler error on generated TSRX → read TSRX output; fix BTSX (e.g. missing `key`, bad attribute expr), not TSRX. Run `bunx tsc --noEmit` with `@tsrx/typescript-plugin`.

## Debugging workflow

1. Read diagnostic `span` (line/col) → open file at that line
2. Check `references/beast-syntax-cheatsheet.md` for correct indentation/shape
3. Re-compile: `bunx beast compile src/App.btsx --out /tmp/App.tsrx` and diff
4. If Vite build fails, check `vite.config.ts` has `plugins: [beastOctane()]` and `tsconfig.json` has `plugins: [{ name: "@tsrx/typescript-plugin" }]` + `tsrx.compiler: "octane"`

## Project builder

- Dotted component APIs (`Theme.Provider`) preserved, class shorthand untouched
- `buildBeastProject` mirrors TSRX tree, validates natives, prunes stale manifest outputs only after success
- Ignores unsafe stale paths, skips `node_modules/.beast`

Bounds: individual reads capped 4 MiB, no exec, no secrets in reports.
