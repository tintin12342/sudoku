import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SudokuApiService } from './sudoku-api.service';
import { Board } from '../model/sudoku-api.model';
import { SUDOKU_API_BASE_URL } from '../model/api-token';

const BASE_URL = 'https://sugoku.onrender.com';

const encodeBoard = (board: Board): string =>
  `board=${encodeURIComponent(JSON.stringify(board))}`;

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

const flushError = (req: TestRequest): void =>
  req.flush('Error', { status: 500, statusText: 'Server Error' });

describe('SudokuApiService', () => {
  let service: SudokuApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SudokuApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SUDOKU_API_BASE_URL, useValue: BASE_URL },
      ],
    });
    service = TestBed.inject(SudokuApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // getBoard

  describe('getBoard', () => {
    it('should GET correct URL with difficulty param and return board', async () => {
      const promise = service.getBoard('hard');

      const req = httpMock.expectOne(`${BASE_URL}/board?difficulty=hard`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('difficulty')).toBe('hard');
      req.flush({ board: mockBoard });

      expect(await promise).toEqual(mockBoard);
    });

    it('should set isLoading true then false on success', async () => {
      const promise = service.getBoard('easy');
      expect(service.isLoading()).toBe(true);

      httpMock
        .expectOne(`${BASE_URL}/board?difficulty=easy`)
        .flush({ board: mockBoard });
      await promise;

      expect(service.isLoading()).toBe(false);
    });

    it('should set isLoading false and set error on failure', async () => {
      const promise = service.getBoard('easy');
      flushError(httpMock.expectOne(`${BASE_URL}/board?difficulty=easy`));

      await promise.catch(() => {
        // expected error for test
      });
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBe('Failed to fetch board. Please try again.');
    });

    it('should clear error signal on new request', async () => {
      const first = service.getBoard('easy');
      flushError(httpMock.expectOne(`${BASE_URL}/board?difficulty=easy`));
      await first.catch(() => {
        // expected rejection for this test, error is handled by the service
      });

      const second = service.getBoard('easy');
      expect(service.error()).toBeNull();
      httpMock
        .expectOne(`${BASE_URL}/board?difficulty=easy`)
        .flush({ board: mockBoard });
      await second;
    });
  });

  // validateBoard & solveBoard

  describe.each([
    {
      method: 'validateBoard' as const,
      url: `${BASE_URL}/validate`,
      call: (svc: SudokuApiService) => svc.validateBoard(mockBoard),
      successResponse: { status: 'solved' },
      errorMessage: 'Failed to validate board.',
    },
    {
      method: 'solveBoard' as const,
      url: `${BASE_URL}/solve`,
      call: (svc: SudokuApiService) => svc.solveBoard(mockBoard),
      successResponse: {
        status: 'solved',
        solution: solvedBoard,
        difficulty: 'easy',
      },
      errorMessage: 'Failed to solve board.',
    },
  ])('$method', ({ url, call, successResponse, errorMessage }) => {
    it('should POST with encoded body and correct Content-Type header', async () => {
      const promise = call(service);

      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe(encodeBoard(mockBoard));
      expect(req.request.headers.get('Content-Type')).toBe(
        'application/x-www-form-urlencoded'
      );
      req.flush(successResponse);

      await promise;
    });

    it('should set isLoading true then false on success', async () => {
      const promise = call(service);
      expect(service.isLoading()).toBe(true);

      httpMock.expectOne(url).flush(successResponse);
      await promise;

      expect(service.isLoading()).toBe(false);
    });

    it('should set isLoading false and set error on failure', async () => {
      const promise = call(service);
      flushError(httpMock.expectOne(url));

      await promise.catch(() => {
        // expected error for test
      });
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBe(errorMessage);
    });

    it('should clear error signal on new request', async () => {
      const first = call(service);
      flushError(httpMock.expectOne(url));
      await first.catch(() => {
        // expected rejection for this test, error is handled by the service
      });

      const second = call(service);
      expect(service.error()).toBeNull();
      httpMock.expectOne(url).flush(successResponse);
      await second;
    });
  });
});
