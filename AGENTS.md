# Youtube-New-Year — 薄索引
跨平台規則正本：`~/.agents/institution/`（先讀 core/PRINCIPLES.md，照其指示附版本標記）。

## 專案專屬
- Build/test 指令：`npm test`（等同 `node test.mjs`）；`scripts/check-channels.mjs`（驗證 YouTube 直播狀態，需 YOUTUBE_API_KEY）
- 架構一句話：純靜態網頁（HTML+CSS+Vanilla JS），20 格跨年直播聚合頁，含倒數計時與煙火特效，可部署 GitHub Pages。
- 本專案禁區：直播 ID 由 `channels.js` 維護；不要引入 npm 依賴；Google API 金鑰只讀環境變數，絕不進 repo。
