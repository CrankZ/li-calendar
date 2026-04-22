# 松鼠日历

跨平台的桌面日历，支持显示农历、节假日、调休、节气等信息

<img src="./README.assets/windows-light.png" width="400" alt="windows-light"> <img src="./README.assets/macos-light.png" width="400" alt="macos-light">

## 主要功能

- 支持 macOS、Windows 等操作系统
- 自定义 Windows 任务栏时钟，可显示**星期**等信息
- 替换 Windows 任务栏的系统日历
- 在 Windows 桌面上显示日历
- **天气显示**：支持和风天气 API，可自定义多个城市
- **个人数据管理**：待办事项、日程安排、生日提醒
- **WebDAV 同步**：支持将数据同步到 Nextcloud、群晖等 WebDAV 服务器

## 技术栈

- Tauri 2
- React 19
- Ant Design 6
- lunar-typescript
- Zustand

## 开发与构建

```bash
pnpm install
pnpm tauri dev
```

## 功能说明

### 天气功能

1. 在「日历内容」设置中启用天气
2. 输入和风天气 API Key（可在 [和风天气开发者平台](https://dev.qweather.com/) 免费申请）
3. 搜索并添加城市，默认城市显示在日历顶部
4. 悬停天气图标查看详情，点击「查看更多城市」在侧边栏查看所有城市天气

### 日期详情侧边栏

- **单击任意日期**即可快速打开侧边栏
- 侧边栏显示该日期的待办事项、日程安排和生日提醒
- 可以直接在侧边栏中添加新的待办或日程
- 无需进入设置页面，快速记录临时想法

### 个人数据管理

在「个人数据」设置中管理：

- **待办事项**：添加、完成/取消、删除，支持设置截止日期和优先级
- **日程安排**：设置日期、时间、描述和提醒
- **生日提醒**：支持农历/公历生日，设置提前提醒天数

### WebDAV 同步

在「数据同步」设置中配置：

1. 启用同步并填写 WebDAV 服务器地址、用户名和密码
2. 点击「测试连接」验证配置
3. 使用「上传本地数据」或「下载远程数据」同步数据

支持的 WebDAV 服务器：Nextcloud、群晖 NAS、OwnCloud 等

## 🤔常见问题

### macOS版本无法打开问题

安装完成后，复制以下命令到终端，然后按回车键

```
sudo xattr -r -d com.apple.quarantine /Applications/liCalendar.app
```
