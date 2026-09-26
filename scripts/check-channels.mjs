#!/usr/bin/env node
/**
 * 直播檢查腳本（供每年 12 月中換直播網址時使用）
 *
 * 用法：
 *   YOUTUBE_API_KEY=xxx node scripts/check-channels.mjs
 *   YOUTUBE_API_KEY=xxx node scripts/check-channels.mjs --suggest-names
 *
 * 金鑰只從環境變數 YOUTUBE_API_KEY 讀取，絕不寫死、絕不印出、絕不寫入任何檔案。
 * 一次呼叫 videos.list 帶 20 個 id（逗號分隔）只花 1 quota。
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function extractVideoId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function loadChannels() {
    const code = readFileSync(join(repoRoot, 'channels.js'), 'utf8');
    const context = vm.createContext({ window: {} });
    vm.runInContext(code, context, { filename: 'channels.js' });
    return context.window.NYL_CHANNELS || [];
}

async function main() {
    const suggestNames = process.argv.includes('--suggest-names');

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.error('需要 YOUTUBE_API_KEY（請用環境變數傳入，勿寫進檔案）');
        process.exit(2);
    }

    const channels = loadChannels();
    if (channels.length === 0) {
        console.error('channels.js 內沒有任何頻道可檢查');
        process.exit(2);
    }

    const ids = channels.map(ch => extractVideoId(ch.url)).filter(Boolean);
    if (ids.length === 0) {
        console.error('channels.js 內沒有任何可解析的 videoId');
        process.exit(2);
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,liveStreamingDetails,status');
    url.searchParams.set('id', ids.join(','));
    url.searchParams.set('key', apiKey);

    let data;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`YouTube API 呼叫失敗：HTTP ${res.status}`);
            process.exit(1);
        }
        data = await res.json();
    } catch (err) {
        // 絕不印出 err 內可能含有 key 的欄位（fetch 錯誤訊息一般不含 key，但保守只印訊息文字）
        console.error(`YouTube API 呼叫失敗：${err.message}`);
        process.exit(1);
    }

    const itemsById = new Map((data.items || []).map(item => [item.id, item]));

    let hasProblem = false;
    const suggestions = [];

    ids.forEach((id, i) => {
        const item = itemsById.get(id);
        const exists = !!item;
        const liveBroadcastContent = exists ? (item.snippet?.liveBroadcastContent ?? 'none') : 'none';
        const scheduledStartTime = exists ? (item.liveStreamingDetails?.scheduledStartTime ?? '(無)') : '(無)';
        const channelTitle = exists ? (item.snippet?.channelTitle ?? '(無)') : '(無)';

        if (!exists || (liveBroadcastContent !== 'upcoming' && liveBroadcastContent !== 'live')) {
            hasProblem = true;
        }

        console.log(
            `[${i + 1}/${ids.length}] id=${id} 存在=${exists} liveBroadcastContent=${liveBroadcastContent} scheduledStartTime=${scheduledStartTime} channelTitle=${channelTitle}`
        );

        if (exists && channelTitle !== '(無)') {
            suggestions.push({ name: channelTitle, url: channels[i].url });
        }
    });

    if (suggestNames) {
        console.log('\n--suggest-names：可貼進 channels.js 的 name 欄位（來自 API 的真實 channelTitle）');
        suggestions.forEach(s => {
            console.log(`    { name: ${JSON.stringify(s.name)}, url: ${JSON.stringify(s.url)} },`);
        });
    }

    if (hasProblem) {
        console.log('\n有頻道不存在或非 live/upcoming，請於跨年前更新 channels.js。');
        process.exit(1);
    }

    console.log('\n全部 20 個頻道皆為 live 或 upcoming。');
    process.exit(0);
}

main();
