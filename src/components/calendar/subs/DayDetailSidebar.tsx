import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  GiftOutlined,
  PlusOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Checkbox,
  Drawer,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Tabs,
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

function DayDetailSidebar({ open, selectedDate, onClose }: DayDetailSidebarProps): ReactElement {
  const { todos, schedules, birthdays, todoOperations, scheduleOperations, birthdayOperations } =
    usePersonalData();

  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  const [todoForm] = Form.useForm();
  const [scheduleForm] = Form.useForm();
  const [birthdayForm] = Form.useForm();

  const dateStr = selectedDate.format('YYYY-MM-DD');
  const dateDisplay = selectedDate.format('M月D日');

  const dayTodos = todos.filter((t: TodoItem) => t.dueDate === dateStr);
  const daySchedules = schedules.filter((s: ScheduleItem) => s.date === dateStr);
  const dayBirthdays = birthdays.filter(
    (b: BirthdayItem) => b.date === selectedDate.format('MM-DD'),
  );

  const handleAddTodo = (values: {
    content: string;
    priority?: 'low' | 'medium' | 'high';
    remindEnabled?: boolean;
    remindIntervalMinutes?: number;
  }): void => {
    todoOperations.add({
      content: values.content,
      completed: false,
      dueDate: dateStr,
      priority: values.priority || 'medium',
      remindEnabled: values.remindEnabled || false,
      remindIntervalMinutes: values.remindIntervalMinutes || 30,
    });
    todoForm.resetFields();
    setTodoModalOpen(false);
  };

  const handleAddSchedule = (values: {
    title: string;
    startTime?: dayjs.Dayjs;
    endTime?: dayjs.Dayjs;
    description?: string;
    remindEnabled?: boolean;
    remindBefore?: number;
    remindIntervalMinutes?: number;
  }): void => {
    scheduleOperations.add({
      title: values.title,
      date: dateStr,
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
    remindDays?: number;
    remindEnabled?: boolean;
    remindIntervalDays?: number;
  }): void => {
    birthdayOperations.add({
      name: values.name,
      date: selectedDate.format('MM-DD'),
      isLunar: false,
      remindDays: values.remindDays || 7,
      remindEnabled: values.remindEnabled || false,
      remindIntervalDays: values.remindIntervalDays || 0,
    });
    birthdayForm.resetFields();
    setBirthdayModalOpen(false);
  };

  const tabItems = [
    {
      key: 'todo',
      label: (
        <span>
          <CheckCircleOutlined /> 待办
        </span>
      ),
      children: (
        <div className="day-detail-section">
          <List
            size="small"
            dataSource={dayTodos}
            locale={{ emptyText: '暂无待办' }}
            renderItem={(todo) => (
              <List.Item
                actions={[
                  <Button
                    key="delete"
                    size="small"
                    danger
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
                  title={
                    <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                      {todo.content}
                    </span>
                  }
                  description={
                    <Space>
                      <Tag
                        color={
                          todo.priority === 'high'
                            ? 'red'
                            : todo.priority === 'medium'
                              ? 'orange'
                              : 'green'
                        }
                      >
                        {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                      </Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
          <Button
            icon={<PlusOutlined />}
            onClick={() => setTodoModalOpen(true)}
            block
            style={{ marginTop: 8 }}
          >
            添加待办
          </Button>
        </div>
      ),
    },
    {
      key: 'schedule',
      label: (
        <span>
          <ScheduleOutlined /> 日程
        </span>
      ),
      children: (
        <div className="day-detail-section">
          <List
            size="small"
            dataSource={daySchedules}
            locale={{ emptyText: '暂无日程' }}
            renderItem={(schedule) => (
              <List.Item
                actions={[
                  <Button
                    key="delete"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => scheduleOperations.delete(schedule.id)}
                  />,
                ]}
              >
                <List.Item.Meta
                  title={schedule.title}
                  description={
                    <div>
                      {schedule.startTime && (
                        <div>
                          {schedule.startTime}
                          {schedule.endTime ? ` - ${schedule.endTime}` : ''}
                        </div>
                      )}
                      {schedule.description && (
                        <div style={{ color: '#999' }}>{schedule.description}</div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
          <Button
            icon={<PlusOutlined />}
            onClick={() => setScheduleModalOpen(true)}
            block
            style={{ marginTop: 8 }}
          >
            添加日程
          </Button>
        </div>
      ),
    },
    {
      key: 'birthday',
      label: (
        <span>
          <GiftOutlined /> 生日
        </span>
      ),
      children: (
        <div className="day-detail-section">
          <List
            size="small"
            dataSource={dayBirthdays}
            locale={{ emptyText: '暂无生日' }}
            renderItem={(birthday) => (
              <List.Item
                actions={[
                  <Button
                    key="delete"
                    size="small"
                    danger
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
                  title={birthday.name}
                  description={birthday.isLunar ? '农历' : '公历'}
                />
              </List.Item>
            )}
          />
          <Button
            icon={<PlusOutlined />}
            onClick={() => setBirthdayModalOpen(true)}
            block
            style={{ marginTop: 8 }}
          >
            添加生日
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined />
            <span>{dateDisplay}</span>
            <span style={{ fontSize: 12, color: 'var(--text-sec)', fontWeight: 'normal' }}>
              {selectedDate.format('YYYY年')}
            </span>
          </div>
        }
        placement="left"
        onClose={onClose}
        open={open}
        width={320}
        closeIcon={<CloseOutlined />}
        styles={{
          body: { padding: '12px' },
          header: { padding: '12px 16px' },
        }}
      >
        <Tabs defaultActiveKey="todo" items={tabItems} />
      </Drawer>

      <Modal
        title={`添加待办 - ${dateDisplay}`}
        open={todoModalOpen}
        onCancel={() => {
          setTodoModalOpen(false);
          todoForm.resetFields();
        }}
        footer={null}
      >
        <Form form={todoForm} onFinish={handleAddTodo} layout="vertical">
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="medium">
            <Select
              options={[
                { value: 'low', label: '低' },
                { value: 'medium', label: '中' },
                { value: 'high', label: '高' },
              ]}
            />
          </Form.Item>
          <Form.Item name="remindEnabled" label="提醒" valuePropName="checked" initialValue={false}>
            <Checkbox>启用提醒</Checkbox>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.remindEnabled !== curr.remindEnabled}
          >
            {({ getFieldValue }) =>
              getFieldValue('remindEnabled') && (
                <Form.Item name="remindIntervalMinutes" label="提醒间隔" initialValue={30}>
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
        title={`添加日程 - ${dateDisplay}`}
        open={scheduleModalOpen}
        onCancel={() => {
          setScheduleModalOpen(false);
          scheduleForm.resetFields();
        }}
        footer={null}
      >
        <Form form={scheduleForm} onFinish={handleAddSchedule} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
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
          <Form.Item name="remindEnabled" label="提醒" valuePropName="checked" initialValue={false}>
            <Checkbox>启用提醒</Checkbox>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.remindEnabled !== curr.remindEnabled}
          >
            {({ getFieldValue }) =>
              getFieldValue('remindEnabled') && (
                <>
                  <Form.Item name="remindBefore" label="提前" initialValue={30}>
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
                  <Form.Item name="remindIntervalMinutes" label="重复间隔" initialValue={0}>
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
        title={`添加生日 - ${dateDisplay}`}
        open={birthdayModalOpen}
        onCancel={() => {
          setBirthdayModalOpen(false);
          birthdayForm.resetFields();
        }}
        footer={null}
      >
        <Form form={birthdayForm} onFinish={handleAddBirthday} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="remindEnabled" label="提醒" valuePropName="checked" initialValue={false}>
            <Checkbox>启用提醒</Checkbox>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.remindEnabled !== curr.remindEnabled}
          >
            {({ getFieldValue }) =>
              getFieldValue('remindEnabled') && (
                <>
                  <Form.Item name="remindDays" label="提前提醒" initialValue={7}>
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
                  <Form.Item name="remindIntervalDays" label="重复间隔" initialValue={0}>
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
