# UI Components Catalog — compelling

Curated single-file reference for Beast codegen. Read this before scaffolding or editing `src/components/ui/*.btsx`. All components are Beast BTSX (`module`/`props`/`setup` → indented elements), use `cn` from `@/lib/utils` (`clsx`+`twMerge`), `Icon` from `@/lib/icons/index.btsx`, and `octane` hooks where stateful. Figma source: `https://app.paper.design/file/01KZGVETYAQKTHH625G2W9QFXQ/3-0` (page `component`).

## Design tokens (Figma → Tailwind)

- Backgrounds: `#FCFCFC` (card/popover), `#F8F7F7` (input), `#F1F1F1` (selected/segmented), `#7B7B7B` (muted icon/badge)
- Borders: `#E2E2E2` (input/select/trigger), `#ECECEC` (sidebar-closed), `#D4D4D4` (primary gradient border), `#D1D1D1` (tag variant)
- Foreground: `#121212` (primary text), `#7B7B7B` (placeholder/muted)
- Radius: `12` (primary button, sidebar-item, input), `10` (select/input trigger), `8` (icon wrap/item), `6` (kbd)
- Typography: `Inter 12/16 500 tracking -0.12px` (input/search), `Inter 14/20 600 tracking -0.28px` (primary button), `Inter 12/16 500` (select), `Geist Mono` fallback
- Shadows: `inset 0 1px 0 #FFFFFF33..65 , 0 3px 4px -1px #00000015 , 0 1px 4px -4px #00000013 + 0 8px 16px -12px #00000020` (select content)
- Dark: `dark:bg-muted|card|popover dark:border-border dark:text-foreground`

## Import map

```ts
import { cn } from "@/lib/utils"
import Icon from "@/lib/icons/index.btsx"
import type { IconName } from "@/lib/icons/types"
import { useState, useEffect, useRef } from "octane"
```

## Components

### 1. `brand.btsx` — Brand lockup

```btsx
module
  interface BrandProps { imageUrl: string; }
props { imageUrl }: BrandProps
div(className="flex items-center gap-3")
  div(className="flex items-center gap-5")
    img(src={imageUrl} className="size-16")
    div
      div(className="font-semibold text-orange-400 dark:text-orange-300 text-sm tracking-tight") Compelling
      div(className="font-semibold text-foreground text-base md:text-lg tracking-tight") Demos & Guides
```

Usage: `<Brand imageUrl="https://..." />` in `App.btsx` header.

### 2. `button.btsx` — Button

```btsx
module
  interface ButtonProps {
    variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "mist";
    size?: "sm" | "md" | "lg" | "icon";
    className?: string; disabled?: boolean; type?: "button"|"submit"|"reset";
    icon?: IconName; iconPosition?: "left"|"right"; onClick?: VoidFunction; label?: string; style?: HTMLButtonElement['style']
  }
```

- `base` `inline-flex justify-center rounded-xl font-mono font-medium transition shrink-0 min-w-10`
- `primary` `bg-[linear-gradient(in_oklab_180deg,oklab(92.2%_0_0)_0%,oklab(91.3%_0_0)_100%)] text-[#121212] border-[#D4D4D4] shadow-[inset_0_1px_0_#FFFFFF33,0_3px_4px_-1px_#00000015] rounded-[12px] font-semibold tracking-[-0.28px] font-[Inter]`
- `size` `sm: px-2 h-9 10px | md: px-2.5 h-10 text-sm | lg: px-3 h-11 12px`

```btsx
Button(variant="primary" label="Log out all")
Button(variant="outline" icon="eraser" label="Clear")
ButtonGroup(attached=false)
  Button(label="A") 
  Button(label="B")
```

Figma: `L8-0 115×40 rounded12` primary.

### 3. `button-group.btsx` — ButtonGroup

```btsx
module
  interface ButtonGroupProps {
    orientation?: "horizontal"|"vertical"; attached?: boolean;
    variant?: "default"|"segmented"; size?: "sm"|"md"|"lg"; className?: string; children?: HTMLElement
  }
props { orientation="horizontal", attached=true, variant="default", size="md", className, children }: ButtonGroupProps
```

