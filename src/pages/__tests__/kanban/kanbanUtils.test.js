import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEmptyBoard,
  addTask,
  updateTask,
  deleteTask,
  moveTask,
  reorderTask,
  filterByTag,
  filterByPriority,
  searchByTitle,
  applyFilters,
  findTask,
  validateTask,
  loadTasks,
  saveTasks,
  generateId,
} from '@/pages/kanban/kanbanUtils.js';
import { TASK_STATUSES, PRIORITIES, STORAGE_KEY } from '@/pages/kanban/constants.js';

function createMockStorage() {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    _store: store,
  };
}

describe('kanbanUtils', () => {
  describe('createEmptyBoard', () => {
    it('should create a board with three empty columns', () => {
      const board = createEmptyBoard();
      expect(board).toEqual({
        [TASK_STATUSES.TODO]: [],
        [TASK_STATUSES.IN_PROGRESS]: [],
        [TASK_STATUSES.DONE]: [],
      });
    });
  });

  describe('generateId', () => {
    it('should generate non-empty string ids', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique ids', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('addTask', () => {
    it('should add a task to the correct column', () => {
      const board = createEmptyBoard();
      const newBoard = addTask(board, {
        title: 'Test Task',
        status: TASK_STATUSES.TODO,
      });
      expect(newBoard[TASK_STATUSES.TODO].length).toBe(1);
      expect(newBoard[TASK_STATUSES.TODO][0].title).toBe('Test Task');
      expect(newBoard[TASK_STATUSES.TODO][0].id).toBeTruthy();
      expect(board[TASK_STATUSES.TODO].length).toBe(0);
    });

    it('should default to TODO status when not specified', () => {
      const board = createEmptyBoard();
      const newBoard = addTask(board, { title: 'No Status' });
      expect(newBoard[TASK_STATUSES.TODO].length).toBe(1);
      expect(newBoard[TASK_STATUSES.TODO][0].status).toBe(TASK_STATUSES.TODO);
    });

    it('should default to medium priority', () => {
      const board = createEmptyBoard();
      const newBoard = addTask(board, { title: 'No Priority' });
      expect(newBoard[TASK_STATUSES.TODO][0].priority).toBe(PRIORITIES.MEDIUM);
    });

    it('should filter out invalid tags', () => {
      const board = createEmptyBoard();
      const newBoard = addTask(board, {
        title: 'Tags Task',
        tags: ['Bug', '功能', 'InvalidTag'],
      });
      expect(newBoard[TASK_STATUSES.TODO][0].tags).toEqual(['Bug', '功能']);
    });

    it('should not mutate the original board', () => {
      const board = createEmptyBoard();
      const frozen = JSON.stringify(board);
      addTask(board, { title: 'Immutable' });
      expect(JSON.stringify(board)).toBe(frozen);
    });
  });

  describe('updateTask', () => {
    it('should update task fields', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Original', id: 't1' });
      const task = board[TASK_STATUSES.TODO][0];
      const updated = updateTask(board, task.id, { title: 'Updated', priority: PRIORITIES.HIGH });
      expect(updated[TASK_STATUSES.TODO][0].title).toBe('Updated');
      expect(updated[TASK_STATUSES.TODO][0].priority).toBe(PRIORITIES.HIGH);
    });

    it('should move task between status columns when status changes', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Move Me', status: TASK_STATUSES.TODO });
      const task = board[TASK_STATUSES.TODO][0];
      const updated = updateTask(board, task.id, { status: TASK_STATUSES.DONE });
      expect(updated[TASK_STATUSES.TODO].length).toBe(0);
      expect(updated[TASK_STATUSES.DONE].length).toBe(1);
      expect(updated[TASK_STATUSES.DONE][0].status).toBe(TASK_STATUSES.DONE);
    });

    it('should return the same board structure for non-existent task', () => {
      const board = createEmptyBoard();
      const updated = updateTask(board, 'non-existent', { title: 'X' });
      expect(updated).toEqual(board);
    });
  });

  describe('deleteTask', () => {
    it('should remove a task from its column', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Delete Me' });
      board = addTask(board, { title: 'Keep Me' });
      const task = board[TASK_STATUSES.TODO][0];
      const updated = deleteTask(board, task.id);
      expect(updated[TASK_STATUSES.TODO].length).toBe(1);
      expect(updated[TASK_STATUSES.TODO][0].title).toBe('Keep Me');
    });

    it('should do nothing if task does not exist', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Stay' });
      const updated = deleteTask(board, 'nope');
      expect(updated[TASK_STATUSES.TODO].length).toBe(1);
    });
  });

  describe('moveTask', () => {
    it('should move task to another column at given index', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Todo1', status: TASK_STATUSES.TODO });
      board = addTask(board, { title: 'Done1', status: TASK_STATUSES.DONE });
      board = addTask(board, { title: 'Done2', status: TASK_STATUSES.DONE });
      const todoTask = board[TASK_STATUSES.TODO][0];
      const moved = moveTask(board, todoTask.id, TASK_STATUSES.DONE, 1);
      expect(moved[TASK_STATUSES.TODO].length).toBe(0);
      expect(moved[TASK_STATUSES.DONE].length).toBe(3);
      expect(moved[TASK_STATUSES.DONE][1].title).toBe('Todo1');
    });

    it('should handle target index 0', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Mover', status: TASK_STATUSES.TODO });
      board = addTask(board, { title: 'IP1', status: TASK_STATUSES.IN_PROGRESS });
      const mover = board[TASK_STATUSES.TODO][0];
      const moved = moveTask(board, mover.id, TASK_STATUSES.IN_PROGRESS, 0);
      expect(moved[TASK_STATUSES.IN_PROGRESS][0].title).toBe('Mover');
    });

    it('should not change board if task id not found', () => {
      const board = createEmptyBoard();
      const moved = moveTask(board, 'nope', TASK_STATUSES.DONE, 0);
      expect(moved).toBe(board);
    });
  });

  describe('reorderTask', () => {
    it('should reorder tasks within the same column', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'A' });
      board = addTask(board, { title: 'B' });
      board = addTask(board, { title: 'C' });
      const reordered = reorderTask(board, TASK_STATUSES.TODO, 0, 2);
      const titles = reordered[TASK_STATUSES.TODO].map((t) => t.title);
      expect(titles).toEqual(['B', 'C', 'A']);
    });

    it('should handle moving to index 0', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'A' });
      board = addTask(board, { title: 'B' });
      board = addTask(board, { title: 'C' });
      const reordered = reorderTask(board, TASK_STATUSES.TODO, 2, 0);
      const titles = reordered[TASK_STATUSES.TODO].map((t) => t.title);
      expect(titles).toEqual(['C', 'A', 'B']);
    });
  });

  describe('filterByTag', () => {
    it('should filter tasks containing the given tag', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Bug Task', tags: ['Bug'] });
      board = addTask(board, { title: 'Feature Task', tags: ['功能'] });
      board = addTask(board, { title: 'Multi Tag', tags: ['Bug', '紧急'], status: TASK_STATUSES.IN_PROGRESS });
      const filtered = filterByTag(board, 'Bug');
      expect(filtered[TASK_STATUSES.TODO].length).toBe(1);
      expect(filtered[TASK_STATUSES.IN_PROGRESS].length).toBe(1);
      expect(filtered[TASK_STATUSES.DONE].length).toBe(0);
    });

    it('should return same board structure when tag is empty', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Any' });
      const filtered = filterByTag(board, '');
      expect(filtered[TASK_STATUSES.TODO].length).toBe(1);
    });
  });

  describe('filterByPriority', () => {
    it('should filter tasks by priority', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'High', priority: PRIORITIES.HIGH });
      board = addTask(board, { title: 'Medium', priority: PRIORITIES.MEDIUM });
      board = addTask(board, { title: 'Low', priority: PRIORITIES.LOW, status: TASK_STATUSES.IN_PROGRESS });
      const filtered = filterByPriority(board, PRIORITIES.HIGH);
      expect(filtered[TASK_STATUSES.TODO].length).toBe(1);
      expect(filtered[TASK_STATUSES.TODO][0].title).toBe('High');
      expect(filtered[TASK_STATUSES.IN_PROGRESS].length).toBe(0);
    });
  });

  describe('searchByTitle', () => {
    it('should do case-insensitive title search', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Fix Login BUG' });
      board = addTask(board, { title: 'Register feature' });
      board = addTask(board, { title: 'fix something', status: TASK_STATUSES.DONE });
      const filtered = searchByTitle(board, 'fix');
      expect(filtered[TASK_STATUSES.TODO].length).toBe(1);
      expect(filtered[TASK_STATUSES.DONE].length).toBe(1);
    });

    it('should match partial strings', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Hello World' });
      board = addTask(board, { title: 'Goodbye' });
      const filtered = searchByTitle(board, 'ell');
      expect(filtered[TASK_STATUSES.TODO].length).toBe(1);
      expect(filtered[TASK_STATUSES.TODO][0].title).toBe('Hello World');
    });

    it('should return original board when query is empty or whitespace', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Anything' });
      expect(searchByTitle(board, '')[TASK_STATUSES.TODO].length).toBe(1);
      expect(searchByTitle(board, '   ')[TASK_STATUSES.TODO].length).toBe(1);
    });
  });

  describe('applyFilters', () => {
    it('should apply both search and tag filters together', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Login Bug', tags: ['Bug'] });
      board = addTask(board, { title: 'Login Feature', tags: ['功能'] });
      board = addTask(board, { title: 'Other Bug', tags: ['Bug'] });
      const filtered = applyFilters(board, { query: 'login', tag: 'Bug' });
      expect(filtered[TASK_STATUSES.TODO].length).toBe(1);
      expect(filtered[TASK_STATUSES.TODO][0].title).toBe('Login Bug');
    });

    it('should apply search and priority filters together', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Login Issue', priority: PRIORITIES.HIGH });
      board = addTask(board, { title: 'Login Feature', priority: PRIORITIES.MEDIUM });
      board = addTask(board, { title: 'Other Issue', priority: PRIORITIES.HIGH });
      const filtered = applyFilters(board, { query: 'login', priority: PRIORITIES.HIGH });
      expect(filtered[TASK_STATUSES.TODO].length).toBe(1);
      expect(filtered[TASK_STATUSES.TODO][0].title).toBe('Login Issue');
    });

    it('should prefer tag over priority when both are provided (mutual exclusion)', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Bug High', tags: ['Bug'], priority: PRIORITIES.HIGH });
      board = addTask(board, { title: 'Feature High', tags: ['功能'], priority: PRIORITIES.HIGH });
      board = addTask(board, { title: 'Bug Low', tags: ['Bug'], priority: PRIORITIES.LOW });
      const filtered = applyFilters(board, { tag: 'Bug', priority: PRIORITIES.HIGH });
      const titles = filtered[TASK_STATUSES.TODO].map((t) => t.title).sort();
      expect(titles).toEqual(['Bug High', 'Bug Low']);
    });
  });

  describe('findTask', () => {
    it('should find task across any column', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Todo', status: TASK_STATUSES.TODO });
      board = addTask(board, { title: 'Done', status: TASK_STATUSES.DONE });
      const doneTask = board[TASK_STATUSES.DONE][0];
      const found = findTask(board, doneTask.id);
      expect(found).toBeTruthy();
      expect(found.title).toBe('Done');
    });

    it('should return null for non-existent id', () => {
      const board = createEmptyBoard();
      expect(findTask(board, 'nope')).toBeNull();
    });
  });

  describe('validateTask', () => {
    it('should mark empty title as invalid', () => {
      expect(validateTask({ title: '' }).valid).toBe(false);
      expect(validateTask({ title: '   ' }).valid).toBe(false);
    });

    it('should accept a valid task', () => {
      const result = validateTask({
        title: 'Valid',
        priority: PRIORITIES.HIGH,
        tags: ['Bug'],
        status: TASK_STATUSES.TODO,
      });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid priority', () => {
      const result = validateTask({ title: 'OK', priority: 'super-high' });
      expect(result.valid).toBe(false);
      expect(result.errors.priority).toBeTruthy();
    });

    it('should reject tasks with invalid tags', () => {
      const result = validateTask({ title: 'OK', tags: ['NotATag'] });
      expect(result.valid).toBe(false);
      expect(result.errors.tags).toBeTruthy();
    });

    it('should reject invalid status', () => {
      const result = validateTask({ title: 'OK', status: 'archived' });
      expect(result.valid).toBe(false);
    });

    it('should handle null/undefined task', () => {
      expect(validateTask(null).valid).toBe(false);
      expect(validateTask(undefined).valid).toBe(false);
    });
  });

  describe('localStorage persistence', () => {
    let storage;
    beforeEach(() => {
      storage = createMockStorage();
    });

    it('loadTasks should return default board and persist it when storage empty', () => {
      const board = loadTasks(storage);
      expect(board[TASK_STATUSES.TODO].length).toBeGreaterThan(0);
      expect(storage.getItem(STORAGE_KEY)).toBeTruthy();
    });

    it('saveTasks and loadTasks should round-trip correctly', () => {
      let board = createEmptyBoard();
      board = addTask(board, { title: 'Persisted' });
      saveTasks(board, storage);
      const loaded = loadTasks(storage);
      expect(loaded[TASK_STATUSES.TODO].length).toBe(1);
      expect(loaded[TASK_STATUSES.TODO][0].title).toBe('Persisted');
    });

    it('loadTasks should gracefully handle corrupted JSON', () => {
      storage.setItem(STORAGE_KEY, '{invalid json');
      const board = loadTasks(storage);
      expect(board[TASK_STATUSES.TODO]).toBeInstanceOf(Array);
    });

    it('loadTasks should ignore extra unknown columns', () => {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          [TASK_STATUSES.TODO]: [{ id: '1', title: 'Valid', tags: [] }],
          archived: [{ id: '2', title: 'Unknown' }],
        })
      );
      const board = loadTasks(storage);
      expect(board.archived).toBeUndefined();
      expect(board[TASK_STATUSES.TODO].length).toBe(1);
    });

    it('should not throw when storage is unavailable (null)', () => {
      expect(() => loadTasks(null)).not.toThrow();
      expect(() => saveTasks(createEmptyBoard(), null)).not.toThrow();
    });
  });
});
