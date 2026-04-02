import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { getToolById } from './server-tools.mjs';
import { buildPrompt, buildSystemPrompt } from './server-prompts.mjs';

// Prevent crashes
process.on('uncaughtException', (err) => console.error('Uncaught:', err.message));
process.on('unhandledRejection', (err) => console.error('Unhandled:', err?.message || err));

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = process.env.DIST_DIR || join(__dirname, 'dist');
const PORT = parseInt(process.env.PORT || '8080', 10);
const DATA_DIR = join(__dirname, 'data');
const FEEDBACK_DIR = join(DATA_DIR, 'feedback_uploads');
const FEEDBACK_FILE = join(DATA_DIR, 'teacher_feedback.json');
const TOOL_USAGE_FILE = join(DATA_DIR, 'tool_usage.json');

function loadLocalEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  const raw = readFileSync(filePath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  });
  return env;
}

const LOCAL_ENV = loadLocalEnv(join(__dirname, '.env.local'));
const envValue = (key, fallback = '') => process.env[key] || LOCAL_ENV[key] || fallback;
const splitKeys = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const PROVIDERS = {
  deepseek: {
    name: 'deepseek',
    baseUrl: envValue('DEEPSEEK_BASE_URL', 'https://api.deepseek.com'),
    model: envValue('DEEPSEEK_MODEL', 'deepseek-chat'),
    keys: splitKeys(envValue('DEEPSEEK_KEYS', envValue('API_KEY', '')))
  },
  kimi: {
    name: 'kimi',
    baseUrl: envValue('KIMI_BASE_URL', 'https://api.moonshot.cn/v1'),
    model: envValue('KIMI_MODEL', 'kimi-k2.5'),
    keys: splitKeys(envValue('KIMI_KEYS', ''))
  }
};

const LONG_FORM_TOOL_IDS = new Set([
  'lesson-plan',
  'pe-lesson-plan',
  'lesson-5e',
  'unit-plan',
  'lesson-talk',
  'project-based-learning',
  'science-lab',
  'group-work',
  'pd-planner',
  'sel-lesson-plan',
  'syllabus-generator',
  'exam-review',
  'feedback-rubric',
  'classroom-observation',
  'writing-feedback',
  'class-meeting',
  'parent-communication',
  'professional-email',
  'class-newsletter',
  'recommendation-letter',
  'thank-you-letter',
  'promo-copy',
  'student-support',
  'teaching-adjustment',
  'support-goals',
  'social-story',
  'restorative-reflection',
  'classroom-management',
  'inclusive-support-plan',
  'individual-support-plan',
  'behavior-support-plan'
]);

const ANALYZE_PROVIDER = envValue('ANALYZE_PROVIDER', 'deepseek');
const FEEDBACK_ADMIN_TOKEN = envValue('FEEDBACK_ADMIN_TOKEN', splitKeys(envValue('DEEPSEEK_KEYS', ''))[0] || '');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  const pathname = (req.url || '/').split('?')[0];
  const isPublicAsset =
    pathname === '/' ||
    pathname === '/index.html' ||
    pathname === '/favicon.svg' ||
    pathname === '/icons.svg' ||
    pathname.startsWith('/assets/');

  if (!isPublicAsset) {
    if (extname(pathname)) {
      res.writeHead(404);
      return res.end('not found');
    }
    const indexFile = join(DIST_DIR, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    return res.end(readFileSync(indexFile));
  }

  let fp = join(DIST_DIR, pathname === '/' ? '/index.html' : pathname);
  if (!existsSync(fp) || !statSync(fp).isFile()) {
    if (extname(pathname)) {
      res.writeHead(404);
      return res.end('not found');
    }
    fp = join(DIST_DIR, 'index.html');
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' });
  res.end(readFileSync(fp));
}

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(FEEDBACK_DIR, { recursive: true });
}

