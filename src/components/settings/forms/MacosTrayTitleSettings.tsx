import { invoke } from '@tauri-apps/api/core';
import {
  Alert,
  Button,
  Flex,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Space,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { type CSSProperties, type FC, useEffect, useState } from 'react';
import { DebugConst } from '../../../debugConst.ts';
import { useConfigSync } from '../../../sync/configStore.ts';
import type {
  MacosTrayBarIconKind,
  MacosTrayDateIconStyle,
} from '../../../sync/type/configTypes.ts';
import { isMacos } from '../../../utils/platform.ts';

dayjs.locale('zh-cn');

const radioBtnStyle: CSSProperties = {
  height: 'auto',
  padding: '8px 12px',
  lineHeight: 1.3,
  borderRadius: 6,
};

const TEMPLATE_TOKENS = ['{YYYY}', '{MM}', '{M}', '{DD}', '{D}', '{ddd}', '{dddd}'];

/** 与 `tray_icon_px::DEFAULT_TRAY_ICON_*` 一致 */
const DEFAULT_TRAY_ICON_WIDTH_PX = 42;
/** 与 LunarBar 视觉对齐：21×18 @2×，日期图占 15/18 高 */
const DEFAULT_TRAY_ICON_HEIGHT_PX = 36;

const TRAY_TITLE_PRESETS = [
  { label: '仅图标', template: '' },
  { label: '仅日期', template: '{D}' },
  { label: '月日', template: '{M}月{D}日' },
  { label: '周 + 月日', template: '{ddd} {M}月{D}日' },
  { label: '完整日期', template: '{YYYY}-{MM}-{DD}' },
  { label: '松鼠 + 月日', template: '🐿 {M}月{D}日' },
] as const;

const renderTemplatePreview = (template: string, now: dayjs.Dayjs): string => {
  const normalizedTemplate = template.trim();
  if (!normalizedTemplate) {
    return '（无右侧文案，仅主图标）';
  }

  return normalizedTemplate
    .split('{YYYY}')
    .join(now.format('YYYY'))
    .split('{MM}')
    .join(now.format('MM'))
    .split('{M}')
    .join(now.format('M'))
    .split('{DD}')
    .join(now.format('DD'))
    .split('{D}')
    .join(now.format('D'))
    .split('{dddd}')
    .join(now.format('dddd'))
    .split('{ddd}')
    .join(now.format('ddd'));
};

const MacosTrayTitleSettings: FC = () => {
  const { data: config, sync: syncConfig } = useConfigSync();
  const [form] = Form.useForm();
  const [previewNow, setPreviewNow] = useState<dayjs.Dayjs>(() => dayjs());
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    form.setFieldsValue({
      macosTrayTitleTemplate: config.macosTrayTitleTemplate,
      macosTrayBarIcon: config.macosTrayBarIcon,
      macosTrayDateIconStyle: config.macosTrayDateIconStyle,
      macosTrayIconWidth: config.macosTrayIconWidth,
      macosTrayIconHeight: config.macosTrayIconHeight,
    });
  }, [
    config.macosTrayTitleTemplate,
    config.macosTrayBarIcon,
    config.macosTrayDateIconStyle,
    config.macosTrayIconWidth,
    config.macosTrayIconHeight,
    form,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewNow(dayjs());
    }, 30_000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const currentTemplate =
    Form.useWatch('macosTrayTitleTemplate', form) ?? config.macosTrayTitleTemplate;
  const currentPreview = renderTemplatePreview(currentTemplate, previewNow);
  const trayBarIcon: MacosTrayBarIconKind =
    Form.useWatch('macosTrayBarIcon', form) ?? config.macosTrayBarIcon;
  const trayUsesDateGlyph = trayBarIcon === 'date';

  const applyTrayIconPx = async (): Promise<void> => {
    const w = Number(form.getFieldValue('macosTrayIconWidth'));
    const h = Number(form.getFieldValue('macosTrayIconHeight'));
    const cw = Math.min(
      128,
      Math.max(16, Math.round(Number.isFinite(w) ? w : DEFAULT_TRAY_ICON_WIDTH_PX)),
    );
    const ch = Math.min(
      128,
      Math.max(16, Math.round(Number.isFinite(h) ? h : DEFAULT_TRAY_ICON_HEIGHT_PX)),
    );
    form.setFieldsValue({ macosTrayIconWidth: cw, macosTrayIconHeight: ch });
    await syncConfig({ macosTrayIconWidth: cw, macosTrayIconHeight: ch });
    if (!isMacos) {
      return;
    }
    try {
      setSubmitting(true);
      await invoke('set_macos_tray_icon_px', { width: cw, height: ch });
    } finally {
      setSubmitting(false);
    }
  };

  const resetTrayIconPxToDefault = async (): Promise<void> => {
    form.setFieldsValue({
      macosTrayIconWidth: DEFAULT_TRAY_ICON_WIDTH_PX,
      macosTrayIconHeight: DEFAULT_TRAY_ICON_HEIGHT_PX,
    });
    await syncConfig({
      macosTrayIconWidth: DEFAULT_TRAY_ICON_WIDTH_PX,
      macosTrayIconHeight: DEFAULT_TRAY_ICON_HEIGHT_PX,
    });
    if (!isMacos) {
      return;
    }
    try {
      setSubmitting(true);
      await invoke('set_macos_tray_icon_px', {
        width: DEFAULT_TRAY_ICON_WIDTH_PX,
        height: DEFAULT_TRAY_ICON_HEIGHT_PX,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const applyTrayBarIcon = async (icon: MacosTrayBarIconKind): Promise<void> => {
    form.setFieldValue('macosTrayBarIcon', icon);
    await syncConfig('macosTrayBarIcon', icon);
    if (!isMacos) {
      return;
    }
    try {
      setSubmitting(true);
      await invoke('set_macos_tray_bar_icon', { icon });
    } catch (e) {
      message.error(String(e));
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  const applyDateIconStyle = async (style: MacosTrayDateIconStyle): Promise<void> => {
    await syncConfig('macosTrayDateIconStyle', style);
    if (!isMacos) {
      return;
    }
    try {
      setSubmitting(true);
      await invoke('set_macos_tray_date_icon_style', { style });
    } finally {
      setSubmitting(false);
    }
  };

  const applyTemplate = async (template: string): Promise<void> => {
    const normalizedTemplate = template.trim();

    form.setFieldValue('macosTrayTitleTemplate', normalizedTemplate);
    await syncConfig('macosTrayTitleTemplate', normalizedTemplate);

    if (!isMacos) {
      return;
    }

    try {
      setSubmitting(true);
      await invoke('set_macos_tray_title_template', {
        template: normalizedTemplate,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isMacos) {
    return <Alert type="info" showIcon title="当前仅 macOS 支持菜单栏图标文案动态设置。" />;
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        macosTrayTitleTemplate: config.macosTrayTitleTemplate,
        macosTrayBarIcon: config.macosTrayBarIcon,
        macosTrayDateIconStyle: config.macosTrayDateIconStyle,
        macosTrayIconWidth: config.macosTrayIconWidth,
        macosTrayIconHeight: config.macosTrayIconHeight,
      }}
    >
      <Form.Item name="macosTrayBarIcon" label="菜单栏主图标">
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          onChange={(e) => {
            void applyTrayBarIcon(e.target.value as MacosTrayBarIconKind);
            void applyDateIconStyle(e.target.value as MacosTrayDateIconStyle);
          }}
        >
          <Radio.Button value="filled">实心日期</Radio.Button>
          <Radio.Button value="outlined">描边日期</Radio.Button>
          <Radio.Button value="calendar">日历图标</Radio.Button>
        </Radio.Group>
      </Form.Item>
      {DebugConst.IS_DEV && (
        <div>
          <Form.Item
            label="日期图标位图尺寸（像素）"
            extra={
              trayUsesDateGlyph
                ? '默认 42×36：画布 21×18 点 × @2×（与 tray 将整图压到约 18pt 高、LunarBar 日期图 15pt 高对齐）；中间 21×15 区域绘图标。范围 16–128；离屏会按屏幕倍率放大栅格以保证清晰。'
                : '「日历」主图标与日期数字共用同一套宽高与倍率公式（默认 42×36）做离屏栅格；需调清晰度时请切回「日期数字」改尺寸后再选「日历」。'
            }
          >
            <Flex gap="middle" wrap="wrap" align="center">
              <Form.Item name="macosTrayIconWidth" noStyle>
                <InputNumber
                  min={16}
                  max={128}
                  addonBefore="宽"
                  style={{ width: 140 }}
                  disabled={!trayUsesDateGlyph}
                />
              </Form.Item>
              <Form.Item name="macosTrayIconHeight" noStyle>
                <InputNumber
                  min={16}
                  max={128}
                  addonBefore="高"
                  style={{ width: 140 }}
                  disabled={!trayUsesDateGlyph}
                />
              </Form.Item>
              <Button
                type="default"
                loading={submitting}
                disabled={!trayUsesDateGlyph}
                onClick={() => void applyTrayIconPx()}
              >
                应用尺寸
              </Button>
              <Button
                type="link"
                loading={submitting}
                disabled={!trayUsesDateGlyph}
                onClick={() => void resetTrayIconPxToDefault()}
              >
                恢复默认大小（{DEFAULT_TRAY_ICON_WIDTH_PX}×{DEFAULT_TRAY_ICON_HEIGHT_PX}）
              </Button>
            </Flex>
          </Form.Item>
          <Form.Item label="预设示例">
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={
                TRAY_TITLE_PRESETS.some((item) => item.template === currentTemplate)
                  ? currentTemplate
                  : undefined
              }
              style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
              onChange={(e) => {
                void applyTemplate(e.target.value as string);
              }}
            >
              {TRAY_TITLE_PRESETS.map((preset) => (
                <Radio.Button key={preset.template} value={preset.template} style={radioBtnStyle}>
                  <div>{preset.label}</div>
                  <div>{renderTemplatePreview(preset.template, previewNow)}</div>
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="macosTrayTitleTemplate"
            label="自定义文案模板"
            extra={`支持变量：${TEMPLATE_TOKENS.join('、')}。可直接加入 emoji（如 🐿 {M}月{D}日）。`}
          >
            <Input
              placeholder="例如：{ddd} {M}月{D}日"
              onPressEnter={() => {
                void applyTemplate(form.getFieldValue('macosTrayTitleTemplate') ?? '');
              }}
            />
          </Form.Item>

          <Form.Item label="实时预览">
            <Flex gap="small" align="center">
              <div
                style={{
                  minWidth: 160,
                  textAlign: 'center',
                  padding: '6px 12px',
                  background: '#f5f5f5',
                  borderRadius: 6,
                }}
              >
                {currentPreview}
              </div>
              <Button
                type="primary"
                loading={submitting}
                onClick={() => void applyTemplate(currentTemplate)}
              >
                立即应用
              </Button>
            </Flex>
          </Form.Item>

          <Space orientation="vertical" size={4}>
            <Typography.Text>示例：</Typography.Text>
            <Typography.Text>
              {'{D}'} → {renderTemplatePreview('{D}', previewNow)}
            </Typography.Text>
            <Typography.Text>
              {'{M}月{D}日'} → {renderTemplatePreview('{M}月{D}日', previewNow)}
            </Typography.Text>
            <Typography.Text>
              {'{ddd} {M}月{D}日'} → {renderTemplatePreview('{ddd} {M}月{D}日', previewNow)}
            </Typography.Text>
          </Space>
        </div>
      )}
    </Form>
  );
};

export default MacosTrayTitleSettings;
