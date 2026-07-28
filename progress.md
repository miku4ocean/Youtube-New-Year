# Youtube-New-Year — 專案進度報告

> 本檔依 GALLEY_SPEC.md 交付物三規格產出，內容基於實際讀取
> `HANDOFF.md`／`AGENTS.md`／`CLAUDE.md`／`README.md`／`index.html`／`app.js`／`styles.css`（2026-07-25）。
> 查無資料處一律標記「未確認」，不臆造。

## A. 專案名稱
Youtube-New-Year（🎆 新年跨年直播合集）

## B. 專案路徑
`/Users/leonalin/Code/Youtube-New-Year`

## C. 專案簡介
一個純靜態網頁工具，可在單一頁面同時觀看 20 個 YouTube 跨年直播頻道，
內建倒數計時（動態算出「距離下一年」）與新年時刻的煙火粒子動畫特效。
無後端、無資料庫、無建置流程，可直接以瀏覽器開啟或部署至 GitHub Pages。

## D. 專案開發目的
供每年跨年夜重複使用的直播聚合頁——不必在多個分頁間切換，
一次畫面看到多個電視台／頻道的跨年直播與倒數氣氛（README.md、HANDOFF.md）。

## E. 解決使用者痛點
- 跨年夜想比較、切換多個頻道的直播畫面，但瀏覽器多分頁切換麻煩、無法同時看。
- 想要有倒數計時與新年氣氛（煙火特效），但一般直播頁面本身不提供。
- 想要簡單的一鍵全部靜音／全螢幕控制，避免逐一調整每支影片。
（以上根據 README.md 功能特色與 app.js 實際功能反推；使用者研究資料本身未確認。）

## F. 專案功能細項介紹
- 20 個 YouTube 直播頻道同時嵌入播放（iframe，autoplay+mute）
- RWD 響應式格線：桌機 4 欄／平板 3 欄／手機 2 欄／極小螢幕 1 欄
- 點擊任一格可放大至全螢幕覆蓋層觀看，點背景或 ESC 關閉
- 一鍵「全部靜音／取消靜音」（同步套用到所有 iframe 的 mute 參數）
- 一鍵全螢幕模式（Fullscreen API）
- 跨年倒數計時，標籤依系統當前時間動態顯示「距離 {明年年份}」
- 倒數歸零（新年時刻）自動觸發煙火粒子動畫，並持續隨機噴發
- 最後 10 秒倒數會加上 `celebration` 特效樣式
- 鍵盤快捷鍵：`M` 靜音切換／`F` 全螢幕切換／`ESC` 關閉放大覆蓋層
- Toast 通知（例如切換靜音時顯示「已全部靜音」）
- 頂部狀態指示器顯示目前成功解析出影片 ID 的頻道數

## G. 專案規格及 RPD

**技術棧**
- 純 HTML5 + CSS3 + 原生 JavaScript（ES6 class），無任何框架、無 npm 套件、無 build 工具
- 外部資源：Google Fonts（Inter、Noto Sans TC，經 `<link>` 引入，非內嵌）
- 影片來源：YouTube iframe embed（`youtube.com/embed/{videoId}`），非 YouTube Data API，不需 API 金鑰

**埠／啟動指令**
- 無 package.json、無 server 程式；AGENTS.md 明列「直接用瀏覽器開啟 `index.html`」
- HANDOFF.md 記錄本次驗證用 `python3 -m http.server` 起本機伺服器測試（僅為驗證用途，非專案內建指令）

**資料流**
1. `app.js` 內硬編碼 `videoUrls` 陣列（20 個 YouTube 網址，第 9~30 行）
2. `extractVideoId()` 以正則從網址解析出 11 碼 YouTube 影片 ID
3. `getEmbedUrl()` 組出 iframe 的 embed URL（`autoplay=1&mute=1&enablejsapi=1&rel=0`）
4. `renderVideoGrid()` 動態產生 20 個 `.video-cell`，各自插入對應 iframe
5. 無任何資料寫回、無 localStorage／sessionStorage／fetch 呼叫（已用 grep 確認）

