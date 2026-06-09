import { DEFAULT_LANGUAGES, DEFAULT_TRANSLATIONS, FILTER_MODES, STORAGE_KEY } from './constants.js';

export function getDefaultState() {
  return {
    languages: [...DEFAULT_LANGUAGES],
    translations: JSON.parse(JSON.stringify(DEFAULT_TRANSLATIONS)),
  };
}

export function loadState(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return getDefaultState();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = getDefaultState();
      saveState(defaults, storage);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.languages) || !parsed.translations || typeof parsed.translations !== 'object') {
      return getDefaultState();
    }
    return {
      languages: parsed.languages.filter((l) => l && l.code && l.name),
      translations: parsed.translations,
    };
  } catch {
    return getDefaultState();
  }
}

export function saveState(state, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function isKeyDuplicated(translations, key, excludeKey = null) {
  if (!key) return false;
  if (key === excludeKey) return false;
  return Object.prototype.hasOwnProperty.call(translations, key);
}

export function isValidKey(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('.') || trimmed.endsWith('.')) return false;
  if (trimmed.includes('..')) return false;
  return /^[a-zA-Z0-9_.]+$/.test(trimmed);
}

export function addTranslationKey(translations, key, languages) {
  const trimmedKey = key.trim();
  if (!isValidKey(trimmedKey)) return translations;
  if (isKeyDuplicated(translations, trimmedKey)) return translations;
  const emptyValues = {};
  languages.forEach((lang) => {
    emptyValues[lang.code] = '';
  });
  return { ...translations, [trimmedKey]: emptyValues };
}

export function updateTranslationKey(translations, oldKey, newKey) {
  const trimmedNewKey = newKey.trim();
  if (oldKey === trimmedNewKey) return translations;
  if (!isValidKey(trimmedNewKey)) return translations;
  if (isKeyDuplicated(translations, trimmedNewKey, oldKey)) return translations;
  const newTranslations = { ...translations };
  const value = newTranslations[oldKey];
  delete newTranslations[oldKey];
  newTranslations[trimmedNewKey] = value;
  return newTranslations;
}

export function deleteTranslationKey(translations, key) {
  if (!Object.prototype.hasOwnProperty.call(translations, key)) return translations;
  const newTranslations = { ...translations };
  delete newTranslations[key];
  return newTranslations;
}

export function updateTranslationValue(translations, key, langCode, value) {
  if (!Object.prototype.hasOwnProperty.call(translations, key)) return translations;
  return {
    ...translations,
    [key]: {
      ...translations[key],
      [langCode]: value,
    },
  };
}

export function addLanguage(languages, translations, code, name) {
  const trimmedCode = code.trim();
  const trimmedName = name.trim();
  if (!trimmedCode || !trimmedName) return { languages, translations };
  if (languages.some((l) => l.code === trimmedCode)) return { languages, translations };
  const newLanguages = [...languages, { code: trimmedCode, name: trimmedName }];
  const newTranslations = { ...translations };
  Object.keys(newTranslations).forEach((key) => {
    newTranslations[key] = { ...newTranslations[key], [trimmedCode]: '' };
  });
  return { languages: newLanguages, translations: newTranslations };
}

export function isKeyFullyTranslated(keyData, languages) {
  return languages.every((lang) => {
    const val = keyData[lang.code];
    return typeof val === 'string' && val.trim() !== '';
  });
}

export function isKeyPartiallyUntranslated(keyData, languages) {
  return languages.some((lang) => {
    const val = keyData[lang.code];
    return typeof val !== 'string' || val.trim() === '';
  });
}

export function filterTranslations(translations, languages, filterMode) {
  const keys = Object.keys(translations);
  const filtered = {};
  keys.forEach((key) => {
    const keyData = translations[key];
    if (filterMode === FILTER_MODES.ALL) {
      filtered[key] = keyData;
    } else if (filterMode === FILTER_MODES.TRANSLATED) {
      if (isKeyFullyTranslated(keyData, languages)) {
        filtered[key] = keyData;
      }
    } else if (filterMode === FILTER_MODES.UNTRANSLATED) {
      if (isKeyPartiallyUntranslated(keyData, languages)) {
        filtered[key] = keyData;
      }
    }
  });
  return filtered;
}

