# HANDOFF — Youtube-New-Year
更新：2026-09-26／claude（Opus 5.5）

## 目前目標
跨年直播聚合頁（20 頻道同時觀看），含倒數計時與新年煙火特效，供每年跨年重複使用。

## 狀態
- 已完成：初始提交（a15d642，2025-12-31），包含 20 頻道、倒數、煙火特效
- 本次驗證：本機起 `python3 -m http.server` 開 index.html/app.js/styles.css 皆 200；
  `node --check app.js` 語法通過；app.js 內 12 個 `getElementById` 與 index.html 的
  id 全部對得上（無 null 參照風險）；20 個影片網址皆能正確解析出 11 碼 YouTube ID。
- 本次修復：title/meta/logo/倒數標籤原寫死「2025」，現改為年份無關文字，
  倒數標籤（`#countdownLabel`）改由 app.js 依當前系統時間動態算出「距離 {明年年份}」。
- grep 確認無硬編碼 API 金鑰／密鑰。
- 進行中：無 WIP，工作區乾淨

## 2026-08-18 瀏覽器驗證（Playwright + page.clock，20 mock 頻道，不真連 YouTube）
用 `context.clock` 把系統時間設在跨年前 10 秒，逐秒推進穿越跨年時刻；375/768/1440px 三尺寸各跑一輪；
共 32 項檢查，30 過、2 個標記如下：

**確認正常**：倒數正確遞減、跨年時刻觸發「🎉 新年快樂！」＋`celebration` class＋煙火粒子生成、
年份動態計算（用兩組不同年份測試皆正確，非寫死，R2 回歸未再發生，grep 全檔無 2025/2026/2027 字樣）、
20 頻道 URL 皆為合法格式並各自渲染 iframe 與展開互動正常（展開 #1 再展開 #6 能正確換片、無殘留舊 iframe）、
375/768/1440px 三尺寸格線皆正確（1440→4欄／768與375→2欄，20 格皆不溢出容器、無水平捲軸）。

**煙火 setInterval 洩漏 —— 已修（b6702de，2026-08-18 同日修復；本段舊描述已過期，特此更正）**：
原本 `startCountdown()` 的 `updateCountdown` 在跨年進入「慶祝視窗」後沒有旗標防止重複觸發，
每秒 tick 都會再呼叫一次 `triggerFireworks()`，每次都新增一個永不清除的 `setInterval(...,500)`，
會讓分頁在數分鐘內卡死。b6702de 已加上 `this.celebrationTriggered` 旗標（`triggerFireworks()`
只在旗標為 false 時執行一次）與 `this.fireworksIntervalId` + `stopFireworks()`（跨年後恢復平常倒數時
清掉 interval 並重置旗標，見現行 `app.js` 的 `triggerFireworks()`/`stopFireworks()`）。
一切以程式碼為準，若之後又發現類似問題請直接改這裡的描述，不要只累加「未修」段落。

**任務假設與實作不符（非 bug，供接手參考）**：任務描述提到「20 個頻道配置...每個有 YouTube URL/名稱」，
但實際 `app.js` 的 `videoUrls` 只存 URL 陣列，沒有任何頻道名稱／標籤欄位，UI 上只有 hover 才顯示的
1~20 數字徽章，不顯示頻道名稱。若要有名稱需另外新增資料結構（非本次修復範圍）。
另外，任務描述提到「Canvas 動畫」，實際煙火特效是 DOM element + CSS `@keyframes` 做的粒子動畫，
不是 `<canvas>` 元素——上述 setInterval 洩漏正是這個 DOM 粒子作法在無節制觸發下的效能代價。

## 待更新資料項（季節性，需外部資訊，本次未動）
- **20 個 YouTube 直播 ID 全數為 2025 跨年時的頻道**，本次驗證只確認「網址格式可解析」，
  未確認頻道是否仍存在／是否為 2026→2027 跨年直播——需要接手者在跨年前（約 12 月中）
  查詢當年度台灣跨年直播清單，手動替換 app.js 開頭 `videoUrls` 陣列的 20 個網址。
  本環境無法取得即時直播清單，故未假造資料。

## 下一步（接手的人從這裡開始）
1. **12 月中**：在使用者本機（非沙盒 agent）跑 `YOUTUBE_API_KEY=xxx node scripts/check-channels.mjs`
   確認現有 20 筆狀態，查當年度台灣跨年直播清單，更新 `channels.js` 的 20 個 `url`（`name` 可用
   `--suggest-names` 印出的真實 `channelTitle` 填入，不要編造）
2. 用瀏覽器實際開啟 index.html（或 `?ids=` 帶新清單先行測試），確認 20 支影片載入、倒數計時、
   煙火特效、頻道名稱皆正常
3. push 後 GitHub Pages 會自動重建，需提前約 1 週更新完成

## 地雷（別踩）
- 20 個 YouTube 直播 ID 目前仍是 2025 跨年時的舊值（2026-09-26 本次也還沒換，見下方待更新資料項），
  現在開啟多數會顯示「直播已結束」——**這不是 bug，是季節性資料，需 12 月中人工換網址**
