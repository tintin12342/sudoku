import { TestBed } from '@angular/core/testing';
import { Database, DatabaseReference } from '@angular/fire/database';
import {
  MultiplayerService,
  RoomState,
  RoomPlayer,
} from './multiplayer.service';
import { Board } from '@sudoku/api';

jest.mock('@angular/fire/database', () => ({
  ref: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  push: jest.fn(),
  remove: jest.fn(),
  onValue: jest.fn(),
  get: jest.fn(),
  onDisconnect: jest.fn(),
  Database: class {},
}));

import {
  ref,
  set,
  update,
  push,
  remove,
  onValue,
  get,
  onDisconnect,
} from '@angular/fire/database';

const mockRef = {} as DatabaseReference;
const mockDb = {} as Database;
const mockBoard: Board = Array.from({ length: 9 }, () => Array(9).fill(0));

const makeSnapshot = (value: RoomState | null, exists = true) => ({
  val: () => value,
  exists: () => exists,
});

const makeRoomState = (
  playerCount: number,
  takenColors: string[] = []
): RoomState => {
  const players: Record<string, RoomPlayer> = {};
  for (let i = 0; i < playerCount; i++) {
    players[`player${i}`] = {
      name: `Player P${i}`,
      color: takenColors[i] ?? `#unknown${i}`,
      joinedAt: Date.now(),
    };
  }
  return {
    board: mockBoard,
    initialBoard: mockBoard,
    difficulty: 'easy',
    status: 'playing',
    createdAt: Date.now(),
    players,
  };
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MultiplayerService', () => {
  let service: MultiplayerService;

  beforeEach(() => {
    jest.clearAllMocks();
    (ref as jest.Mock).mockReturnValue(mockRef);
    (set as jest.Mock).mockResolvedValue(undefined);
    (update as jest.Mock).mockResolvedValue(undefined);
    (remove as jest.Mock).mockResolvedValue(undefined);
    (push as jest.Mock).mockReturnValue({ key: 'test-room-id' });
    (onDisconnect as jest.Mock).mockReturnValue({ remove: jest.fn() });

    TestBed.configureTestingModule({
      providers: [MultiplayerService, { provide: Database, useValue: mockDb }],
    });
    service = TestBed.inject(MultiplayerService);
  });

  // createRoom

  describe('createRoom', () => {
    it('should return the generated room ID', async () => {
      const roomId = await service.createRoom(mockBoard, 'easy');
      expect(roomId).toBe('test-room-id');
    });

    it('should set room with correct shape', async () => {
      await service.createRoom(mockBoard, 'hard');
      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          board: mockBoard,
          initialBoard: mockBoard,
          difficulty: 'hard',
          status: 'playing',
          players: {},
        })
      );
    });
  });

  // joinRoom

  describe('joinRoom', () => {
    it('should emit room state from Firebase', (done) => {
      const mockState = makeRoomState(1);
      (onValue as jest.Mock).mockImplementation((_ref, callback) => {
        callback(makeSnapshot(mockState));
        return jest.fn();
      });

      service.joinRoom('room-1').subscribe((state) => {
        expect(state).toEqual(mockState);
        done();
      });
    });

    it('should call unsubscribe on teardown', () => {
      const unsubscribeMock = jest.fn();
      (onValue as jest.Mock).mockReturnValue(unsubscribeMock);

      const sub = service.joinRoom('room-1').subscribe();
      sub.unsubscribe();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should propagate Firebase errors', (done) => {
      (onValue as jest.Mock).mockImplementation((_ref, _cb, errorCb) => {
        errorCb(new Error('Firebase error'));
        return jest.fn();
      });

      service.joinRoom('room-1').subscribe({
        error: (err) => {
          expect(err.message).toBe('Firebase error');
          done();
        },
      });
    });
  });

  // roomExists

  describe('roomExists', () => {
    it('should return true when room exists', async () => {
      (get as jest.Mock).mockResolvedValue(makeSnapshot(null, true));
      expect(await service.roomExists('room-1')).toBe(true);
    });

    it('should return false when room does not exist', async () => {
      (get as jest.Mock).mockResolvedValue(makeSnapshot(null, false));
      expect(await service.roomExists('room-1')).toBe(false);
    });
  });

  // registerPlayer

  describe('registerPlayer', () => {
    it('should throw when room does not exist', async () => {
      (get as jest.Mock).mockResolvedValue({
        val: () => null,
        exists: () => false,
      });
      await expect(service.registerPlayer('room-1', 'p1')).rejects.toThrow(
        'Room not found'
      );
    });

    it('should throw when room is full', async () => {
      (get as jest.Mock).mockResolvedValue({
        val: () => makeRoomState(4),
        exists: () => true,
      });
      await expect(service.registerPlayer('room-1', 'p5')).rejects.toThrow(
        'Room is full'
      );
    });

    it('should assign the first color not taken by existing players', async () => {
      (get as jest.Mock).mockResolvedValue({
        val: () => makeRoomState(1, ['#8e24aa']),
        exists: () => true,
      });

      await service.registerPlayer('room-1', 'abc1');
      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ color: '#1e88e5' })
      );
    });

    it('should set player name derived from playerId', async () => {
      (get as jest.Mock).mockResolvedValue({
        val: () => makeRoomState(0),
        exists: () => true,
      });

      await service.registerPlayer('room-1', 'abcd9999');
      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: 'Player ABCD' })
      );
    });

    it('should register onDisconnect removal', async () => {
      const removeMock = jest.fn();
      (onDisconnect as jest.Mock).mockReturnValue({ remove: removeMock });
      (get as jest.Mock).mockResolvedValue({
        val: () => makeRoomState(0),
        exists: () => true,
      });

      await service.registerPlayer('room-1', 'p1');
      expect(onDisconnect).toHaveBeenCalled();
      expect(removeMock).toHaveBeenCalled();
    });
  });

  // removePlayer

  describe('removePlayer', () => {
    it('should call remove on player ref', async () => {
      await service.removePlayer('room-1', 'p1');
      expect(remove).toHaveBeenCalledWith(mockRef);
    });
  });

  // updateBoard & updateStatus

  describe.each([
    {
      method: 'updateBoard' as const,
      call: (svc: MultiplayerService) => svc.updateBoard('room-1', mockBoard),
      expectedPayload: { board: mockBoard },
    },
    {
      method: 'updateStatus' as const,
      call: (svc: MultiplayerService) => svc.updateStatus('room-1', 'solved'),
      expectedPayload: { status: 'solved' },
    },
  ])('$method', ({ call, expectedPayload }) => {
    it('should call update with correct payload', async () => {
      await call(service);
      expect(update).toHaveBeenCalledWith(mockRef, expectedPayload);
    });
  });
});
