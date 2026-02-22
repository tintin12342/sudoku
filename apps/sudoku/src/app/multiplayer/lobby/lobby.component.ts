import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { SudokuApiService, Difficulty } from '@sudoku/api';
import { MultiplayerService } from '@sudoku/multiplayer';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
})
export class LobbyComponent {
  private readonly _router = inject(Router);
  private readonly _api = inject(SudokuApiService);
  private readonly _multiplayer = inject(MultiplayerService);
  private readonly _snackBar = inject(MatSnackBar);

  readonly difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'random'];
  readonly selectedDifficulty = signal<Difficulty>('easy');
  readonly isCreating = signal(false);
  readonly isJoining = signal(false);

  readonly roomIdControl = new FormControl('', [
    Validators.required,
    Validators.minLength(4),
  ]);

  async createRoom(): Promise<void> {
    this.isCreating.set(true);
    try {
      const board = await this._api.getBoard(this.selectedDifficulty());
      const roomId = await this._multiplayer.createRoom(
        board,
        this.selectedDifficulty()
      );
      this._router.navigate(['/multiplayer', roomId]);
    } catch {
      this._snackBar.open('Failed to create room. Try again.', 'Close', {
        duration: 3000,
      });
      this.isCreating.set(false);
    }
  }

  async joinRoom(): Promise<void> {
    const roomId = this.roomIdControl.value?.trim();
    if (!roomId) return;

    this.isJoining.set(true);
    try {
      const exists = await this._multiplayer.roomExists(roomId);
      if (exists) {
        this._router.navigate(['/multiplayer', roomId]);
      } else {
        this._snackBar.open(
          'Room not found. Check the ID and try again.',
          'Close',
          {
            duration: 3000,
          }
        );
      }
    } catch {
      this._snackBar.open('Could not check room. Try again.', 'Close', {
        duration: 3000,
      });
    } finally {
      this.isJoining.set(false);
    }
  }
}
