import { CloseOutlined, CloudOutlined, LoadingOutlined } from '@ant-design/icons';
import { Badge, Drawer, Popover, Spin, Tooltip } from 'antd';
import { type ReactElement, useEffect, useState } from 'react';
import { fetchWeatherInfo, type WeatherInfo } from '../../http/weather.ts';
import type { CalendarViewClassNames } from '../../styles/useCalendarViewStyles.ts';
import { useConfigSync } from '../../sync/configStore.ts';

interface WeatherDisplayProps {
  styles: CalendarViewClassNames;
}

interface WeatherSidebarProps {
  open: boolean;
  onClose: () => void;
  styles: CalendarViewClassNames;
}

function WeatherIcon({ code, size = 24 }: { code: string; size?: number }): ReactElement {
  const iconMap: Record<string, string> = {
    '100': '☀️',
    '101': '⛅',
    '102': '☁️',
    '103': '⛅',
    '104': '☁️',
    '200': '🌬️',
    '201': '🌬️',
    '202': '🌬️',
    '203': '🌬️',
    '204': '🌬️',
    '205': '🌬️',
    '206': '🌬️',
    '207': '🌬️',
    '208': '🌬️',
    '209': '🌬️',
    '210': '🌬️',
    '211': '⛈️',
    '212': '⛈️',
    '213': '⛈️',
    '300': '🌦️',
    '301': '🌧️',
    '302': '🌧️',
    '303': '🌧️',
    '304': '🌧️',
    '305': '🌧️',
    '306': '🌧️',
    '307': '🌧️',
    '308': '🌧️',
    '309': '🌧️',
    '310': '🌧️',
    '311': '🌧️',
    '312': '🌧️',
    '313': '🌧️',
    '400': '🌨️',
    '401': '🌨️',
    '402': '🌨️',
    '403': '🌨️',
    '404': '❄️',
    '405': '❄️',
    '406': '🌨️',
    '407': '🌨️',
    '408': '🌨️',
    '409': '🌨️',
    '410': '❄️',
    '456': '🌨️',
    '457': '🌨️',
    '500': '🌫️',
    '501': '🌫️',
    '502': '🌫️',
    '503': '🌫️',
    '504': '🌫️',
    '507': '🌫️',
    '508': '🌫️',
    '509': '🌫️',
    '510': '🌫️',
    '511': '🌫️',
    '512': '🌫️',
    '513': '🌫️',
    '514': '🌫️',
    '515': '🌫️',
  };
  return <span style={{ fontSize: size }}>{iconMap[code] || '🌡️'}</span>;
}

function WeatherBadge({
  weather,
  styles,
}: {
  weather: WeatherInfo;
  styles: CalendarViewClassNames;
}): ReactElement {
  const { city, now } = weather;
  return (
    <Tooltip title={`${city.name} ${now?.text || ''} ${now?.temp || ''}°`}>
      <div className={styles.weatherBadge}>
        {now ? (
          <>
            <WeatherIcon code={now.icon} size={14} />
            <span className={styles.weatherTemp}>{now.temp}°</span>
          </>
        ) : (
          <CloudOutlined />
        )}
      </div>
    </Tooltip>
  );
}

function WeatherCard({
  weather,
  styles,
}: {
  weather: WeatherInfo;
  styles: CalendarViewClassNames;
}): ReactElement {
  const { city, now, airQuality, updateTime } = weather;
  return (
    <div className={styles.weatherCard}>
      <div className={styles.weatherCardHeader}>
        <span className={styles.weatherCityName}>{city.name}</span>
        <span className={styles.weatherUpdateTime}>更新于 {updateTime}</span>
      </div>
      {now && (
        <div className={styles.weatherCardMain}>
          <WeatherIcon code={now.icon} size={48} />
          <div className={styles.weatherCardTemp}>
            <span className={styles.weatherTempBig}>{now.temp}°</span>
            <span className={styles.weatherText}>{now.text}</span>
          </div>
        </div>
      )}
      {now && (
        <div className={styles.weatherCardDetails}>
          <span>体感 {now.feelsLike}°</span>
          <span>湿度 {now.humidity}%</span>
          <span>
            {now.windDir} {now.windScale}级
          </span>
        </div>
      )}
      {airQuality && (
        <div className={styles.weatherCardAir}>
          <Badge
            status={
              airQuality.category === '优'
                ? 'success'
                : airQuality.category === '良'
                  ? 'processing'
                  : 'warning'
            }
            text={airQuality.category}
          />
          <span className={styles.weatherAirAqi}>AQI {airQuality.aqi}</span>
        </div>
      )}
    </div>
  );
}

