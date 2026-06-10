import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'warning' | 'danger' | 'info';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly messages = signal<ToastMessage[]>([]);

  readonly toasts = this.messages.asReadonly();

  success(message: string): void {
    this.push('success', message);
  }

  warning(message: string): void {
    this.push('warning', message);
  }

  danger(message: string): void {
    this.push('danger', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this.messages.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private push(kind: ToastKind, message: string): void {
    const toast: ToastMessage = {
      id: this.nextId,
      kind,
      message,
    };

    this.nextId += 1;
    this.messages.update((current) => [...current, toast]);
  }
}
