import { Button, Divider, Form, Input, List, Select, Space, Switch } from 'antd';
import React, { useState } from 'react';
import { searchCities } from '../../../http/weather.ts';
import { syncValuesConfig } from '../../../sync/base/syncValuesConfig.ts';
import { useConfigSync } from '../../../sync/configStore.ts';
import type { WeatherCity } from '../../../sync/type/configTypes.ts';

const CalendarForm: React.FC = () => {
  const { data: config, sync } = useConfigSync();
  const [citySearchText, setCitySearchText] = useState('');
  const [searchResults, setSearchResults] = useState<WeatherCity[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearchCity = async (): Promise<void> => {
    if (!citySearchText || !config.weatherApiKey) return;
    setSearching(true);
    try {
      const results = await searchCities(citySearchText, config.weatherApiKey);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  };

  const handleSetDefaultCity = (city: WeatherCity): void => {
    void sync({ defaultCity: city });
    setSearchResults([]);
    setCitySearchText('');
  };

  const handleAddCity = (city: WeatherCity): void => {
    const exists = config.additionalCities.some((c) => c.id === city.id);
    if (!exists) {
      void sync({ additionalCities: [...config.additionalCities, city] });
    }
    setSearchResults([]);
    setCitySearchText('');
  };

  const handleRemoveCity = (cityId: string): void => {
    void sync({ additionalCities: config.additionalCities.filter((c) => c.id !== cityId) });
    if (config.defaultCity?.id === cityId) {
      void sync({ defaultCity: null });
    }
  };

  return (
    <Form
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 14 }}
      labelAlign="left"
      colon={false}
      initialValues={config}
      onValuesChange={syncValuesConfig}
    >
      {/* @ts-expect-error antd 6 Divider orientation type issue */}
      <Divider orientation="left" plain>
        天气设置
      </Divider>
      <Form.Item name="weatherEnabled" label="启用天气">
        <Switch />
      </Form.Item>
      <Form.Item name="weatherApiKey" label="和风天气Key">
        <Input placeholder="请输入和风天气 API Key" />
      </Form.Item>
      <Form.Item label="默认城市">
        <Space direction="vertical" style={{ width: '100%' }}>
          {config.defaultCity ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{config.defaultCity.name}</span>
              <Button size="small" onClick={() => void sync({ defaultCity: null })}>
                移除
              </Button>
            </div>
          ) : (
            <span style={{ color: '#999' }}>未设置</span>
          )}
        </Space>
      </Form.Item>
      <Form.Item label="搜索城市">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.Search
            placeholder="输入城市名称搜索"
            value={citySearchText}
            onChange={(e) => setCitySearchText(e.target.value)}
            onSearch={handleSearchCity}
            loading={searching}
            enterButton="搜索"
          />
          {searchResults.length > 0 && (
            <List
              size="small"
              bordered
              dataSource={searchResults}
              style={{ maxHeight: 200, overflow: 'auto' }}
              renderItem={(city) => (
                <List.Item style={{ cursor: 'pointer' }} onClick={() => handleSetDefaultCity(city)}>
                  {city.name}
                </List.Item>
              )}
            />
          )}
        </Space>
      </Form.Item>

      {/* @ts-expect-error antd 6 Divider orientation type issue */}
      <Divider orientation="left">其他城市</Divider>
      <Form.Item label="已添加城市">
        <List
          size="small"
          dataSource={config.additionalCities}
          renderItem={(city) => (
            <List.Item
              actions={[
                <Button key="remove" size="small" danger onClick={() => handleRemoveCity(city.id)}>
                  删除
                </Button>,
              ]}
            >
              {city.name}
            </List.Item>
          )}
        />
      </Form.Item>
      <Form.Item label="添加城市">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.Search
            placeholder="输入城市名称添加"
            value={citySearchText}
            onChange={(e) => setCitySearchText(e.target.value)}
            onSearch={handleSearchCity}
            loading={searching}
            enterButton="搜索"
          />
          {searchResults.length > 0 && (
            <List
              size="small"
              bordered
              dataSource={searchResults}
              style={{ maxHeight: 200, overflow: 'auto' }}
              renderItem={(city) => (
                <List.Item style={{ cursor: 'pointer' }} onClick={() => handleAddCity(city)}>
                  {city.name}
                </List.Item>
              )}
            />
          )}
        </Space>
      </Form.Item>

      {/* @ts-expect-error antd 6 Divider orientation type issue */}
      <Divider orientation="left">日历显示</Divider>
      <Form.Item name="calendarFooterVisible" label="显示底部信息区域">
        <Switch />
      </Form.Item>
      <Form.Item name="footerFestivalVisible" label="显示节假日">
        <Switch />
      </Form.Item>
      <Form.Item name="footerYiJiVisible" label="显示宜忌">
        <Switch />
      </Form.Item>
      <Form.Item name="footerCountdownVisible" label="显示节日倒计时">
        <Switch />
      </Form.Item>
      <Form.Item name="mainWindowDateFormat" label="日期格式">
        <Select>
          <Select.Option value="MMMd">4月22日</Select.Option>
          <Select.Option value="MMMdEEE">4月22日 周二</Select.Option>
          <Select.Option value="MdE">4/22 周二</Select.Option>
        </Select>
      </Form.Item>
    </Form>
  );
};

export default CalendarForm;
