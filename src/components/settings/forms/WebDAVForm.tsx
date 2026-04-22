import { Button, Divider, Form, Input, message, Space, Switch } from 'antd';
import React, { useState } from 'react';
import { downloadFromWebDAV, testWebDAVConnection, uploadToWebDAV } from '../../../http/webdav.ts';
import { syncValuesConfig } from '../../../sync/base/syncValuesConfig.ts';
import { useConfigSync } from '../../../sync/configStore.ts';
import type {
  BirthdayItem,
  ScheduleItem,
  TodoItem,
  WeatherCity,
} from '../../../sync/type/configTypes.ts';

const WebDAVForm: React.FC = () => {
  const { data: config, sync } = useConfigSync();
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleTestConnection = async (): Promise<void> => {
    if (!config.webdavUrl || !config.webdavUsername || !config.webdavPassword) {
      message.warning('请填写完整的 WebDAV 连接信息');
      return;
    }
    setTesting(true);
    try {
      const result = await testWebDAVConnection(
        config.webdavUrl,
        config.webdavUsername,
        config.webdavPassword,
      );
      if (result.success) {
        message.success('连接测试成功');
      } else {
        message.error(`连接失败: ${result.error}`);
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async (direction: 'upload' | 'download'): Promise<void> => {
    if (!config.webdavEnabled) {
      message.warning('请先启用 WebDAV 同步');
      return;
    }
    setSyncing(true);
    try {
      const syncData = {
        weatherEnabled: config.weatherEnabled,
        weatherApiKey: config.weatherApiKey,
        defaultCity: config.defaultCity,
        additionalCities: config.additionalCities,
        todos: config.todos,
        schedules: config.schedules,
        birthdays: config.birthdays,
        todoVisible: config.todoVisible,
        scheduleVisible: config.scheduleVisible,
        birthdayVisible: config.birthdayVisible,
      };

      if (direction === 'upload') {
        const result = await uploadToWebDAV(
          config.webdavUrl,
          config.webdavUsername,
          config.webdavPassword,
          {
            version: 1,
            lastModified: new Date().toISOString(),
            data: syncData,
          },
        );
        if (result.success) {
          message.success('上传成功');
          void sync({ lastSyncTime: new Date().toISOString() });
        } else {
          message.error(`上传失败: ${result.error}`);
        }
      } else {
        const result = await downloadFromWebDAV(
          config.webdavUrl,
          config.webdavUsername,
          config.webdavPassword,
        );
        if (!result.success) {
          message.error(`下载失败: ${result.error}`);
          return;
        }
        if (!result.data) {
          message.info('远程没有数据');
          return;
        }
        const remoteData = result.data.data;
        void sync({
          weatherEnabled: remoteData.weatherEnabled,
          weatherApiKey: remoteData.weatherApiKey,
          defaultCity: remoteData.defaultCity as WeatherCity | null,
          additionalCities: remoteData.additionalCities as WeatherCity[],
          todos: remoteData.todos as TodoItem[],
          schedules: remoteData.schedules as ScheduleItem[],
          birthdays: remoteData.birthdays as BirthdayItem[],
          todoVisible: remoteData.todoVisible,
          scheduleVisible: remoteData.scheduleVisible,
          birthdayVisible: remoteData.birthdayVisible,
          lastSyncTime: new Date().toISOString(),
        });
        message.success('下载成功');
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* @ts-expect-error antd 6 Divider orientation type issue */}
      <Divider orientation="left">WebDAV 同步设置</Divider>
      <Form
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 14 }}
        labelAlign="left"
        colon={false}
        initialValues={config}
        onValuesChange={syncValuesConfig}
      >
        <Form.Item name="webdavEnabled" label="启用同步">
          <Switch />
        </Form.Item>
        <Form.Item name="webdavUrl" label="服务器地址">
          <Input placeholder="https://dav.example.com/calendars" />
        </Form.Item>
        <Form.Item name="webdavUsername" label="用户名">
          <Input placeholder="请输入用户名" />
        </Form.Item>
        <Form.Item name="webdavPassword" label="密码">
          <Input.Password placeholder="请输入密码" />
        </Form.Item>
        <Form.Item label=" " colon={false}>
          <Space>
            <Button onClick={handleTestConnection} loading={testing}>
              测试连接
            </Button>
          </Space>
        </Form.Item>
        {config.lastSyncTime && (
          <Form.Item label="上次同步">
            <span style={{ color: '#666' }}>{new Date(config.lastSyncTime).toLocaleString()}</span>
          </Form.Item>
        )}
      </Form>

      {/* @ts-expect-error antd 6 Divider orientation type issue */}
      <Divider orientation="left">数据同步</Divider>
      <Space>
        <Button
          type="primary"
          onClick={() => void handleSync('upload')}
          loading={syncing}
          disabled={!config.webdavEnabled}
        >
          上传本地数据
        </Button>
        <Button
          onClick={() => void handleSync('download')}
          loading={syncing}
          disabled={!config.webdavEnabled}
        >
          下载远程数据
        </Button>
      </Space>
      <div style={{ fontSize: 12, color: '#999' }}>
        提示：上传会覆盖远程数据，下载会覆盖本地数据。请谨慎操作。
      </div>
    </div>
  );
};

export default WebDAVForm;
