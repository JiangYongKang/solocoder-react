export const STORAGE_KEY = 'gantt_chart_tasks';

export const ZOOM_LEVELS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
};

export const DAY_WIDTH = {
  [ZOOM_LEVELS.DAY]: 60,
  [ZOOM_LEVELS.WEEK]: 30,
  [ZOOM_LEVELS.MONTH]: 10,
};

export const ROW_HEIGHT = 48;
export const LEFT_PANEL_WIDTH = 420;
export const HEADER_HEIGHT = 72;
export const BAR_HEIGHT = 30;
export const BAR_VERTICAL_OFFSET = 9;

export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
