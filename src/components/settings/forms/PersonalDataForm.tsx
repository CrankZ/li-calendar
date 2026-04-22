import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Switch,
} from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { usePersonalData } from '../../../hooks/usePersonalData.ts';
import { syncValuesConfig } from '../../../sync/base/syncValuesConfig.ts';
import { useConfigSync } from '../../../sync/configStore.ts';

const PersonalDataForm: React.FC = () => {
  const { data: config } = useConfigSync();
  const { todos, schedules, birthdays, todoOperations, scheduleOperations, birthdayOperations } =
    usePersonalData();
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  const [todoForm] = Form.useForm();
  const [scheduleForm] = Form.useForm();
  const [birthdayForm] = Form.useForm();

  const handleAddTodo = (values: {
    content: string;
    dueDate?: dayjs.Dayjs;
    priority?: 'low' | 'medium' | 'high';
  }): void => {
    todoOperations.add(
      values.content,
      values.dueDate?.format('YYYY-MM-DD') || null,
      values.priority || 'medium',
    );
    todoForm.resetFields();
    setTodoModalOpen(false);
  };

  const handleAddSchedule = (values: {
    title: string;
    date: dayjs.Dayjs;
    startTime?: string;
    endTime?: string;
    description?: string;
    remindBefore?: number;
    remindEnabled?: boolean;
    remindIntervalMinutes?: number;
  }): void => {
    scheduleOperations.add({
      title: values.title,
      date: values.date.format('YYYY-MM-DD'),
      startTime: values.startTime || null,
      endTime: values.endTime || null,
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
    date: dayjs.Dayjs;
    isLunar: boolean;
    remindDays?: number;
    remindEnabled?: boolean;
    remindIntervalDays?: number;
  }): void => {
    birthdayOperations.add({
      name: values.name,
      date: values.date.format('MM-DD'),
      isLunar: values.isLunar,
      remindDays: values.remindDays || 7,
      remindEnabled: values.remindEnabled || false,
      remindIntervalDays: values.remindIntervalDays || 0,
    });
    birthdayForm.resetFields();
    setBirthdayModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* @ts-expect-error antd 6 Divider orientation type issue */}
      <Divider orientation="left">显示设置</Divider>
      <Form
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 14 }}
        labelAlign="left"
        colon={false}
        initialValues={config}
        onValuesChange={syncValuesConfig}
      >
        <Form.Item name="todoVisible" label="显示待办">
          <Switch />
        </Form.Item>
        <Form.Item name="scheduleVisible" label="显示日程">
          <Switch />
        </Form.Item>
        <Form.Item name="birthdayVisible" label="显示生日">
          <Switch />
        </Form.Item>
      </Form>

      {/* @ts-expect-error antd 6 Divider orientation type issue */}
      <Divider orientation="left">待办事项</Divider>
      <List
        size="small"
        dataSource={todos}
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
                <Switch
                  size="small"
                  checked={todo.completed}
                  onChange={() => todoOperations.toggle(todo.id)}
                />
              }
              title={
                <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                  {todo.content}
                </span>
              }
              description={todo.dueDate ? `截止: ${todo.dueDate}` : undefined}
            />
          </List.Item>
        )}
      />
      <Button icon={<PlusOutlined />} onClick={() => setTodoModalOpen(true)}>
        添加待办
      </Button>

      {/* @ts-expect-error antd 6 Divider orientation type issue */}
      <Divider orientation="left">日程安排</Divider>
      <List
        size="small"
        dataSource={schedules}
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
                  <div>
                    {schedule.date} {schedule.startTime || ''} - {schedule.endTime || ''}
                  </div>
                  {schedule.description && (
                    <div style={{ color: '#999' }}>{schedule.description}</div>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
      <Button icon={<PlusOutlined />} onClick={() => setScheduleModalOpen(true)}>
        添加日程
      </Button>

      {/* @ts-expect-error antd 6 Divider orientation type issue */}
      <Divider orientation="left">生日提醒</Divider>
      <List
        size="small"
        dataSource={birthdays}
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
              description={`${birthday.isLunar ? '农历' : '公历'} ${birthday.date} 提前${birthday.remindDays}天提醒`}
            />
          </List.Item>
        )}
      />
      <Button icon={<PlusOutlined />} onClick={() => setBirthdayModalOpen(true)}>
        添加生日
      </Button>

      <Modal
        title="添加待办"
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
          <Form.Item name="dueDate" label="截止日期">
            <DatePicker style={{ width: '100%' }} />
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
        width={500}
      >
        <Form form={scheduleForm} onFinish={handleAddSchedule} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="date" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="startTime" label="开始时间" style={{ flex: 1 }}>
              <Input type="time" />
            </Form.Item>
            <Form.Item name="endTime" label="结束时间" style={{ flex: 1 }}>
              <Input type="time" />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="remindBefore" label="提前提醒(分钟)" initialValue={30}>
            <Select
              options={[
                { value: 0, label: '不提醒' },
                { value: 5, label: '5分钟' },
                { value: 15, label: '15分钟' },
                { value: 30, label: '30分钟' },
                { value: 60, label: '1小时' },
                { value: 1440, label: '1天' },
              ]}
            />
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
        <Form form={birthdayForm} onFinish={handleAddBirthday} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="date" label="生日日期" rules={[{ required: true }]}>
            <DatePicker picker="date" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isLunar" label="农历" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
          <Form.Item name="remindDays" label="提前提醒天数" initialValue={7}>
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
    </div>
  );
};

export default PersonalDataForm;
