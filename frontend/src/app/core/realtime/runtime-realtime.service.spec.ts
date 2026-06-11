import { TestBed } from '@angular/core/testing';

import { AuthService } from '../auth/auth.service';
import { UserProfile } from '../api/api.types';
import { FLOWCORE_ECHO_FACTORY, FLOWCORE_REALTIME_CONFIG, RealtimeEcho } from './realtime.config';
import { RuntimeRealtimeService } from './runtime-realtime.service';
import { RuntimeUpdateEvent } from './runtime-realtime.types';

describe('RuntimeRealtimeService', () => {
  const event: RuntimeUpdateEvent = {
    workflow_instance_id: 42,
    instance_step_id: 10,
    action: 'escalated',
    occurred_at: '2026-06-11T10:00:00.000Z',
  };
  let callback: ((event: RuntimeUpdateEvent) => void) | null;
  let disconnect: jest.Mock;
  let leave: jest.Mock;
  let listen: jest.Mock;

  function configure(auth: { token: () => string | null; user: () => UserProfile | null }): RuntimeRealtimeService {
    callback = null;
    disconnect = jest.fn();
    leave = jest.fn();
    listen = jest.fn((_eventName: string, next: (event: RuntimeUpdateEvent) => void) => {
      callback = next;
    });

    const echo = {
      disconnect,
      leave,
      private: jest.fn(() => ({ listen })),
    } as unknown as RealtimeEcho;

    TestBed.configureTestingModule({
      providers: [
        RuntimeRealtimeService,
        { provide: AuthService, useValue: auth },
        {
          provide: FLOWCORE_REALTIME_CONFIG,
          useValue: {
            appKey: 'flowcore-local-key',
            authEndpoint: 'http://localhost:8000/broadcasting/auth',
            wsHost: 'localhost',
            wsPort: 8080,
            forceTls: false,
          },
        },
        { provide: FLOWCORE_ECHO_FACTORY, useValue: jest.fn(() => echo) },
      ],
    });

    return TestBed.inject(RuntimeRealtimeService);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('subscribes to the authenticated user runtime channel and tears it down', () => {
    const service = configure({
      token: () => 'token',
      user: () => ({ id: 7, name: 'Approver', email: 'a@demo.com', roles: [], permissions: [] }),
    });
    const received: RuntimeUpdateEvent[] = [];

    const subscription = service.runtimeUpdates().subscribe((update) => received.push(update));
    callback?.(event);
    subscription.unsubscribe();

    expect(received).toEqual([event]);
    expect(listen).toHaveBeenCalledWith('.runtime.workflow.updated', expect.any(Function));
    expect(leave).toHaveBeenCalledWith('users.7.runtime');
  });

  it('completes without opening a socket when the user is anonymous', () => {
    const service = configure({
      token: () => null,
      user: () => null,
    });
    let completed = false;

    service.runtimeUpdates().subscribe({ complete: () => (completed = true) });

    expect(completed).toBe(true);
    expect(disconnect).not.toHaveBeenCalled();
  });
});
