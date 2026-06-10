import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LoadingBarComponent } from './shared/ui/loading-bar/loading-bar.component';
import { ToastOutletComponent } from './shared/ui/toast-outlet/toast-outlet.component';

@Component({
  selector: 'app-root',
  imports: [LoadingBarComponent, RouterOutlet, ToastOutletComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly title = 'FlowCore';
}