function WeatherSidebar({ open, onClose, styles }: WeatherSidebarProps): ReactElement {
  const { data: config } = useConfigSync();
  const [weatherList, setWeatherList] = useState<WeatherInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !config.weatherEnabled || !config.weatherApiKey) return;
    const cities = config.defaultCity
      ? [config.defaultCity, ...config.additionalCities]
      : config.additionalCities;
    if (cities.length === 0) return;

    const fetchAllWeather = async (): Promise<void> => {
      setLoading(true);
      try {
        const results = await Promise.all(
          cities.map((city) => fetchWeatherInfo(city, config.weatherApiKey)),
        );
        setWeatherList(results);
      } finally {
        setLoading(false);
      }
    };
    void fetchAllWeather();
  }, [
    open,
    config.weatherEnabled,
    config.weatherApiKey,
    config.defaultCity,
    config.additionalCities,
  ]);

  return (
    <Drawer
      title="天气信息"
      placement="right"
      onClose={onClose}
      open={open}
      width={300}
      closeIcon={<CloseOutlined />}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin indicator={<LoadingOutlined spin />} />
        </div>
      ) : weatherList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          暂无天气数据，请在设置中添加城市
        </div>
      ) : (
        <div className={styles.weatherSidebarList}>
          {weatherList.map((weather) => (
            <WeatherCard key={weather.city.id} weather={weather} styles={styles} />
          ))}
        </div>
      )}
    </Drawer>
  );
}

export function WeatherDisplay({ styles }: WeatherDisplayProps): ReactElement | null {
  const { data: config } = useConfigSync();
  const [defaultWeather, setDefaultWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hasWeather = config.weatherEnabled && config.weatherApiKey && config.defaultCity;
  const hasMultipleCities = config.additionalCities.length > 0;

  useEffect(() => {
    if (!hasWeather) {
      setDefaultWeather(null);
      return;
    }
    const fetchDefaultWeather = async (): Promise<void> => {
      if (!config.defaultCity) return;
      setLoading(true);
      try {
        const info = await fetchWeatherInfo(config.defaultCity, config.weatherApiKey);
        setDefaultWeather(info);
      } finally {
        setLoading(false);
      }
    };
    void fetchDefaultWeather();
  }, [hasWeather, config.defaultCity, config.weatherApiKey]);

  if (!config.weatherEnabled || !config.weatherApiKey) {
    return null;
  }

  return (
    <>
      <div className={styles.weatherContainer}>
        {loading ? (
          <Spin size="small" indicator={<LoadingOutlined spin />} />
        ) : defaultWeather ? (
          <Popover
            content={
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{defaultWeather.city.name}</div>
                <div style={{ fontSize: 24, marginBottom: 4 }}>
                  {defaultWeather.now?.temp}° {defaultWeather.now?.text}
                </div>
                {defaultWeather.airQuality && (
                  <div style={{ fontSize: 12, color: '#666' }}>
                    空气质量 {defaultWeather.airQuality.category} (AQI{' '}
                    {defaultWeather.airQuality.aqi})
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                  更新于 {defaultWeather.updateTime}
                </div>
                {hasMultipleCities && (
                  <button
                    type="button"
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: '#1890ff',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                    }}
                    onClick={() => setSidebarOpen(true)}
                  >
                    {'查看更多城市 >>'}
                  </button>
                )}
              </div>
            }
            title={null}
            trigger="hover"
            placement="bottom"
          >
            <WeatherBadge weather={defaultWeather} styles={styles} />
          </Popover>
        ) : hasMultipleCities ? (
          <button
            type="button"
            className={styles.weatherBadge}
            onClick={() => setSidebarOpen(true)}
          >
            <CloudOutlined />
          </button>
        ) : null}
      </div>
      <WeatherSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} styles={styles} />
    </>
  );
}

export default WeatherDisplay;
