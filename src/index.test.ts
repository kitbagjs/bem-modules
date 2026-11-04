import { describe, test, expect, expectTypeOf } from 'vitest'
import { bem, useBem, type Blocks, type Elements, type Modifiers } from './index'

// Simulated CSS modules output — keys are BEM classes, values are emitted names
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

describe('useBem(styles)', () => {
  describe('block only', () => {
    test('returns the block class', () => {
      const bem = useBem(styles)

      expect(bem('card')).toBe(styles['card'])
    })

    test('handles kebab-case block names', () => {
      const bem = useBem(styles)

      expect(bem('nav-bar')).toBe(styles['nav-bar'])
    })
  })

  describe('block + element', () => {
    test('returns the block__element class', () => {
      const bem = useBem(styles)

      expect(bem('card', 'title')).toBe(styles['card__title'])
    })

    test('handles kebab-case element names', () => {
      const bem = useBem(styles)

      expect(bem('nav-bar', 'item')).toBe(styles['nav-bar__item'])
    })
  })

  describe('block + element + modifiers', () => {
    test('applies modifiers with truthy values', () => {
      const bem = useBem(styles)

      expect(bem('card', 'title', { highlighted: true, large: false })).toBe(
        [styles['card__title'], styles['card__title--highlighted']].join(' '),
      )
    })

    test('applies multiple truthy modifiers', () => {
      const bem = useBem(styles)

      expect(bem('card', 'title', { highlighted: true, large: true })).toBe(
        [styles['card__title'], styles['card__title--highlighted'], styles['card__title--large']].join(' '),
      )
    })

    test('applies no modifiers when all values are falsy', () => {
      const bem = useBem(styles)

      expect(bem('card', 'title', { highlighted: false, large: undefined })).toBe(styles['card__title'])
    })
  })

  describe('block + modifiers (no element)', () => {
    test('applies modifiers directly to the block', () => {
      const bem = useBem(styles)

      expect(bem('card', { 'featured': true, 'dark-mode': true })).toBe(
        [styles['card'], styles['card--featured'], styles['card--dark-mode']].join(' '),
      )
    })

    test('skips falsy block modifiers', () => {
      const bem = useBem(styles)

      expect(bem('card', { featured: false })).toBe(styles['card'])
    })
  })

  describe('unmapped keys', () => {
    test('drops unmapped blocks', () => {
      const bem = useBem(styles)
      // @ts-expect-error — testing runtime safety
      expect(bem('nonexistent')).toBe('')
    })

    test('drops unmapped modifiers', () => {
      const bem = useBem(styles)
      // @ts-expect-error — testing runtime safety
      expect(bem('card', 'title', { nonexistent: true })).toBe(styles['card__title'])
    })
  })
})

describe('bem (plain BEM)', () => {
  test('returns raw BEM block string', () => {
    expect(bem('card')).toBe('card')
  })

  test('returns raw BEM block__element string', () => {
    expect(bem('card', 'title')).toBe('card__title')
  })

  test('returns raw BEM block__element--modifier string', () => {
    expect(bem('card', 'title', { highlighted: true, large: false })).toBe(
      'card__title card__title--highlighted',
    )
  })

  test('returns raw BEM block--modifier string', () => {
    expect(bem('card', { featured: true })).toBe('card card--featured')
  })

  test('converts casing to kebab-case', () => {
    expect(bem('navBar', 'listItem', { isActive: true })).toBe(
      'nav-bar__list-item nav-bar__list-item--is-active',
    )
  })

  test('converts acronyms, underscores, and spaces to kebab-case', () => {
    expect(bem('myXMLFile', 'list_item', { 'is active': true })).toBe(
      'my-xml-file__list-item my-xml-file__list-item--is-active',
    )
  })
})

describe('useBem(styles, block)', () => {
  test('returns the block class with no args', () => {
    const bem = useBem(styles, 'card')

    expect(bem()).toBe(styles['card'])
  })

  test('returns block__element class', () => {
    const bem = useBem(styles, 'card')

    expect(bem('title')).toBe(styles['card__title'])
  })

  test('handles element modifiers', () => {
    const bem = useBem(styles, 'card')

    expect(bem('title', { highlighted: true, large: false })).toBe(
      [styles['card__title'], styles['card__title--highlighted']].join(' '),
    )
  })

  test('handles block modifiers', () => {
    const bem = useBem(styles, 'card')

    expect(bem({ 'featured': true, 'dark-mode': true })).toBe(
      [styles['card'], styles['card--featured'], styles['card--dark-mode']].join(' '),
    )
  })
})

describe('useBem(block)', () => {
  test('returns block with no args', () => {
    const bem = useBem('card')

    expect(bem()).toBe('card')
  })

  test('returns block__element', () => {
    const bem = useBem('card')

    expect(bem('title')).toBe('card__title')
  })

  test('handles element modifiers', () => {
    const bem = useBem('card')

    expect(bem('title', { highlighted: true, large: false })).toBe(
      'card__title card__title--highlighted',
    )
  })

  test('handles block modifiers', () => {
    const bem = useBem('card')

    expect(bem({ featured: true })).toBe('card card--featured')
  })

  test('converts casing to kebab-case', () => {
    const bem = useBem('navBar')

    expect(bem('listItem', { isActive: true })).toBe(
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
    expectTypeOf<Modifiers<S, 'card', 'title'>>().toEqualTypeOf<'highlighted' | 'large'>()
  })

  test('extracts modifiers for block only', () => {
    expectTypeOf<Modifiers<S, 'card'>>().toEqualTypeOf<'featured' | 'dark-mode'>()
  })

  test('with styles, unknown blocks, elements, and modifiers are rejected', () => {
    const bem = useBem(styles)

    // @ts-expect-error — unknown block
    bem('unknown')
    // @ts-expect-error — unknown element
    bem('card', 'unknown')
    // @ts-expect-error — element modifier used on block
    bem('card', { highlighted: true })
    // @ts-expect-error — block modifier used on element
    bem('card', 'title', { featured: true })
  })

  test('with styles and bound block, unknown elements and modifiers are rejected', () => {
    const bem = useBem(styles, 'card')

    // @ts-expect-error — unknown element
    bem('unknown')
    // @ts-expect-error — element modifier used on block
    bem({ highlighted: true })
  })

  test('without styles, input accepts any string', () => {
    type BlockParam = Parameters<typeof bem>[0]
    expectTypeOf<'anything'>().toExtend<BlockParam>()
  })
})
