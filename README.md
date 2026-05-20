# ZC Pet

Windows 本地 AI 桌宠。项目使用 Electron、React 和 TypeScript 实现透明置顶桌宠窗口、文字聊天窗口、设置后台和 OpenAI Responses API 对接。

## 功能

- 透明、置顶、可拖拽的桌宠窗口
- 基于参考图抽象出的 Q 版黑发和服持刀桌宠形象
- 聊天窗口支持文字对话和流式回复
- 设置后台支持 OpenAI API Key、Base URL、模型、人设、温度、最大输出长度和开机启动
- API Key 通过 Windows 凭据系统保存，普通设置使用本地应用配置保存
- 系统托盘支持聊天、设置、暂停动画、开机启动和退出

## 本地运行

```powershell
npm install
npm run dev
```

开发模式会同时启动 Vite、Electron TypeScript 编译监听和 Electron 应用。

## 打包

```powershell
npm run package:win
```

打包产物会输出到 `release/`。

## OpenAI 配置

打开桌宠右下角设置按钮，填写：

- `OpenAI API Key`
- `Base URL`，默认 `https://api.openai.com/v1`
- `Model`，默认 `gpt-5.4-mini`
- `System Prompt / 人设`

保存后可点击 `测试连接`。

## 素材说明

当前版本使用项目内 SVG 动画角色，方便本地稳定运行和后续迭代。完整位图 spritesheet 可以按 `hatch-pet` 工作流替换到前端组件中，状态命名已按 `idle / chatting / waiting / waving / jumping / review / running-left / running-right / running` 预留。
