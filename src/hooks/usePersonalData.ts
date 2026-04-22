import { useCallback } from 'react';
import { useConfigSync } from '../sync/configStore.ts';
import type { BirthdayItem, ScheduleItem, TodoItem } from '../sync/type/configTypes.ts';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function usePersonalData() {
  const { data: config, sync } = useConfigSync();

  const todoOperations = {
    add: useCallback(
      (
        content: string,
        dueDate: string | null = null,
        priority: TodoItem['priority'] = 'medium',
      ) => {
        const newTodo: TodoItem = {
          id: generateId(),
          content,
          completed: false,
          dueDate,
          priority,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        void sync({ todos: [...config.todos, newTodo] });
        return newTodo;
      },
      [config.todos, sync],
    ),

    update: useCallback(
      (id: string, updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>>) => {
        void sync({
          todos: config.todos.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t,
          ),
        });
      },
      [config.todos, sync],
    ),

    toggle: useCallback(
      (id: string) => {
        void sync({
          todos: config.todos.map((t) =>
            t.id === id
              ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() }
              : t,
          ),
        });
      },
      [config.todos, sync],
    ),

    delete: useCallback(
      (id: string) => {
        void sync({ todos: config.todos.filter((t) => t.id !== id) });
      },
      [config.todos, sync],
    ),

    getToday: useCallback(() => {
      const today = new Date().toISOString().split('T')[0];
      return config.todos.filter((t) => t.dueDate === today && !t.completed);
    }, [config.todos]),
  };

  const scheduleOperations = {
    add: useCallback(
      (item: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newSchedule: ScheduleItem = {
          ...item,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        void sync({ schedules: [...config.schedules, newSchedule] });
        return newSchedule;
      },
      [config.schedules, sync],
    ),

    update: useCallback(
      (id: string, updates: Partial<Omit<ScheduleItem, 'id' | 'createdAt'>>) => {
        void sync({
          schedules: config.schedules.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s,
          ),
        });
      },
      [config.schedules, sync],
    ),

    delete: useCallback(
      (id: string) => {
        void sync({ schedules: config.schedules.filter((s) => s.id !== id) });
      },
      [config.schedules, sync],
    ),

    getByDate: useCallback(
      (date: string) => {
        return config.schedules.filter((s) => s.date === date);
      },
      [config.schedules],
    ),

    getUpcoming: useCallback(
      (days: number = 7) => {
        const today = new Date();
        const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
        return config.schedules.filter((s) => {
          const scheduleDate = new Date(s.date);
          return scheduleDate >= today && scheduleDate <= endDate;
        });
      },
      [config.schedules],
    ),
  };

  const birthdayOperations = {
    add: useCallback(
      (item: Omit<BirthdayItem, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newBirthday: BirthdayItem = {
          ...item,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        void sync({ birthdays: [...config.birthdays, newBirthday] });
        return newBirthday;
      },
      [config.birthdays, sync],
    ),

    update: useCallback(
      (id: string, updates: Partial<Omit<BirthdayItem, 'id' | 'createdAt'>>) => {
        void sync({
          birthdays: config.birthdays.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b,
          ),
        });
      },
      [config.birthdays, sync],
    ),

    delete: useCallback(
      (id: string) => {
        void sync({ birthdays: config.birthdays.filter((b) => b.id !== id) });
      },
      [config.birthdays, sync],
    ),

    getUpcoming: useCallback(
      (days: number = 30) => {
        const today = new Date();
        return config.birthdays.filter((b) => {
          const birthdayThisYear = new Date(
            today.getFullYear(),
            parseInt(b.date.split('-')[1], 10) - 1,
            parseInt(b.date.split('-')[2], 10),
          );
          if (birthdayThisYear < today) {
            birthdayThisYear.setFullYear(birthdayThisYear.getFullYear() + 1);
          }
          const diffDays = Math.ceil(
            (birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          return diffDays <= days;
        });
      },
      [config.birthdays],
    ),
  };

  return {
    todos: config.todos,
    schedules: config.schedules,
    birthdays: config.birthdays,
    todoVisible: config.todoVisible,
    scheduleVisible: config.scheduleVisible,
    birthdayVisible: config.birthdayVisible,
    setTodoVisible: (visible: boolean) => void sync({ todoVisible: visible }),
    setScheduleVisible: (visible: boolean) => void sync({ scheduleVisible: visible }),
    setBirthdayVisible: (visible: boolean) => void sync({ birthdayVisible: visible }),
    todoOperations,
    scheduleOperations,
    birthdayOperations,
  };
}