**檔案結構**
- `index.html`（88 行）：頁面骨架
- `app.js`（335 行）：`class NewYearLivestreams`，涵蓋渲染、倒數、靜音、全螢幕、放大、煙火、Toast
- `styles.css`（740 行）：深色跨年主題（金／紅點綴）、RWD Grid、動畫樣式
- `README.md`／`HANDOFF.md`／`AGENTS.md`／`CLAUDE.md`：文件

**RPD（需求／產品定義）摘要**
- 目標使用者：想同時觀看多個台灣跨年直播的一般使用者
- 核心需求：多頻道同顯＋倒數＋節慶氣氛＋簡單控制
- 非目標：不做直播清單的動態抓取／不做使用者帳號／不做後台管理介面（均未見於文件或程式碼，判斷為刻意排除以維持零依賴）

## H. 目前已完成項目
- 20 頻道格線播放、RWD 版面、放大／靜音／全螢幕／鍵盤快捷鍵功能皆已實作（app.js 全部方法完整）
- 倒數計時已改為年份無關動態計算（HANDOFF.md 記錄：2026-07-21 修復，commit `8620a6e`）
- 已完成本機驗證：`python3 -m http.server` 起服後 index.html／app.js／styles.css 皆回 200；
  `node --check app.js` 語法通過；12 個 `getElementById` 與 HTML id 全部對應；
  20 個影片網址皆可正確解析出 11 碼 YouTube ID
- 已用 grep 確認無硬編碼 API 金鑰／密鑰
- Git 歷史：3 個 commit（`a15d642` 初始提交 → `0c8a181` 專案骨架文件 → `8620a6e` 年份修復），工作區乾淨

## I. 尚待完成項目
- **20 個直播網址為 2025 跨年時的頻道，需在下次跨年前（約 12 月中）更新**：
  HANDOFF.md 明列這是「待更新資料項」，本環境無法取得即時直播清單，故未假造資料；
  接手者需查詢當年度台灣跨年直播清單，手動替換 `app.js` 開頭 `videoUrls` 陣列的 20 個網址。
- **尚未經瀏覽器實際開啟驗證影片載入、倒數與煙火特效的視覺效果**（HANDOFF.md「下一步」#2，
  目前只驗證了 HTTP 200 與語法層級，未做視覺／互動驗證）。
- **尚未部署至 GitHub Pages**：README.md／HANDOFF.md 皆列為建議步驟，但未見實際部署紀錄，未確認是否已上線。
- **主辦權「單線／待分派」**（HANDOFF.md），目前無指定負責人持續維護跨年前的資料更新。

## J. 系統優化或增加功能建議
- 將 `videoUrls` 陣列抽成獨立 JSON 設定檔（如 `channels.json`），讓年度更新不需碰 `app.js` 邏輯本體，
  降低誤改程式碼風險。
- 可加入「失效頻道自動偵測」提示（例如 iframe 載入逾時或顯示直播已結束時，於格內顯示提示文字），
  減少每年人工逐一檢查 20 個頻道是否仍在線的負擔。
- 可考慮加入簡易靜態設定頁（仍不需後端，例如一個獨立的 `config.html` 搭配 localStorage）
  讓非工程背景的接手者也能自行調整頻道清單，降低「主辦權待分派」的交接門檻。
- Google Fonts 目前透過外部 CDN 載入，若追求離線可用／零外部依賴，可考慮改為系統字體或自行內嵌字型檔。
- 可在 README／HANDOFF 增加「部署狀態」欄位，明確記錄目前是否已上線 GitHub Pages 及網址，避免每次接手都要重新確認（見 I 段）。

---

## 附錄：規格正本
本檔依 `/private/tmp/claude-501/-Users-leonalin-Code/60311e3f-10c5-4464-9651-e4b51b373e60/scratchpad/GALLEY_SPEC.md`
之 D 段規格產出（A–J 十段結構、Galley 視覺語言、鐵律：查不到寫「未確認」）。
