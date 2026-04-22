import { invoke } from '@tauri-apps/api/core';
import dayjs, { type Dayjs } from 'dayjs';
import { Solar } from 'lunar-typescript';
import {
  type CSSProperties,
  type PointerEvent,
  type RefObject,
  type TouchEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { CalendarFooterProps } from '../../components/calendar/subs/CalendarFooter.tsx';
import type { CalendarHeaderProps } from '../../components/calendar/subs/CalendarHeader.tsx';
import type { CalendarMonthGridProps } from '../../components/calendar/subs/CalendarMonthGrid.tsx';
import type { CalendarMonthNavProps } from '../../components/calendar/subs/CalendarMonthNav.tsx';
import { openFestivalBaike } from '../../http/baike.ts';
import { useCalendarViewStyles } from '../../styles/useCalendarViewStyles.ts';
import { useConfigSync } from '../../sync/configStore.ts';
import { getCalendarCellViewModel } from '../../utils/calendar/calendarCellModel.ts';
import { getSelectedFestivalsWithJieQi } from '../../utils/calendar/calendarFestivals.ts';
import { buildMonthCells } from '../../utils/calendar/calendarMonthUtils.ts';
import { isWindows } from '../../utils/platform.ts';
import {
  closeOrHideCalendarWindow,
  getCalendarWindowKindFromLocation,
  openMainApplicationWindow,
  startCalendarShellDragging,
} from '../../utils/tauriUtils.ts';
import { useCalendarPin } from './useCalendarPin.ts';
import { useCalendarSwipeMonth } from './useCalendarSwipeMonth.ts';
import { useCalendarTheme } from './useCalendarTheme.ts';
import { useHolidayCountdown } from './useHolidayCountdown.ts';
import { useTauriCalendarResize } from './useTauriCalendarResize.ts';

/** 用前端 `dayjs()` 刷新「今天」与跨日检测的轮询间隔 */
const SYSTEM_TIME_POLL_MS = 1_000;

/** 首帧生效前占位的公历时刻（Unix 0），仅用于 `useState` 初始值，不表示「当前时间」。 */
const PENDING_BACKEND_TIME = dayjs(0);

export interface CalendarViewModelInput {
  /** 是否允许在壳子上按住拖拽移动窗口 */
  enableDrag: boolean;
  /** 是否给顶栏标题区加 `data-tauri-drag-region` */
  dragRegion: boolean;
  /** 是否根据内容用 ResizeObserver 同步 Tauri 窗口物理尺寸 */
  autoResizeWindow: boolean;
  /** 是否使用半透明磨砂背景 */
  transparent: boolean;
  /** 透明模式下背景不透明度 0–100 */
  backgroundOpacity: number;
  /** 是否显示主题切换按钮 */
  showThemeButton: boolean;
  /** 是否显示置顶按钮 */
  showPinButton: boolean;
  /** 是否显示设置按钮 */
  showSettingsButton: boolean;
  /** 是否显示关闭/收起按钮 */
  showCloseButton: boolean;
  /** 根节点额外样式 */
  style?: CSSProperties;
}

/** 日历主视图：根容器与各区块子组件所需的全部数据与回调 */
export interface CalendarViewModel {
  /** 根容器：外观、尺寸测量 ref、指针拖拽与纵向滑动手势 */
  rootProps: {
    className: string;
    ref: RefObject<HTMLDivElement | null>;
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
    onTouchStart: (event: TouchEvent) => void;
    onTouchEnd: (event: TouchEvent) => void;
    style?: CSSProperties;
  };
  headerProps: CalendarHeaderProps;
  navProps: CalendarMonthNavProps;
  gridProps: CalendarMonthGridProps;
  /** 无底部内容时为 null，由视图层决定是否渲染 */
  footerProps: CalendarFooterProps | null;
  /** 双击日期时设置的侧边栏日期 */
  sidebarDate: Dayjs | null;
  /** 设置侧边栏日期（双击时调用） */
  setSidebarDate: (date: Dayjs | null) => void;
}

/**
 * 聚合日历窗口的状态、配置同步、Tauri 交互与派生数据，供 `CalendarView.tsx` 只做 JSX 拼装。
 */
export function useCalendarViewModel({
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
}: CalendarViewModelInput): CalendarViewModel {
  /** 当前主题状态与主题切换方法。 */
  const { theme, toggleTheme, isDark } = useCalendarTheme();
  /** 当前窗口是否置顶，以及置顶切换方法。 */
  const { isPinned, togglePin } = useCalendarPin();
  /** 全局配置数据，用于决定页脚与窗口效果。 */
  const { data: config, sync: syncConfig } = useConfigSync();
  const {
    calendarFooterVisible,
    footerFestivalVisible,
    footerYiJiVisible,
    footerCountdownVisible,
    frontendWindowEffectEnabled,
    frontendWindowTransparency,
  } = config;
  /** 页脚总开关。 */
  const showFooter = calendarFooterVisible;
  /** 节日模块显隐状态。 */
  const showFestival = footerFestivalVisible;
  /** 宜忌模块显隐状态。 */
  const showYiJi = footerYiJiVisible;
  /** 节假日倒计时模块显隐状态。 */
  const showCountdown = footerCountdownVisible;
  /** 实际是否启用透明背景，前端窗口特效也会强制开启透明模式。 */
  const effectiveTransparent = transparent || frontendWindowEffectEnabled;
  /** 样式层仍用「背景不透明度」；配置与 UI 仅使用「透明度」 */
  const effectiveBackgroundOpacity = frontendWindowEffectEnabled
    ? 100 - frontendWindowTransparency
    : effectiveTransparent
      ? Math.min(backgroundOpacity, 72)
      : backgroundOpacity;
  /** 由样式 hook 计算出的 className 映射。 */
  const { styles } = useCalendarViewStyles({
    transparent: effectiveTransparent,
    isDark,
    backgroundOpacity: effectiveBackgroundOpacity,
  });

  // 选中哪一天、月历面板显示哪个月（可不同步，例如选其它月中的日期会跳面板）
  /** 当前高亮选中的日期。首帧前为占位值，首 tick 后与本地日期对齐。 */
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => PENDING_BACKEND_TIME);
  /** 月历「今天」格高亮所依据的公历日（本地时间）。 */
  const [calendarToday, setCalendarToday] = useState<Dayjs>(() => PENDING_BACKEND_TIME);
  /** 当前月网格展示的面板月份。 */
  const [panelMonth, setPanelMonth] = useState<Dayjs>(() => PENDING_BACKEND_TIME);
  /** 双击日期时设置的侧边栏日期 */
  const [sidebarDate, setSidebarDate] = useState<Dayjs | null>(null);

  const calendarTodayRef = useRef<Dayjs>(PENDING_BACKEND_TIME);
  const selectedDateRef = useRef<Dayjs>(PENDING_BACKEND_TIME);
  const hasReceivedBackendTimeRef = useRef(false);
  calendarTodayRef.current = calendarToday;
  selectedDateRef.current = selectedDate;

  const applyBackendTimeTickRef = useRef<(t: Dayjs) => void>(() => {});
  applyBackendTimeTickRef.current = (t: Dayjs): void => {
    if (!hasReceivedBackendTimeRef.current) {
      hasReceivedBackendTimeRef.current = true;
      setSelectedDate(t);
      setCalendarToday(t);
      setPanelMonth(t.startOf('month'));
      return;
    }

    const prevToday = calendarTodayRef.current;
    const prevSelected = selectedDateRef.current;

    if (t.isSame(prevToday, 'date')) {
      return;
    }

    setCalendarToday(t);
    if (prevSelected.isSame(prevToday, 'date')) {
      setSelectedDate(t);
      setPanelMonth((pm) => (t.month() !== pm.month() ? t.startOf('month') : pm));
    }
  };

  /** 挂载时立即用本地时间 tick 一次，之后每秒用 `dayjs()` 更新（跨日或补初始化）。 */
  useEffect(() => {
    const tick = (): void => {
      applyBackendTimeTickRef.current(dayjs());
    };
    tick();
    const id = window.setInterval(tick, SYSTEM_TIME_POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  /** 根节点尺寸监听 ref，用于桌面端自动调整窗口大小。 */
  const containerRef = useTauriCalendarResize(autoResizeWindow);
  /** 左右滑动切换月份的触摸事件处理器。 */
  const { handleTouchStart, handleTouchEnd } = useCalendarSwipeMonth(setPanelMonth);

  /** 打开节日百科详情页。 */
  const handleFestivalClick = (name: string): void => {
    void openFestivalBaike(name);
  };

  /** 返回今天，并同步把月份面板切回本月（本地时间）。 */
  const handleGoToToday = (): void => {
    const today = dayjs();
    setCalendarToday(today);
    setSelectedDate(today);
    setPanelMonth(today.startOf('month'));
  };

  /** 切换到上一个月。 */
  const handlePrevMonth = (): void => {
    setPanelMonth((m) => m.subtract(1, 'month'));
  };

  /** 切换到下一个月。 */
  const handleNextMonth = (): void => {
    setPanelMonth((m) => m.add(1, 'month'));
  };

  /** 选中某一天，必要时同步切换月份面板。 */
  const handleSelectDate = (date: Dayjs): void => {
    setSelectedDate(date);
    setPanelMonth((pm) => (date.month() !== pm.month() ? date.startOf('month') : pm));
  };

  /** 在允许拖拽时，按下空白区域就启动窗口拖拽。 */
  const handlePointerDown = async (event: PointerEvent<HTMLDivElement>): Promise<void> => {
    if (!enableDrag || event.button !== 0) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, textarea, select, [data-no-drag]')) {
      return;
    }
    try {
      await startCalendarShellDragging();
    } catch (error) {
      console.error('startDragging failed', error);
    }
  };

  /** 最近的节假日倒计时信息。 */
  const holidayCountdown = useHolidayCountdown(calendarToday);

  // 月网格：先算 42 个公历日，再为每格生成展示模型（农历、角标、tooltip）
  const monthCells = buildMonthCells(panelMonth);
  /** 把日期数组进一步映射为视图层可直接消费的单元格模型。 */
  const cellModels = monthCells.map((date) =>
    getCalendarCellViewModel(date, panelMonth, selectedDate, calendarToday),
  );

  /** 当前选中日期对应的公历对象。 */
  const selectedSolar = Solar.fromDate(selectedDate.toDate());
  /** 当前选中日期对应的农历对象。 */
  const selectedLunar = selectedSolar.getLunar();

  /** 当前选中日期的节日与节气列表。 */
  const selectedFestivals = getSelectedFestivalsWithJieQi(selectedDate);

  // 页脚：多块显隐组合
  /** 节日区块是否真正显示。 */
  const hasFestivalSection = showFooter && showFestival;
  /** 宜忌区块是否真正显示。 */
  const hasYiJiSection = showFooter && showYiJi;
  /** 倒计时区块是否真正显示。 */
  const hasCountdownSection = showFooter && showCountdown && Boolean(holidayCountdown);
  /** 页脚是否至少存在一个可展示区块。 */
  const hasFooterContent = hasFestivalSection || hasYiJiSection || hasCountdownSection;

  /** 当前窗口类型，用于决定关闭时是 hide 还是 close。 */
  const windowKind = getCalendarWindowKindFromLocation();
  const showPinButtonEffective = showPinButton && !(windowKind === 'desktop' && isWindows);

  /** 关闭或隐藏当前日历窗口；从桌面组件收起时同步关闭「桌面组件」开关。 */
  const handleClose = (): void => {
    if (windowKind === 'desktop') {
      void (async () => {
        try {
          await syncConfig({ desktopWidgetEnabled: false });
          if (isWindows) {
            await invoke('set_desktop_widget_enabled', { enabled: false });
            return;
          }
          await closeOrHideCalendarWindow(windowKind);
        } catch (error: unknown) {
          console.error('[收起桌面组件] 同步配置或关闭失败', error);
          await closeOrHideCalendarWindow(windowKind);
        }
      })();
      return;
    }
    void closeOrHideCalendarWindow(windowKind);
  };

  /** 打开主设置页；移动端会切到内嵌设置视图。 */
  const handleOpenMainWindow = (): void => {
    void openMainApplicationWindow();
  };

  // 根容器：样式、测量 ref、拖拽与触摸换月
  const rootProps: CalendarViewModel['rootProps'] = {
    className: styles.micaContainer,
    ref: containerRef,
    onPointerDown: handlePointerDown,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    style,
  };

  // 拆给子组件的 props，保持 CalendarView 只做展开渲染
  const headerProps: CalendarHeaderProps = {
    styles,
    selectedDate,
    selectedLunar,
    dragRegion,
    showThemeButton,
    showPinButton: showPinButtonEffective,
    showSettingsButton,
    showCloseButton,
    theme,
    isPinned,
    onToggleTheme: toggleTheme,
    onTogglePin: togglePin,
    onOpenMainWindow: handleOpenMainWindow,
    onClose: handleClose,
  };

  const navProps: CalendarMonthNavProps = {
    styles,
    panelMonth,
    onGoToToday: handleGoToToday,
    onPrevMonth: handlePrevMonth,
    onNextMonth: handleNextMonth,
  };

  const gridProps: CalendarMonthGridProps = {
    styles,
    cellModels,
    onSelectDate: handleSelectDate,
    onDateDoubleClick: setSidebarDate,
  };

  const footerProps: CalendarFooterProps | null = hasFooterContent
    ? {
        styles,
        hasFestivalSection,
        hasYiJiSection,
        hasCountdownSection,
        selectedFestivals,
        onFestivalClick: handleFestivalClick,
        selectedLunar,
        holidayCountdown,
      }
    : null;

  return {
    rootProps,
    headerProps,
    navProps,
    gridProps,
    footerProps,
    sidebarDate,
    setSidebarDate,
  };
}
