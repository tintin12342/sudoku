import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Board } from '@sudoku/api';
import { CellComponent } from '../cell/cell.component';

@Component({
  selector: 'lib-board',
  standalone: true,
  imports: [CommonModule, CellComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class BoardComponent {
  board = input<Board>([]);
  initialBoard = input<Board>([]);
  isInvalid = input<boolean>(false);
  selectedCell = input<{ row: number; col: number } | null>(null);

  cellChange = output<{ row: number; col: number; value: number }>();
  cellSelect = output<{ row: number; col: number }>();

  readonly rows = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  readonly cols = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  isSelected = computed(() => (row: number, col: number) => {
    const sel = this.selectedCell();
    return sel?.row === row && sel?.col === col;
  });

  isPrefilled(row: number, col: number): boolean {
    return this.initialBoard()[row]?.[col] !== 0;
  }

  onCellClick(row: number, col: number): void {
    if (!this.isPrefilled(row, col)) {
      this.cellSelect.emit({ row, col });
    }
  }

  onCellValueChange(row: number, col: number, value: number): void {
    this.cellChange.emit({ row, col, value });
    this.cellSelect.emit({ row, col });
  }
}
