# Beast BTSX Syntax Cheatsheet

Compact authoring for TSRX. Indentation is structure. Octane owns runtime.

## File shape

```btsx
import Panel from "./Panel.btsx"
import { useState } from "octane"

module
  interface Props {
    title: string
    links: { id: string, label: string, url: string }[]
  }
  // any raw TypeScript at module scope

props { title, links }: Props
setup
  const [count, setCount] = useState(0)
  const doubled = useMemo(() => count * 2, [count])

// template root(s)
main.app
  p.eyebrow BTSX → TSRX → Octane
  h1 #{title}
  button(onClick={() => setCount(count + 1)}) Count #{count}
```

Rules: `import` → `module` (multiline TS, keep as-is) → `props` (destructured, typed) → `setup` (hooks, TS) → template. `component` declares tagless locals.

## Elements

```
tag               → div, h1, p, ul, li, header
tag.class         → div.card
tag#id            → div#app
tag.class#id      → main.app#hero
tag.class1.class2 → div.flex.gap
Component         → Panel, AdminPanel (capitalized)
```

Attributes: `a(href={url} target="_blank" rel="noreferrer")`, `div(class="x")`, `input(disabled)`, `div(data-testid="hero")`, `div({ ...props })` spread (precedence = authored order), `div#app`, `p.eyebrow`, `a.button(id={link.id})`.

Text: `p Hello`, `h1 #{title}`, `p Count #{count} of #{total}`, `p Escaped \# not interpolation`, `code src/App.btsx.`

## Control flow (emits native Octane)

```btsx
if user.isAdmin
  AdminPanel(userId={user.id})
elseif user.guest
  p Guest view
else
  p Welcome, #{user.name}

each item, i in items key item.id
  li #{item.name}
empty
  p No items

switch variant
  case "editor"
    Editor()
  case "view"
    Viewer()
  default
    Empty()

try
  Content()
pending
  p Loading...
catch err
  p Error #{err.message}
# pending-only or catch-only also valid
```

Keys: prefer `key item.id`; single-root loop hoists key. `empty` aligned with `each`.

## Composition

```btsx
# implicit fragment (multiple roots auto-wrapped)
div One
div Two

# explicit fragment
fragment
  div A
  div B

# dotted provider + context
module
  const Theme = createContext("light")
Theme.Provider(value="dark")
  Child()
setup
  const theme = use(Theme)

# portal
setup
  const body = useMemo(() => document.body, [])
createPortal(body)
  Modal()

# lazy + suspense + error
setup
  const Lazy = lazy(() => import("./Panel.tsrx"))
Suspense(fallback=p Loading...)
  Lazy()
```

## Styles

```btsx
style
  :global(body) { margin: 0; }
  .app { width: min(680px, 100vw - 3rem); }
  .button:hover { opacity: 0.8; }
  #beast { background: #fafafa; }
```

Scoped to component; `:global()` escapes.

## Comments, line breaks, interpolation

```btsx
# text line with interpolation
p Start building in
  span.arrow →
  code src/App.btsx.

# escape
p Price \#5

# blank lines and module comments preserved in TSRX output
module
  // comment kept
  const x = 1
```

## Compiled TSRX shape (what Octane sees)

```tsrx
import Panel from "./Panel.btsx"

export default function Card({ title, links }: Props) @{
  <div className="app">
    <p className="eyebrow">BTSX → TSRX → Octane</p>
    <h1>{title}</h1>
    @for (const link of links; key link.id) {
      <a className="button" id={link.id} href={link.url}>{link.label}</a>
    }
  </div>
}
```

Beast keeps output readable; Octane validates/lowers.

## Common gotchas

- Indentation: 2 spaces; `SourceSpan` reports line/column on error
- Props must be destructured: `props { a, b }: Props` not `props a: Props`
- Empty `fragment`/`style`/`spread`/`if` body → invalid syntax
- Spread must be `{ ...x }`, not `{ x }`
- Tagless locals need `component Name` with Capitalized name
