const ERROR_TYPES = {
  TYPE_ERROR: 'TypeError',
  REFERENCE_ERROR: 'ReferenceError',
  NETWORK_ERROR: 'NetworkError',
  PROMISE_REJECTION: 'PromiseRejectionError',
  SYNTAX_ERROR: 'SyntaxError',
  RANGE_ERROR: 'RangeError',
}

const ERROR_TYPE_COLORS = {
  [ERROR_TYPES.TYPE_ERROR]: '#ef4444',
  [ERROR_TYPES.REFERENCE_ERROR]: '#f59e0b',
  [ERROR_TYPES.NETWORK_ERROR]: '#3b82f6',
  [ERROR_TYPES.PROMISE_REJECTION]: '#8b5cf6',
  [ERROR_TYPES.SYNTAX_ERROR]: '#10b981',
  [ERROR_TYPES.RANGE_ERROR]: '#ec4899',
}

const ERROR_TYPE_LIST = Object.values(ERROR_TYPES)

const TIME_RANGE_OPTIONS = [
  { key: '1h', label: '最近 1 小时' },
  { key: 'today', label: '今天' },
  { key: '7d', label: '最近 7 天' },
  { key: '30d', label: '最近 30 天' },
  { key: 'custom', label: '自定义' },
]

const SORT_OPTIONS = [
  { key: 'time-desc', label: '时间 最新优先' },
  { key: 'time-asc', label: '时间 最早优先' },
  { key: 'count-desc', label: '发生次数 最多优先' },
  { key: 'count-asc', label: '发生次数 最少优先' },
  { key: 'type-asc', label: '错误类型 A-Z' },
  { key: 'type-desc', label: '错误类型 Z-A' },
]

const PAGE_SIZE = 10

const ERROR_MESSAGES = {
  [ERROR_TYPES.TYPE_ERROR]: [
    "Cannot read property 'name' of undefined",
    "Cannot read property 'length' of null",
    "undefined is not a function",
    "Cannot set property 'value' of undefined",
    "Object doesn't support this property or method",
  ],
  [ERROR_TYPES.REFERENCE_ERROR]: [
    "userData is not defined",
    "config is not defined",
    "$ is not defined",
    "React is not defined",
    "fetchData is not defined",
  ],
  [ERROR_TYPES.NETWORK_ERROR]: [
    "Network request failed",
    "Failed to fetch",
    "NetworkError when attempting to fetch resource",
    "Connection refused",
    "Request timeout",
  ],
  [ERROR_TYPES.PROMISE_REJECTION]: [
    "Unhandled promise rejection",
    "Promise rejected with no error message",
    "Unhandled Rejection: TypeError",
    "Unhandled Rejection: NetworkError",
    "Unhandled promise rejection: Invalid JSON",
  ],
  [ERROR_TYPES.SYNTAX_ERROR]: [
    "Unexpected token '<'",
    "Unexpected end of JSON input",
    "Missing ) after argument list",
    "Unexpected token '}'",
    "Invalid or unexpected token",
  ],
  [ERROR_TYPES.RANGE_ERROR]: [
    "Maximum call stack size exceeded",
    "Invalid array length",
    "Number.prototype.toFixed: digits argument must be between 0 and 100",
    "Invalid time value",
    "RangeError: precision is out of range",
  ],
}

const STACK_FILES = [
  'app.jsx',
  'main.jsx',
  'utils.js',
  'api.js',
  'component.jsx',
  'hook.js',
  'service.js',
  'store.js',
  'router.jsx',
  'helpers.js',
]

const STACK_FUNCTIONS = {
  'app.jsx': ['App', 'renderApp', 'initApp'],
  'main.jsx': ['main', 'bootstrap', 'mountApp'],
  'utils.js': ['formatData', 'parseResponse', 'validateInput', 'transformData'],
  'api.js': ['fetchData', 'postRequest', 'getUser', 'getConfig', 'sendRequest'],
  'component.jsx': ['UserProfile', 'DataTable', 'FormInput', 'ModalDialog', 'ChartPanel'],
  'hook.js': ['useFetch', 'useUserData', 'useForm', 'useDebounce', 'useLocalStorage'],
  'service.js': ['UserService', 'DataService', 'AuthService', 'ConfigService'],
  'store.js': ['useStore', 'dispatch', 'getState', 'subscribe'],
  'router.jsx': ['Router', 'navigate', 'useParams', 'useNavigate'],
  'helpers.js': ['formatDate', 'deepClone', 'debounce', 'throttle', 'classNames'],
}

export {
  ERROR_TYPES,
  ERROR_TYPE_COLORS,
  ERROR_TYPE_LIST,
  TIME_RANGE_OPTIONS,
  SORT_OPTIONS,
  PAGE_SIZE,
  ERROR_MESSAGES,
  STACK_FILES,
  STACK_FUNCTIONS,
}
