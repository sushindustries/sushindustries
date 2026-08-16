import { lazy, Suspense } from 'react'
import { useViewIn3D } from './use-view-in-3d'
import type { UseViewIn3DResult } from './use-view-in-3d'
import type { ModelViewerProps } from './elements/model-viewer/model-viewer.types'
import type { ReactElement, ReactNode } from 'react'
import type { ZoneScheme } from '@sushindustries/product-viewer'

/**
 * "View in 3D" - the button, and the thing it opens.
 *
 * Most product pages should not mount a WebGL canvas on load. three plus R3F is
 * roughly 600 kB before the model, most visitors never rotate anything, and on a
 * mid-range phone the canvas competes for memory with the page that is actually
 * selling the product. The honest default is a button.
 *
 * So the viewer is imported only when someone asks for it. The `lazy` lives in
 * this module rather than the caller's, which means a page that renders this
 * button and is never clicked ships the button and nothing else.
 *
 * **This component is a convenience, not the API.** Everything difficult here -
 * focus return, Escape, scroll locking, ARIA - is in `useViewIn3D`, which has no
 * markup. If the markup below is wrong for your design system, take the hook.
 *
 * Styling: class names and `data-*` attributes, no inline styles. Import
 * `@sushindustries/react-product-viewer/styles.css` for defaults, or style
 * `.pv-trigger` and `.pv-dialog` yourself and import nothing.
 */

// Imported here, not by the consumer, so the code split happens whether or not
// they remember to do it. `ssr: false` on the route is still required - this
// defers the fetch, it does not make three run on a server.
const ModelViewer = lazy(async () => {
  const module = await import('./elements/model-viewer/model-viewer')
  return { default: module.ModelViewer }
})

export interface ViewIn3DProps<
  S extends ZoneScheme = ZoneScheme,
> extends ModelViewerProps<S> {
  /** Button text. @default "View in 3D" */
  label?: ReactNode
  /** Dialog heading, also its accessible name. */
  title?: string
  /**
   * Replaces the default button entirely.
   *
   * Receives the hook's result, so a custom trigger keeps the ARIA wiring:
   * `(view) => <MyButton {...view.triggerProps}>Open</MyButton>`
   */
  trigger?: (view: UseViewIn3DResult) => ReactNode
  /** Extra controls rendered beside the viewer inside the dialog. */
  panel?: ReactNode
  /** Added to the dialog root, after `pv-dialog`. */
  className?: string
  triggerClassName?: string
}

const ICON = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <title>3D</title>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
)

export function ViewIn3D<S extends ZoneScheme = ZoneScheme>({
  label = 'View in 3D',
  title = 'Product in 3D',
  trigger,
  panel,
  className,
  triggerClassName,
  ...viewer
}: ViewIn3DProps<S>): ReactElement {
  const view = useViewIn3D({ title })
  const { isOpen, close, triggerProps, dialogProps } = view

  return (
    <>
      {trigger ? (
        trigger(view)
      ) : (
        <button
          type="button"
          className={['pv-trigger', triggerClassName].filter(Boolean).join(' ')}
          {...triggerProps}
        >
          {ICON}
          {label}
        </button>
      )}

      {isOpen ? (
        <div
          {...dialogProps}
          className={['pv-dialog', className].filter(Boolean).join(' ')}
        >
          <header className="pv-dialog__header">
            <strong className="pv-dialog__title">{title}</strong>
            <button
              type="button"
              className="pv-dialog__close"
              onClick={close}
              aria-label="Close"
            >
              Close
            </button>
          </header>

          <div className="pv-dialog__body">
            <div className="pv-dialog__stage">
              <Suspense fallback={null}>
                <ModelViewer {...(viewer as ModelViewerProps<S>)} />
              </Suspense>
            </div>
            {panel ? <aside className="pv-dialog__panel">{panel}</aside> : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
