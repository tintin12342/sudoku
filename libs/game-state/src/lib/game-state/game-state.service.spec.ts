import { GameStateService } from './game-state.service';
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

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new GameStateService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // initGame

  describe('initGame', () => {
    it('should set board and initialBoard as deep copies', () => {
      service.initGame(mockBoard, 'easy');
      expect(service.board()).toEqual(mockBoard);
      expect(service.initialBoard()).toEqual(mockBoard);
      mockBoard[0][2] = 99;
      expect(service.board()[0][2]).toBe(0);
      mockBoard[0][2] = 0;
    });

    it('should set status to playing', () => {
      service.initGame(mockBoard, 'easy');
      expect(service.gameStatus()).toBe('playing');
      expect(service.isPlaying()).toBe(true);
    });

    it('should set difficulty', () => {
      service.initGame(mockBoard, 'hard');
      expect(service.difficulty()).toBe('hard');
    });

    it('should reset elapsed seconds to 0', () => {
      service.initGame(mockBoard, 'easy');
      jest.advanceTimersByTime(5000);
      service.initGame(mockBoard, 'easy');
      expect(service.elapsedSeconds()).toBe(0);
    });

    it('should start the timer', () => {
      service.initGame(mockBoard, 'easy');
      jest.advanceTimersByTime(3000);
      expect(service.elapsedSeconds()).toBe(3);
    });
  });

  // setCellValue

  describe('setCellValue', () => {
    beforeEach(() => service.initGame(mockBoard, 'easy'));

    it('should update an empty cell', () => {
      service.setCellValue(0, 2, 4);
      expect(service.board()[0][2]).toBe(4);
    });

    it('should not update a prefilled cell', () => {
      service.setCellValue(0, 0, 9);
      expect(service.board()[0][0]).toBe(5);
    });

    it('should reset invalid status to playing', () => {
      service.setStatus('invalid');
      service.setCellValue(0, 2, 4);
      expect(service.gameStatus()).toBe('playing');
    });

    it('should reset broken status to playing', () => {
      service.setStatus('broken');
      service.setCellValue(0, 2, 4);
      expect(service.gameStatus()).toBe('playing');
    });

    it('should reset unsolvable status to playing', () => {
      service.setStatus('unsolvable');
      service.setCellValue(0, 2, 4);
      expect(service.gameStatus()).toBe('playing');
    });

    it('should not reset solved status when editing', () => {
      service.setStatus('solved');
      service.setCellValue(0, 2, 4);
      expect(service.gameStatus()).toBe('solved');
    });
  });

  // setStatus

  describe('setStatus', () => {
    beforeEach(() => service.initGame(mockBoard, 'easy'));

    it('should update gameStatus', () => {
      service.setStatus('invalid');
      expect(service.gameStatus()).toBe('invalid');
    });

    it('should stop the timer when status is solved', () => {
      jest.advanceTimersByTime(3000);
      service.setStatus('solved');
      jest.advanceTimersByTime(3000);
      expect(service.elapsedSeconds()).toBe(3);
    });

    it('should not stop the timer for non-solved statuses', () => {
      jest.advanceTimersByTime(2000);
      service.setStatus('invalid');
      jest.advanceTimersByTime(2000);
      expect(service.elapsedSeconds()).toBe(4);
    });
  });

  // applySolution

  describe('applySolution', () => {
    beforeEach(() => service.initGame(mockBoard, 'easy'));

    it('should set board to solution', () => {
      service.applySolution(solvedBoard);
      expect(service.board()).toEqual(solvedBoard);
    });

    it('should set status to solved', () => {
      service.applySolution(solvedBoard);
      expect(service.gameStatus()).toBe('solved');
      expect(service.isSolved()).toBe(true);
    });

    it('should stop the timer', () => {
      jest.advanceTimersByTime(4000);
      service.applySolution(solvedBoard);
      jest.advanceTimersByTime(4000);
      expect(service.elapsedSeconds()).toBe(4);
    });
  });

  // isBoardComplete

  describe('isBoardComplete', () => {
    it('should return false when board has empty cells', () => {
      service.initGame(mockBoard, 'easy');
      expect(service.isBoardComplete()).toBe(false);
    });

    it('should return true when all cells are filled', () => {
      service.initGame(solvedBoard, 'easy');
      expect(service.isBoardComplete()).toBe(true);
    });
  });

  // resetGame

  describe('resetGame', () => {
    it('should clear board and status', () => {
      service.initGame(mockBoard, 'easy');
      service.resetGame();
      expect(service.board()).toEqual([]);
      expect(service.gameStatus()).toBe('idle');
      expect(service.elapsedSeconds()).toBe(0);
    });

    it('should stop the timer', () => {
      service.initGame(mockBoard, 'easy');
      jest.advanceTimersByTime(3000);
      service.resetGame();
      jest.advanceTimersByTime(3000);
      expect(service.elapsedSeconds()).toBe(0);
    });
  });
});
