import {
  MoonOutlined,
  PushpinFilled,
  PushpinOutlined,
  SettingOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import type { Dayjs } from 'dayjs';
import type { Lunar } from 'lunar-typescript';
import type { ReactElement } from 'react';
import { useCalendarViewContext } from '../../../hooks/calender/CalendarViewContext.tsx';
import type { CalendarViewClassNames } from '../../../styles/useCalendarViewStyles.ts';
import { useConfigSync } from '../../../sync/configStore.ts';
import { weekdayNames } from '../../../utils/calendar/calendarFestivals.ts';
import { WeatherDisplay } from '../../weather/WeatherDisplay.tsx';

/** 供 `useCalendarViewModel` 组装的顶栏数据形状（亦可用于单测 mock） */
export interface CalendarHeaderProps {
  /** 样式 class 映射 */
  styles: CalendarViewClassNames;
  /** 当前选中的公历日期（大标题） */
  selectedDate: Dayjs;
  /** 选中日的农历对象（副标题干支生肖等） */
  selectedLunar: Lunar;
  /** 是否在标题区域启用系统拖拽区 */
  dragRegion: boolean;
  /** 是否显示主题切换按钮 */
  showThemeButton: boolean;
  /** 是否显示置顶按钮 */
  showPinButton: boolean;
  /** 是否显示设置按钮 */
  showSettingsButton: boolean;
  /** 是否显示关闭/收起按钮 */
  showCloseButton: boolean;
  /** 浅 / 深主题，决定太阳月亮图标与 Tooltip */
  theme: 'light' | 'dark';
  /** 是否已置顶 */
  isPinned: boolean;
  /** 点击切换深浅色 */
  onToggleTheme: () => void;
  /** 点击切换置顶 */
  onTogglePin: () => void;
  /** 打开主设置窗口 */
  onOpenMainWindow: () => void;
  /** 收起或关闭当前日历窗口 */
  onClose: () => void;
}

/**
 * 顶栏：公历 / 农历摘要与主题、置顶、设置、收起按钮（数据来自 `CalendarViewContext`）。
 */
function CalendarHeader(): ReactElement {
  /** 从上下文读取顶栏渲染所需的全部状态与回调。 */
  const { headerProps } = useCalendarViewContext();
  const { data: config } = useConfigSync();
  const {
    styles,
    selectedDate,
    selectedLunar,
    dragRegion,
    showThemeButton,
    showPinButton,
    showSettingsButton,
    theme,
    isPinned,
    onToggleTheme,
    onTogglePin,
    onOpenMainWindow,
  } = headerProps;

  const formatDate = (date: Dayjs): string => {
    const fmt = config.mainWindowDateFormat || 'MMMdEEE';
    switch (fmt) {
      case 'MMMd':
        return date.format('M月D日');
      case 'MdE':
        return `${date.format('M/D')} ${weekdayNames[date.day()]}`;
      case 'MMMdEEE':
        return `${date.format('M月D日')} ${weekdayNames[date.day()]}`;
    }
  };

  return (
    <div className={styles.header}>
      <div className={styles.headerTopRow} data-tauri-drag-region={dragRegion || undefined}>
        <div className={styles.headerContent}>
          <WeatherDisplay styles={styles} />
          <div>
            <div className={styles.title}>{formatDate(selectedDate)}</div>
            <div className={styles.subtitle}>
              {selectedLunar.getMonthInChinese()}月{selectedLunar.getDayInChinese()}{' '}
              {selectedLunar.getYearInGanZhi()}
              {selectedLunar.getYearShengXiao()}
            </div>
          </div>
        </div>
        {(showThemeButton || showPinButton || showSettingsButton) && (
          <div className={styles.headerActions}>
            {showThemeButton && (
              <Tooltip title={theme === 'light' ? '切换到暗色模式' : '切换到浅色模式'}>
                <button
                  className={styles.headerBtn}
                  type="button"
                  onClick={onToggleTheme}
                  aria-label="切换主题"
                >
                  {theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
                </button>
              </Tooltip>
            )}
            {showPinButton && (
              <Tooltip title={isPinned ? '取消固定' : '固定窗口'}>
                <button
                  className={styles.headerBtn}
                  type="button"
                  onClick={onTogglePin}
                  aria-label="固定窗口"
                  style={isPinned ? { color: 'var(--accent)' } : undefined}
                >
                  {isPinned ? <PushpinFilled /> : <PushpinOutlined />}
                </button>
              </Tooltip>
            )}
            {showSettingsButton && (
              <Tooltip title="设置">
                <button className={styles.headerBtn} type="button" onClick={onOpenMainWindow}>
                  <SettingOutlined />
                </button>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarHeader;
