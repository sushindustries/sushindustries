import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { HTMLAttributes, RefObject } from 'react'

/**
 * The behaviour of "view in 3D", with no markup attached.
 *
 * This is the headless layer, and it is the one to reach for if you have a
 * design system. `ViewIn3D` is this hook plus opinions about a button and a
 * dialog; if those opinions are wrong for you, take the hook and render your own
 * - you lose nothing, because everything that is actually difficult here lives
 * in this file rather than in the markup.
 *
 * What it handles that a `useState(false)` does not: Escape to close, focus into
 * the dialog on open and back to the trigger on close, the page behind not
 * scrolling, and the ARIA wiring that makes a div behave as a modal.
 *
 * ```tsx
 * const { isOpen, triggerProps, dialogProps, close } = useViewIn3D()
 *
 * return (
 *   <>
 *     <MyButton {...triggerProps}>View in 3D</MyButton>
 *     {isOpen ? (
 *       <MyDialog {...dialogProps}>
 *         <ProductViewer model={model} />
 *         <MyButton onClick={close}>Close</MyButton>
 *       </MyDialog>
 *     ) : null}
 *   </>
 * )
 * ```
 */

export interface UseViewIn3DOptions {
  /** Accessible name for the dialog. @default "Product in 3D" */
  title?: string
  /** Start open. Useful when the route itself is the 3D view. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Generic over the dialog element so `dialogProps` can be spread onto whatever
 * you actually render. Defaults to a div; pass `HTMLDialogElement` if you are
 * using the native element.
 */
export interface UseViewIn3DResult<E extends HTMLElement = HTMLDivElement> {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  /** Spread onto whatever opens the viewer. */
  triggerProps: {
    onClick: () => void
    'aria-haspopup': 'dialog'
    'aria-expanded': boolean
    'aria-controls': string | undefined
  }
  /** Spread onto the dialog root. Attach `ref` too. */
  dialogProps: HTMLAttributes<E> & {
    id: string
    role: 'dialog'
    'aria-modal': true
    'aria-label': string
    tabIndex: -1
    ref: RefObject<E | null>
  }
}

export function useViewIn3D<E extends HTMLElement = HTMLDivElement>({
  title = 'Product in 3D',
  defaultOpen = false,
  onOpenChange,
}: UseViewIn3DOptions = {}): UseViewIn3DResult<E> {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const id = useId()
  const dialogRef = useRef<E | null>(null)
  const returnFocusTo = useRef<Element | null>(null)

  const set = useCallback(
    (next: boolean) => {
      setIsOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange],
  )

  const open = useCallback(() => {
    returnFocusTo.current = document.activeElement
    set(true)
  }, [set])

  const close = useCallback(() => {
    set(false)
    // Focus goes back where it came from. Without this a keyboard user is
    // returned to the top of the document and has to walk the page again to get
    // back to where they were.
    ;(returnFocusTo.current as HTMLElement | null)?.focus?.()
  }, [set])

  const toggle = useCallback(() => {
    if (isOpen) close()
    else open()
  }, [isOpen, open, close])

  useEffect(() => {
    if (!isOpen) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)

    // The page behind a full-screen dialog must not scroll. OrbitControls
    // already stops the wheel over the canvas; this stops it everywhere else.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [isOpen, close])

  return {
    isOpen,
    open,
    close,
    toggle,
    triggerProps: {
      onClick: open,
      'aria-haspopup': 'dialog',
      'aria-expanded': isOpen,
      'aria-controls': isOpen ? id : undefined,
    },
    dialogProps: {
      id,
      role: 'dialog',
      'aria-modal': true,
      'aria-label': title,
      tabIndex: -1,
      ref: dialogRef,
    },
  }
}
