import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./game/game.component').then((m) => m.GameComponent),
  },
  {
    path: 'multiplayer',
    loadComponent: () =>
      import('./multiplayer/lobby/lobby.component').then(
        (m) => m.LobbyComponent
      ),
  },
  {
    path: 'multiplayer/:roomId',
    loadComponent: () =>
      import('./multiplayer/room/room.component').then((m) => m.RoomComponent),
  },
];