- ~~煙火動畫在跨年後自動觸發、無限重複觸發~~ ：**已修（b6702de，2026-08-18）**，此地雷已解除，
  勿再誤植為「未修」

## 2026-09-26 這輪工作（WP1～WP6，Opus 5.5）
現況：82% → 這輪做完約 88%（缺 88%→90% 的唯一門檻是 12 月換 20 個當年度直播網址，屬季節性 [D]）。

**完成的 WP（皆已 commit，`npm test`：34 passed, 0 failed，含 node:vm 直接載入 app.js 測試邏輯，
不引入任何 npm 依賴）**：
- WP1：把 `extractVideoId`／`countdownState`／`formatCountdown`／`shouldHandleShortcut` 抽成
  `globalThis.NYLCore`，test.mjs 用 `node:vm` 直接測試（含閏年、跨午夜、大小寫、修飾鍵等情境）。
- WP2（真 bug，已修）：`updateCountdown` 進入 countdown phase 後從未移除 `celebration` class，
  導致跨年後倒數數字會一直閃動（`celebrationPulse`）到分頁關閉為止。已在 phase==='countdown' 時
  `classList.remove('celebration')`。同時倒數改用 `formatCountdown`，超過 24 小時顯示
  「N 天 HH:MM:SS」而非「2327:12:33」這種數字。
  Playwright + `page.clock`（`runFor`，非 `fastForward`）驗證：RED（修復前）跨過 01:00 後
  celebration class 仍為 true；GREEN（修復後）為 false。
- WP3（真 bug，已修）：`toggleMuteAll()` 原本改 `iframe.src` 造成整個 iframe 重新載入，跨年當下
  按一次 m 會讓 20 個直播全部黑屏重連，取消靜音後常被瀏覽器 autoplay 政策擋掉。改用
  `iframe.contentWindow.postMessage(...)` 呼叫 YouTube IFrame API 的 mute/unMute，只有
  postMessage 丟例外才退回舊做法。`grep -n "iframe.src = src" app.js` 現在無輸出。
  Playwright 驗證：RED 按 m 後 iframe.src 改變；GREEN 不變。
- WP4（真 bug，已修）：`handleKeydown` 原本只檢查 `e.key==='f'`/`'m'`，Cmd+F／Ctrl+F 搜尋頁面、
  Cmd+M 也會被誤觸；大寫 F／M（CapsLock 開）反而沒反應。改用 `NYLCore.shouldHandleShortcut(e)`
  排除 metaKey/ctrlKey/altKey 與 input/textarea/contenteditable，並 `toLowerCase()`。
  Playwright 驗證：RED 模擬 Cmd+f 仍呼叫 `requestFullscreen`；GREEN 不再呼叫。
- WP5：新增 `channels.js`（`window.NYL_CHANNELS`，20 筆，用 .js 而非 .json 是因為
  `index.html` 常以 `file://` 直接開啟，fetch JSON 在 `file://` 下會被擋）。`app.js` 改讀
  `window.NYL_CHANNELS`，並支援 `?ids=ID1,ID2,...` 網址參數即時覆蓋（跨年當天臨時換台不必重新部署）；
  缺少頻道清單時顯示 toast。每格影片加上 `<span class="video-name">` 顯示頻道名稱（`textContent`
  設定，不拼 `innerHTML`，避免 XSS）。名稱目前為佔位文字「直播 1」～「直播 20」，尚未填入真實頻道名稱
  （未編造資料，需搭配 WP6 或人工查證後填入）。
- WP6：新增 `scripts/check-channels.mjs`，`YOUTUBE_API_KEY=xxx node scripts/check-channels.mjs`
  一次呼叫 `videos.list` 帶 20 個 id（逗號分隔，只花 1 quota），印出每個 ID 是否存在、
  `liveBroadcastContent`、`scheduledStartTime`、`channelTitle`；有問題就 exit 1。
  `--suggest-names` 可印出真實 `channelTitle` 供貼進 channels.js。金鑰只讀環境變數，絕不印出、
  不寫入任何檔案；沒有 key 時印「需要 YOUTUBE_API_KEY」並 exit 2（已驗證）。
  **這次實際跑的結果**：金鑰放在 `/Users/leonalin/Code/courseshelf/apps/web/.env.local`
  （`YOUTUBE_API_KEY`），本次在 agent 沙盒環境跑會回傳 HTTP 403
  `API_KEY_IP_ADDRESS_BLOCKED`（金鑰的 IP 白名單擋掉了沙盒的出口 IP，是這個環境本身的限制，
  不是腳本或金鑰的問題）。**下次接手者請直接在使用者本機終端機跑一次**
  （而非透過此類沙盒 agent），才能拿到真正的 20 筆 live/upcoming 檢查結果。

**留給下一輪（未做，皆非本次硬性約束範圍）**：AGENTS.md 的 build/test 行同步、使用說明.md 補
`?ids=` 與快捷鍵說明、母 repo PROJECT_LIST.md 那一列更新——這些對應規劃檔的 WP7（標記 [H]），
按指示留給後續 Haiku 那輪處理。

## 主辦權
單線／待分派
