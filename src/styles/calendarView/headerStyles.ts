import type { CalendarViewStyleContext } from './types.ts';

export function createCalendarHeaderStyles(ctx: CalendarViewStyleContext) {
  const { css, isDark } = ctx;

  return {
    header: css`
      text-align: left;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `,
    headerContent: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    `,
    headerActions: css`
      display: flex;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
    `,
    headerBtn: css`
      background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
      border: none;
      width: calc(8px * 2 + 12px);
      height: calc(8px * 2 + 12px);
      padding: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      color: var(--text-sec);
      flex-shrink: 0;
      border-radius: 50%;

      &:hover {
        background: ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'};
      }
    `,
    title: css`
      font-size: 13px;
      font-weight: 500;
      line-height: 1.2;
      color: var(--text-main);
    `,
    subtitle: css`
      font-size: 12px;
      line-height: 1.25;
      color: var(--text-sec);
      opacity: 0.9;
    `,
    festivalList: css`
      font-size: 13px;
      color: var(--accent);
      font-weight: 500;
      padding: 0 2px 1px;
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      flex-wrap: nowrap;
      white-space: nowrap;
      overflow: hidden;
    `,
    festivalSection: css`
      display: flex;
      align-items: center;
      min-height: 20px;
    `,
    festivalItem: css`
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      color: inherit;
      font: inherit;
      line-height: 1.3;
      flex-shrink: 0;
      transition: opacity 0.2s;
      &:hover {
        opacity: 0.7;
        text-decoration: underline;
      }
    `,
    festivalSeparator: css`
      color: var(--text-sec);
      opacity: 0.7;
      flex-shrink: 0;
    `,
    festivalEmpty: css`
      font-size: 12px;
      color: var(--text-sec);
      opacity: 0.85;
      padding: 0 2px;
    `,
    weatherContainer: css`
      display: flex;
      align-items: center;
    `,
    weatherBadge: css`
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.2s;
      &:hover {
        background: ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'};
      }
    `,
    weatherTemp: css`
      font-size: 16px;
      font-weight: 500;
    `,
    weatherSidebarList: css`
      display: flex;
      flex-direction: column;
      gap: 12px;
    `,
    weatherCard: css`
      padding: 12px;
      background: ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'};
      border-radius: 8px;
    `,
    weatherCardHeader: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `,
    weatherCityName: css`
      font-weight: 600;
      font-size: 14px;
    `,
    weatherUpdateTime: css`
      font-size: 11px;
      color: var(--text-sec);
    `,
    weatherCardMain: css`
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    `,
    weatherCardTemp: css`
      display: flex;
      flex-direction: column;
    `,
    weatherTempBig: css`
      font-size: 28px;
      font-weight: 500;
      line-height: 1;
    `,
    weatherText: css`
      font-size: 13px;
      color: var(--text-sec);
    `,
    weatherCardDetails: css`
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: var(--text-sec);
      flex-wrap: wrap;
    `,
    weatherCardAir: css`
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'};
    `,
    weatherAirAqi: css`
      font-size: 12px;
      color: var(--text-sec);
    `,
  };
}