async function readJsonFile(filePath, fallback) {
  try {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath, value) {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, status, html) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function getImageExtensionFromDataUrl(dataUrl) {
  const match = /^data:image\/([a-zA-Z0-9+.-]+);base64,/.exec(dataUrl || '');
  if (!match) return 'png';
  const type = match[1].toLowerCase();
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  if (type.includes('gif')) return 'gif';
  if (type.includes('webp')) return 'webp';
  return 'png';
}

function decodeBase64Image(dataUrl) {
  const match = /^data:image\/[a-zA-Z0-9+.-]+;base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  return Buffer.from(match[1], 'base64');
}

async function collectJsonBody(req, res) {
  const chunks = [];
  await new Promise((resolve) => {
    req.on('data', c => chunks.push(c));
    req.on('end', resolve);
  });

  try {
    return JSON.parse(Buffer.concat(chunks).toString() || '{}');
  } catch {
    sendJson(res, 400, { error: 'bad json' });
    return null;
  }
}

async function handleFeedback(req, res) {
  const parsed = await collectJsonBody(req, res);
  if (!parsed) return;

  const message = String(parsed.message || '').trim();
  const feedbackType = String(parsed.feedbackType || '改进建议').trim();
  const contact = String(parsed.contact || '').trim();
  const screenshot = parsed.screenshot || '';

  if (!message) {
    return sendJson(res, 400, { error: 'message required' });
  }

  await ensureDataDir();
  const feedbackList = await readJsonFile(FEEDBACK_FILE, []);
  const entry = {
    id: crypto.randomUUID(),
    feedbackType,
    message,
    contact,
    createdAt: new Date().toISOString()
  };

  if (typeof screenshot === 'string' && screenshot.startsWith('data:image/')) {
    const buffer = decodeBase64Image(screenshot);
    if (buffer) {
      const ext = getImageExtensionFromDataUrl(screenshot);
      const filename = `${entry.id}.${ext}`;
      await writeFile(join(FEEDBACK_DIR, filename), buffer);
      entry.image = `/feedback_uploads/${filename}`;
    }
  }

  feedbackList.unshift(entry);
  await writeJsonFile(FEEDBACK_FILE, feedbackList.slice(0, 500));
  return sendJson(res, 200, { ok: true, id: entry.id });
}

async function handleToolUsage(req, res) {
  if (req.method === 'GET') {
    const stats = await readJsonFile(TOOL_USAGE_FILE, { total: 0, tools: {} });
    return sendJson(res, 200, stats);
  }

  const parsed = await collectJsonBody(req, res);
  if (!parsed) return;

  const toolId = String(parsed.toolId || '').trim();
  const toolName = String(parsed.toolName || '').trim();

  if (!toolId) {
    return sendJson(res, 400, { error: 'toolId required' });
  }

  const stats = await readJsonFile(TOOL_USAGE_FILE, { total: 0, tools: {} });
  stats.total += 1;
  if (!stats.tools[toolId]) {
    stats.tools[toolId] = { toolId, toolName, openCount: 0, lastOpenedAt: null };
  }
  stats.tools[toolId].toolName = toolName || stats.tools[toolId].toolName;
  stats.tools[toolId].openCount += 1;
  stats.tools[toolId].lastOpenedAt = new Date().toISOString();

  await writeJsonFile(TOOL_USAGE_FILE, stats);
  return sendJson(res, 200, { ok: true });
}

function isAdminAuthorized(req) {
  const token = String(req.headers['x-admin-token'] || '').trim();
  return !!FEEDBACK_ADMIN_TOKEN && token === FEEDBACK_ADMIN_TOKEN;
}

async function handleAdminFeedbackList(req, res) {
  if (!isAdminAuthorized(req)) {
    return sendJson(res, 401, { error: 'unauthorized' });
  }

  const feedbackList = await readJsonFile(FEEDBACK_FILE, []);
  return sendJson(res, 200, { items: feedbackList });
}

function renderFeedbackAdminPage() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>教师反馈列表</title>
  <style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8fafc;color:#0f172a}
    .wrap{max-width:1080px;margin:0 auto;padding:24px}
    .card{background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:24px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .grid{display:grid;gap:16px}
    .stats{grid-template-columns:repeat(3,minmax(0,1fr))}
    .row{display:flex;gap:12px;align-items:center}
    .between{display:flex;justify-content:space-between;gap:16px;align-items:center}
    .input, .btn{border-radius:18px;padding:14px 16px;font-size:14px;border:1px solid #cbd5e1}
    .input{flex:1;background:#fff}
    .btn{background:#2563eb;color:#fff;border:none;cursor:pointer}
    .btn.secondary{background:#fff;color:#334155;border:1px solid #cbd5e1}
    .muted{color:#64748b;font-size:14px;line-height:1.7}
    .tag{display:inline-block;padding:6px 10px;border-radius:999px;background:#eff6ff;color:#2563eb;font-size:12px;font-weight:600}
    .item{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:16px}
    .shot{width:100%;height:180px;object-fit:cover;border-radius:18px;border:1px solid #e2e8f0;background:#f8fafc}
    .msg{white-space:pre-wrap;line-height:1.8;font-size:14px;color:#334155}
    .empty{padding:48px 24px;text-align:center;color:#94a3b8}
    @media (max-width: 900px){.stats,.item{grid-template-columns:1fr}.wrap{padding:16px}}
  </style>
</head>
<body>
  <div class="wrap grid">
    <div class="between">
      <button class="btn secondary" onclick="history.back()">返回</button>
      <div style="text-align:right">
        <h1 style="margin:0;font-size:28px">教师反馈列表</h1>
        <div class="muted">隐藏后台页，输入口令后查看老师反馈、截图和联系方式</div>
      </div>
    </div>

    <div class="card">
      <h2 style="margin:0 0 8px">访问校验</h2>
      <div class="muted">这个页面不在导航中显示，只有口令正确时才会请求反馈数据。</div>
      <div class="row" style="margin-top:16px">
        <input id="token" class="input" type="password" placeholder="请输入管理员口令" />
        <button id="loadBtn" class="btn">查看反馈</button>
      </div>
      <div id="error" style="margin-top:12px;color:#e11d48;font-size:14px"></div>
    </div>

    <div id="content" class="grid" style="display:none">
      <div class="grid stats">
        <div class="card"><div id="total" style="font-size:28px;font-weight:700">0</div><div class="muted">反馈总数</div></div>
        <div class="card" style="grid-column:span 2"><div style="font-size:16px;font-weight:600;margin-bottom:10px">反馈类型分布</div><div id="types" class="row" style="flex-wrap:wrap"></div></div>
      </div>
      <div id="list" class="grid"></div>
    </div>
  </div>
  <script>
    const tokenInput = document.getElementById('token');
    const loadBtn = document.getElementById('loadBtn');
    const errorEl = document.getElementById('error');
    const contentEl = document.getElementById('content');
    const totalEl = document.getElementById('total');
    const typesEl = document.getElementById('types');
    const listEl = document.getElementById('list');
    tokenInput.value = localStorage.getItem('feedback_admin_token') || '';

    function escapeHtml(text){
      return String(text || '').replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
    }

    function render(items){
      totalEl.textContent = items.length;
      const typeMap = {};
      items.forEach(item => { const key = item.feedbackType || '未分类'; typeMap[key] = (typeMap[key] || 0) + 1; });
      typesEl.innerHTML = Object.entries(typeMap).sort((a,b)=>b[1]-a[1]).map(([label,count]) => '<span class="tag">'+escapeHtml(label)+' '+count+'</span>').join('') || '<span class="muted">暂无数据</span>';
      listEl.innerHTML = items.length ? items.map(item => {
        const time = item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : '未知时间';
        const image = item.image
          ? '<a href="'+encodeURI(item.image)+'" target="_blank" rel="noreferrer"><img class="shot" src="'+encodeURI(item.image)+'" alt="反馈截图" /></a>'
          : '<div class="card empty" style="padding:24px">无截图</div>';
        const contact = item.contact ? '<div style="margin-top:14px;padding:12px 14px;border-radius:16px;background:#f8fafc;color:#475569;font-size:14px">联系方式：'+escapeHtml(item.contact)+'</div>' : '';
        return '<div class="card item"><div><div class="row" style="flex-wrap:wrap"><span class="tag">'+escapeHtml(item.feedbackType || '未分类')+'</span><span class="muted">'+escapeHtml(time)+'</span></div><div class="msg" style="margin-top:16px">'+escapeHtml(item.message)+'</div>'+contact+'</div><div>'+image+'</div></div>';
      }).join('') : '<div class="card empty">还没有收到教师反馈。</div>';
      contentEl.style.display = 'grid';
    }

    async function loadFeedback(){
      const token = tokenInput.value.trim();
      if(!token){ errorEl.textContent = '请输入访问口令'; return; }
      errorEl.textContent = '';
      loadBtn.disabled = true;
      loadBtn.textContent = '加载中...';
      try{
        const response = await fetch('/api/admin/feedback', { headers: { 'x-admin-token': token } });
        if(response.status === 401) throw new Error('访问口令不正确');
        if(!response.ok) throw new Error('加载失败，请稍后重试');
        const data = await response.json();
        localStorage.setItem('feedback_admin_token', token);
        render(Array.isArray(data.items) ? data.items : []);
      }catch(err){
        errorEl.textContent = err.message || '加载失败，请稍后重试';
      }finally{
        loadBtn.disabled = false;
        loadBtn.textContent = '查看反馈';
      }
    }

    loadBtn.addEventListener('click', loadFeedback);
    tokenInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') loadFeedback(); });
  </script>
</body>
</html>`;
}

function buildAnalyzePrompt(tool) {
  const visibleFields = tool.fields
    .filter((field) => !field.isAdvanced)
    .map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      required: !!field.required,
      options: field.options || []
    }));

  return `你是中国教师工具的需求拆解助手。你的任务是把老师的一句话需求，拆解成当前工具需要的字段。

工具名称：${tool.name}
可用字段：
${JSON.stringify(visibleFields, null, 2)}

请只返回 JSON，格式必须是：
{
  "message": "一句自然、简短的中文确认，概括你已理解的需求",
  "recognized": {
    "字段key": "已经从老师原话里识别出的值"
  },
  "requiredFields": [
    {
      "key": "还需要追问的字段key",
      "label": "字段显示名",
      "type": "text/select/textarea",
      "required": true,
      "placeholder": "给老师看的自然提示语",
      "options": []
    }
  ],
  "advancedFields": []
}

要求：
1. 能从老师原话中识别出来的字段，不要再放进 requiredFields。
2. select 类型如果能匹配 options，recognized 里必须返回标准值。
3. requiredFields 只保留当前真正还缺的必要字段，按追问顺序返回。
4. placeholder 要像老师助手在追问，不能只是重复字段名。
5. advancedFields 先返回空数组。`;
}

function extractJsonObject(text) {
  if (!text) return null;
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] || text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function pickRandomKey(keys, tried = new Set()) {
  const available = keys.filter((key) => !tried.has(key));
  if (available.length === 0) return '';
  return available[Math.floor(Math.random() * available.length)];
}

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || '').replace(/\/+$/, '');
}

function chooseProvider(toolId, mode = 'generate') {
  if (mode === 'analyze') {
    return PROVIDERS[ANALYZE_PROVIDER] || PROVIDERS.deepseek;
  }

  if (LONG_FORM_TOOL_IDS.has(toolId) && PROVIDERS.kimi.keys.length > 0) {
    return PROVIDERS.kimi;
  }

  return PROVIDERS.deepseek;
}

async function postToModel(payload, options = {}) {
  const { toolId = '', mode = 'generate' } = options;
  const provider = chooseProvider(toolId, mode);

  if (!provider || provider.keys.length === 0) {
    throw new Error(`provider_unavailable:${provider?.name || 'unknown'}`);
  }

  const tried = new Set();
  let lastError = null;

  while (tried.size < provider.keys.length) {
    const key = pickRandomKey(provider.keys, tried);
    if (!key) break;
    tried.add(key);

    try {
      const response = await fetch(`${normalizeBaseUrl(provider.baseUrl)}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: provider.model,
          ...payload
        }),
      });

      if ([401, 402, 403, 429, 500, 502, 503, 504].includes(response.status) && tried.size < provider.keys.length) {
        lastError = new Error(`${provider.name}:${response.status}`);
        continue;
      }

      response._provider = provider.name;
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`all_keys_failed:${provider.name}`);
}

async function readStreamingText(upstream) {
  if (!upstream.ok || !upstream.body) {
    throw new Error(`请求失败：${upstream.status}`);
  }

  const decoder = new TextDecoder();
  let pending = '';
  let fullText = '';

  for await (const chunk of upstream.body) {
    pending += decoder.decode(typeof chunk === 'string' ? Buffer.from(chunk) : chunk, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (!data || data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) fullText += content;
      } catch {}
    }
  }

  if (pending.startsWith('data: ')) {
    const data = pending.slice(6);
    if (data && data !== '[DONE]') {
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) fullText += content;
      } catch {}
    }
  }

  return fullText;
}

async function handleAnalyze(req, res) {
  const parsed = await collectJsonBody(req, res);
  if (!parsed) return;

  const tool = getToolById(String(parsed.toolId || '').trim());
  const message = String(parsed.message || '').trim();

  if (!tool || !message) {
    return sendJson(res, 400, { error: 'toolId and message required' });
  }

  let upstream;
  try {
    upstream = await postToModel({
      stream: true,
      messages: [
        { role: 'system', content: buildAnalyzePrompt(tool) },
        { role: 'user', content: message }
      ]
    }, { toolId: tool.id, mode: 'analyze' });
    const text = await readStreamingText(upstream);
    const result = extractJsonObject(text) || {
      message: '我先帮你梳理了一下需求，还差几项关键信息。',
      recognized: {},
      requiredFields: [],
      advancedFields: []
    };
    return sendJson(res, 200, result);
  } catch (err) {
    console.error('Analyze failed:', err.message);
    return sendJson(res, 500, { error: 'analyze failed' });
  }
}

async function handleGenerate(req, res) {
  const parsed = await collectJsonBody(req, res);
  if (!parsed) return;

  const tool = getToolById(String(parsed.toolId || '').trim());
  const formData = parsed.formData && typeof parsed.formData === 'object' ? parsed.formData : {};

  if (!tool) {
    return sendJson(res, 400, { error: 'toolId required' });
  }

  let upstream;
  try {
    upstream = await postToModel({
      stream: true,
      messages: [
        { role: 'system', content: buildSystemPrompt(tool) },
        { role: 'user', content: buildPrompt(tool, formData) }
      ]
    }, { toolId: tool.id, mode: 'generate' });
  } catch (err) {
    console.error('Generate fetch failed:', err.message);
    return sendJson(res, 502, { error: err.message });
  }

  res.writeHead(upstream.status, {
    'Content-Type': upstream.headers.get('content-type') || 'text/event-stream',
    'Cache-Control': 'no-cache',
  });

  if (!upstream.body) {
    return res.end(await upstream.text());
  }

  try {
    for await (const chunk of upstream.body) {
      if (res.writableEnded) break;
      res.write(typeof chunk === 'string' ? chunk : Buffer.from(chunk));
    }
  } catch (err) {
    console.error('Generate stream error:', err.message);
  }
  if (!res.writableEnded) res.end();
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
    });
    return res.end();
  }
  if (req.method === 'POST' && req.url === '/api/tools/analyze') {
    handleAnalyze(req, res).catch(err => {
      console.error('Analyze handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'analyze failed' });
    });
  } else if (req.method === 'POST' && req.url === '/api/tools/generate') {
    handleGenerate(req, res).catch(err => {
      console.error('Generate handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'generate failed' });
      if (!res.writableEnded) res.end();
    });
  } else if (req.url === '/api/feedback' && req.method === 'POST') {
    handleFeedback(req, res).catch(err => {
      console.error('Feedback handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'feedback failed' });
    });
  } else if (req.url === '/api/tool-usage' && (req.method === 'POST' || req.method === 'GET')) {
    handleToolUsage(req, res).catch(err => {
      console.error('Tool usage handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'tool usage failed' });
    });
  } else if (req.url === '/api/admin/feedback' && req.method === 'GET') {
    handleAdminFeedbackList(req, res).catch(err => {
      console.error('Admin feedback handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'admin feedback failed' });
    });
  } else if (req.url === '/feedback-admin' && req.method === 'GET') {
    sendHtml(res, 200, renderFeedbackAdminPage());
  } else if ((req.url || '').startsWith('/api/')) {
    sendJson(res, 404, { error: 'not found' });
  } else if (req.url.startsWith('/feedback_uploads/')) {
    const fp = join(FEEDBACK_DIR, req.url.replace('/feedback_uploads/', ''));
    if (!existsSync(fp) || !statSync(fp).isFile()) {
      res.writeHead(404);
      return res.end('not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' });
    res.end(readFileSync(fp));
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`AI备课工作台 running at http://localhost:${PORT}`);
  console.log(
    `Providers: deepseek(${PROVIDERS.deepseek.keys.length}) -> ${PROVIDERS.deepseek.model}, kimi(${PROVIDERS.kimi.keys.length}) -> ${PROVIDERS.kimi.model}`
  );
});
