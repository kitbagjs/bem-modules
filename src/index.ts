type Styles = Record<string, string>

type KnownKeys<T> = keyof {
  [K in keyof T as string extends K ? never
    : number extends K ? never
    : symbol extends K ? never
    : K]: T[K]
} & string

type ExtractBlock<K extends string> =
  K extends `${infer B}__${string}` ? B
  : K extends `${infer B}--${string}` ? B
  : K

type ExtractElement<K extends string, Block extends string = string> =
  K extends `${Block}__${infer E}--${string}` ? E
  : K extends `${Block}__${infer E}` ? E
  : never

type ExtractModifier<K extends string, Block extends string = string, Element extends string | null = null> =
  K extends `${Block}__${Element}--${infer M}` ? M
  : Element extends null
    ? K extends `${Block}--${infer M}`
      ? M
      : never
  : never

type Blocks<S extends Styles> = ExtractBlock<KnownKeys<S>>

type Elements<S extends Styles, B extends Blocks<S>> = ExtractElement<KnownKeys<S>, B>

type Modifiers<S extends Styles, B extends Blocks<S>, E extends Elements<S, B> | null = null> =
  ExtractModifier<KnownKeys<S>, B, E>

type ModifierInput<M extends string> = Partial<Record<M, boolean | undefined>>

/**
 * Convert a string to kebab-case.
 *
 * @example
 * ```ts
 * kebabCase('cardTitle')     // 'card-title'
 * kebabCase('CardTitle')     // 'card-title'
 * kebabCase('myXMLFile')     // 'my-xml-file'
 * kebabCase('already-kebab') // 'already-kebab'
 * ```
 */
function kebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

function isModifierInput(value: unknown): value is Record<string, boolean | undefined> {
  return typeof value === 'object' && value !== null
}

function toBem(block: string, element?: string | null, modifier?: string): string {
  let key = kebabCase(block)

  if (element) {
    key += `__${kebabCase(element)}`
  }

  if (modifier) {
    key += `--${kebabCase(modifier)}`
  }

  return key
}

/**
 * Create a BEM class name helper bound to a CSS modules styles object with a pre-bound block.
 *
 * @example
 * ```ts
 * import styles from './card.module.css'
 * const bem = useBem(styles, 'card')
 * bem()                                                    // block only
 * bem('title')                                             // block + element
 * bem('title', { highlighted: true, large: isLarge })      // block + element + modifiers
 * bem({ featured: true })                                  // block + modifiers (no element)
 * ```
 */
export function useBem<const TStyles extends Styles, B extends Blocks<TStyles>>(styles: TStyles, block: B): {
  (): string
  <M extends Modifiers<TStyles, B, null>>(modifiers: ModifierInput<M>): string
  <E extends Elements<TStyles, B>>(element: E): string
  <E extends Elements<TStyles, B>, M extends Modifiers<TStyles, B, E>>(element: E, modifiers: ModifierInput<M>): string
}

/**
 * Create a BEM class name helper bound to a CSS modules styles object.
 *
 * Looks up class names using BEM conventions (`block__element--modifier`).
 * Input strings are automatically converted to kebab-case at runtime.
 *
 * @param styles - A CSS modules styles object (keys are BEM class names, values are the emitted class names).
 * @returns A `bem()` function with typed overloads for block, element, and modifier lookups.
 *
 * @example
 * ```ts
 * import styles from './card.module.css'
 * const bem = useBem(styles)
 * bem('card')                                                   // block only
 * bem('card', 'title')                                          // block + element
 * bem('card', 'title', { highlighted: true, large: isLarge })   // block + element + modifiers
 * bem('card', { featured: true })                               // block + modifiers (no element)
 * ```
 */
export function useBem<const TStyles extends Styles>(styles: TStyles): {
  <B extends Blocks<TStyles>>(block: B): string
  <B extends Blocks<TStyles>, M extends Modifiers<TStyles, B, null>>(block: B, modifiers: ModifierInput<M>): string
  <B extends Blocks<TStyles>, E extends Elements<TStyles, B>>(block: B, element: E): string
  <B extends Blocks<TStyles>, E extends Elements<TStyles, B>, M extends Modifiers<TStyles, B, E>>(block: B, element: E, modifiers: ModifierInput<M>): string
}

/**
 * Create a plain BEM class name builder with a pre-bound block (no CSS modules).
 *
 * @example
 * ```ts
 * const bem = useBem('card')
 * bem('title', { highlighted: true }) // → 'card__title card__title--highlighted'
 * bem({ featured: true })             // → 'card card--featured'
 * ```
 */
export function useBem(block: string): {
  (): string
  (modifiers: ModifierInput<string>): string
  (element: string): string
  (element: string, modifiers: ModifierInput<string>): string
}

/**
 * Create a plain BEM class name builder (no CSS modules).
 *
 * Builds raw BEM class strings with kebab-case conversion.
 *
 * @example
 * ```ts
 * const bem = useBem()
 * bem('card', 'title', { highlighted: true }) // → 'card__title card__title--highlighted'
 * bem('card', { featured: true })             // → 'card card--featured'
 * ```
 */
export function useBem(): {
  (block: string): string
  (block: string, modifiers: ModifierInput<string>): string
  (block: string, element: string): string
  (block: string, element: string, modifiers: ModifierInput<string>): string
}

export function useBem(stylesOrBlock?: Styles | string, maybeBlock?: string) {
  const styles = typeof stylesOrBlock === 'object' ? stylesOrBlock : undefined
  const block = typeof stylesOrBlock === 'string' ? stylesOrBlock : maybeBlock

  function bem(
    block: string,
    element?: string | null,
    modifiers: Record<string, boolean | undefined> = {},
  ): string {
    const classNames = new Set<string>()

    classNames.add(toBem(block, element))

    for (const [modifier, active] of Object.entries(modifiers)) {
      if (!active) {
        continue
      }

      classNames.add(toBem(block, element, modifier))
    }

    return Array.from(classNames)
      .map(key => styles ? styles[key] : key)
      .filter(Boolean)
      .join(' ')
  }

  if (block !== undefined) {
    return (
      elementOrModifiers?: string | Record<string, boolean | undefined>,
      modifiers?: Record<string, boolean | undefined>,
    ) => isModifierInput(elementOrModifiers)
      ? bem(block, null, elementOrModifiers)
      : bem(block, elementOrModifiers, modifiers)
  }

  return (
    block: string,
    elementOrModifiers?: string | Record<string, boolean | undefined>,
    modifiers?: Record<string, boolean | undefined>,
  ) => isModifierInput(elementOrModifiers)
    ? bem(block, null, elementOrModifiers)
    : bem(block, elementOrModifiers, modifiers)
}

/**
 * A pre-built BEM helper for use without CSS Modules.
 * Builds raw BEM class strings with kebab-case conversion.
 *
 * @example
 * ```ts
 * import { bem } from '@kitbag/bem-modules'
 *
 * bem('card', 'title', { highlighted: true }) // → 'card__title card__title--highlighted'
 * ```
 */
export const bem = useBem()

export type { Styles, Blocks, Elements, Modifiers }
