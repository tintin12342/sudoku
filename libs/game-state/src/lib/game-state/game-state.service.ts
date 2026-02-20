import { Injectable, signal, computed } from '@angular/core';
import { Board, Difficulty } from '@sudoku/api';

export type GameStatus = 'idle' | 'playing' | 'solved' | 'invalid';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  // Core state signals
  readonly board = signal<Board>([]);
  readonly initialBoard = signal<Board>([]);
  readonly difficulty = signal<Difficulty>('easy');
  readonly gameStatus = signal<GameStatus>('idle');
  readonly elapsedSeconds = signal<number>(0);

  // Computed signals
  readonly isPlaying = computed(() => this.gameStatus() === 'playing');
  readonly isSolved = computed(() => this.gameStatus() === 'solved');

  readonly isCellPrefilled = computed(
    () => (row: number, col: number) => this.initialBoard()[row]?.[col] !== 0
  );

  readonly isBoardComplete = computed(() =>
    this.board().every((row) => row.every((cell) => cell !== 0))
  );

  private timerInterval: ReturnType<typeof setInterval> | null = null;

  initGame(board: Board, difficulty: Difficulty): void {
    this.board.set(board.map((row) => [...row]));
    this.initialBoard.set(board.map((row) => [...row]));
    this.difficulty.set(difficulty);
    this.gameStatus.set('playing');
    this.elapsedSeconds.set(0);
    this.startTimer();
  }

  setCellValue(row: number, col: number, value: number): void {
    if (this.isCellPrefilled()(row, col)) return;

    this.board.update((board) => {
      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = value;
      return newBoard;
    });

    // Reset invalid status back to playing when user edits
    if (this.gameStatus() === 'invalid') {
      this.gameStatus.set('playing');
    }
  }

  applySolution(solution: Board): void {
    this.board.set(solution.map((row) => [...row]));
    this.gameStatus.set('solved');
    this.stopTimer();
  }

  setStatus(status: GameStatus): void {
    this.gameStatus.set(status);
    if (status === 'solved') this.stopTimer();
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty.set(difficulty);
  }

  resetGame(): void {
    this.board.set([]);
    this.initialBoard.set([]);
    this.gameStatus.set('idle');
    this.elapsedSeconds.set(0);
    this.stopTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds.update((s) => s + 1);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
