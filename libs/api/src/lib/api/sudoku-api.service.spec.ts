import { TestBed } from '@angular/core/testing';

import { SudokuApiService } from './sudoku-api.service';

describe('SudokuApiService', () => {
  let service: SudokuApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SudokuApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
