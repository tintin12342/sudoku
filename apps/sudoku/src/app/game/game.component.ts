import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { SudokuApiService, Difficulty } from '@sudoku/api';
import { GameStateService } from '@sudoku/game-state';
import { BoardComponent } from '@sudoku/board';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    BoardComponent,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent implements OnInit {
  private readonly _snackBar = inject(MatSnackBar);
  protected readonly api = inject(SudokuApiService);
  readonly gameState = inject(GameStateService);

  private readonly _resetStatuses = ['invalid', 'broken', 'unsolvable'];

  readonly difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'random'];
  readonly selectedDifficulty = signal<Difficulty>('easy');
  readonly selectedCell = signal<{ row: number; col: number } | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadBoard();
  }

  async loadBoard(): Promise<void> {
    try {
      const board = await this.api.getBoard(this.selectedDifficulty());
      this.gameState.initGame(board, this.selectedDifficulty());
    } catch {
      this._snackBar.open('Failed to load board. Please try again.', 'Retry', {
        duration: 4000,
      });
    }
  }

  async onValidate(): Promise<void> {
    try {
      const result = await this.api.validateBoard(this.gameState.board());

      switch (result.status) {
        case 'solved':
          this.gameState.setStatus('solved');
          this._snackBar.open('Congratulations! Puzzle solved!', 'Close', {
            duration: 5000,
          });
          break;

        case 'broken':
          this.gameState.setStatus('broken');
          this._snackBar.open('Board is broken.', 'Close', {
            duration: 4000,
          });
          break;

        default:
          this.gameState.setStatus('invalid');
          this._snackBar.open('Board is invalid. Keep trying!', 'Close', {
            duration: 3000,
          });
      }
    } catch {
      this._snackBar.open('Validation failed. Try again.', 'Close', {
        duration: 3000,
      });
    }
  }

  async onSolve(): Promise<void> {
    try {
      const result = await this.api.solveBoard(this.gameState.board());

      switch (result.status) {
        case 'solved':
          this.gameState.applySolution(result.solution);
          this._snackBar.open('Board solved!', 'Close', { duration: 3000 });
          break;

        case 'unsolvable':
          this.gameState.setStatus('unsolvable');
          this._snackBar.open('This board has no solution.', 'Close', {
            duration: 4000,
          });
          break;

        default:
          this.gameState.setStatus('broken');
          this._snackBar.open(
            'Board is broken and cannot be solved.',
            'Close',
            {
              duration: 4000,
            }
          );
          break;
      }
    } catch {
      this._snackBar.open('Could not solve board.', 'Close', {
        duration: 3000,
      });
    }
  }

  onCellSelect(cell: { row: number; col: number } | null): void {
    this.selectedCell.set(cell);

    if (this._resetStatuses.includes(this.gameState.gameStatus())) {
      this.gameState.setStatus('playing');
    }
  }

  onNumpadInput(value: number): void {
    const cell = this.selectedCell();
    if (cell) {
      this.gameState.setCellValue(cell.row, cell.col, value);
    }
  }

  onCellChange(event: { row: number; col: number; value: number }): void {
    this.gameState.setCellValue(event.row, event.col, event.value);
  }

  onDifficultyChange(difficulty: Difficulty): void {
    this.selectedDifficulty.set(difficulty);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}
