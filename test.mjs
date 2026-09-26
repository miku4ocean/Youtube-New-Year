import { readFileSync, existsSync } from 'fs';
import vm from 'node:vm';

let pass = 0, fail = 0;
function test(name, fn) { try { fn(); pass++; console.log(`  ✓ ${name}`); } catch(e) { fail++; console.log(`  ✗ ${name}: ${e.message}`); } }
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// ── 既有 5 項：HTML 基本檢查 ──
const candidates = ['index.html', 'src/index.html', 'public/index.html'];
let htmlFile = candidates.find(f => existsSync(f));
assert(htmlFile, 'No index.html found');
const html = readFileSync(htmlFile, 'utf8');
test('HTML file exists and is non-empty', () => { assert(html.length > 100, `Only ${html.length} chars`); });
test('Has DOCTYPE', () => { assert(html.toLowerCase().includes('<!doctype'), 'Missing DOCTYPE'); });
test('Has charset meta', () => { assert(html.includes('charset'), 'Missing charset'); });
test('Has title', () => { assert(/<title>[^<]+<\/title>/.test(html), 'Missing or empty title'); });
test('Has body content', () => { assert(/<body[\s>]/.test(html), 'Missing body tag'); });

// ── 用 node:vm 載入 app.js，取出 NYLCore 純邏輯做單元測試（不引入任何 npm 依賴）──
function makeDomStub() {
    return {
        createElement: () => ({}),
        head: { appendChild: () => {} },
        addEventListener: () => {},
        getElementById: () => null,
        body: { style: {}, classList: { toggle: () => {} } }
    };
}

const appCode = readFileSync('app.js', 'utf8');
const appContext = vm.createContext({ document: makeDomStub(), window: {}, console });
vm.runInContext(appCode, appContext, { filename: 'app.js' });
const NYLCore = appContext.NYLCore;

test('NYLCore 有被掛到 globalThis', () => { assert(NYLCore && typeof NYLCore === 'object', 'globalThis.NYLCore 不存在'); });

// extractVideoId
test('extractVideoId: watch URL', () => { assert(NYLCore.extractVideoId('https://www.youtube.com/watch?v=6Ekqt2eQWaM') === '6Ekqt2eQWaM', '未取得正確 ID'); });
test('extractVideoId: youtu.be 短網址', () => { assert(NYLCore.extractVideoId('https://youtu.be/6Ekqt2eQWaM') === '6Ekqt2eQWaM', '未取得正確 ID'); });
test('extractVideoId: embed URL', () => { assert(NYLCore.extractVideoId('https://www.youtube.com/embed/6Ekqt2eQWaM') === '6Ekqt2eQWaM', '未取得正確 ID'); });
test('extractVideoId: live URL', () => { assert(NYLCore.extractVideoId('https://www.youtube.com/live/6Ekqt2eQWaM') === '6Ekqt2eQWaM', '未取得正確 ID'); });
test('extractVideoId: 純 11 碼 ID', () => { assert(NYLCore.extractVideoId('6Ekqt2eQWaM') === '6Ekqt2eQWaM', '未取得正確 ID'); });
test('extractVideoId: 無效字串回傳 null', () => { assert(NYLCore.extractVideoId('not a valid url') === null, '應回傳 null'); });
test('extractVideoId: null 輸入回傳 null', () => { assert(NYLCore.extractVideoId(null) === null, '應回傳 null'); });

// countdownState
test('countdownState: 12/31 23:59:50 → final10', () => {
    const now = new Date(2026, 11, 31, 23, 59, 50);
    const s = NYLCore.countdownState(now);
    assert(s.phase === 'final10', `phase=${s.phase}`);
    assert(s.targetYear === 2027, `targetYear=${s.targetYear}`);
});
test('countdownState: 1/1 00:00:00 → celebrate', () => {
    const now = new Date(2027, 0, 1, 0, 0, 0);
    const s = NYLCore.countdownState(now);
    assert(s.phase === 'celebrate', `phase=${s.phase}`);
});
test('countdownState: 1/1 00:59:59 → celebrate', () => {
    const now = new Date(2027, 0, 1, 0, 59, 59);
    const s = NYLCore.countdownState(now);
    assert(s.phase === 'celebrate', `phase=${s.phase}`);
});
test('countdownState: 1/1 01:00:00 → countdown 且 targetYear=明年', () => {
    const now = new Date(2027, 0, 1, 1, 0, 0);
    const s = NYLCore.countdownState(now);
    assert(s.phase === 'countdown', `phase=${s.phase}`);
    assert(s.targetYear === 2028, `targetYear=${s.targetYear}`);
});
test('countdownState: 9/26 平常日 → countdown', () => {
    const now = new Date(2026, 8, 26, 12, 0, 0);
    const s = NYLCore.countdownState(now);
    assert(s.phase === 'countdown', `phase=${s.phase}`);
    assert(s.targetYear === 2027, `targetYear=${s.targetYear}`);
});
test('countdownState: 閏年 2/29 中午 → countdown 且 remainingMs 計算正確', () => {
    const now = new Date(2024, 1, 29, 12, 0, 0); // 2024 是閏年
    const s = NYLCore.countdownState(now);
    const expectedDiff = new Date(2025, 0, 1, 0, 0, 0) - now;
    assert(s.phase === 'countdown', `phase=${s.phase}`);
    assert(s.targetYear === 2025, `targetYear=${s.targetYear}`);
    assert(s.remainingMs === expectedDiff, `remainingMs=${s.remainingMs}，預期=${expectedDiff}`);
});

