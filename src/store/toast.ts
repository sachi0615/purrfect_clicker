import { nanoid } from 'nanoid';
import { create } from 'zustand';

type ToastType = 'info' | 'success' | 'warning';

export type ToastMessage = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastState = {
  toasts: ToastMessage[];
  push: (toast: Omit<ToastMessage, 'id'> & { id?: string; duration?: number }) => void;
  dismiss: (id: string) => void;
  clear: () => void;
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: ({ id, message, type, duration = 2000 }) => {
    const toastId = id ?? nanoid();
    set((state) => ({
      toasts: [...state.toasts, { id: toastId, message, type }],
    }));

    window.setTimeout(() => get().dismiss(toastId), duration);
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  clear: () => set({ toasts: [] }),
}));

export function pushToast(message: string, type: ToastType = 'info', duration?: number) {
  useToastStore.getState().push({ message, type, duration });
}
