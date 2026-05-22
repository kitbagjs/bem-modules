# @kitbag/bem-modules

> Type-safe [BEM](https://getbem.com/) helper — autocomplete your blocks, elements, and modifiers.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
[![Types: included](https://img.shields.io/badge/types-included-blue.svg)](#typescript)

## Why

BEM is a great naming convention, but using it means writing class names like `card__title--highlighted` by hand — which is tedious, error-prone, and noisy. With CSS Modules it's even worse: `styles['card__title--highlighted']`.

`bem-modules` gives you a clean function call and works two ways:

**Without CSS Modules** — builds raw BEM class strings. A lightweight alternative to concatenating while also ensuring the modifiers get applied correctly.

```ts
import { bem } from '@kitbag/bem-modules'

bem('navBar', 'item', 'active')
// → 'nav-bar__item nav-bar__item--active'
```

**With CSS Modules** — looks up hashed class names from your styles object with full autocomplete for every block, element, and modifier that exists in your stylesheet.

```ts
import { createBem } from '@kitbag/bem-modules'
import styles from './card.module.css'

const bem = createBem(styles)

bem('card', 'title', 'highlighted')
// → '_card__title_x2 _card__title--highlighted_x3'
```

### Why BEM + CSS Modules?

In many ways, both BEM and CSS Modules aim to make styles modular and avoid cross-component interference, but BEM does it via a naming convention in a global namespace, while CSS Modules do it via tooling and local scope.

**BEM gives you meaningful structure.** Class names like `card__title--highlighted` tell you what a class is (a title inside a card), what state it represents (highlighted), and how it relates to other classes. This structure is visible in devtools, making debugging straightforward.

**CSS Modules give you scoping.** They guarantee your class names won't collide with anything else in the application. Even if two components both have a `.title` class, the generated hashes (like `_title_x7f2a`) protect styles from leaking between them.

Together they provide a powerful combination of readability, enforced structure, and isolation.

- Without BEM, CSS Modules class names are flat and unstructured — you lose the ability to see component relationships at a glance in devtools.
- Without CSS Modules, BEM relies on discipline alone to avoid collisions across a large codebase.

---

## Installation

Install `@kitbag/bem-modules` with your favorite package manager:

```bash
# bun
bun add @kitbag/bem-modules
# yarn
yarn add @kitbag/bem-modules
# npm
npm install @kitbag/bem-modules
```

---

## Quick start

```ts
import { bem } from '@kitbag/bem-modules'

bem('card')                            // 'card'
bem('card', 'title')                   // 'card__title'
bem('card', 'title', 'highlighted')    // 'card__title card__title--highlighted'
bem('card', null, 'featured')          // 'card card--featured'
```

### With CSS Modules

TypeScript infers the valid blocks, elements, and modifiers from your styles object — rename a class in CSS and every stale usage becomes a type error.

#### In React

```css
/* card.module.css */
.card { /* ... */ }
.card--featured { /* ... */ }
.card__title { /* ... */ }
.card__title--highlighted { /* ... */ }
.card__title--large { /* ... */ }
.card__body { /* ... */ }
```

```tsx
import { createBem } from '@kitbag/bem-modules'
import styles from './card.module.css'

const bem = createBem(styles)

function Card({ title }: { title: string }) {
  const [highlighted, setHighlighted] = useState(false)

  return (
    <div className={bem('card')}>
      <h2 className={bem('card', 'title', [highlighted && 'highlighted'])}>{title}</h2>
      <div className={bem('card', 'body')} />
    </div>
  )
}
```

#### In Vue

```vue
<script setup lang="ts">
  import { createBem } from '@kitbag/bem-modules'
  import { useCssModule } from 'vue'

  const styles = useCssModule()
  const bem = createBem(styles)
</script>

<template>
  <div class="${bem('card')}">
    <h2 class="${bem('card', 'title', [highlighted && 'highlighted'])}">${title}</h2>
    <div class="${bem('card', 'body')}"></div>
  </div>
</template>

<style module>
  .card {
    /* ... */
  }
  .card__title {
    /* ... */
  }
</style>
```

## Conditional modifiers

Modifiers accept an array, and **falsy values (`false`, `null`, `undefined`, `0`, `''`) are filtered out** — perfect for toggling classes from state:

```ts
bem('card', 'title', [
  'highlighted',
  isLarge && 'large',      // included only when isLarge is truthy
  isActive && 'active',    // included only when isActive is truthy
])
```

---

## Options

```ts
createBem(styles, { casing: 'kebab', strict: false })
```

### `casing`

Controls **which casing your editor autocompletes** for blocks, elements, and modifiers. This is purely a type-level convenience — at runtime every input is converted to kebab-case, so the resolved class is identical regardless of casing.

| Value      | You write                      | Resolves to            |
| ---------- | ------------------------------ | ---------------------- |
| `'kebab'`  | `bem('nav-bar', 'item')`       | `nav-bar__item`        |
| `'camel'`  | `bem('navBar', 'item')`        | `nav-bar__item`        |
| `'pascal'` | `bem('NavBar', 'Item')`        | `nav-bar__item`        |

Defaults to `'kebab'`, matching CSS class names as authored. Choose `'camel'` or `'pascal'` if you prefer those identifiers in your TypeScript while keeping kebab-case in CSS.

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

const strict = createBem(styles, { strict: true })
strict('card', 'title', 'nonexistent') // type error — and only styles['card__title'] at runtime
```

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
