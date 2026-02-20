import { Component, input, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cell.component.html',
  styleUrl: './cell.component.scss',
})
export class CellComponent {
  value = input<number>(0);
  isPrefilled = input<boolean>(false);
  isSelected = input<boolean>(false);
  isInvalid = input<boolean>(false);

  cellClick = output<void>();
  valueChange = output<number>();

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.isPrefilled()) return;

    const num = parseInt(event.key);
    if (num >= 1 && num <= 9) {
      this.valueChange.emit(num);
    } else if (
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key === '0'
    ) {
      this.valueChange.emit(0);
    }
  }
}
