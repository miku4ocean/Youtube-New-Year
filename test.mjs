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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
