import { Button, Col, Menu, type MenuProps, Result, Row } from 'antd';
import React, { type ReactElement, useEffect, useState } from 'react';
import { isDesktop, isMacos, isWindows } from '../../utils/platform.ts';
import { openMobileCalendarView } from '../../utils/tauriUtils.ts';
import About from '../About.tsx';
import AutostartForm from './forms/AutostartForm.tsx';
import CalendarForm from './forms/CalendarForm.tsx';
import MacosTrayTitleSettings from './forms/MacosTrayTitleSettings.tsx';
import PersonalDataForm from './forms/PersonalDataForm.tsx';
import TransparentEffectForm from './forms/TransparentEffectForm.tsx';
import WebDAVForm from './forms/WebDAVForm.tsx';
import WidgetShowForm from './forms/WidgetShowForm.tsx';
import WindowsTrayForm from './forms/WindowsTrayForm.tsx';

type SettingsTab =
  | 'general'
  | 'calendar'
  | 'personal'
  | 'webdav'
  | 'trayClock'
  | 'trayTitle'
  | 'about';

interface SettingsPageProps {
  /** 移动端精简模式下，只保留“日历内容”配置。 */
  mobileCalendarOnly?: boolean;
}

const Settings: React.FC<SettingsPageProps> = ({ mobileCalendarOnly = false }) => {
  /** 当前左侧菜单选中的设置页签。 */
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    mobileCalendarOnly ? 'calendar' : 'general',
  );
  useEffect(() => {
    if (mobileCalendarOnly) {
      setActiveTab('calendar');
    }
  }, [mobileCalendarOnly]);

  /** 左侧菜单项；移动端精简模式下只保留“日历内容”。 */
  const menuItems: MenuProps['items'] = mobileCalendarOnly
    ? [{ key: 'calendar', label: '日历内容' }]
    : [
        { key: 'general', label: '通用设置' },
        { key: 'calendar', label: '日历内容' },
        { key: 'personal', label: '个人数据' },
        { key: 'webdav', label: '数据同步' },
        ...(isWindows ? [{ key: 'trayClock', label: '任务栏时钟' }] : []),
        ...(isMacos ? [{ key: 'trayTitle', label: '菜单图标' }] : []),
        { key: 'about', label: '关于' },
      ];

  /** 按当前页签渲染对应设置内容。 */
  const renderContent = (): ReactElement => {
    switch (activeTab) {
      case 'general':
        return (
          <div>
            {isDesktop && <AutostartForm />}
            {isDesktop && <WidgetShowForm />}
            <TransparentEffectForm />
          </div>
        );
      case 'calendar':
        return <CalendarForm />;
      case 'personal':
        return <PersonalDataForm />;
      case 'webdav':
        return <WebDAVForm />;
      case 'trayClock':
        return <WindowsTrayForm />;
      case 'trayTitle':
        return <MacosTrayTitleSettings />;
      case 'about':
        return <About />;
      default:
        return <Result status="404" title="404" subTitle="页面不存在." />;
    }
  };

  if (mobileCalendarOnly) {
    return (
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: 16 }}>
        {/* 移动端设置页顶部栏：返回日历 + 当前页标题。 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Button onClick={openMobileCalendarView}>返回日历</Button>
          <div style={{ fontSize: 18, fontWeight: 600 }}>日历内容</div>
          <div style={{ width: 88 }} />
        </div>
        {renderContent()}
      </div>
    );
  }

  return (
    <Row style={{ width: '100%', height: '100%' }} wrap={false}>
      <Col flex="180px">
        <Menu
          mode="vertical"
          selectedKeys={[activeTab]}
          onClick={(e) => setActiveTab(e.key as SettingsTab)}
          items={menuItems}
          style={{ height: '100%', borderRight: 0 }}
        />
      </Col>
      <Col flex="auto" style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
        {renderContent()}
      </Col>
    </Row>
  );
};

export default Settings;
