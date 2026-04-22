import { Tooltip } from 'antd';
import classNames from 'classnames';
import type { Dayjs } from 'dayjs';
import type { ReactElement } from 'react';
import { useCalendarViewContext } from '../../../hooks/calender/CalendarViewContext.tsx';
import type { CalendarViewClassNames } from '../../../styles/useCalendarViewStyles.ts';
import type { CalendarCellViewModel } from '../../../utils/calendar/calendarCellModel.ts';
import { weekdays } from '../../../utils/calendar/calendarFestivals.ts';

export interface CalendarMonthGridProps {
  /** antd-style 生成的 className 映射 */
  styles: CalendarViewClassNames;
  /** 已由逻辑层算好的 42 格展示模型 */
  cellModels: CalendarCellViewModel[];
  /** 用户点击某一格时回传该格公历日期 */
  onSelectDate: (date: Dayjs) => void;
  /** 用户双击某一格时回传该格公历日期 */
  onDateDoubleClick?: (date: Dayjs) => void;
}

/**
 * 月历主体：星期表头 + 日期格子（数据来自 `CalendarViewContext`）。
 */
function CalendarMonthGrid(): ReactElement {
  const { gridProps } = useCalendarViewContext();
  const { styles, cellModels, onSelectDate, onDateDoubleClick } = gridProps;

  return (
    <div className={styles.calendarGrid}>
      {weekdays.map((day) => (
        <div className={styles.weekday} key={day}>
          {day}
        </div>
      ))}
      {cellModels.map((cell) => {
        /** 「休」「班」角标对应不同背景色 class */
        const badgeClass =
          cell.badgeVariant === 'rest'
            ? styles.tagRest
            : cell.badgeVariant === 'work'
              ? styles.tagWork
              : '';

        return (
          <Tooltip key={cell.dateKey} title={cell.tooltipTitle} mouseEnterDelay={0.5}>
            <button
              type="button"
              className={classNames(styles.cell, {
                [styles.otherMonth]: cell.isOtherMonth,
                [styles.today]: cell.isToday,
                [styles.selected]: cell.isSelected && !cell.isToday,
              })}
              onClick={() => onSelectDate(cell.date)}
              onDoubleClick={() => onDateDoubleClick?.(cell.date)}
            >
              {cell.badgeText && (
                <span className={classNames(styles.tag, badgeClass)}>{cell.badgeText}</span>
              )}
              <span className={styles.dateText}>{cell.date.date()}</span>
              <span className={classNames(styles.lunar, { [styles.term]: cell.hasJieQi })}>
                {cell.displayText}
              </span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

export default CalendarMonthGrid;
