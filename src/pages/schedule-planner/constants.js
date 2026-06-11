export const STORAGE_KEY = 'schedule_planner_data';

export const TIME_SLOT_DURATION = 45;
export const BREAK_DURATION = 5;

export const START_HOUR = 8;
export const START_MINUTE = 0;
export const END_HOUR = 20;
export const END_MINUTE = 0;

export const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const WEEKDAY_INDICES = [0, 1, 2, 3, 4, 5, 6];

export const WEEKEND_INDICES = [5, 6];

export const SUBJECT_COLORS = [
  { id: 'math', name: '数学', color: '#3B82F6', bgColor: '#DBEAFE' },
  { id: 'chinese', name: '语文', color: '#EF4444', bgColor: '#FEE2E2' },
  { id: 'english', name: '英语', color: '#22C55E', bgColor: '#DCFCE7' },
  { id: 'physics', name: '物理', color: '#8B5CF6', bgColor: '#EDE9FE' },
  { id: 'chemistry', name: '化学', color: '#F59E0B', bgColor: '#FEF3C7' },
  { id: 'biology', name: '生物', color: '#14B8A6', bgColor: '#CCFBF1' },
  { id: 'history', name: '历史', color: '#A855F7', bgColor: '#F3E8FF' },
  { id: 'geography', name: '地理', color: '#06B6D4', bgColor: '#CFFAFE' },
  { id: 'politics', name: '政治', color: '#EC4899', bgColor: '#FCE7F3' },
  { id: 'pe', name: '体育', color: '#F97316', bgColor: '#FFEDD5' },
  { id: 'custom1', name: '自定义1', color: '#6366F1', bgColor: '#E0E7FF' },
  { id: 'custom2', name: '自定义2', color: '#10B981', bgColor: '#D1FAE5' },
];

export const WEEK_TYPE = {
  ALL: 'all',
  ODD: 'odd',
  EVEN: 'even',
};

export const WEEK_TYPE_LABELS = {
  [WEEK_TYPE.ALL]: '全周',
  [WEEK_TYPE.ODD]: '单周',
  [WEEK_TYPE.EVEN]: '双周',
};

export function generateTimeSlots() {
  const slots = [];
  let hour = START_HOUR;
  let minute = START_MINUTE;
  let slotIndex = 0;

  while (hour < END_HOUR || (hour === END_HOUR && minute < END_MINUTE)) {
    const startH = String(hour).padStart(2, '0');
    const startM = String(minute).padStart(2, '0');

    minute += TIME_SLOT_DURATION;
    while (minute >= 60) {
      minute -= 60;
      hour += 1;
    }

    const endH = String(hour).padStart(2, '0');
    const endM = String(minute).padStart(2, '0');

    slots.push({
      index: slotIndex,
      startTime: `${startH}:${startM}`,
      endTime: `${endH}:${endM}`,
      label: `${startH}:${startM}-${endH}:${endM}`,
    });

    minute += BREAK_DURATION;
    while (minute >= 60) {
      minute -= 60;
      hour += 1;
    }

    slotIndex += 1;
  }

  return slots;
}

export const TIME_SLOTS = generateTimeSlots();
export const TOTAL_SLOTS = TIME_SLOTS.length;
