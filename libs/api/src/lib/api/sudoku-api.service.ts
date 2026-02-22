import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Board,
  BoardResponse,
  Difficulty,
  SolveResponse,
  SudokuRequest,
  ValidateResponse,
} from '../model/sudoku-api.model';
import { SUDOKU_API_BASE_URL } from '../model/api-token';

@Injectable({ providedIn: 'root' })
export class SudokuApiService {
  private readonly _http = inject(HttpClient);
  private readonly _baseUrl = inject(SUDOKU_API_BASE_URL);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  async getBoard(difficulty: Difficulty): Promise<Board> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const params = new HttpParams().set('difficulty', difficulty);
      const response = await firstValueFrom(
        this._http.get<BoardResponse>(`${this._baseUrl}/board`, { params })
      );
      return response.board;
    } catch (error) {
      this.error.set('Failed to fetch board. Please try again.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async validateBoard(board: Board): Promise<ValidateResponse> {
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    this.isLoading.set(true);
    this.error.set(null);
    try {
      return await firstValueFrom(
        this._http.post<ValidateResponse>(
          `${this._baseUrl}/validate`,
          this._encodeBoard({ board }),
          { headers }
        )
      );
    } catch (error) {
      this.error.set('Failed to validate board.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async solveBoard(board: Board): Promise<SolveResponse> {
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    this.isLoading.set(true);
    this.error.set(null);
    try {
      return await firstValueFrom(
        this._http.post<SolveResponse>(
          `${this._baseUrl}/solve`,
          this._encodeBoard({ board }),
          { headers }
        )
      );
    } catch (error) {
      this.error.set('Failed to solve board.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  private _encodeBoard(body: SudokuRequest): string {
    return `board=${encodeURIComponent(JSON.stringify(body.board))}`;
  }
}
