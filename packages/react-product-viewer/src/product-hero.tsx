import { ModelViewer } from './elements/model-viewer/model-viewer'
import type { ModelViewerProps } from './elements/model-viewer/model-viewer.types'
import type { CSSProperties, ReactElement, ReactNode } from 'react'
import type { ZoneScheme } from '@sushindustries/product-viewer'

/**
 * The model as the hero of a page, with copy over it.
 *
 * A hero is the one place a WebGL canvas earns its cost without being asked
 * for: it is the whole reason the visitor is looking at the screen, it is above
 * the fold, and the product turning slowly is the message.
 *
 * Two things this does that a bare `<ModelViewer>` in a tall div does not:
 *
 *  - **The copy stays reachable.** Text sits in a layer that does not take
 *    pointer events, so dragging anywhere - including across the headline -
 *    orbits the model. Links and buttons inside it re-enable them individually.
 *  - **It has a real height.** The viewer fills its parent, and the commonest
 *    way to get a blank hero is a parent with no height at all.
 */

export interface ProductHeroProps<
  S extends ZoneScheme = ZoneScheme,
> extends ModelViewerProps<S> {
  /** Drawn over the canvas. Pointer-transparent except for interactive parts. */
  overlay?: ReactNode
  /** Where the overlay sits. @default "bottom-left" */
  align?: 'top-left' | 'bottom-left' | 'center'
  /**
   * Hero height. Any CSS length.
   *
   * Defaults to a viewport-relative height that leaves a strip of the next
   * section showing - a hero that fills exactly 100dvh reads as the whole page
   * and people do not scroll.
   *
   * @default "min(78dvh, 720px)" (set in the stylesheet)
   */
  height?: string
  /** Added after `pv-hero`. */
  className?: string
  /**
   * Darken the canvas behind the overlay so text stays legible.
   *
   * A scrim, not a flat tint: the model is the point, so it dims where the words
   * are and nowhere else.
   *
   * @default true when `overlay` is given
   */
  scrim?: boolean
}

export function ProductHero<S extends ZoneScheme = ZoneScheme>({
  overlay,
  align = 'bottom-left',
  height,
  scrim = Boolean(overlay),
  className,
  ...viewer
}: ProductHeroProps<S>): ReactElement {
  return (
    <section
      data-align={align}
      className={['pv-hero', className].filter(Boolean).join(' ')}
      // The one inline style kept, because it is a value rather than a
      // decision: a custom property the stylesheet reads. Everything else is
      // a class you can override.
      style={
        height ? ({ '--pv-hero-height': height } as CSSProperties) : undefined
      }
    >
      <ModelViewer {...(viewer as ModelViewerProps<S>)} />
      {scrim ? <div className="pv-hero__scrim" aria-hidden="true" /> : null}
      {overlay ? (
        <div className="pv-hero__overlay">
          <div className="pv-hero__content">{overlay}</div>
        </div>
      ) : null}
    </section>
  )
}

/**
 * Re-enables pointer events for interactive content inside a hero overlay.
 *
 * The overlay is pointer-transparent so dragging across the headline still
 * orbits the model. Anything a visitor is meant to click opts back in.
 */
export function HeroInteractive({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}): ReactElement {
  return (
    <div
      className={['pv-hero__interactive', className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