- `variant segmented` → `bg-[#F1F1F1] dark:bg-muted p-1 gap-1 rounded-xl border #E2E2E2`
- `attached true` → `rounded-xl border divide-x overflow-hidden` + `[&>*]:rounded-none first:rounded-l-[11px] last:rounded-r-[11px]` (supports `button` + `a`)
- `size` → `[&>*]:h-9/10/11`

```btsx
ButtonGroup(attached=false variant="default")
  Button(label="Left")
  Button(label="Right")
ButtonGroup(variant="segmented")
  Button(label="Push")
```

### 4. `frame.btsx` — Frame

```btsx
module
  interface FrameProps { title?: string; subtitle?: string; className?: string; children?: HTMLElement; }
```

`bg-card border-border/50 rounded-xl overflow-hidden` + header `h-10 bg-background border-b px-3` with three dots. Usage: `Frame(title="Virtualized 3 columns") > div.h-[640px]`

### 5. `header.btsx` — Header (agnostic)

```btsx
module
  interface HeaderAction { id: string; label?: string; icon?: IconName; href?: string; variant?: ButtonProps["variant"]; size?: ButtonProps["size"]; className?: string; onClick?: VoidFunction; }
  interface HeaderProps {
    title: string; subtitle?: string; description?: string; icon?: IconName;
    isVisible?: boolean; toggleFn?: VoidFunction;
    pending?: boolean; pendingLabel?: string;
    actions?: HeaderAction[]; className?: string; actionsClassName?: string;
  }
```

Layout `flex-col lg:flex-row justify-between pb-5` + left `h1 text-4xl tracking-tighter` + subtitle `text-2xs uppercase` + description `text-[13px] font-mono` + `slot`. Actions rendered in `ButtonGroup attached=false` + pending badge `rounded-[10px] bg-card`.

```btsx
Header(title="Virtualized Masonry Grid" subtitle="GRID VIRTUALIZATION" description="..." isVisible={showInfo} toggleFn={toggleInfo} actions={[{id:"clear", label:"Clear", onClick: clear}]})
  // or agnostic slot
  Header(title="Page") 
    Button(label="Custom child")
```

### 6. `input.btsx` — Input (Figma M0-0)

```btsx
module
  interface InputProps {
    value?: string; defaultValue?: string; placeholder?: string; type?: string; disabled?: boolean;
    leftIcon?: IconName; rightSlot?: string; className?: string; inputClassName?: string;
    onChange?: (value:string)=>void; onKeyDown?: (e:KeyboardEvent)=>void;
  }
props { value, defaultValue, placeholder="Search files...", type="text", disabled, leftIcon="search", rightSlot="/", ... }: InputProps
setup
  const [inner,setInner]=useState(defaultValue??"")
  const val = value!==undefined ? value : inner
  const handleInput = (e:Event)=>{ const v=(e.target as HTMLInputElement).value; if(value===undefined) setInner(v); onChange?.(v) }
```

- Container `relative w-full max-w-[260px]`
- Left icon `absolute left-1 top-1 size-8 grid place-items-center text-[#7B7B7B]` (`search` 16, added to `icons.ts`)
- Input `w-full h-10 rounded-[12px] bg-[#F8F7F7] border-[#E2E2E2] pl-12 pr-14 text-[12px] font-medium tracking-[-0.12px] placeholder:text-[#7B7B7B] focus:ring-[#E2E2E2] focus:bg-[#FCFCFC]`
- Right `kbd absolute right-[7px] top-1/2 -translate-y-1/2 min-w-8 h-6 px-[6px] rounded-[6px] bg-[#7B7B7B] text-white`

```btsx
Input(value={query} onChange={(v)=>setQuery(v)} placeholder="Search title, category, author")
Input(defaultValue="hello" leftIcon="search" rightSlot="⌘K")
```

Figma: `M2-0 260×40 rounded12 pl48 pr56 bg #F8F7F7`.

### 7. `select.btsx` — Select (Figma M9-0: LB/MH/LN + LG)

