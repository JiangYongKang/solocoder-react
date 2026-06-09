export const STORAGE_KEY = 'i18n_manager_data';

export const FILTER_MODES = {
  ALL: 'all',
  UNTRANSLATED: 'untranslated',
  TRANSLATED: 'translated',
};

export const FILTER_LABELS = {
  [FILTER_MODES.ALL]: '显示全部',
  [FILTER_MODES.UNTRANSLATED]: '仅显示未完全翻译',
  [FILTER_MODES.TRANSLATED]: '仅显示完全翻译',
};

export const VIEW_MODES = {
  FLAT: 'flat',
  TREE: 'tree',
};

export const VIEW_LABELS = {
  [VIEW_MODES.FLAT]: '平铺',
  [VIEW_MODES.TREE]: '树形',
};

export const DEFAULT_LANGUAGES = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'en-US', name: 'English' },
];

export const DEFAULT_TRANSLATIONS = {
  'app.title': { 'zh-CN': '我的应用', 'en-US': 'My App' },
  'app.welcome': { 'zh-CN': '欢迎使用', 'en-US': 'Welcome' },
  'user.profile.name': { 'zh-CN': '姓名', 'en-US': 'Name' },
  'user.profile.email': { 'zh-CN': '邮箱', 'en-US': 'Email' },
  'user.profile.age': { 'zh-CN': '', 'en-US': 'Age' },
  'common.save': { 'zh-CN': '保存', 'en-US': 'Save' },
  'common.cancel': { 'zh-CN': '', 'en-US': '' },
  'common.delete': { 'zh-CN': '删除', 'en-US': 'Delete' },
  'common.search': { 'zh-CN': '搜索', 'en-US': 'Search' },
  'errors.notFound': { 'zh-CN': '未找到', 'en-US': 'Not Found' },
  'errors.serverError': { 'zh-CN': '服务器错误', 'en-US': '' },
  'menu.home': { 'zh-CN': '首页', 'en-US': 'Home' },
  'menu.settings': { 'zh-CN': '设置', 'en-US': 'Settings' },
  'menu.about': { 'zh-CN': '', 'en-US': 'About' },
};
