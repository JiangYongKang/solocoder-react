import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDefaultState,
  loadState,
  saveState,
  isKeyDuplicated,
  isValidKey,
  addTranslationKey,
  updateTranslationKey,
  deleteTranslationKey,
  updateTranslationValue,
  addLanguage,
  isKeyFullyTranslated,
  isKeyPartiallyUntranslated,
  filterTranslations,
  calculateCoverage,
  getKeyParts,
  buildTree,
  getLeafKeys,
  importTranslations,
  exportTranslations,
  compareKeyTranslations,
  getKeyCompareStatus,
  sortKeys,
  getTopLevelKeys,
  getInitialExpandedKeys,
} from '@/pages/i18n-manager/i18nUtils.js';
import { FILTER_MODES, DEFAULT_LANGUAGES, STORAGE_KEY } from '@/pages/i18n-manager/constants.js';

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

const LANGS = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'en-US', name: 'English' },
];

describe('i18nUtils', () => {
  describe('getDefaultState', () => {
    it('should return default state with languages and translations', () => {
      const state = getDefaultState();
      expect(state).toHaveProperty('languages');
      expect(state).toHaveProperty('translations');
      expect(Array.isArray(state.languages)).toBe(true);
      expect(typeof state.translations).toBe('object');
      expect(state.languages.length).toBeGreaterThan(0);
    });

    it('should not share references between calls', () => {
      const a = getDefaultState();
      const b = getDefaultState();
      a.translations['test'] = { 'zh-CN': 'x' };
      expect(b.translations['test']).toBeUndefined();
    });
  });

  describe('localStorage persistence', () => {
    let storage;
    beforeEach(() => {
      storage = createMockStorage();
    });

    it('loadState should return default state and persist when storage empty', () => {
      const state = loadState(storage);
      expect(state.languages.length).toBeGreaterThan(0);
      expect(Object.keys(state.translations).length).toBeGreaterThan(0);
      expect(storage.getItem(STORAGE_KEY)).toBeTruthy();
    });

    it('saveState and loadState should round-trip correctly', () => {
      const original = {
        languages: [{ code: 'zh-CN', name: '简体中文' }],
        translations: { 'hello': { 'zh-CN': '你好' } },
      };
      saveState(original, storage);
      const loaded = loadState(storage);
      expect(loaded.languages).toEqual(original.languages);
      expect(loaded.translations).toEqual(original.translations);
    });

    it('loadState should gracefully handle corrupted JSON', () => {
      storage.setItem(STORAGE_KEY, '{invalid json');
      const state = loadState(storage);
      expect(Array.isArray(state.languages)).toBe(true);
      expect(typeof state.translations).toBe('object');
    });

    it('loadState should handle malformed state structure', () => {
      storage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
      const state = loadState(storage);
      expect(Array.isArray(state.languages)).toBe(true);
      expect(typeof state.translations).toBe('object');
    });

    it('loadState should filter out invalid languages', () => {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          languages: [{ code: 'zh', name: '中文' }, null, { foo: 'bar' }, { code: '', name: '' }],
          translations: {},
        })
      );
      const state = loadState(storage);
      expect(state.languages.length).toBe(1);
      expect(state.languages[0].code).toBe('zh');
    });

    it('should not throw when storage is unavailable', () => {
      expect(() => loadState(null)).not.toThrow();
      expect(() => saveState(getDefaultState(), null)).not.toThrow();
    });
  });

  describe('isValidKey', () => {
    it('should accept valid simple keys', () => {
      expect(isValidKey('hello')).toBe(true);
      expect(isValidKey('hello_world')).toBe(true);
      expect(isValidKey('hello123')).toBe(true);
    });

    it('should accept valid nested keys', () => {
      expect(isValidKey('user.profile.name')).toBe(true);
      expect(isValidKey('a.b.c.d')).toBe(true);
    });

    it('should reject empty or null keys', () => {
      expect(isValidKey('')).toBe(false);
      expect(isValidKey('   ')).toBe(false);
      expect(isValidKey(null)).toBe(false);
      expect(isValidKey(undefined)).toBe(false);
    });

    it('should reject keys starting or ending with dot', () => {
      expect(isValidKey('.hello')).toBe(false);
      expect(isValidKey('hello.')).toBe(false);
      expect(isValidKey('.hello.')).toBe(false);
    });

    it('should reject keys with consecutive dots', () => {
      expect(isValidKey('user..name')).toBe(false);
    });

    it('should reject keys with special characters', () => {
      expect(isValidKey('user name')).toBe(false);
      expect(isValidKey('user-name')).toBe(false);
      expect(isValidKey('user@name')).toBe(false);
    });
  });

  describe('isKeyDuplicated', () => {
    it('should return true for existing keys', () => {
      const translations = { 'hello': { 'zh-CN': '你好' } };
      expect(isKeyDuplicated(translations, 'hello')).toBe(true);
    });

    it('should return false for non-existing keys', () => {
      const translations = { 'hello': { 'zh-CN': '你好' } };
      expect(isKeyDuplicated(translations, 'world')).toBe(false);
    });

    it('should return false when excluding the same key', () => {
      const translations = { 'hello': { 'zh-CN': '你好' } };
      expect(isKeyDuplicated(translations, 'hello', 'hello')).toBe(false);
    });

    it('should return true for existing key when excluding different key', () => {
      const translations = { 'hello': { 'zh-CN': '你好' }, 'world': { 'zh-CN': '世界' } };
      expect(isKeyDuplicated(translations, 'hello', 'world')).toBe(true);
    });
  });

  describe('addTranslationKey', () => {
    it('should add a new key with empty values for all languages', () => {
      const translations = {};
      const result = addTranslationKey(translations, 'greeting.hello', LANGS);
      expect(result['greeting.hello']).toEqual({ 'zh-CN': '', 'en-US': '' });
      expect(translations['greeting.hello']).toBeUndefined();
    });

    it('should not add duplicate keys', () => {
      const translations = { 'greeting': { 'zh-CN': '问候', 'en-US': 'Greeting' } };
      const result = addTranslationKey(translations, 'greeting', LANGS);
      expect(result).toBe(translations);
    });

    it('should not add invalid keys', () => {
      const translations = {};
      const result = addTranslationKey(translations, '.invalid', LANGS);
      expect(result).toBe(translations);
    });

    it('should trim whitespace from key', () => {
      const translations = {};
      const result = addTranslationKey(translations, '  hello.world  ', LANGS);
      expect(result['hello.world']).toBeDefined();
    });
  });

  describe('updateTranslationKey', () => {
    it('should rename a key while preserving its values', () => {
      const translations = { 'old.key': { 'zh-CN': '旧', 'en-US': 'Old' } };
      const result = updateTranslationKey(translations, 'old.key', 'new.key');
      expect(result['old.key']).toBeUndefined();
      expect(result['new.key']).toEqual({ 'zh-CN': '旧', 'en-US': 'Old' });
    });

    it('should return original if new key is same as old', () => {
      const translations = { 'same': { 'zh-CN': '相同' } };
      const result = updateTranslationKey(translations, 'same', 'same');
      expect(result).toBe(translations);
    });

    it('should return original if new key is invalid', () => {
      const translations = { 'hello': { 'zh-CN': '你好' } };
      const result = updateTranslationKey(translations, 'hello', '.invalid');
      expect(result).toBe(translations);
    });

    it('should return original if new key already exists', () => {
      const translations = { 'a': { 'zh-CN': 'A' }, 'b': { 'zh-CN': 'B' } };
      const result = updateTranslationKey(translations, 'a', 'b');
      expect(result).toBe(translations);
    });
  });

  describe('deleteTranslationKey', () => {
    it('should remove the specified key', () => {
      const translations = { 'a': { 'zh-CN': 'A' }, 'b': { 'zh-CN': 'B' } };
      const result = deleteTranslationKey(translations, 'a');
      expect(result['a']).toBeUndefined();
      expect(result['b']).toEqual({ 'zh-CN': 'B' });
      expect(translations['a']).toBeDefined();
    });

    it('should return original if key does not exist', () => {
      const translations = { 'a': { 'zh-CN': 'A' } };
      const result = deleteTranslationKey(translations, 'nonexistent');
      expect(result).toBe(translations);
    });
  });

  describe('updateTranslationValue', () => {
    it('should update translation value for a specific language', () => {
      const translations = { 'hello': { 'zh-CN': '', 'en-US': '' } };
      const result = updateTranslationValue(translations, 'hello', 'zh-CN', '你好');
      expect(result['hello']['zh-CN']).toBe('你好');
      expect(result['hello']['en-US']).toBe('');
      expect(translations['hello']['zh-CN']).toBe('');
    });

    it('should return original if key does not exist', () => {
      const translations = {};
      const result = updateTranslationValue(translations, 'nonexistent', 'zh-CN', 'x');
      expect(result).toBe(translations);
    });
  });

  describe('addLanguage', () => {
    it('should add a new language and initialize empty values', () => {
      const languages = [{ code: 'zh-CN', name: '简体中文' }];
      const translations = { 'hello': { 'zh-CN': '你好' } };
      const result = addLanguage(languages, translations, 'en-US', 'English');
      expect(result.languages).toHaveLength(2);
      expect(result.languages[1]).toEqual({ code: 'en-US', name: 'English' });
      expect(result.translations['hello']['en-US']).toBe('');
      expect(result.translations['hello']['zh-CN']).toBe('你好');
    });

    it('should not add language with duplicate code', () => {
      const result = addLanguage(LANGS, {}, 'zh-CN', '中文');
      expect(result.languages).toBe(LANGS);
    });

    it('should not add language with empty code or name', () => {
      let result = addLanguage(LANGS, {}, '', 'Name');
      expect(result.languages).toBe(LANGS);
      result = addLanguage(LANGS, {}, 'code', '');
      expect(result.languages).toBe(LANGS);
      result = addLanguage(LANGS, {}, '  ', 'Name');
      expect(result.languages).toBe(LANGS);
    });

    it('should trim whitespace from code and name', () => {
      const result = addLanguage(LANGS, {}, '  ja-JP  ', '  日本語  ');
      expect(result.languages.length).toBe(3);
      expect(result.languages[2]).toEqual({ code: 'ja-JP', name: '日本語' });
    });
  });

  describe('translation completeness', () => {
    it('isKeyFullyTranslated should return true when all languages translated', () => {
      const keyData = { 'zh-CN': '你好', 'en-US': 'Hello' };
      expect(isKeyFullyTranslated(keyData, LANGS)).toBe(true);
    });

    it('isKeyFullyTranslated should return false when any language empty', () => {
      const keyData = { 'zh-CN': '你好', 'en-US': '' };
      expect(isKeyFullyTranslated(keyData, LANGS)).toBe(false);
    });

    it('isKeyFullyTranslated should treat whitespace as empty', () => {
      const keyData = { 'zh-CN': '你好', 'en-US': '   ' };
      expect(isKeyFullyTranslated(keyData, LANGS)).toBe(false);
    });

    it('isKeyPartiallyUntranslated should return true when any language empty', () => {
      const keyData = { 'zh-CN': '你好', 'en-US': '' };
      expect(isKeyPartiallyUntranslated(keyData, LANGS)).toBe(true);
    });

    it('isKeyPartiallyUntranslated should return false when all translated', () => {
      const keyData = { 'zh-CN': '你好', 'en-US': 'Hello' };
      expect(isKeyPartiallyUntranslated(keyData, LANGS)).toBe(false);
    });
  });

  describe('filterTranslations', () => {
    const translations = {
      'all.translated': { 'zh-CN': '全翻译', 'en-US': 'All Translated' },
      'partial.translated': { 'zh-CN': '部分翻译', 'en-US': '' },
      'none.translated': { 'zh-CN': '', 'en-US': '' },
    };

    it('should return all keys in ALL mode', () => {
      const result = filterTranslations(translations, LANGS, FILTER_MODES.ALL);
      expect(Object.keys(result)).toHaveLength(3);
    });

    it('should return only fully translated keys in TRANSLATED mode', () => {
      const result = filterTranslations(translations, LANGS, FILTER_MODES.TRANSLATED);
      expect(Object.keys(result)).toEqual(['all.translated']);
    });

    it('should return partially or fully untranslated keys in UNTRANSLATED mode', () => {
      const result = filterTranslations(translations, LANGS, FILTER_MODES.UNTRANSLATED);
      expect(Object.keys(result).sort()).toEqual(['none.translated', 'partial.translated'].sort());
    });
  });

  describe('calculateCoverage', () => {
    it('should calculate correct coverage percentages', () => {
      const translations = {
        'a': { 'zh-CN': 'A', 'en-US': 'A' },
        'b': { 'zh-CN': 'B', 'en-US': '' },
        'c': { 'zh-CN': '', 'en-US': '' },
      };
      const coverage = calculateCoverage(translations, LANGS);
      expect(coverage['zh-CN'].translated).toBe(2);
      expect(coverage['zh-CN'].total).toBe(3);
      expect(coverage['zh-CN'].percentage).toBe(67);
      expect(coverage['en-US'].translated).toBe(1);
      expect(coverage['en-US'].percentage).toBe(33);
    });

    it('should handle empty translations', () => {
      const coverage = calculateCoverage({}, LANGS);
      expect(coverage['zh-CN'].translated).toBe(0);
      expect(coverage['zh-CN'].total).toBe(0);
      expect(coverage['zh-CN'].percentage).toBe(0);
    });

    it('should handle 100% coverage', () => {
      const translations = { 'a': { 'zh-CN': 'X', 'en-US': 'Y' } };
      const coverage = calculateCoverage(translations, LANGS);
      expect(coverage['zh-CN'].percentage).toBe(100);
      expect(coverage['en-US'].percentage).toBe(100);
    });
  });

  describe('getKeyParts', () => {
    it('should split key by dots', () => {
      expect(getKeyParts('user.profile.name')).toEqual(['user', 'profile', 'name']);
    });

    it('should handle single part keys', () => {
      expect(getKeyParts('hello')).toEqual(['hello']);
    });
  });

  describe('buildTree and getLeafKeys', () => {
    const translations = {
      'app.title': {},
      'app.welcome': {},
      'user.profile.name': {},
      'user.profile.email': {},
      'common.save': {},
    };

    it('should build a nested tree structure', () => {
      const tree = buildTree(translations);
      expect(tree.app).toBeDefined();
      expect(tree.app.__children.title).toBeDefined();
      expect(tree.app.__children.title.__isLeaf).toBe(true);
      expect(tree.app.__children.title.__fullKey).toBe('app.title');
      expect(tree.user.__children.profile.__children.name.__isLeaf).toBe(true);
      expect(tree.user.__children.profile.__children.name.__fullKey).toBe('user.profile.name');
    });

    it('getLeafKeys should return all leaf full keys', () => {
      const tree = buildTree(translations);
      const leaves = getLeafKeys(tree).sort();
      expect(leaves).toEqual(Object.keys(translations).sort());
    });
  });

  describe('importTranslations', () => {
    it('should merge imported data with existing data', () => {
      const languages = LANGS;
      const translations = { 'existing': { 'zh-CN': '已存在', 'en-US': 'Existing' } };
      const importData = {
        'existing': { 'zh-CN': '已覆盖', 'en-US': 'Overwritten' },
        'new': { 'zh-CN': '新的', 'en-US': 'New' },
      };
      const result = importTranslations(languages, translations, importData);
      expect(result.translations['existing']['zh-CN']).toBe('已覆盖');
      expect(result.translations['new']['zh-CN']).toBe('新的');
    });

    it('should add new languages from import data', () => {
      const importData = { 'hello': { 'ja-JP': 'こんにちは' } };
      const result = importTranslations(LANGS, {}, importData);
      expect(result.languages.some((l) => l.code === 'ja-JP')).toBe(true);
      expect(result.translations['hello']['zh-CN']).toBe('');
      expect(result.translations['hello']['ja-JP']).toBe('こんにちは');
    });

    it('should handle non-object import gracefully', () => {
      const result = importTranslations(LANGS, {}, null);
      expect(result.languages).toBe(LANGS);
      expect(result.translations).toEqual({});
    });

    it('should initialize missing language values for existing keys', () => {
      const languages = LANGS;
      const translations = { 'old': { 'zh-CN': '旧' } };
      const importData = { 'old': { 'en-US': 'Old' } };
      const result = importTranslations(languages, translations, importData);
      expect(result.translations['old']['zh-CN']).toBe('旧');
      expect(result.translations['old']['en-US']).toBe('Old');
    });
  });

  describe('exportTranslations', () => {
    it('should return a deep copy of translations', () => {
      const translations = { 'hello': { 'zh-CN': '你好' } };
      const exported = exportTranslations(translations);
      expect(exported).toEqual(translations);
      exported['hello']['zh-CN'] = 'modified';
      expect(translations['hello']['zh-CN']).toBe('你好');
    });
  });

  describe('compareKeyTranslations and getKeyCompareStatus', () => {
    it('should detect all same non-empty values', () => {
      const keyData = { 'zh-CN': 'Test', 'en-US': 'Test' };
      expect(compareKeyTranslations(keyData, LANGS).allSame).toBe(true);
      expect(compareKeyTranslations(keyData, LANGS).allEmpty).toBe(false);
    });

    it('should detect different values', () => {
      const keyData = { 'zh-CN': '测试', 'en-US': 'Test' };
      expect(compareKeyTranslations(keyData, LANGS).allSame).toBe(false);
      expect(compareKeyTranslations(keyData, LANGS).allEmpty).toBe(false);
    });

    it('should detect all empty values', () => {
      const keyData = { 'zh-CN': '', 'en-US': '' };
      expect(compareKeyTranslations(keyData, LANGS).allEmpty).toBe(true);
    });

    it('getKeyCompareStatus should return missing for empty values', () => {
      const keyData = { 'zh-CN': '你好', 'en-US': '' };
      expect(getKeyCompareStatus(keyData, 'en-US', LANGS)).toBe('missing');
    });

    it('getKeyCompareStatus should return same when all non-empty values are identical', () => {
      const keyData = { 'zh-CN': 'Same', 'en-US': 'Same' };
      expect(getKeyCompareStatus(keyData, 'zh-CN', LANGS)).toBe('same');
      expect(getKeyCompareStatus(keyData, 'en-US', LANGS)).toBe('same');
    });

    it('getKeyCompareStatus should return different when values differ', () => {
      const keyData = { 'zh-CN': '测试', 'en-US': 'Test' };
      expect(getKeyCompareStatus(keyData, 'zh-CN', LANGS)).toBe('different');
      expect(getKeyCompareStatus(keyData, 'en-US', LANGS)).toBe('different');
    });

    it('getKeyCompareStatus should return missing when some empty and some non-empty', () => {
      const keyData = { 'zh-CN': '你好', 'en-US': '' };
      expect(getKeyCompareStatus(keyData, 'en-US', LANGS)).toBe('missing');
      expect(getKeyCompareStatus(keyData, 'zh-CN', LANGS)).toBe('same');
    });
  });

  describe('sortKeys', () => {
    it('should return translations sorted by key alphabetically', () => {
      const translations = {
        'zebra': {},
        'apple': {},
        'monkey': {},
      };
      const sorted = sortKeys(translations);
      expect(Object.keys(sorted)).toEqual(['apple', 'monkey', 'zebra']);
    });

    it('should not mutate the original object', () => {
      const translations = { 'b': {}, 'a': {} };
      const frozenKeys = Object.keys(translations);
      sortKeys(translations);
      expect(Object.keys(translations)).toEqual(frozenKeys);
    });
  });

  describe('immutability', () => {
    it('addTranslationKey should not mutate original', () => {
      const original = {};
      const frozen = JSON.stringify(original);
      addTranslationKey(original, 'hello', LANGS);
      expect(JSON.stringify(original)).toBe(frozen);
    });

    it('updateTranslationValue should not mutate original', () => {
      const original = { 'hello': { 'zh-CN': '' } };
      const frozen = JSON.stringify(original);
      updateTranslationValue(original, 'hello', 'zh-CN', '你好');
      expect(JSON.stringify(original)).toBe(frozen);
    });

    it('deleteTranslationKey should not mutate original', () => {
      const original = { 'hello': { 'zh-CN': '你好' } };
      const frozen = JSON.stringify(original);
      deleteTranslationKey(original, 'hello');
      expect(JSON.stringify(original)).toBe(frozen);
    });
  });

  describe('getTopLevelKeys', () => {
    it('should extract unique top-level key namespaces', () => {
      const translations = {
        'app.title': {},
        'app.welcome': {},
        'user.profile.name': {},
        'user.profile.email': {},
        'common.save': {},
      };
      expect(getTopLevelKeys(translations)).toEqual(['app', 'common', 'user']);
    });

    it('should handle single-part keys as top-level', () => {
      const translations = {
        'standalone': {},
        'app.title': {},
      };
      expect(getTopLevelKeys(translations)).toEqual(['app', 'standalone']);
    });

    it('should return empty array for empty translations', () => {
      expect(getTopLevelKeys({})).toEqual([]);
    });

    it('should deduplicate and sort top-level keys', () => {
      const translations = {
        'zebra.x': {},
        'apple.y': {},
        'apple.z': {},
        'monkey.a': {},
      };
      expect(getTopLevelKeys(translations)).toEqual(['apple', 'monkey', 'zebra']);
    });
  });

  describe('getInitialExpandedKeys', () => {
    it('should generate expanded key set for all top-level namespaces at level 0', () => {
      const translations = {
        'app.title': {},
        'user.profile.name': {},
        'common.save': {},
      };
      const result = getInitialExpandedKeys(translations);
      expect(result instanceof Set).toBe(true);
      expect(result.has('app_0')).toBe(true);
      expect(result.has('user_0')).toBe(true);
      expect(result.has('common_0')).toBe(true);
      expect(result.size).toBe(3);
    });

    it('should support custom level parameter', () => {
      const translations = { 'app.title': {} };
      const result = getInitialExpandedKeys(translations, 2);
      expect(result.has('app_2')).toBe(true);
      expect(result.size).toBe(1);
    });

    it('should return empty set for empty translations', () => {
      const result = getInitialExpandedKeys({});
      expect(result instanceof Set).toBe(true);
      expect(result.size).toBe(0);
    });

    it('should handle dynamically imported namespaces', () => {
      const translations = {
        'dashboard.overview': {},
        'dashboard.stats': {},
        'settings.general': {},
        'api.endpoints.list': {},
      };
      const result = getInitialExpandedKeys(translations);
      expect(result.has('dashboard_0')).toBe(true);
      expect(result.has('settings_0')).toBe(true);
      expect(result.has('api_0')).toBe(true);
      expect(result.size).toBe(3);
    });
  });

  describe('row operations for both view modes', () => {
    it('deleteTranslationKey should work consistently regardless of key nesting depth', () => {
      const translations = {
        'simple': { 'zh-CN': '简单', 'en-US': 'Simple' },
        'nested.key': { 'zh-CN': '嵌套', 'en-US': 'Nested' },
        'deeply.nested.key': { 'zh-CN': '深层嵌套', 'en-US': 'Deep' },
      };

      const afterDeleteSimple = deleteTranslationKey(translations, 'simple');
      expect(Object.keys(afterDeleteSimple)).toEqual(['nested.key', 'deeply.nested.key']);

      const afterDeleteNested = deleteTranslationKey(afterDeleteSimple, 'nested.key');
      expect(Object.keys(afterDeleteNested)).toEqual(['deeply.nested.key']);

      const afterDeleteDeep = deleteTranslationKey(afterDeleteNested, 'deeply.nested.key');
      expect(Object.keys(afterDeleteDeep)).toEqual([]);

      expect(Object.keys(translations)).toHaveLength(3);
    });

    it('updateTranslationKey should handle renaming leaf nodes in nested keys', () => {
      const translations = {
        'user.profile.name': { 'zh-CN': '姓名', 'en-US': 'Name' },
        'user.profile.email': { 'zh-CN': '邮箱', 'en-US': 'Email' },
      };

      const result = updateTranslationKey(
        translations,
        'user.profile.name',
        'user.profile.fullName'
      );

      expect(result['user.profile.fullName']).toEqual({ 'zh-CN': '姓名', 'en-US': 'Name' });
      expect(result['user.profile.name']).toBeUndefined();
      expect(result['user.profile.email']).toBeDefined();
    });

    it('updateTranslationValue should work for both simple and nested keys', () => {
      const translations = {
        'simple': { 'zh-CN': '', 'en-US': '' },
        'a.b.c': { 'zh-CN': '', 'en-US': '' },
      };

      let result = updateTranslationValue(translations, 'simple', 'zh-CN', '简单值');
      result = updateTranslationValue(result, 'a.b.c', 'en-US', 'Nested Value');

      expect(result['simple']['zh-CN']).toBe('简单值');
      expect(result['a.b.c']['en-US']).toBe('Nested Value');
      expect(result['simple']['en-US']).toBe('');
      expect(result['a.b.c']['zh-CN']).toBe('');
    });

    it('addTranslationKey should support adding nested keys with dot notation', () => {
      const translations = {};
      const result = addTranslationKey(translations, 'new.nested.deep.key', LANGS);

      expect(result['new.nested.deep.key']).toEqual({ 'zh-CN': '', 'en-US': '' });
      expect(getTopLevelKeys(result)).toEqual(['new']);
    });

    it('tree building should preserve all leaf keys regardless of nesting', () => {
      const translations = {
        'a': { 'zh-CN': 'A' },
        'a.b': { 'zh-CN': 'AB' },
        'a.b.c': { 'zh-CN': 'ABC' },
        'x.y.z.w': { 'zh-CN': 'XYZW' },
      };

      const tree = buildTree(translations);
      const leaves = getLeafKeys(tree).sort();
      expect(leaves).toEqual(Object.keys(translations).sort());
    });

    it('filterTranslations should correctly filter both flat and nested keys', () => {
      const translations = {
        'flat.done': { 'zh-CN': '已完成', 'en-US': 'Done' },
        'flat.partial': { 'zh-CN': '部分', 'en-US': '' },
        'nested.key.done': { 'zh-CN': '嵌套完成', 'en-US': 'Nested Done' },
        'nested.key.empty': { 'zh-CN': '', 'en-US': '' },
      };

      const allKeys = filterTranslations(translations, LANGS, FILTER_MODES.ALL);
      expect(Object.keys(allKeys)).toHaveLength(4);

      const doneKeys = filterTranslations(translations, LANGS, FILTER_MODES.TRANSLATED);
      expect(Object.keys(doneKeys).sort()).toEqual(['flat.done', 'nested.key.done']);

      const untranslatedKeys = filterTranslations(translations, LANGS, FILTER_MODES.UNTRANSLATED);
      expect(Object.keys(untranslatedKeys).sort()).toEqual(['flat.partial', 'nested.key.empty']);
    });

    it('coverage calculation should account for all keys regardless of nesting', () => {
      const translations = {
        'top': { 'zh-CN': '顶', 'en-US': 'Top' },
        'mid.a': { 'zh-CN': '中A', 'en-US': '' },
        'deep.x.y': { 'zh-CN': '', 'en-US': '' },
      };
      const coverage = calculateCoverage(translations, LANGS);
      expect(coverage['zh-CN'].translated).toBe(2);
      expect(coverage['zh-CN'].total).toBe(3);
      expect(coverage['en-US'].translated).toBe(1);
      expect(coverage['en-US'].total).toBe(3);
    });

    it('isKeyPartiallyUntranslated and isKeyFullyTranslated should work for view mode row highlighting', () => {
      const fullyTranslated = { 'zh-CN': '你好', 'en-US': 'Hello' };
      const partiallyTranslated = { 'zh-CN': '你好', 'en-US': '' };
      const notTranslated = { 'zh-CN': '', 'en-US': '' };

      expect(isKeyFullyTranslated(fullyTranslated, LANGS)).toBe(true);
      expect(isKeyFullyTranslated(partiallyTranslated, LANGS)).toBe(false);
      expect(isKeyFullyTranslated(notTranslated, LANGS)).toBe(false);

      expect(isKeyPartiallyUntranslated(fullyTranslated, LANGS)).toBe(false);
      expect(isKeyPartiallyUntranslated(partiallyTranslated, LANGS)).toBe(true);
      expect(isKeyPartiallyUntranslated(notTranslated, LANGS)).toBe(true);
    });

    it('importTranslations should merge new namespaces into existing tree structure', () => {
      const existing = {
        'app.title': { 'zh-CN': '标题', 'en-US': 'Title' },
      };
      const importData = {
        'dashboard.stats': { 'zh-CN': '统计', 'en-US': 'Stats' },
        'dashboard.chart': { 'zh-CN': '图表', 'en-US': 'Chart' },
        'app.title': { 'zh-CN': '新标题', 'en-US': 'New Title' },
      };

      const result = importTranslations(LANGS, existing, importData);
      const topLevel = getTopLevelKeys(result.translations);
      expect(topLevel).toEqual(['app', 'dashboard']);
      expect(result.translations['app.title']['zh-CN']).toBe('新标题');
      expect(result.translations['dashboard.stats']).toBeDefined();
      expect(result.translations['dashboard.chart']).toBeDefined();
    });

    it('sortKeys should sort both simple and deeply nested keys lexicographically', () => {
      const translations = {
        'z.y.x': {},
        'a.b.c': {},
        'm': {},
        'a.a.a': {},
      };
      const sorted = sortKeys(translations);
      expect(Object.keys(sorted)).toEqual(['a.a.a', 'a.b.c', 'm', 'z.y.x']);
    });
  });
});
