import { notification } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useConfigSync } from '../sync/configStore.ts';
import type { BirthdayItem, ScheduleItem, TodoItem } from '../sync/type/configTypes.ts';

export interface ReminderInfo {
  type: 'todo' | 'schedule' | 'birthday';
  title: string;
  description: string;
  time: string;
  itemId: string;
}

const CHECK_INTERVAL_MS = 60_000;

export function useReminder() {
  const { data: config } = useConfigSync();
  const [reminderQueue, setReminderQueue] = useState<ReminderInfo[]>([]);
  const lastNotifiedRef = useRef<Map<string, number>>(new Map());

  const showReminderNotification = useCallback((reminder: ReminderInfo) => {
    notification.open({
      message: reminder.title,
      description: reminder.description,
      duration: 0,
      placement: 'topRight',
      key: reminder.itemId,
    });
  }, []);

  const checkReminders = useCallback(() => {
    if (!config.reminderConfig.enabled) return;

    const now = dayjs();
    const newReminders: ReminderInfo[] = [];

    config.todos.forEach((todo: TodoItem) => {
      if (!todo.remindEnabled || todo.completed || !todo.dueDate) return;
      const dueDateTime = dayjs(`${todo.dueDate} 23:59`);
      const shouldRemindAt = dueDateTime.subtract(todo.remindIntervalMinutes, 'minute');

      if (now.isAfter(shouldRemindAt) || now.isSame(shouldRemindAt, 'minute')) {
        const reminderKey = `todo-${todo.id}-${Math.floor(now.unix() / todo.remindIntervalMinutes)}`;
        const lastNotified = lastNotifiedRef.current.get(reminderKey);
        if (!lastNotified || now.unix() - lastNotified >= todo.remindIntervalMinutes * 60) {
          newReminders.push({
            type: 'todo',
            title: '待办提醒',
            description: todo.content,
            time: `截止时间: ${todo.dueDate}`,
            itemId: reminderKey,
          });
          lastNotifiedRef.current.set(reminderKey, now.unix());
        }
      }
    });

    config.schedules.forEach((schedule: ScheduleItem) => {
      if (!schedule.remindEnabled || !schedule.startTime) return;
      const scheduleDateTime = dayjs(`${schedule.date} ${schedule.startTime}`);
      const shouldRemindAt = scheduleDateTime.subtract(schedule.remindBefore || 0, 'minute');

      if (now.isAfter(shouldRemindAt) || now.isSame(shouldRemindAt, 'minute')) {
        const interval = schedule.remindIntervalMinutes || schedule.remindBefore || 30;
        const reminderKey = `schedule-${schedule.id}-${Math.floor(now.unix() / interval)}`;
        const lastNotified = lastNotifiedRef.current.get(reminderKey);
        if (!lastNotified || now.unix() - lastNotified >= interval * 60) {
          newReminders.push({
            type: 'schedule',
            title: '日程提醒',
            description: `${schedule.title}\n${schedule.description || ''}`,
            time: `日程时间: ${schedule.date} ${schedule.startTime}`,
            itemId: reminderKey,
          });
          lastNotifiedRef.current.set(reminderKey, now.unix());
        }
      }
    });

    config.birthdays.forEach((birthday: BirthdayItem) => {
      if (!birthday.remindEnabled) return;
      const thisYearBirthday = dayjs(`${now.year()}-${birthday.date}`);
      let remindDate = thisYearBirthday.subtract(birthday.remindDays, 'day');

      if (remindDate.isBefore(now, 'day')) {
        remindDate = remindDate.add(1, 'year');
      }

      if (
        now.isSame(remindDate, 'day') ||
        (now.isAfter(remindDate) && now.isBefore(remindDate.add(1, 'day')))
      ) {
        const interval = birthday.remindIntervalDays || birthday.remindDays || 1;
        const reminderKey = `birthday-${birthday.id}-${now.format('YYYY-MM-DD')}`;
        const lastNotified = lastNotifiedRef.current.get(reminderKey);
        if (!lastNotified || now.unix() - lastNotified >= interval * 24 * 60 * 60) {
          newReminders.push({
            type: 'birthday',
            title: '生日提醒',
            description: `${birthday.name}的生日快到了！`,
            time: `生日日期: ${birthday.isLunar ? '农历' : '公历'} ${birthday.date}`,
            itemId: reminderKey,
          });
          lastNotifiedRef.current.set(reminderKey, now.unix());
        }
      }
    });

    if (newReminders.length > 0) {
      setReminderQueue((prev) => [...prev, ...newReminders]);
      newReminders.forEach(showReminderNotification);
    }
  }, [config, showReminderNotification]);

  useEffect(() => {
    if (!config.reminderConfig.enabled) return;

    checkReminders();
    const intervalId = window.setInterval(checkReminders, CHECK_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [config.reminderConfig.enabled, checkReminders]);

  const clearReminder = useCallback((itemId: string) => {
    setReminderQueue((prev) => prev.filter((r) => r.itemId !== itemId));
    notification.destroy(itemId);
  }, []);

  return {
    reminderQueue,
    clearReminder,
    checkReminders,
  };
}
