# @kitbag/bem-modules

> Type-safe [BEM](https://getbem.com/) helper — autocomplete your blocks, elements, and modifiers.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
[![Types: included](https://img.shields.io/badge/types-included-blue.svg)](#typescript)

## Why

BEM is a great naming convention, but using it means writing class names like `card__title--highlighted` by hand — which is tedious, error-prone, and noisy. With CSS Modules it's even worse: `styles['card__title--highlighted']`.

`bem-modules` gives you a clean function call, bound to your component's block, and works two ways:

**Without CSS Modules** — builds raw BEM class strings. A lightweight alternative to concatenating while also ensuring the modifiers get applied correctly.

```ts
import { useBem } from '@kitbag/bem-modules'

const bem = useBem('navBar')

bem('item', { active: true })
// → 'nav-bar__item nav-bar__item--active'
```

**With CSS Modules** — looks up hashed class names from your styles object with full autocomplete for every block, element, and modifier that exists in your stylesheet.

```ts
import { useBem } from '@kitbag/bem-modules'
import styles from './card.module.css'

const bem = useBem(styles, 'card')

bem('title', { highlighted: true })
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

Call `useBem` with your component's block, then use the returned `bem` for the block, its elements, and their modifiers:

```ts
import { useBem } from '@kitbag/bem-modules'

const bem = useBem('card')

bem()                                // 'card'
bem('title')                         // 'card__title'
bem('title', { highlighted: true })  // 'card__title card__title--highlighted'
bem({ featured: true })              // 'card card--featured'
```

Inputs are converted to kebab-case, so with `useBem('navBar')`, `bem('listItem', { isActive: true })` gives `'nav-bar__list-item nav-bar__list-item--is-active'`.

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
import { useBem } from '@kitbag/bem-modules'
import styles from './card.module.css'

const bem = useBem(styles, 'card')

function Card({ title, featured }: { title: string, featured: boolean }) {
  const [isHighlighted, setIsHighlighted] = useState(false)

  return (
    <div className={bem({ featured })}>
      <h2 className={bem('title', { highlighted: isHighlighted })}>{title}</h2>
      <div className={bem('body')} />
    </div>
  )
}
```

#### In Vue

```vue
<script setup lang="ts">
  import { useBem } from '@kitbag/bem-modules'
  import { ref, useCssModule } from 'vue'

  defineProps<{ title: string }>()

  const styles = useCssModule()
  const bem = useBem(styles, 'card')

  const isHighlighted = ref(false)
</script>

<template>
  <div :class="bem()">
    <h2 :class="bem('title', { highlighted: isHighlighted })">{{ title }}</h2>
    <div :class="bem('body')"></div>
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

Modifiers are an object mapping modifier names to booleans — only truthy entries are applied, which makes toggling classes from state straightforward:

```ts
const bem = useBem(styles, 'card')

bem('title', {
  highlighted: true,
  large: isLarge,       // included only when isLarge is truthy
  active: isActive,     // included only when isActive is truthy
})
```

Pass the object in place of the element to modify the block itself:

```ts
bem({ featured: isFeatured })
```

With a styles object, modifier keys are typed per block/element, so `bem('title', { featured: true })` is a type error when `.card__title--featured` doesn't exist.

## Without a bound block

If you need classes from more than one block in the same place, leave the block off and pass it as the first argument instead. The package also exports `bem`, which is `useBem()` ready to use:

```ts
import { bem, useBem } from '@kitbag/bem-modules'

bem('card', 'title', { highlighted: true })   // 'card__title card__title--highlighted'
bem('card', { featured: true })               // 'card card--featured'

const cssBem = useBem(styles)
cssBem('nav-bar', 'item', { active: true })   // typed against every block in styles
```

| Call | Returns |
| --- | --- |
| `useBem(block)` | `bem(element?, modifiers?)` / `bem(modifiers)` |
| `useBem(styles, block)` | Same, typed and looked up against `styles` |
| `useBem()` | `bem(block, element?, modifiers?)` / `bem(block, modifiers)` |
| `useBem(styles)` | Same, typed and looked up against `styles` |

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
