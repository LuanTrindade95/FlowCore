import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { loadFlowcoreRuntimeConfig, provideFlowcoreRuntimeConfig } from './app/core/config/runtime-config';

registerLocaleData(localePt);

loadFlowcoreRuntimeConfig()
  .then((runtimeConfig) =>
    bootstrapApplication(AppComponent, {
      ...appConfig,
      providers: [...(appConfig.providers ?? []), ...provideFlowcoreRuntimeConfig(runtimeConfig)],
    }),
  )
  .catch((err) => console.error(err));
