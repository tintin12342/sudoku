import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SudokuApiService } from '@sudoku/api';
import { BoardComponent } from '@sudoku/board';
import { MultiplayerService } from '@sudoku/multiplayer';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ClipboardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    BoardComponent,
  ],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss',
})
export class RoomComponent implements OnInit, OnDestroy {
  private readonly _route = inject(ActivatedRoute);
  private readonly _multiplayer = inject(MultiplayerService);
  private readonly _api = inject(SudokuApiService);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _clipboard = inject(Clipboard);
  private readonly _router = inject(Router);

  private readonly _resetStatuses = ['invalid', 'broken', 'unsolvable'];

  readonly roomId = this._route.snapshot.paramMap.get('roomId')!;
  readonly playerId = this._getOrCreatePlayerId();
  readonly selectedCell = signal<{ row: number; col: number } | null>(null);
  private readonly _roomState = toSignal(
    this._multiplayer.joinRoom(this.roomId)
  );

  readonly board = computed(() => this._roomState()?.board ?? []);
  readonly initialBoard = computed(() => this._roomState()?.initialBoard ?? []);
  readonly status = computed(() => this._roomState()?.status ?? 'playing');
  readonly difficulty = computed(() => this._roomState()?.difficulty ?? 'easy');
  readonly players = computed(() =>
    Object.values(this._roomState()?.players ?? {})
  );
  readonly isSolved = computed(() => this.status() === 'solved');
  readonly isLoading = computed(() => this._roomState() === undefined);

  async ngOnInit(): Promise<void> {
    try {
      await this._multiplayer.registerPlayer(this.roomId, this.playerId);
    } catch (e: any) {
      if (e.message === 'Room is full') {
        this._snackBar.open('🚫 Room is full (max 4 players).', 'Close', {
          duration: 4000,
        });
        this._router.navigate(['/multiplayer']);
      } else {
        this._snackBar.open('Room not found.', 'Close', { duration: 4000 });
        this._router.navigate(['/multiplayer']);
      }
    }
  }

  ngOnDestroy(): void {
    this._multiplayer.removePlayer(this.roomId, this.playerId);
  }

  onCellSelect(cell: { row: number; col: number } | null): void {
    this.selectedCell.set(cell);

    if (this._resetStatuses.includes(this.status())) {
      this._multiplayer.updateStatus(this.roomId, 'playing');
    }
  }

  onCellChange(event: { row: number; col: number; value: number }): void {
    const newBoard = this.board().map((row) => [...row]);
    newBoard[event.row][event.col] = event.value;

    this._multiplayer.updateBoard(this.roomId, newBoard);

    if (this._resetStatuses.includes(this.status())) {
      this._multiplayer.updateStatus(this.roomId, 'playing');
    }
  }

  onNumpadInput(value: number): void {
    const cell = this.selectedCell();
    if (cell) {
      const newBoard = this.board().map((row) => [...row]);
      newBoard[cell.row][cell.col] = value;
      this._multiplayer.updateBoard(this.roomId, newBoard);

      if (this._resetStatuses.includes(this.status())) {
        this._multiplayer.updateStatus(this.roomId, 'playing');
      }
    }
  }

  async onValidate(): Promise<void> {
    try {
      const result = await this._api.validateBoard(this.board());
      switch (result.status) {
        case 'solved':
          await this._multiplayer.updateStatus(this.roomId, 'solved');
          this._snackBar.open('Puzzle solved!', 'Close', { duration: 5000 });
          break;
        case 'broken':
          await this._multiplayer.updateStatus(this.roomId, 'broken');
          this._snackBar.open('Board is broken.', 'Close', {
            duration: 4000,
          });
          break;
        default:
          await this._multiplayer.updateStatus(this.roomId, 'invalid');
          this._snackBar.open('Not quite right. Keep trying!', 'Close', {
            duration: 3000,
          });
      }
    } catch {
      this._snackBar.open('Validation failed.', 'Close', { duration: 3000 });
    }
  }

  async onSolve(): Promise<void> {
    try {
      const result = await this._api.solveBoard(this.board());
      switch (result.status) {
        case 'solved':
          await this._multiplayer.updateBoard(this.roomId, result.solution);
          await this._multiplayer.updateStatus(this.roomId, 'solved');
          this._snackBar.open('Board solved!', 'Close', { duration: 3000 });
          break;
        case 'unsolvable':
          await this._multiplayer.updateStatus(this.roomId, 'unsolvable');
          this._snackBar.open('No solution exists.', 'Close', {
            duration: 4000,
          });
          break;
        case 'broken':
          await this._multiplayer.updateStatus(this.roomId, 'broken');
          this._snackBar.open('Board is broken.', 'Close', {
            duration: 4000,
          });
          break;
      }
    } catch {
      this._snackBar.open('Could not solve board.', 'Close', {
        duration: 3000,
      });
    }
  }

  copyInviteLink(): void {
    this._clipboard.copy(
      `${window.location.origin}/multiplayer/${this.roomId}`
    );
    this._snackBar.open('Invite link copied!', 'Close', { duration: 2000 });
  }

  private _getOrCreatePlayerId(): string {
    const key = 'sudoku_player_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem(key, id);
    }
    return id;
  }
}
