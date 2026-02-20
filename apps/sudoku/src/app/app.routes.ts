import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./game/game.component').then((m) => m.GameComponent),
  },
];
