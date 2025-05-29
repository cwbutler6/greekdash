// Adapted from shadcn-ui toast component
// https://ui.shadcn.com/docs/components/toast

import { useState, useEffect } from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

type ToastProps = {
  id?: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// This is used by consumers of the library
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ToastActionElement = React.ReactElement

export const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToastProps
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToastProps>
      id: string
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      id: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      id: string
    }

interface State {
  toasts: ToastProps[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { id } = action

      // If toast doesn't exist, return state
      if (!state.toasts.find((t) => t.id === id)) {
        return state
      }

      // Set toast to dismissed
      const updatedState = {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === id ? { ...t, open: false } : t
        ),
      }

      // Remove toast after delay
      const timeout = setTimeout(() => {
        dispatch({
          type: actionTypes.REMOVE_TOAST,
          id,
        })
      }, TOAST_REMOVE_DELAY)

      toastTimeouts.set(id, timeout)

      return updatedState
    }

    case actionTypes.REMOVE_TOAST: {
      const { id } = action

      // Clear timeout
      const timeout = toastTimeouts.get(id)
      if (timeout) clearTimeout(timeout)

      // Remove toast
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== id),
      }
    }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// Used for toast context and providers
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Toast {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function useToast() {
  const [state, setState] = useState<State>(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    toast: (props: ToastProps) => {
      const id = genId()
      const newToast = {
        ...props,
        id,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) {
            dispatch({
              type: actionTypes.DISMISS_TOAST,
              id,
            })
          }
        },
      }

      dispatch({
        type: actionTypes.ADD_TOAST,
        toast: newToast,
      })

      return newToast
    },
    dismiss: (id: string) => {
      dispatch({
        type: actionTypes.DISMISS_TOAST,
        id,
      })
    },
  }
}

// Helper to create a singleton-like toast function that doesn't call hooks directly
const createToast = (props: ToastProps) => {
  const id = genId()
  const newToast = {
    ...props,
    id,
    open: true,
    onOpenChange: (open: boolean) => {
      if (!open) {
        dispatch({
          type: actionTypes.DISMISS_TOAST,
          id,
        })
      }
    },
  }

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: newToast,
  })

  return newToast
}

// Create a toast object with helper methods for different toast types
type ToastFunction = typeof createToast & {
  success: (title: string, props?: Omit<ToastProps, 'title' | 'variant'>) => ReturnType<typeof createToast>;
  error: (title: string, props?: Omit<ToastProps, 'title' | 'variant'>) => ReturnType<typeof createToast>;
  warning: (title: string, props?: Omit<ToastProps, 'title' | 'variant'>) => ReturnType<typeof createToast>;
  info: (title: string, props?: Omit<ToastProps, 'title' | 'variant'>) => ReturnType<typeof createToast>;
};

// Create the toast function with variant helpers
export const toast = createToast as ToastFunction;

// Add helper methods
toast.success = (title: string, props: Omit<ToastProps, 'title' | 'variant'> = {}) => {
  return createToast({ title, variant: 'default', ...props })
}

toast.error = (title: string, props: Omit<ToastProps, 'title' | 'variant'> = {}) => {
  return createToast({ title, variant: 'destructive', ...props })
}

toast.warning = (title: string, props: Omit<ToastProps, 'title' | 'variant'> = {}) => {
  return createToast({ title, variant: 'default', ...props })
}

toast.info = (title: string, props: Omit<ToastProps, 'title' | 'variant'> = {}) => {
  return createToast({ title, variant: 'default', ...props })
}
