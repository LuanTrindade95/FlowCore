import { inject, Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { FLOWCORE_ECHO_FACTORY, FLOWCORE_REALTIME_CONFIG, RealtimeEcho } from './realtime.config';
import { RuntimeUpdateEvent } from './runtime-realtime.types';

@Injectable({ providedIn: 'root' })
export class RuntimeRealtimeService {
  private readonly auth = inject(AuthService);
  private readonly config = inject(FLOWCORE_REALTIME_CONFIG);
  private readonly echoFactory = inject(FLOWCORE_ECHO_FACTORY);
  private readonly zone = inject(NgZone);
  private echo: RealtimeEcho | null = null;
  private echoToken: string | null = null;

  runtimeUpdates(): Observable<RuntimeUpdateEvent> {
    return new Observable<RuntimeUpdateEvent>((subscriber) => {
      const token = this.auth.token();
      const user = this.auth.user();

      if (!token || !user) {
        subscriber.complete();

        return undefined;
      }

      const echo = this.resolveEcho(token);
      const channelName = `users.${user.id}.runtime`;
      const channel = echo.private(channelName);

      channel.listen('.runtime.workflow.updated', (event: RuntimeUpdateEvent) => {
        this.zone.run(() => subscriber.next(event));
      });

      return () => {
        echo.leave(channelName);
      };
    });
  }

  disconnect(): void {
    this.echo?.disconnect();
    this.echo = null;
    this.echoToken = null;
  }

  private resolveEcho(token: string): RealtimeEcho {
    if (this.echo && this.echoToken === token) {
      return this.echo;
    }

    this.disconnect();
    this.echo = this.echoFactory(this.config, token);
    this.echoToken = token;

    return this.echo;
  }
}
