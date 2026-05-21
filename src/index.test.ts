import { describe, test, expect, expectTypeOf } from 'vitest'
import { createBem, type Blocks, type Elements, type Modifiers } from './index'

// Simulated CSS modules output — keys are BEM classes, values are hashed names
const styles = {
  'card': '_card_x1',
  'card__title': '_card__title_x2',
  'card__title--highlighted': '_card__title--highlighted_x3',
  'card__title--large': '_card__title--large_x4',
  'card__body': '_card__body_x5',
  'card--featured': '_card--featured_x6',
  'card--dark-mode': '_card--dark-mode_x7',
  'nav-bar': '_nav-bar_y1',
  'nav-bar__item': '_nav-bar__item_y2',
  'nav-bar__item--active': '_nav-bar__item--active_y3',
} as const

describe('createBem', () => {
  describe('block only', () => {
    test('returns the block class', () => {
      const bem = createBem(styles)
      const value = bem('card')
      
      expect(value).toBe(styles['card'])
    })

    test('handles kebab-case block names', () => {
      const bem = createBem(styles)
      const value = bem('nav-bar')

      expect(value).toBe(styles['nav-bar'])
    })
  })

  describe('block + element', () => {
    test('returns the block__element class', () => {
      const bem = createBem(styles)
      const value = bem('card', 'title')
      
      expect(value).toBe(styles['card__title'])
    })

    test('handles kebab-case element names', () => {
      const bem = createBem(styles)
      const value = bem('nav-bar', 'item')

      expect(value).toBe(styles['nav-bar__item'])
    })
  })

  describe('block + element + modifier', () => {
    test('returns base + modifier classes', () => {
      const bem = createBem(styles)
      const value = bem('card', 'title', 'highlighted')
      
      expect(value).toBe(
        [styles['card__title'], styles['card__title--highlighted']].join(' '),
      )
    })

    test('handles modifier array', () => {
      const bem = createBem(styles)
      const value = bem('card', 'title', ['highlighted', 'large'])
      
      expect(value).toBe(
        [styles['card__title'], styles['card__title--highlighted'], styles['card__title--large']].join(' '),
      )
    })

    test.each([false, null, undefined, 0, ''] as const)('filters falsy values from modifier array', (falsy) => {
      const bem = createBem(styles)
      const value = bem('card', 'title', ['highlighted', falsy && 'large'])
      
      expect(value).toBe(
        [styles['card__title'], styles['card__title--highlighted']].join(' '),
      )
    })
  })

  describe('block + null element + modifier', () => {
    test('applies modifier directly to block', () => {
      const bem = createBem(styles)
      const value = bem('card', null, 'featured')
      
      expect(value).toBe(
        [styles['card'], styles['card--featured']].join(' '),
      )
    })
  })

  describe('missing keys', () => {
    test('falls back to raw BEM key by default', () => {
      const bem = createBem(styles)
      // @ts-expect-error — testing runtime safety
      expect(bem('nonexistent')).toBe('nonexistent')
    })

    test('falls back to raw BEM key for unknown modifiers by default', () => {
      const bem = createBem(styles)
      // @ts-expect-error — testing runtime safety
      expect(bem('card', 'title', 'nonexistent')).toBe(
        [styles['card__title'], 'card__title--nonexistent'].join(' '),
      )
    })

    test('drops unmapped classes in strict mode', () => {
      const bem = createBem(styles, { strict: true })
      // @ts-expect-error — testing runtime safety
      expect(bem('nonexistent')).toBe('')
    })

    test('drops unknown modifiers in strict mode', () => {
      const bem = createBem(styles, { strict: true })
      // @ts-expect-error — testing runtime safety
      expect(bem('card', 'title', 'nonexistent')).toBe(styles['card__title'])
    })
  })
})

describe('casing option', () => {
  test('camel casing accepts camelCase input', () => {
    const bem = createBem(styles, { casing: 'camel' })
    const value = bem('navBar', 'item', 'active')

    expect(value).toBe(
      [styles['nav-bar__item'], styles['nav-bar__item--active']].join(' '),
    )
  })

  test('pascal casing accepts PascalCase input', () => {
    const bem = createBem(styles, { casing: 'pascal' })
    const value = bem('NavBar', 'Item', 'Active')

    expect(value).toBe(
      [styles['nav-bar__item'], styles['nav-bar__item--active']].join(' '),
    )
  })

  test('any casing accepts all casings', () => {
    const bem = createBem(styles, { casing: 'any' })
    const value = bem('anything', 'works', ['here', 'friend'])

    expect(value).toBe('anything works here friend')
  })
})

describe('type extraction', () => {
  type S = typeof styles

  test('extracts blocks', () => {
    expectTypeOf<Blocks<S>>().toEqualTypeOf<'card' | 'nav-bar'>()
  })

  test('extracts elements for a block', () => {
    expectTypeOf<Elements<S, 'card'>>().toEqualTypeOf<'title' | 'body'>()
  })

  test('extracts modifiers for block + element', () => {
    type Input = Modifiers<S, 'card', 'title'>
    expectTypeOf<Input>().toEqualTypeOf<'highlighted' | 'large'>()
  })

  test('extracts modifiers for block only', () => {
    type Input = Modifiers<S, 'card'>
    expectTypeOf<Input>().toEqualTypeOf<'featured' | 'dark-mode'>()
  })
})
