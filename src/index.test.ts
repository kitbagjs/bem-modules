import { describe, test, expect, expectTypeOf } from 'vitest'
import { bem, createBem, type Blocks, type Elements, type Modifiers } from './index'

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

  describe('object modifiers', () => {
    test('applies modifiers with truthy values', () => {
      const bem = createBem(styles)
      const value = bem('card', 'title', { 'highlighted': true, 'large': false })

      expect(value).toBe(
        [styles['card__title'], styles['card__title--highlighted']].join(' '),
      )
    })

    test('applies multiple truthy modifiers', () => {
      const bem = createBem(styles)
      const value = bem('card', 'title', { 'highlighted': true, 'large': true })

      expect(value).toBe(
        [styles['card__title'], styles['card__title--highlighted'], styles['card__title--large']].join(' '),
      )
    })

    test('applies no modifiers when all values are falsy', () => {
      const bem = createBem(styles)
      const value = bem('card', 'title', { 'highlighted': false, 'large': undefined })

      expect(value).toBe(styles['card__title'])
    })

    test('works with block + null element', () => {
      const bem = createBem(styles)
      const value = bem('card', null, { 'featured': true })

      expect(value).toBe(
        [styles['card'], styles['card--featured']].join(' '),
      )
    })
  })

  describe('block + null element + modifier', () => {
    test('applies modifier directly to block', () => {
      const bem = createBem(styles)
      const value = bem('card', null, ['featured', true && 'dark-mode'])

      expect(value).toBe(
        [styles['card'], styles['card--featured'], styles['card--dark-mode']].join(' '),
      )
    })
  })

  describe('unmapped keys', () => {
    test('drops unmapped blocks', () => {
      const bem = createBem(styles)
      // @ts-expect-error — testing runtime safety
      expect(bem('nonexistent')).toBe('')
    })

    test('drops unmapped modifiers', () => {
      const bem = createBem(styles)
      // @ts-expect-error — testing runtime safety
      expect(bem('card', 'title', 'nonexistent')).toBe(styles['card__title'])
    })
  })
})

describe('without styles (plain BEM)', () => {
  test('returns raw BEM block string', () => {
    expect(bem('card')).toBe('card')
  })

  test('returns raw BEM block__element string', () => {
    expect(bem('card', 'title')).toBe('card__title')
  })

  test('returns raw BEM block__element--modifier string', () => {
    expect(bem('card', 'title', 'highlighted')).toBe('card__title card__title--highlighted')
  })

  test('handles modifier array with falsy values', () => {
    const isLarge = false
    expect(bem('card', 'title', ['highlighted', isLarge && 'large'])).toBe(
      'card__title card__title--highlighted',
    )
  })

  test('handles object modifiers', () => {
    expect(bem('card', 'title', { highlighted: true, large: false })).toBe(
      'card__title card__title--highlighted',
    )
  })

  test('returns raw BEM block--modifier string', () => {
    expect(bem('card', null, 'featured')).toBe('card card--featured')
  })

  test('converts casing to kebab-case', () => {
    expect(bem('navBar', 'listItem', 'isActive')).toBe(
      'nav-bar__list-item nav-bar__list-item--is-active',
    )
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

  test('with styles, input is restricted to known blocks', () => {
    const bem = createBem(styles)
    type BlockParam = Parameters<typeof bem>[0]
    expectTypeOf<'card'>().toMatchTypeOf<BlockParam>()
    expectTypeOf<'nav-bar'>().toMatchTypeOf<BlockParam>()
    // @ts-expect-error — unknown block not assignable
    expectTypeOf<'unknown'>().toMatchTypeOf<BlockParam>()
  })

  test('without styles, input accepts any string', () => {
    type BlockParam = Parameters<typeof bem>[0]
    expectTypeOf<'card'>().toMatchTypeOf<BlockParam>()
    expectTypeOf<'anything'>().toMatchTypeOf<BlockParam>()
  })
})
