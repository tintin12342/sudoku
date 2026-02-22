import { Injectable, inject } from '@angular/core';
import {
  Database,
  ref,
  set,
  update,
  push,
  remove,
  onValue,
  get,
  onDisconnect,
} from '@angular/fire/database';
import { Observable } from 'rxjs';
import { Board, Difficulty } from '@sudoku/api';

export interface RoomPlayer {
  name: string;
  color: string;
  joinedAt: number;
}

export interface RoomState {
  board: Board;
  initialBoard: Board;
  difficulty: Difficulty;
  status: string;
  createdAt: number;
  players: Record<string, RoomPlayer>;
}

@Injectable({ providedIn: 'root' })
export class MultiplayerService {
  private readonly _db = inject(Database);

  private readonly MAX_PLAYERS = 4 as const;
  private readonly PLAYER_COLORS = [
    '#8e24aa',
    '#1e88e5',
    '#43a047',
    '#fb8c00',
  ] as const;

  async createRoom(board: Board, difficulty: Difficulty): Promise<string> {
    const roomRef = push(ref(this._db, 'rooms'));
    const roomId = roomRef.key!;

    await set(roomRef, {
      board,
      initialBoard: board,
      difficulty,
      status: 'playing',
      createdAt: Date.now(),
      players: {},
    });

    return roomId;
  }

  async roomExists(roomId: string): Promise<boolean> {
    const snapshot = await get(ref(this._db, `rooms/${roomId}`));
    return snapshot.exists();
  }

  async registerPlayer(roomId: string, playerId: string): Promise<void> {
    const room = await get(ref(this._db, `rooms/${roomId}`));
    const data = room.val() as RoomState | null;

    if (!data) throw new Error('Room not found');

    const existingPlayers = Object.values(data.players ?? {});
    if (existingPlayers.length >= this.MAX_PLAYERS)
      throw new Error('Room is full');

    const takenColors = new Set(existingPlayers.map((p) => p.color));
    const availableColor =
      this.PLAYER_COLORS.find((c) => !takenColors.has(c)) ??
      this.PLAYER_COLORS[0];

    const playerRef = ref(this._db, `rooms/${roomId}/players/${playerId}`);

    await set(playerRef, {
      name: `Player ${playerId.slice(0, 4).toUpperCase()}`,
      color: availableColor,
      joinedAt: Date.now(),
    });

    onDisconnect(playerRef).remove();
  }

  joinRoom(roomId: string): Observable<RoomState | null> {
    return new Observable((observer) => {
      const roomRef = ref(this._db, `rooms/${roomId}`);
      const unsubscribe = onValue(
        roomRef,
        (snapshot) => observer.next(snapshot.val() as RoomState),
        (error) => observer.error(error)
      );
      return () => unsubscribe();
    });
  }

  removePlayer(roomId: string, playerId: string): Promise<void> {
    return remove(ref(this._db, `rooms/${roomId}/players/${playerId}`));
  }

  updateBoard(roomId: string, board: Board): Promise<void> {
    return update(ref(this._db, `rooms/${roomId}`), { board });
  }

  updateStatus(roomId: string, status: string): Promise<void> {
    return update(ref(this._db, `rooms/${roomId}`), { status });
  }
}
