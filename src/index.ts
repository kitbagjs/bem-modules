import { CamelCase, kebabCase, PascalCase, type KebabCase } from 'string-ts'

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

type Casing = 'kebab' | 'camel' | 'pascal'

type ApplyCasing<T extends string, C extends Casing> =
  C extends 'camel' ? CamelCase<T>
  : C extends 'pascal' ? PascalCase<T>
  : KebabCase<T>

type WidenWhenLoose<T extends string, TOptions extends BemOptions> =
  TOptions extends { strict: true } ? T : T | (string & {})

type CasingInput<T extends string, TOptions extends BemOptions> =
  WidenWhenLoose<TOptions extends { casing: infer C extends Casing } ? ApplyCasing<T, C> : ApplyCasing<T, 'kebab'>, TOptions>

type ModifierInput<M extends string, TOptions extends BemOptions> = CasingInput<M, TOptions> | (CasingInput<M, TOptions> | Falsy)[]

interface BemOptions {
  /**
   * Controls which casing is accepted for type-level autocomplete.
   * Defaults to `'kebab'`. Pass `'camel'`, `'pascal'`, or `'any'` to accept all casings.
   * This only affects autocomplete — actual runtime return values are always kebab-cases regardless.
   */
  casing?: Casing
  /**
   * When `true`, only returns classes found in the styles object.
   * When `false` (default), falls back to the raw BEM key for unmapped classes,
   * which is useful for global styles or composed classes from other sources.
   */
  strict?: boolean
}

function toBem(block: string, element?: string | null, modifier?: string): string {
  let key = kebabCase(block)
  if (element) key += `__${kebabCase(element)}`
  if (modifier) key += `--${kebabCase(modifier)}`
  return key
}

/**
 * Create a BEM class name helper, optionally bound to a CSS modules styles object.
 *
 * When called with a styles object, looks up hashed class names using BEM conventions
 * (`block__element--modifier`). When called without styles, builds raw BEM class strings.
 * Input strings are automatically converted to kebab-case at runtime.
 *
 * @param styles - A CSS modules styles object (keys are BEM class names, values are hashed strings).
 *   Omit to use as a plain BEM string builder.
 * @param options - Optional configuration.
 * @param options.casing - Controls which casing is accepted for type-level autocomplete.
 *   Defaults to `'kebab'`. Pass `'camel'` or `'pascal'` to match your preferred coding style.
 *   This only affects autocomplete — runtime always kebab-cases regardless.
 * @param options.strict - When `true`, only returns classes found in the styles object,
 *   and the input type is restricted to known keys.
 *   When `false` (default), falls back to the raw BEM key for unmapped classes, and the
 *   input type is widened to accept any string while still suggesting known keys.
 * @returns A `bem()` function with typed overloads for block, element, and modifier lookups.
 *
 * @example
 * ```ts
 * // With CSS modules — hashed class lookup with autocomplete
 * import styles from './card.module.css'
 * const bem = createBem(styles)
 * bem('card')                                         // block only
 * bem('card', 'title')                                // block + element
 * bem('card', 'title', 'highlighted')                 // block + element + modifier
 * bem('card', 'title', ['highlighted', isLarge && 'large']) // conditional modifiers
 * bem('card', null, 'featured')                       // block + modifier (no element)
 *
 * // Without CSS modules — plain BEM string builder
 * const bem = createBem()
 * bem('card', 'title', 'highlighted') // → 'card__title card__title--highlighted'
 * ```
 */
export function createBem<
  const TStyles extends Styles = Record<string, never>,
  const TOptions extends BemOptions = BemOptions,
>(styles?: TStyles, options?: TOptions) {
  const resolvedStyles = styles ?? {} as TStyles

  /**
   * Returns the class for a block.
   *
   * @param block - The BEM block name.
   * @example bem('card')
   */
  function bem<
    const B extends Blocks<TStyles>
  >(block: CasingInput<B, TOptions>): string

  /**
   * Returns the class for a block + element.
   *
   * @param block - The BEM block name.
   * @param element - The BEM element name.
   * @example bem('card', 'title')
   */
  function bem<
    const B extends Blocks<TStyles>,
    const E extends Elements<TStyles, B>
  >(block: CasingInput<B, TOptions>, element: CasingInput<E, TOptions>): string

  /**
   * Returns the classes for a block + element with modifier(s).
   * The base block__element class is always included.
   *
   * @param block - The BEM block name.
   * @param element - The BEM element name.
   * @param modifiers - A single modifier or array of modifiers. Falsy values are filtered out.
   * @example
   * bem('card', 'title', 'highlighted')
   * bem('card', 'title', ['highlighted', isLarge && 'large'])
   */
  function bem<
    const B extends Blocks<TStyles>,
    const E extends Elements<TStyles, B>,
    const M extends Modifiers<TStyles, B, E>
  >(block: CasingInput<B, TOptions>, element: CasingInput<E, TOptions>, modifiers: ModifierInput<M, TOptions>): string

  /**
   * Returns the classes for a block with modifier(s) and no element.
   * The base block class is always included.
   *
   * @param block - The BEM block name.
   * @param element - Pass `null` to skip the element.
   * @param modifiers - A single modifier or array of modifiers. Falsy values are filtered out.
   * @example bem('card', null, 'featured')
   */
  function bem<
    const B extends Blocks<TStyles>,
    const M extends Modifiers<TStyles, B, null>
  >(block: CasingInput<B, TOptions>, element: null, modifiers?: ModifierInput<M, TOptions>): string

  function bem(
    block: string,
    element?: string | null,
    modifiers: string | Falsy | (string | Falsy)[] = [],
  ): string {
    const classNames = new Set<string>()
    const className = toBem(block, element)

    classNames.add(className)

    for (const modifier of Array.isArray(modifiers) ? modifiers : [modifiers]) {
      if (!modifier) continue
      classNames.add(toBem(block, element, modifier))
    }

    const strict = options?.strict ?? false

    return Array.from(classNames)
      .map(key => resolvedStyles[key] ?? (strict ? null : key))
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

export type { Styles, Blocks, Elements, Modifiers, Casing, BemOptions }
