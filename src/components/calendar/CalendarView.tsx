import React, { type CSSProperties } from 'react';
import '../../utils/calendar/setupDayjsCalendar.ts';
import { CalendarViewProvider } from '../../hooks/calender/CalendarViewContext.tsx';
import { useCalendarViewModel } from '../../hooks/calender/useCalendarViewModel.ts';
import CalendarFooter from './subs/CalendarFooter.tsx';
import CalendarHeader from './subs/CalendarHeader.tsx';
import CalendarMonthGrid from './subs/CalendarMonthGrid.tsx';
import CalendarMonthNav from './subs/CalendarMonthNav.tsx';
import DayDetailSidebar from './subs/DayDetailSidebar.tsx';

/** 主日历浮窗 / 桌面日历壳子的可配置项 */
export interface CalendarViewProps {
  /** 是否允许按住空白区域拖拽窗口。 */
  enableDrag?: boolean;
  /** 是否把标题区标记成 Tauri 原生拖拽区域。 */
  dragRegion?: boolean;
  /** 是否根据内容高度自动调整窗口尺寸。 */
  autoResizeWindow?: boolean;
  /** 是否启用透明背景模式。 */
  transparent?: boolean;
  /** 日历背景不透明度。 */
  backgroundOpacity?: number;
  /** 是否显示主题切换按钮。 */
  showThemeButton?: boolean;
  /** 是否显示置顶按钮。 */
  showPinButton?: boolean;
  /** 是否显示设置按钮。 */
  showSettingsButton?: boolean;
  /** 是否显示关闭/收起按钮。 */
  showCloseButton?: boolean;
  /** 传给日历根节点的额外内联样式。 */
  style?: CSSProperties;
}

/**
 * 日历界面根：挂载 view model 上下文，子区块组件各自从 context 读取数据。
 */
const CalendarView: React.FC<CalendarViewProps> = ({
  enableDrag = false,
  dragRegion = false,
  autoResizeWindow = true,
  transparent = true,
  backgroundOpacity = 100,
  showThemeButton = true,
  showPinButton = true,
  showSettingsButton = true,
  showCloseButton = true,
  style,
}) => {
  /** 聚合后的日历视图模型，供上下文与各子组件共享。 */
  const model = useCalendarViewModel({
    enableDrag,
    dragRegion,
    autoResizeWindow,
    transparent,
    backgroundOpacity,
    showThemeButton,
    showPinButton,
    showSettingsButton,
    showCloseButton,
    style,
  });

  return (
    <CalendarViewProvider value={model}>
      <div {...model.rootProps}>
        <CalendarHeader />
        <CalendarMonthNav />
        <CalendarMonthGrid />
        <CalendarFooter />
      </div>
      {model.sidebarDate && (
        <DayDetailSidebar
          open={true}
          selectedDate={model.sidebarDate}
          onClose={() => model.setSidebarDate(null)}
        />
      )}
    </CalendarViewProvider>
  );
};

export default CalendarView;