// formatCountdown
test('formatCountdown: 超過 24h 顯示「N 天 HH:MM:SS」', () => {
    assert(NYLCore.formatCountdown(90061000) === '1 天 01:01:01', NYLCore.formatCountdown(90061000));
});
test('formatCountdown: 未滿 24h 顯示「HH:MM:SS」', () => {
    assert(NYLCore.formatCountdown(3661000) === '01:01:01', NYLCore.formatCountdown(3661000));
});
test('formatCountdown: 0 顯示「00:00:00」', () => {
    assert(NYLCore.formatCountdown(0) === '00:00:00', NYLCore.formatCountdown(0));
});

// shouldHandleShortcut
test('shouldHandleShortcut: Cmd+F → false', () => {
    assert(NYLCore.shouldHandleShortcut({ key: 'f', metaKey: true }) === false, '應忽略 Cmd+F');
});
test('shouldHandleShortcut: Ctrl+F → false', () => {
    assert(NYLCore.shouldHandleShortcut({ key: 'f', ctrlKey: true }) === false, '應忽略 Ctrl+F');
});
test('shouldHandleShortcut: 大寫 F（無修飾鍵）→ true', () => {
    assert(NYLCore.shouldHandleShortcut({ key: 'F' }) === true, '大寫 F 應可觸發');
});
test('shouldHandleShortcut: target 是 input → false', () => {
    assert(NYLCore.shouldHandleShortcut({ key: 'm', target: { tagName: 'INPUT' } }) === false, 'input 中應忽略快捷鍵');
});

// ── WP3：靜音改用 postMessage，不再重新載入 iframe.src ──
test('toggleMuteAll 不再直接以 "iframe.src = src" 重新載入', () => {
    assert(!appCode.includes('iframe.src = src'), '仍殘留舊的 iframe.src = src 寫法');
});
test('toggleMuteAll 有使用 postMessage', () => {
    assert(appCode.includes('postMessage'), '未改用 postMessage 控制靜音');
});

// ── WP5：頻道設定外部化到 channels.js ──
test('app.js 內不再有硬編碼的 youtube.com/watch 網址', () => {
    const count = (appCode.match(/youtube\.com\/watch/g) || []).length;
    assert(count === 0, `仍有 ${count} 筆硬編碼網址`);
});

const channelsCode = readFileSync('channels.js', 'utf8');
const channelsContext = vm.createContext({ window: {}, console });
vm.runInContext(channelsCode, channelsContext, { filename: 'channels.js' });
const NYL_CHANNELS = channelsContext.window.NYL_CHANNELS;

test('channels.js 可被 vm 載入且 NYL_CHANNELS 存在', () => {
    assert(Array.isArray(NYL_CHANNELS), 'window.NYL_CHANNELS 不是陣列');
});
test('NYL_CHANNELS 有 20 筆', () => {
    assert(NYL_CHANNELS.length === 20, `實際 ${NYL_CHANNELS.length} 筆`);
});
test('NYL_CHANNELS 每筆 extractVideoId 都不為 null', () => {
    const bad = NYL_CHANNELS.filter(ch => !NYLCore.extractVideoId(ch.url));
    assert(bad.length === 0, `有 ${bad.length} 筆無法解析出 videoId`);
});
test('NYL_CHANNELS 每筆都有非空 name', () => {
    const bad = NYL_CHANNELS.filter(ch => !ch.name || typeof ch.name !== 'string');
    assert(bad.length === 0, `有 ${bad.length} 筆缺少 name`);
});

// index.html 有引入 channels.js
test('index.html 有引入 channels.js（在 app.js 之前）', () => {
    const channelsIdx = html.indexOf('channels.js');
    const appIdx = html.indexOf('app.js');
    assert(channelsIdx !== -1, 'index.html 未引入 channels.js');
    assert(channelsIdx < appIdx, 'channels.js 應在 app.js 之前載入');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
