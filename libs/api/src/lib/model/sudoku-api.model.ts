export type Difficulty = 'easy' | 'medium' | 'hard' | 'random';
export type GameStatus = 'idle' | 'playing' | 'solved' | 'invalid' | 'broken' | 'unsolvable';
export type Board = number[][];

export interface BoardResponse {
  board: Board;
}

export interface SudokuRequest {
  board: Board;
}

export interface SolveResponse {
  difficulty: Difficulty;
  solution: Board;
  status: 'solved' | 'broken' | 'unsolvable';
}

export interface ValidateResponse {
  status: 'solved' | 'broken' | 'invalid';
}
