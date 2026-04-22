import {
  BellOutlined,
  CalendarOutlined,
  CloseOutlined,
  DeleteOutlined,
  GiftOutlined,
  PlusOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  TimePicker,
} from 'antd';
import dayjs from 'dayjs';
import { type ReactElement, useState } from 'react';
import { usePersonalData } from '../../../hooks/usePersonalData.ts';
import type { BirthdayItem, ScheduleItem, TodoItem } from '../../../sync/type/configTypes';

interface DayDetailSidebarProps {
  open: boolean;
  selectedDate: dayjs.Dayjs;
  onClose: () => void;
}

function DayDetailSidebar({ selectedDate, onClose }: DayDetailSidebarProps): ReactElement {
  const { todos, schedules, birthdays, todoOperations, scheduleOperations, birthdayOperations } =
    usePersonalData();

  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  const [todoForm] = Form.useForm();
  const [scheduleForm] = Form.useForm();
  const [birthdayForm] = Form.useForm();
  const [showLunar, setShowLunar] = useState(false);

  const today = dayjs().format('YYYY-MM-DD');
  const displayDate = selectedDate || dayjs();
  const displayDateStr = displayDate.format('YYYY-MM-DD');
  const displayMonthDay = displayDate.format('MM-DD');

  const incompleteTodos = todos.filter(
    (t: TodoItem) => t.dueDate === displayDateStr || (!t.dueDate && displayDateStr === today),
  );
  const completedTodos = todos.filter(
    (t: TodoItem) =>
      t.completed && (t.dueDate === displayDateStr || (!t.dueDate && displayDateStr === today)),
  );
  const daySchedules = schedules.filter((s: ScheduleItem) => s.date === displayDateStr);
  const dayBirthdays = birthdays.filter((b: BirthdayItem) => b.date === displayMonthDay);

  const handleAddTodo = (values: {
    content: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: dayjs.Dayjs;
    remindEnabled?: boolean;
    remindIntervalMinutes?: number;
  }): void => {
    todoOperations.add({
      content: values.content,
      completed: false,
      dueDate: values.dueDate?.format('YYYY-MM-DD') || today,
      priority: values.priority || 'medium',
      remindEnabled: values.remindEnabled || false,
      remindIntervalMinutes: values.remindIntervalMinutes || 30,
    });
    todoForm.resetFields();
    setTodoModalOpen(false);
  };

  const handleAddSchedule = (values: {
    title: string;
    date?: dayjs.Dayjs;
    startTime?: dayjs.Dayjs;
    endTime?: dayjs.Dayjs;
    description?: string;
    remindEnabled?: boolean;
    remindBefore?: number;
    remindIntervalMinutes?: number;
  }): void => {
    scheduleOperations.add({
      title: values.title,
      date: values.date?.format('YYYY-MM-DD') || today,
      startTime: values.startTime?.format('HH:mm') || null,
      endTime: values.endTime?.format('HH:mm') || null,
      description: values.description || '',
      remindBefore: values.remindBefore || 30,
      remindEnabled: values.remindEnabled || false,
      remindIntervalMinutes: values.remindIntervalMinutes || 0,
    });
    scheduleForm.resetFields();
    setScheduleModalOpen(false);
  };

  const handleAddBirthday = (values: {
    name: string;
    date?: dayjs.Dayjs;
    isLunar?: boolean;
    remindDays?: number;
    remindEnabled?: boolean;
    remindIntervalDays?: number;
  }): void => {
    birthdayOperations.add({
      name: values.name,
      date: values.date?.format('MM-DD') || today.split('-').slice(1).join('-'),
      isLunar: values.isLunar || false,
      remindDays: values.remindDays || 7,
      remindEnabled: values.remindEnabled || false,
      remindIntervalDays: values.remindIntervalDays || 0,
    });
    birthdayForm.resetFields();
    setBirthdayModalOpen(false);
  };

  return (
    <>
      <Card
        className="day-detail-sidebar"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined />
            <span>
              {displayDate.format('MM月DD日')}
              {displayDate.isSame(dayjs(), 'day') ? ' (今天)' : ''}
            </span>
          </div>
        }
        extra={
          <Space size={4}>
            <Switch
              size="small"
              checkedChildren="农历"
              unCheckedChildren="公历"
              checked={showLunar}
              onChange={setShowLunar}
              style={{ marginRight: 4 }}
            />
            <DatePicker
              size="small"
              value={displayDate}
              onChange={(date) => date && onClose()}
              allowClear={false}
              style={{ width: 100 }}
            />
            <Button type="text" icon={<CloseOutlined />} onClick={onClose} size="small" />
          </Space>
        }
        style={{ width: 320 }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: 12 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 8 }}>
              <BellOutlined /> 待办事项
            </div>
            <List
              size="small"
              dataSource={incompleteTodos.slice(0, 5)}
              locale={{ emptyText: '暂无待办' }}
              renderItem={(todo: TodoItem) => (
                <List.Item
                  style={{ padding: '4px 0' }}
                  actions={[
                    <Button
                      key="delete"
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => todoOperations.delete(todo.id)}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Checkbox
                        checked={todo.completed}
                        onChange={() => todoOperations.toggle(todo.id)}
                      />
                    }
                    title={<span style={{ fontSize: 13 }}>{todo.content}</span>}
                    description={
                      todo.remindEnabled && (
                        <Tag color="blue" style={{ fontSize: 10 }}>
                          提醒
                        </Tag>
                      )
                    }
                  />
                </List.Item>
              )}
            />
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setTodoModalOpen(true)}
              block
              size="small"
              style={{ marginTop: 8 }}
            >
              添加待办
            </Button>
          </div>

          {completedTodos.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 8 }}>已完成</div>
              <List
                size="small"
                dataSource={completedTodos.slice(0, 3)}
                locale={{ emptyText: '' }}
                renderItem={(todo: TodoItem) => (
                  <List.Item style={{ padding: '4px 0' }}>
                    <List.Item.Meta
                      avatar={
                        <Checkbox
                          checked={todo.completed}
                          onChange={() => todoOperations.toggle(todo.id)}
                        />
                      }
                      title={
                        <span
                          style={{
                            fontSize: 13,
                            textDecoration: 'line-through',
                            color: 'var(--text-sec)',
                          }}
                        >
                          {todo.content}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 8 }}>
              <ScheduleOutlined /> 日程
            </div>
            <List
              size="small"
              dataSource={daySchedules.slice(0, 3)}
              locale={{ emptyText: '暂无日程' }}
              renderItem={(schedule: ScheduleItem) => (
                <List.Item
                  style={{ padding: '4px 0' }}
                  actions={[
                    <Button
                      key="delete"
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => scheduleOperations.delete(schedule.id)}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={<span style={{ fontSize: 13 }}>{schedule.title}</span>}
                    description={
                      schedule.startTime && (
                        <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>
                          {schedule.startTime}
                          {schedule.endTime ? ` - ${schedule.endTime}` : ''}
                        </span>
                      )
                    }
                  />
                </List.Item>
              )}
            />
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setScheduleModalOpen(true)}
              block
              size="small"
              style={{ marginTop: 8 }}
            >
              添加日程
            </Button>
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 8 }}>
              <GiftOutlined /> 生日
              {showLunar && <span style={{ fontWeight: 'normal' }}> (农历)</span>}
            </div>
            <List
              size="small"
              dataSource={dayBirthdays.filter((b) => b.isLunar === showLunar).slice(0, 3)}
              locale={{ emptyText: '暂无生日' }}
              renderItem={(birthday: BirthdayItem) => (
                <List.Item
                  style={{ padding: '4px 0' }}
                  actions={[
                    <Button
                      key="delete"
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => birthdayOperations.delete(birthday.id)}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                        {birthday.name[0]}
                      </Avatar>
                    }
                    title={<span style={{ fontSize: 13 }}>{birthday.name}</span>}
                    description={
                      <span style={{ fontSize: 11, color: 'var(--text-sec)' }}>
                        {birthday.isLunar ? '农历' : '公历'} {birthday.date}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setBirthdayModalOpen(true)}
              block
              size="small"
              style={{ marginTop: 8 }}
            >
              添加生日
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        title="添加待办"
        open={todoModalOpen}
        onCancel={() => {
          setTodoModalOpen(false);
          todoForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={todoForm}
          onFinish={handleAddTodo}
          layout="vertical"
          initialValues={{ dueDate: displayDate, priority: 'medium', remindEnabled: false }}
        >
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="dueDate" label="日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select
              options={[
                { value: 'low', label: '低' },
                { value: 'medium', label: '中' },
                { value: 'high', label: '高' },
              ]}
            />
          </Form.Item>
          <Form.Item name="remindEnabled" label="提醒" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.remindEnabled !== curr.remindEnabled}
          >
            {({ getFieldValue }) =>
              getFieldValue('remindEnabled') && (
                <Form.Item name="remindIntervalMinutes" label="提醒间隔">
                  <Select
                    options={[
                      { value: 5, label: '5分钟' },
                      { value: 15, label: '15分钟' },
                      { value: 30, label: '30分钟' },
                      { value: 60, label: '1小时' },
                      { value: 120, label: '2小时' },
                      { value: 1440, label: '1天' },
                    ]}
                  />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button
                onClick={() => {
                  setTodoModalOpen(false);
                  todoForm.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加日程"
        open={scheduleModalOpen}
        onCancel={() => {
          setScheduleModalOpen(false);
          scheduleForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={scheduleForm}
          onFinish={handleAddSchedule}
          layout="vertical"
          initialValues={{ date: displayDate, remindEnabled: false }}
        >
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="date" label="日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="startTime" label="开始时间" style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endTime" label="结束时间" style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="remindEnabled" label="提醒" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.remindEnabled !== curr.remindEnabled}
          >
            {({ getFieldValue }) =>
              getFieldValue('remindEnabled') && (
                <>
                  <Form.Item name="remindBefore" label="提前提醒">
                    <Select
                      options={[
                        { value: 5, label: '5分钟' },
                        { value: 15, label: '15分钟' },
                        { value: 30, label: '30分钟' },
                        { value: 60, label: '1小时' },
                        { value: 1440, label: '1天' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="remindIntervalMinutes" label="重复间隔">
                    <Select
                      options={[
                        { value: 0, label: '不重复' },
                        { value: 5, label: '每5分钟' },
                        { value: 15, label: '每15分钟' },
                        { value: 30, label: '每30分钟' },
                        { value: 60, label: '每小时' },
                      ]}
                    />
                  </Form.Item>
                </>
              )
            }
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button
                onClick={() => {
                  setScheduleModalOpen(false);
                  scheduleForm.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加生日"
        open={birthdayModalOpen}
        onCancel={() => {
          setBirthdayModalOpen(false);
          birthdayForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={birthdayForm}
          onFinish={handleAddBirthday}
          layout="vertical"
          initialValues={{ date: displayDate, isLunar: showLunar, remindEnabled: false }}
        >
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="date" label="生日日期">
            <DatePicker picker="month" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isLunar" label="农历" valuePropName="checked">
            <Switch checkedChildren="农历" unCheckedChildren="公历" />
          </Form.Item>
          <Form.Item name="remindEnabled" label="提醒" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.remindEnabled !== curr.remindEnabled}
          >
            {({ getFieldValue }) =>
              getFieldValue('remindEnabled') && (
                <>
                  <Form.Item name="remindDays" label="提前提醒">
                    <Select
                      options={[
                        { value: 1, label: '1天' },
                        { value: 3, label: '3天' },
                        { value: 7, label: '7天' },
                        { value: 14, label: '14天' },
                        { value: 30, label: '30天' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="remindIntervalDays" label="重复间隔">
                    <Select
                      options={[
                        { value: 0, label: '不重复' },
                        { value: 1, label: '每天' },
                        { value: 7, label: '每周' },
                        { value: 30, label: '每月' },
                      ]}
                    />
                  </Form.Item>
                </>
              )
            }
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button
                onClick={() => {
                  setBirthdayModalOpen(false);
                  birthdayForm.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default DayDetailSidebar;
