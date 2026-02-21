import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BoardComponent } from './board.component';
import { Board } from '@sudoku/api';

const mockBoard: Board = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

describe('BoardComponent', () => {
  let fixture: ComponentFixture<BoardComponent>;
  let component: BoardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => jest.clearAllMocks());

  // isPrefilled

  describe('isPrefilled', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('initialBoard', mockBoard);
    });

    it('should return true when the initial cell value is non-zero', () => {
      expect(component.isPrefilled(0, 0)).toBe(true); // value = 5
    });

    it('should return false when the initial cell value is zero', () => {
      expect(component.isPrefilled(0, 2)).toBe(false); // value = 0
    });
  });

  // isSelected

  describe('isSelected', () => {
    it('should return true for the currently selected cell', () => {
      fixture.componentRef.setInput('selectedCell', { row: 2, col: 4 });
      expect(component.isSelected()(2, 4)).toBe(true);
    });

    it('should return false for a non-selected cell', () => {
      fixture.componentRef.setInput('selectedCell', { row: 2, col: 4 });
      expect(component.isSelected()(0, 0)).toBe(false);
    });

    it('should return false when no cell is selected', () => {
      fixture.componentRef.setInput('selectedCell', null);
      expect(component.isSelected()(0, 0)).toBe(false);
    });
  });

  // onCellClick

  describe('onCellClick', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('initialBoard', mockBoard);
    });

    it('should emit cellSelect when the cell is not prefilled', () => {
      const spy = jest.spyOn(component.cellSelect, 'emit');
      component.onCellClick(0, 2);
      expect(spy).toHaveBeenCalledWith({ row: 0, col: 2 });
    });

    it('should not emit cellSelect when the cell is prefilled', () => {
      const spy = jest.spyOn(component.cellSelect, 'emit');
      component.onCellClick(0, 0);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // onCellValueChange

  describe('onCellValueChange', () => {
    it('should emit cellChange with row, col, and value', () => {
      const spy = jest.spyOn(component.cellChange, 'emit');
      component.onCellValueChange(3, 6, 9);
      expect(spy).toHaveBeenCalledWith({ row: 3, col: 6, value: 9 });
    });

    it('should also emit cellSelect for the same cell', () => {
      const spy = jest.spyOn(component.cellSelect, 'emit');
      component.onCellValueChange(3, 6, 9);
      expect(spy).toHaveBeenCalledWith({ row: 3, col: 6 });
    });
  });

  // Template

  describe('template', () => {
    it('should render exactly 81 lib-cell elements', () => {
      fixture.componentRef.setInput('board', mockBoard);
      fixture.componentRef.setInput('initialBoard', mockBoard);
      fixture.detectChanges();
      const cells = fixture.nativeElement.querySelectorAll('lib-cell');
      expect(cells.length).toBe(81);
    });
  });
});