export function calculateCoverage(translations, languages) {
  const totalKeys = Object.keys(translations).length;
  const coverage = {};
  languages.forEach((lang) => {
    let translated = 0;
    Object.keys(translations).forEach((key) => {
      const val = translations[key][lang.code];
      if (typeof val === 'string' && val.trim() !== '') {
        translated++;
      }
    });
    coverage[lang.code] = {
      translated,
      total: totalKeys,
      percentage: totalKeys === 0 ? 0 : Math.round((translated / totalKeys) * 100),
    };
  });
  return coverage;
}

export function getKeyParts(key) {
  return key.split('.');
}

export function buildTree(translations) {
  const root = {};
  Object.keys(translations).forEach((key) => {
    const parts = getKeyParts(key);
    let current = root;
    parts.forEach((part, idx) => {
      if (!current[part]) {
        current[part] = {
          __children: {},
          __isLeaf: idx === parts.length - 1,
          __fullKey: idx === parts.length - 1 ? key : null,
        };
      }
      if (idx === parts.length - 1) {
        current[part].__isLeaf = true;
        current[part].__fullKey = key;
      }
      current = current[part].__children;
    });
  });
  return root;
}

export function getLeafKeys(tree) {
  const result = [];
  function traverse(node) {
    Object.keys(node).forEach((key) => {
      const item = node[key];
      if (item.__isLeaf && item.__fullKey) {
        result.push(item.__fullKey);
      }
      if (item.__children && Object.keys(item.__children).length > 0) {
        traverse(item.__children);
      }
    });
  }
  traverse(tree);
  return result;
}

export function importTranslations(currentLanguages, currentTranslations, importData) {
  if (!importData || typeof importData !== 'object') {
    return { languages: currentLanguages, translations: currentTranslations };
  }
  const newLanguages = [...currentLanguages];
  const newTranslations = { ...currentTranslations };
  const langCodesInImport = new Set();
  Object.keys(importData).forEach((key) => {
    const keyData = importData[key];
    if (!keyData || typeof keyData !== 'object') return;
    Object.keys(keyData).forEach((langCode) => {
      langCodesInImport.add(langCode);
    });
  });
  langCodesInImport.forEach((langCode) => {
    if (!newLanguages.some((l) => l.code === langCode)) {
      newLanguages.push({ code: langCode, name: langCode });
    }
  });
  Object.keys(importData).forEach((key) => {
    const keyData = importData[key];
    if (!keyData || typeof keyData !== 'object') return;
    if (!newTranslations[key]) {
      const emptyValues = {};
      newLanguages.forEach((lang) => {
        emptyValues[lang.code] = '';
      });
      newTranslations[key] = emptyValues;
    }
    Object.keys(keyData).forEach((langCode) => {
      newTranslations[key] = {
        ...newTranslations[key],
        [langCode]: typeof keyData[langCode] === 'string' ? keyData[langCode] : String(keyData[langCode]),
      };
    });
  });
  Object.keys(newTranslations).forEach((key) => {
    newLanguages.forEach((lang) => {
      if (newTranslations[key][lang.code] === undefined) {
        newTranslations[key] = { ...newTranslations[key], [lang.code]: '' };
      }
    });
  });
  return { languages: newLanguages, translations: newTranslations };
}

export function exportTranslations(translations) {
  return JSON.parse(JSON.stringify(translations));
}

export function compareKeyTranslations(keyData, languages) {
  const nonEmptyValues = [];
  languages.forEach((lang) => {
    const val = keyData[lang.code];
    if (typeof val === 'string' && val.trim() !== '') {
      nonEmptyValues.push(val.trim());
    }
  });
  if (nonEmptyValues.length === 0) {
    return { allSame: false, allEmpty: true };
  }
  const firstVal = nonEmptyValues[0];
  const allSame = nonEmptyValues.every((v) => v === firstVal);
  return { allSame, allEmpty: false };
}

export function getKeyCompareStatus(keyData, langCode, languages) {
  const val = keyData[langCode];
  if (typeof val !== 'string' || val.trim() === '') {
    return 'missing';
  }
  const { allSame, allEmpty } = compareKeyTranslations(keyData, languages);
  if (allEmpty) return 'missing';
  if (allSame) return 'same';
  return 'different';
}

export function sortKeys(translations) {
  const sorted = {};
  Object.keys(translations)
    .sort()
    .forEach((key) => {
      sorted[key] = translations[key];
    });
  return sorted;
}
