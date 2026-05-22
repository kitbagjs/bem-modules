import { kebabCase } from 'string-ts'

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

type Falsy = false | null | undefined | 0 | ''

type ModifierInput<M extends string> = M | (M | Falsy)[] | Partial<Record<M, boolean | undefined>>

function isModifierRecord(value: unknown): value is Record<string, boolean | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toBem(block: string, element?: string | null, modifier?: string): string {
  let key = kebabCase(block)
  if (element) key += `__${kebabCase(element)}`
  if (modifier) key += `--${kebabCase(modifier)}`
  return key
}

/**
 * Create a BEM class name helper bound to a CSS modules styles object.
 *
 * Looks up hashed class names using BEM conventions (`block__element--modifier`).
 * Input strings are automatically converted to kebab-case at runtime.
 *
 * @param styles - A CSS modules styles object (keys are BEM class names, values are hashed strings).
 * @returns A `bem()` function with typed overloads for block, element, and modifier lookups.
 *
 * @example
 * ```ts
 * import styles from './card.module.css'
 * const bem = createBem(styles)
 * bem('card')                                              // block only
 * bem('card', 'title')                                     // block + element
 * bem('card', 'title', 'highlighted')                      // block + element + modifier
 * bem('card', 'title', { highlighted: true, large: isLarge }) // conditional modifiers
 * bem('card', null, 'featured')                             // block + modifier (no element)
 * ```
 */
export function createBem<const TStyles extends Styles>(styles: TStyles): {
  <B extends Blocks<TStyles>>(block: B): string
  <B extends Blocks<TStyles>, E extends Elements<TStyles, B>>(block: B, element: E): string
  <B extends Blocks<TStyles>, E extends Elements<TStyles, B>, M extends Modifiers<TStyles, B, E>>(block: B, element: E, modifiers: ModifierInput<M>): string
  <B extends Blocks<TStyles>, M extends Modifiers<TStyles, B, null>>(block: B, element: null, modifiers?: ModifierInput<M>): string
}

/**
 * Create a plain BEM class name builder (no CSS modules).
 *
 * Builds raw BEM class strings with kebab-case conversion.
 *
 * @example
 * ```ts
 * const bem = createBem()
 * bem('card', 'title', 'highlighted') // → 'card__title card__title--highlighted'
 * ```
 */
export function createBem(): {
  (block: string): string
  (block: string, element: string): string
  (block: string, element: string, modifiers: ModifierInput<string>): string
  (block: string, element: null, modifiers?: ModifierInput<string>): string
}

export function createBem(styles?: Styles) {
  function bem(
    block: string,
    element?: string | null,
    modifiers: string | Falsy | (string | Falsy)[] | Record<string, boolean | undefined> = [],
  ): string {
    const classNames = new Set<string>()
    const className = toBem(block, element)

    classNames.add(className)

    const normalized = isModifierRecord(modifiers)
      ? Object.entries(modifiers).filter(([, v]) => v).map(([k]) => k)
      : Array.isArray(modifiers) ? modifiers : [modifiers]

    for (const modifier of normalized) {
      if (!modifier) continue
      classNames.add(toBem(block, element, modifier))
    }

    return Array.from(classNames)
      .map(key => styles ? styles[key] : key)
      .filter(Boolean)
      .join(' ')
  }

  return bem
}

/**
 * A pre-built BEM helper for use without CSS Modules.
 * Builds raw BEM class strings with kebab-case conversion.
 *
 * @example
 * ```ts
 * import { bem } from 'bem-modules'
 *
 * bem('card', 'title', 'highlighted') // → 'card__title card__title--highlighted'
 * ```
 */
export const bem = createBem()

export type { Styles, Blocks, Elements, Modifiers }