```btsx
module
  interface SelectItem { value:string; label:string; disabled?:boolean; }
  interface SelectProps {
    value?: string; defaultValue?: string; placeholder?: string; label?: string; disabled?: boolean;
    items: SelectItem[]; onValueChange?: (v:string)=>void; className?: string;
    triggerClassName?: string; contentClassName?: string; size?: "sm"|"lg";
  }
setup
  const [open,setOpen]=useState(false)
  const [internal,setInternal]=useState(value??defaultValue??"")
  // outside mousedown + Escape close via useEffect + containerRef
```

- Trigger `inline-flex justify-between w-full h-9 px-3 rounded-[10px] border text-[12px] font-medium gap-2` Open `bg-[#FCFCFC] border-[#E2E2E2]` Closed `bg-[#F1F1F1] border-[#ECECEC]` + chevron `chevron-down-tiny 16 text-[#7B7B7B] rotate-180 when open`
- Content `absolute top-full mt-1 w-full bg-[#FCFCFC] border-[#E2E2E2] rounded-[10px] p-1 shadow-[0_1px_4px_-4px_#00000013,0_8px_16px_-12px_#00000020] max-h-60 overflow-auto`
- Item `px-2 py-2 rounded-[8px] text-[12px] font-medium` Selected `bg-[#F1F1F1] text-[#121212]` Unselected `text-[#7B7B7B] hover:bg-[#F1F1F1]`

```btsx
Select(items={[{value:"push",label:"Push"},{value:"email",label:"Email"}]} value={val} onValueChange={setVal} placeholder="Select...")
```

### 8. `tag.btsx` — Tag

```btsx
module
  interface TagProps { href?:string; variant?: "default"|"primary"|"secondary"|"outline"|"ghost"|"mist"; size?: "sm"|"md"|"lg"; icon?: IconName; label?: string; onRemove?: VoidFunction; }
```

`base rounded-lg font-display tracking-tighter border` + `primary` same gradient/shadow/rounded12 as Button + `size sm h-9 10px | md h-10 text-sm | lg h-10 12px`

```btsx
Tag(variant="primary" label="Beast Docs" href="https://...")
Tag(variant="ghost" label="Nature" onClick={...})
```

### 9. `sidebar/sidebar-item.btsx` + `sidebar/navs.ts`

```btsx
module
  interface Props { href:string; icon:IconName; label:string; value:string|number|HTMLElement; path:string; onNavigate:(href:string)=>void; }
setup
  const isSelected = path===href
// a w-full gap-3 pl-[3px] pr-[10px] py-[3px] rounded-[12px] border isSelected? bg-[#F1F1F1] border-[#E2E2E2] : transparent hover:bg-[#F1F1F1]
// icon wrap size-8 rounded-[8px] isSelected? bg-[#FCFCFC] shadow-[0_0_4px_rgba(18,18,18,0.10)] text-[#121212] : text-[#7B7B7B]
// Icon size20 m-0, label flex-1 12px 600 #121212, value ml-auto mono 11px #7B7B7B
```

`navs.ts` exports `navGroups: {title, items:{href,icon,label,value}}[]` used in `App.btsx`.

## Conventions for Beast authoring

- Always `import { cn } from "@/lib/utils"` and `Icon` when icon needed; icon prop type `IconName`.
- Controlled pattern: `value !== undefined ? value : internal` + `onChange/onValueChange` string callback (not event) — see `input`/`select` fix in `grid.btsx:163` (`onChange={(v)=>setQuery(v)}` not `(e)=>e.target.value`).
- Dark variants inline: `dark:bg-muted dark:border-border dark:text-foreground`.
- Slots: use `slot` for agnostic children (`header`, `frame`, `button-group`, `input`).
- Compile: `bunx beast build` (19–21 BTSX), `bun run typecheck` (`tsrx-tsc`), `bun run build` (vite).

## Quick scaffold

```btsx
import Header from "@/components/ui/header.btsx"
import Input from "@/components/ui/input.btsx"
import Select from "@/components/ui/select.btsx"
import ButtonGroup from "@/components/ui/button-group.btsx"
import Button from "@/components/ui/button.btsx"

Header(title="Page" actions={[{id:"save", label:"Save", variant:"primary", onClick: save}]})
  div(className="flex gap-2")
    Input(value={q} onChange={setQ} leftIcon="search")
    Select(items={opts} value={v} onValueChange={setV})
    ButtonGroup(attached=false)
      Button(label="A")
      Button(label="B")
```
