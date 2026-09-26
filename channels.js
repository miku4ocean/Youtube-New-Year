/**
 * 跨年直播頻道清單
 * 用 .js（非 .json）是因為 index.html 常以 file:// 直接雙擊開啟，
 * fetch JSON 在 file:// 下會因 CORS 被瀏覽器擋掉，<script> 標籤則不受影響。
 *
 * 每年跨年前更新流程：
 *   1. 執行 scripts/check-channels.mjs 確認目前清單是否仍為 live/upcoming
 *   2. 找到當年度的 20 個跨年直播網址，更新下面的 url（name 可用
 *      scripts/check-channels.mjs --suggest-names 取得的真實頻道名稱填入）
 *   3. push 後 GitHub Pages 會自動重建
 *
 * 名稱目前為佔位文字「直播 N」，尚未填入真實頻道名稱（不編造資料）。
 */
window.NYL_CHANNELS = [
    { name: '直播 1', url: 'https://www.youtube.com/watch?v=6Ekqt2eQWaM' },
    { name: '直播 2', url: 'https://www.youtube.com/watch?v=INUlQU4XH7E' },
    { name: '直播 3', url: 'https://www.youtube.com/watch?v=qfqPudgn-8A' },
    { name: '直播 4', url: 'https://www.youtube.com/watch?v=fO69UoXVgUU' },
    { name: '直播 5', url: 'https://www.youtube.com/watch?v=0TWaHr8zmBc' },
    { name: '直播 6', url: 'https://www.youtube.com/watch?v=iwbYPtvjzzM' },
    { name: '直播 7', url: 'https://www.youtube.com/watch?v=YuF_KbM01T4' },
    { name: '直播 8', url: 'https://www.youtube.com/watch?v=qK1pilx16WA' },
    { name: '直播 9', url: 'https://www.youtube.com/watch?v=Fua-K7Yjydw' },
    { name: '直播 10', url: 'https://www.youtube.com/watch?v=QFdchnomk7o' },
    { name: '直播 11', url: 'https://www.youtube.com/watch?v=_ePcCXyHDAk' },
    { name: '直播 12', url: 'https://www.youtube.com/watch?v=LvebymzFc2I' },
    { name: '直播 13', url: 'https://www.youtube.com/watch?v=6nV37uSsx1o' },
    { name: '直播 14', url: 'https://www.youtube.com/watch?v=Ys76Vb8Bn1E' },
    { name: '直播 15', url: 'https://www.youtube.com/watch?v=VnZ6x6m5VAc' },
    { name: '直播 16', url: 'https://www.youtube.com/watch?v=DwNoUIspeHg' },
    { name: '直播 17', url: 'https://www.youtube.com/watch?v=pg1pjLGN1us' },
    { name: '直播 18', url: 'https://www.youtube.com/watch?v=9dGtcu2VKOQ' },
    { name: '直播 19', url: 'https://www.youtube.com/watch?v=sKY2i69cenc' },
    { name: '直播 20', url: 'https://www.youtube.com/watch?v=dE_A83eNQ7A' }
];
