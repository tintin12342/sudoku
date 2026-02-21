import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { GameComponent } from './game.component';
import { SudokuApiService, Difficulty } from '@sudoku/api';
import { GameStateService } from '@sudoku/game-state';
import { Board, GameStatus } from '@sudoku/api';

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

const solvedBoard: Board = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const createApiMock = () => ({
  getBoard: jest.fn().mockResolvedValue(mockBoard),
  validateBoard: jest.fn(),
  solveBoard: jest.fn(),
});

const createGameStateMock = () => ({
  board: signal<Board>(mockBoard),
  gameStatus: signal<GameStatus>('playing'),
  elapsedSeconds: signal(0),
  difficulty: signal<Difficulty>('easy'),
  initGame: jest.fn(),
  setCellValue: jest.fn(),
  setStatus: jest.fn(),
  applySolution: jest.fn(),
  resetGame: jest.fn(),
});

const createSnackBarMock = () => ({
  open: jest.fn(),
});

describe('GameComponent', () => {
  let component: GameComponent;
  let apiMock: ReturnType<typeof createApiMock>;
  let gameStateMock: ReturnType<typeof createGameStateMock>;
  let snackBarMock: ReturnType<typeof createSnackBarMock>;

  beforeEach(async () => {
    apiMock = createApiMock();
    gameStateMock = createGameStateMock();
    snackBarMock = createSnackBarMock();

    await TestBed.configureTestingModule({
      imports: [GameComponent, RouterModule.forRoot([])],
      providers: [
        { provide: SudokuApiService, useValue: apiMock },
        { provide: GameStateService, useValue: gameStateMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideProvider(MatSnackBar, { useValue: snackBarMock })
      .compileComponents();

    const fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => jest.clearAllMocks());

  // ngOnInit & loadBoard

  describe('ngOnInit / loadBoard', () => {
    it('should call getBoard with current difficulty on init', async () => {
      await component.ngOnInit();
      expect(apiMock.getBoard).toHaveBeenCalledWith('easy');
    });

    it('should call initGame with fetched board and difficulty', async () => {
      await component.ngOnInit();
      expect(gameStateMock.initGame).toHaveBeenCalledWith(mockBoard, 'easy');
    });

    it('should show snackbar when getBoard fails', async () => {
      apiMock.getBoard.mockRejectedValue(new Error('Network error'));
      await component.ngOnInit();
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Failed to load board. Please try again.',
        'Retry',
        expect.any(Object)
      );
    });

    it('should load board with selected difficulty after difficulty change', async () => {
      component.onDifficultyChange('hard');
      await component.loadBoard();
      expect(apiMock.getBoard).toHaveBeenCalledWith('hard');
    });
  });

  // onNumpadInput

  describe('onNumpadInput', () => {
    it('should do nothing when no cell is selected', () => {
      component.selectedCell.set(null);
      component.onNumpadInput(5);
      expect(gameStateMock.setCellValue).not.toHaveBeenCalled();
    });

    it('should call setCellValue with correct row, col, value when cell is selected', () => {
      component.selectedCell.set({ row: 2, col: 4 });
      component.onNumpadInput(7);
      expect(gameStateMock.setCellValue).toHaveBeenCalledWith(2, 4, 7);
    });
  });

  // onCellSelect

  describe('onCellSelect', () => {
    it('should update selectedCell', () => {
      component.onCellSelect({ row: 1, col: 3 });
      expect(component.selectedCell()).toEqual({ row: 1, col: 3 });
    });

    it('should set selectedCell to null when called with null', () => {
      component.selectedCell.set({ row: 0, col: 0 });
      component.onCellSelect(null);
      expect(component.selectedCell()).toBeNull();
    });

    it.each(['invalid', 'broken', 'unsolvable'])(
      'should reset %s status to playing on cell select',
      (status) => {
        gameStateMock.gameStatus.set(status as GameStatus);
        component.onCellSelect({ row: 0, col: 0 });
        expect(gameStateMock.setStatus).toHaveBeenCalledWith('playing');
      }
    );

    it('should not reset status when game is playing', () => {
      gameStateMock.gameStatus.set('playing');
      component.onCellSelect({ row: 0, col: 0 });
      expect(gameStateMock.setStatus).not.toHaveBeenCalled();
    });
  });

  // onValidate

  describe('onValidate', () => {
    it('should set status to solved and show snackbar', async () => {
      apiMock.validateBoard.mockResolvedValue({ status: 'solved' });
      await component.onValidate();
      expect(gameStateMock.setStatus).toHaveBeenCalledWith('solved');
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Congratulations! Puzzle solved!',
        'Close',
        expect.any(Object)
      );
    });

    it('should set status to broken on broken response', async () => {
      apiMock.validateBoard.mockResolvedValue({ status: 'broken' });
      await component.onValidate();
      expect(gameStateMock.setStatus).toHaveBeenCalledWith('broken');
    });

    it('should set status to invalid on any other response', async () => {
      apiMock.validateBoard.mockResolvedValue({ status: 'unsolved' });
      await component.onValidate();
      expect(gameStateMock.setStatus).toHaveBeenCalledWith('invalid');
    });

    it('should show snackbar when validation request fails', async () => {
      apiMock.validateBoard.mockRejectedValue(new Error('Network error'));
      await component.onValidate();
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Validation failed. Try again.',
        'Close',
        expect.any(Object)
      );
    });
  });

  // onSolve

  describe('onSolve', () => {
    it('should call applySolution and show snackbar on solved response', async () => {
      apiMock.solveBoard.mockResolvedValue({
        status: 'solved',
        solution: solvedBoard,
      });
      await component.onSolve();
      expect(gameStateMock.applySolution).toHaveBeenCalledWith(solvedBoard);
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Board solved!',
        'Close',
        expect.any(Object)
      );
    });

    it('should set status to unsolvable on unsolvable response', async () => {
      apiMock.solveBoard.mockResolvedValue({ status: 'unsolvable' });
      await component.onSolve();
      expect(gameStateMock.setStatus).toHaveBeenCalledWith('unsolvable');
    });

    it('should set status to broken on any other response', async () => {
      apiMock.solveBoard.mockResolvedValue({ status: 'broken' });
      await component.onSolve();
      expect(gameStateMock.setStatus).toHaveBeenCalledWith('broken');
    });

    it('should show snackbar when solve request fails', async () => {
      apiMock.solveBoard.mockRejectedValue(new Error('Network error'));
      await component.onSolve();
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Could not solve board.',
        'Close',
        expect.any(Object)
      );
    });
  });

  // onDifficultyChange

  describe('onDifficultyChange', () => {
    it('should update selectedDifficulty signal', () => {
      component.onDifficultyChange('hard');
      expect(component.selectedDifficulty()).toBe('hard');
    });
  });

  // formatTime

  describe('formatTime', () => {
    it.each([
      [0, '00:00'],
      [59, '00:59'],
      [60, '01:00'],
      [65, '01:05'],
      [3600, '60:00'],
    ])('should format %i seconds as %s', (input, expected) => {
      expect(component.formatTime(input)).toBe(expected);
    });
  });
});
