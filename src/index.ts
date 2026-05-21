import { CamelCase, kebabCase, PascalCase, type KebabCase } from 'string-ts'

type Styles = Record<string, string>

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

type Blocks<S extends Styles> = ExtractBlock<keyof S & string>

type Elements<S extends Styles, B extends Blocks<S>> = ExtractElement<keyof S & string, B>

type Modifiers<S extends Styles, B extends Blocks<S>, E extends Elements<S, B> | null = null> =
  ExtractModifier<keyof S & string, B, E>

type Falsy = false | null | undefined | 0 | ''

type Casing = 'kebab' | 'camel' | 'pascal' | 'any'

type ApplyCasing<T extends string, C extends Casing> =
  C extends 'camel' ? CamelCase<T>
  : C extends 'pascal' ? PascalCase<T>
  : C extends 'any' ? string
  : KebabCase<T>

type CasingInput<T extends string, TOptions extends BemOptions> = TOptions extends { casing: infer C extends Casing } ? ApplyCasing<T, C> : ApplyCasing<T, 'kebab'>

type ModifierInput<M extends string, TOptions extends BemOptions> = CasingInput<M, TOptions> | (CasingInput<M, TOptions> | Falsy)[]

interface BemOptions {
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
 * Create a type-safe BEM helper bound to a CSS modules styles object.
 *
 * Returns a `bem()` function that looks up hashed class names from your styles
 * object using BEM conventions (`block__element--modifier`). Input strings are
 * automatically converted to kebab-case at runtime, so you can write in any casing.
 *
 * @param styles - A CSS modules styles object (keys are BEM class names, values are hashed strings).
 * @param options - Optional configuration.
 * @param options.casing - Controls which casing is accepted for type-level autocomplete.
 *   Defaults to `'kebab'`. Pass `'camel'`, `'pascal'`, or `'any'` to accept all casings.
 *   This only affects autocomplete — runtime always kebab-cases regardless.
 * @param options.strict - When `true`, only returns classes found in the styles object.
 *   When `false` (default), falls back to the raw BEM key for unmapped classes.
 * @returns A `bem()` function with typed overloads for block, element, and modifier lookups.
 *
 * @example
 * ```ts
 * import styles from './card.module.css'
 *
 * // Default: kebab-case autocomplete
 * const bem = createBem(styles)
 * bem('card')                                         // block only
 * bem('card', 'title')                                // block + element
 * bem('card', 'title', 'highlighted')                 // block + element + modifier
 * bem('card', 'title', ['highlighted', isLarge && 'large']) // conditional modifiers
 * bem('card', null, 'featured')                       // block + modifier (no element)
 *
 * // camelCase autocomplete
 * const bem = createBem(styles, { casing: 'camel' })
 *
 * // Accept any casing
 * const bem = createBem(styles, { casing: 'any' })
 * ```
 */
export function createBem<
  const TStyles extends Styles,
  const TOptions extends BemOptions,
>(styles: TStyles, options?: TOptions) {
  /**
   * Returns the hashed CSS module class for a block.
   *
   * @param block - The BEM block name.
   * @example bem('card') // → styles['card']
   */
  function bem<
    const B extends Blocks<TStyles>
  >(block: CasingInput<B, TOptions>): string

  /**
   * Returns the hashed CSS module class for a block + element.
   *
   * @param block - The BEM block name.
   * @param element - The BEM element name.
   * @example bem('card', 'title') // → styles['card__title']
   */
  function bem<
    const B extends Blocks<TStyles>,
    const E extends Elements<TStyles, B>
  >(block: CasingInput<B, TOptions>, element: CasingInput<E, TOptions>): string

  /**
   * Returns the hashed CSS module classes for a block + element with modifier(s).
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
   * Returns the hashed CSS module classes for a block with modifier(s) and no element.
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
      .map(key => styles[key] ?? (strict ? null : key))
      .filter(Boolean)
      .join(' ')
  }

  return bem
}

export type { Styles, Blocks, Elements, Modifiers, Casing, BemOptions }
