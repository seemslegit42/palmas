import { Component, inject } from '@angular/core';
import { NavHeader } from './components/nav-header';
import { FabCluster } from './components/fab-cluster';
import { CanvasView } from './views/canvas-view';
import { ManageView } from './views/manage-view';
import { EditView } from './views/edit-view';
import { SettingsView } from './views/settings-view';
import { PromptStore } from './services/prompt-store';

@Component({
  selector: 'app-root',
  imports: [NavHeader, FabCluster, CanvasView, ManageView, EditView, SettingsView],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly store = inject(PromptStore);
}

