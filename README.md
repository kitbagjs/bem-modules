# bem-modules

> Type-safe [BEM](https://getbem.com/) helper for CSS Modules — autocomplete your blocks, elements, and modifiers, then resolve them to hashed class names at runtime.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
[![Types: included](https://img.shields.io/badge/types-included-blue.svg)](#typescript)

`bem-modules` reads the keys of your CSS Modules `styles` object and turns them into a small, fully-typed `bem()` function. You write `bem('card', 'title', 'highlighted')` and get back the hashed classes — with editor autocomplete for every block, element, and modifier that actually exists in your stylesheet, and a type error for anything that doesn't.

```ts
import { createBem } from 'bem-modules'
import styles from './card.module.css'

const bem = createBem(styles)

bem('card')                          // → "_card_x1"
bem('card', 'title')                 // → "_card__title_x2"
bem('card', 'title', 'highlighted')  // → "_card__title_x2 _card__title--highlighted_x3"
```

---

## Why

CSS Modules hash your class names (`card__title` → `_card__title_x2`), which is great for scoping but awkward to use. You either reference `styles['card__title']` everywhere — losing autocomplete and inviting typos — or you reach for a `classnames`-style helper that knows nothing about your stylesheet.

`bem-modules` closes that gap:

- **Autocomplete is driven by your CSS.** The set of valid blocks, elements, and modifiers is inferred from the keys of your `styles` object. Rename a class in CSS and TypeScript flags every stale usage.
- **BEM structure is enforced by types.** Elements only autocomplete for the block they belong to; modifiers only for the right block/element pair.
- **No string concatenation.** You pass parts, not `block__element--modifier` strings, so you can't fat-finger a separator.

---

## Installation

```bash
npm install bem-modules
```

`bem-modules` ships as ESM with bundled type declarations. Its only runtime dependency is [`string-ts`](https://github.com/gustavoguichard/string-ts).

---

## Quick start

Given a CSS Modules file written with BEM class names:

```css
/* card.module.css */
.card { /* ... */ }
.card--featured { /* ... */ }
.card__title { /* ... */ }
.card__title--highlighted { /* ... */ }
.card__title--large { /* ... */ }
.card__body { /* ... */ }
```

Create a `bem` helper once and use it throughout the component:

```tsx
import { createBem } from 'bem-modules'
import styles from './card.module.css'

const bem = createBem(styles)

function Card({ highlighted, title }: { highlighted: boolean; title: string }) {
  return (
    <div className={bem('card')}>
      <h2 className={bem('card', 'title', [highlighted && 'highlighted'])}>{title}</h2>
      <div className={bem('card', 'body')} />
    </div>
  )
}
```

---

## Usage

`createBem(styles)` returns a `bem()` function with four typed call shapes.

### Block

```ts
bem('card')
// → styles['card']
```

### Block + element

```ts
bem('card', 'title')
// → styles['card__title']
```

### Block + element + modifier(s)

The base `block__element` class is always included, followed by each modifier class.

```ts
bem('card', 'title', 'highlighted')
// → styles['card__title'] + ' ' + styles['card__title--highlighted']

bem('card', 'title', ['highlighted', 'large'])
// → base + both modifier classes
```

### Block + modifier (no element)

For the less common case of a modifier on the block itself, pass `null` as the element. The base `block` class is always included.

```ts
bem('card', null, 'featured')
// → styles['card'] + ' ' + styles['card--featured']
```

---

## Conditional modifiers

Modifiers accept an array, and **falsy values (`false`, `null`, `undefined`, `0`, `''`) are filtered out** — perfect for toggling classes from state:

```ts
bem('card', 'title', [
  'highlighted',
  isLarge && 'large',      // included only when isLarge is truthy
  isActive && 'active',
])
```

Use the array form for conditionals so the result stays type-checked.

---

## Options

```ts
createBem(styles, { casing: 'kebab', strict: false })
```

### `casing`

Controls **which casing your editor autocompletes** for blocks, elements, and modifiers. This is purely a type-level convenience — at runtime every input is converted to kebab-case before lookup, so the resolved class is identical regardless of casing.

| Value      | You write                      | Resolves to            |
| ---------- | ------------------------------ | ---------------------- |
| `'kebab'`  | `bem('nav-bar', 'item')`       | `nav-bar__item`        |
| `'camel'`  | `bem('navBar', 'item')`        | `nav-bar__item`        |
| `'pascal'` | `bem('NavBar', 'Item')`        | `nav-bar__item`        |
| `'any'`    | any string accepted            | kebab-cased input      |

Defaults to `'kebab'`, matching CSS Modules keys as authored. Choose `'camel'` or `'pascal'` if you prefer those identifiers in your TypeScript while keeping kebab-case in CSS. `'any'` disables autocomplete checking entirely and accepts any string.

```ts
const bem = createBem(styles, { casing: 'camel' })
bem('navBar', 'item', 'active') // resolves to nav-bar__item--active
```

### `strict`

Controls what happens when a requested class **isn't found** in the `styles` object — both at runtime and in the type signature.

- `false` (default) — falls back to the raw BEM key (e.g. `'card__title--nonexistent'`). Handy for global classes or classes composed from another source. The input type is **widened to any string** while still suggesting the keys from your `styles` object, so unknown classes don't raise a type error.
- `true` — drops unmapped classes from the output entirely, and **restricts the input type** to the known keys, so unknown classes are a compile-time error.

```ts
const loose = createBem(styles) // strict: false
loose('card', 'title', 'nonexistent') // ok — falls back to 'card__title--nonexistent'

const bem = createBem(styles, { strict: true })
bem('card', 'title', 'nonexistent') // type error — and only styles['card__title'] at runtime
```

---

## Type utilities

The same types that power autocomplete are exported, so you can derive precise types from a `styles` object:

```ts
import type { Blocks, Elements, Modifiers } from 'bem-modules'

type S = typeof styles

type Block    = Blocks<S>                  // 'card' | 'nav-bar'
type Element  = Elements<S, 'card'>        // 'title' | 'body'
type Modifier = Modifiers<S, 'card', 'title'> // 'highlighted' | 'large'
type BlockMod = Modifiers<S, 'card'>       // 'featured' | 'dark-mode'
```

Also exported: `Styles`, `Casing`, and `BemOptions`.

---

## How it works

1. **At the type level**, `createBem` parses the keys of your `styles` object against the BEM grammar (`block__element--modifier`) to build unions of valid blocks, elements, and modifiers. Each `bem()` overload constrains its arguments to those unions.
2. **At runtime**, the arguments are kebab-cased and reassembled into BEM keys, which are looked up in `styles`. The base class plus any modifier classes are de-duplicated and joined with spaces.

Because lookup happens against the real `styles` object, the output is always the actual hashed class names CSS Modules generated.

## TypeScript

- Requires a CSS Modules setup where importing a stylesheet yields a `Record<string, string>` of BEM keys to hashed values (the default for most bundlers, e.g. Vite, Next.js, webpack `css-loader`).
- For the strongest inference, ensure your styles object is treated as `const`/literal — most CSS Modules type plugins already emit literal keys.
- The library is `strict`-mode clean and ships its own `.d.ts`.

---

## Development

```bash
npm install      # install dependencies
npm test         # run the test suite once (vitest)
npm run test:watch
npm run build    # bundle with tsup → dist/
```

---

## License

MIT
