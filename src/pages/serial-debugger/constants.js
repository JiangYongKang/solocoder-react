export const COM_PORTS = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8']

export const PRESET_BAUD_RATES = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200]

export const DATA_BITS = [5, 6, 7, 8]

export const STOP_BITS = [1, 1.5, 2]

export const PARITY_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'odd', label: '奇校验' },
  { value: 'even', label: '偶校验' },
]

export const PARITY_MAP = {
  none: 'N',
  odd: 'O',
  even: 'E',
}

export const MAX_HISTORY_ITEMS = 50

export const MAX_PINNED_ITEMS = 3

export const STORAGE_KEY_CONFIG = 'serial_debugger_config'

export const STORAGE_KEY_HISTORY = 'serial_debugger_history'

export const STORAGE_KEY_PINNED = 'serial_debugger_pinned'

export const STORAGE_KEY_RECEIVE_LOG = 'serial_debugger_receive_log'

export const DEFAULT_CONFIG = {
  port: 'COM3',
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
}

export const DISPLAY_MODES = {
  ASCII: 'ascii',
  HEX: 'hex',
}

export const DIRECTIONS = {
  SEND: 'send',
  RECEIVE: 'receive',
}

export const EXPORT_FORMATS = {
  PLAIN_TEXT: 'plain',
  WITH_HEADER: 'header',
}
