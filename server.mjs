import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
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
const WORKFLOWS_FILE = join(DATA_DIR, 'user_workflows.json');
const WORKFLOW_RUNS_FILE = join(DATA_DIR, 'user_workflow_runs.json');

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
const FEEDBACK_ADMIN_TOKEN = envValue('FEEDBACK_ADMIN_TOKEN', 'wfg12170317');

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
    if (!isAdminAuthorized(req)) {
      return sendJson(res, 401, { error: 'unauthorized' });
    }
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

function getUserId(req) {
  return String(req.headers['x-beike-user-id'] || '').trim() || 'guest-anonymous';
}

async function readUserCollection(filePath) {
  return readJsonFile(filePath, {});
}

async function writeUserCollection(filePath, value) {
  await writeJsonFile(filePath, value);
}

async function handleWorkflows(req, res) {
  const userId = getUserId(req);
  const store = await readUserCollection(WORKFLOWS_FILE);

  if (req.method === 'GET') {
    return sendJson(res, 200, { items: Array.isArray(store[userId]) ? store[userId] : [] });
  }

  if (req.method === 'POST') {
    const parsed = await collectJsonBody(req, res);
    if (!parsed) return;

    const workflow = parsed && typeof parsed === 'object' ? parsed : null;
    if (!workflow?.id) {
      return sendJson(res, 400, { error: 'workflow id required' });
    }

    const current = Array.isArray(store[userId]) ? store[userId] : [];
    store[userId] = [workflow, ...current.filter((item) => item.id !== workflow.id)];
    await writeUserCollection(WORKFLOWS_FILE, store);
    return sendJson(res, 200, { ok: true, item: workflow });
  }

  return sendJson(res, 405, { error: 'method not allowed' });
}

async function handleWorkflowById(req, res, workflowId) {
  const userId = getUserId(req);
  const store = await readUserCollection(WORKFLOWS_FILE);
  const current = Array.isArray(store[userId]) ? store[userId] : [];

  if (req.method === 'DELETE') {
    store[userId] = current.filter((item) => item.id !== workflowId);
    await writeUserCollection(WORKFLOWS_FILE, store);
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 405, { error: 'method not allowed' });
}

async function handleWorkflowRun(req, res, workflowId) {
  const userId = getUserId(req);
  const store = await readUserCollection(WORKFLOW_RUNS_FILE);
  const currentRuns = store[userId] && typeof store[userId] === 'object' ? store[userId] : {};

  if (req.method === 'GET') {
    return sendJson(res, 200, { item: currentRuns[workflowId] || { fields: {}, steps: {} } });
  }

  if (req.method === 'PUT') {
    const parsed = await collectJsonBody(req, res);
    if (!parsed || typeof parsed !== 'object') {
      return sendJson(res, 400, { error: 'run payload required' });
    }
    store[userId] = {
      ...currentRuns,
      [workflowId]: parsed,
    };
    await writeUserCollection(WORKFLOW_RUNS_FILE, store);
    return sendJson(res, 200, { ok: true, item: parsed });
  }

  if (req.method === 'DELETE') {
    const nextRuns = { ...currentRuns };
    delete nextRuns[workflowId];
    store[userId] = nextRuns;
    await writeUserCollection(WORKFLOW_RUNS_FILE, store);
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 405, { error: 'method not allowed' });
}

function sanitizeFilename(name) {
  return String(name || 'file')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim() || 'file';
}

function runZipCommand(cwd, zipPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('zip', ['-r', zipPath, '.'], { cwd });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk || '');
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `zip exited with code ${code}`));
    });
  });
}

async function handleWorkflowBundle(req, res) {
  const parsed = await collectJsonBody(req, res);
  if (!parsed) return;

  const workflowName = sanitizeFilename(parsed.workflowName || '工作流备课包');
  const files = Array.isArray(parsed.files) ? parsed.files : [];

  if (files.length === 0) {
    return sendJson(res, 400, { error: 'files required' });
  }

  const tempRoot = await mkdtemp(join(tmpdir(), 'beike-workflow-'));
  const contentDir = join(tempRoot, 'bundle');
  const zipPath = join(tempRoot, `${workflowName}.zip`);

  try {
    await mkdir(contentDir, { recursive: true });

    const readmeLines = [
      `# ${parsed.workflowName || '工作流备课包'}`,
      '',
      '## 统一输入信息',
      '',
      ...Object.entries(parsed.formData || {}).map(([key, value]) => `- ${key}: ${String(value)}`),
      '',
      '## 文件清单',
      '',
      ...files.map((file, index) => `${index + 1}. ${file.filename}`),
      '',
    ];

    await writeFile(join(contentDir, 'README.md'), readmeLines.join('\n'), 'utf8');

    for (const file of files) {
      const filename = sanitizeFilename(file.filename || '未命名.md');
      await writeFile(join(contentDir, filename), String(file.content || ''), 'utf8');
    }

    await runZipCommand(contentDir, zipPath);
    const buffer = await readFile(zipPath);
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(workflowName)}.zip"`,
    });
    res.end(buffer);
  } catch (error) {
    console.error('Workflow bundle failed:', error.message);
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'bundle failed' });
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => {});
  }
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
  <title>反馈与工具统计</title>
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
        <h1 style="margin:0;font-size:28px">反馈与工具统计</h1>
        <div class="muted">隐藏后台页，输入口令后查看老师反馈、截图和工具使用情况</div>
      </div>
    </div>

    <div class="card">
      <h2 style="margin:0 0 8px">访问校验</h2>
      <div class="muted">这个页面不在导航中显示，只有口令正确时才会请求后台数据。</div>
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
      <div class="card">
        <div class="between" style="align-items:flex-start">
          <div>
            <div style="font-size:16px;font-weight:600;margin-bottom:6px">工具点击统计</div>
            <div class="muted">按工具详情页打开次数统计，方便后续判断哪些工具最常用。</div>
          </div>
          <div class="tag" id="usageTotal">总点击 0</div>
        </div>
        <div id="usageList" class="grid" style="margin-top:16px"></div>
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
    const usageTotalEl = document.getElementById('usageTotal');
    const usageListEl = document.getElementById('usageList');
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

    function renderUsage(stats){
      const tools = Object.values((stats && stats.tools) || {})
        .sort((a,b) => (b.openCount || 0) - (a.openCount || 0));
      usageTotalEl.textContent = '总点击 ' + (stats?.total || 0);
      usageListEl.innerHTML = tools.length ? tools.map((item, index) => {
        const time = item.lastOpenedAt ? new Date(item.lastOpenedAt).toLocaleString('zh-CN') : '暂无记录';
        return '<div class="card" style="padding:16px 18px"><div class="between"><div><div style="font-size:15px;font-weight:600;color:#0f172a">'+escapeHtml(item.toolName || item.toolId)+'</div><div class="muted" style="margin-top:4px">toolId: '+escapeHtml(item.toolId || '-')+'</div></div><div style="text-align:right"><div style="font-size:24px;font-weight:700;color:#2563eb">'+(item.openCount || 0)+'</div><div class="muted">第 '+(index + 1)+' 名</div></div></div><div class="muted" style="margin-top:10px">最近打开：'+escapeHtml(time)+'</div></div>';
      }).join('') : '<div class="card empty">还没有工具点击数据。</div>';
    }

    async function loadFeedback(){
      const token = tokenInput.value.trim();
      if(!token){ errorEl.textContent = '请输入访问口令'; return; }
      errorEl.textContent = '';
      loadBtn.disabled = true;
      loadBtn.textContent = '加载中...';
      try{
        const [feedbackResponse, usageResponse] = await Promise.all([
          fetch('/api/admin/feedback', { headers: { 'x-admin-token': token } }),
          fetch('/api/tool-usage', { headers: { 'x-admin-token': token } })
        ]);
        if(feedbackResponse.status === 401 || usageResponse.status === 401) throw new Error('访问口令不正确');
        if(!feedbackResponse.ok || !usageResponse.ok) throw new Error('加载失败，请稍后重试');
        const data = await feedbackResponse.json();
        const usage = await usageResponse.json();
        localStorage.setItem('feedback_admin_token', token);
        render(Array.isArray(data.items) ? data.items : []);
        renderUsage(usage || { total: 0, tools: {} });
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

function buildToolSeedPrompt(tool) {
  const fields = tool.fields.map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type,
    required: !!field.required,
    options: field.options || []
  }));

  const categoryHints = {
    '沟通写作': [
      '如果老师原话里已经明确说了“发给家长/学生/同事”“语气温和/正式/简洁”“想沟通的问题或事实”，这些都要尽量落到 recognized 里。',
      '像“课堂走神、作业拖延、阅读状态下滑、需要提醒带材料”这类具体情况，必须优先写入 content / key_facts / highlights 之类的内容字段，不能漏掉。',
      '如果老师同时说了语气和额外要求，可以把语气放进 tone，把“要把问题说清楚/更像班主任平时说的话/需要简短版”这类要求放进 special_needs。'
    ],
    '教学设计': [
      '老师原话里提到的年级、学科、教材版本、课题/单元、教学目标、课堂风格，都要尽量提取。',
      '如果老师已经说清“希望更生动/突出朗读/加强实验/加入合作活动”，不要再把这些内容放进缺失字段里追问。',
      '如果老师提到“学生基础一般/基础薄弱/愿意表达/班里学生差异大/课堂参与积极”等信息，尽量提取到 student_situation。',
      '如果老师提到“重点想抓……”“难点是……”“重难点在于……”这类表达，尽量提取到 key_difficult。',
      '如果老师提到“课堂提问、当堂练习、小组展示、任务单、出口卡、自评互评、小组汇报”等评价安排，尽量提取到 evaluation_method。',
      '如果老师提到“40分钟一课时、45分钟、2课时、两课时”等时长信息，尽量提取到 duration。'
    ],
    '练习命题': [
      '老师原话里提到的题型、题量、难度、适用年级或知识点，都要尽量识别。',
      '像“做几题”“偏基础/提升”“围绕某段材料出题”这类信息要优先写入 recognized。'
    ],
    '反馈评价': [
      '如果老师已经给出了优点、不足、评价对象、评价标准，这些都要直接拆到对应字段。',
      '像学生评语、作文反馈这类工具，老师原话里的“鼓励一点/别太模板化/指出努力方向”也可以写入风格或特殊要求字段。'
    ],
    '学生支持': [
      '老师描述中的学生优势、当前困难、支持方向、情绪或学习表现，尽量拆入对应字段。',
      '像“愿意参与但作业拖延”“情绪波动大”“基础薄弱但愿意配合”这类完整情况，必须优先落到 recognized。'
    ]
  };

  const hintText = categoryHints[tool.category]?.length
    ? `\n分类提示：\n${categoryHints[tool.category].map((line, index) => `${index + 1}. ${line}`).join('\n')}\n`
    : '';

  return `你是教学工具的意图拆解助手。请把老师一句自然描述拆成“硬约束”和“软建议”。

工具名称：${tool.name}
工具字段：
${JSON.stringify(fields, null, 2)}
${hintText}

请只返回 JSON：
{
  "message": "一句简短确认",
  "recognized": {
    "字段key": "已识别值"
  },
  "explicitFieldKeys": ["老师原话里明确说过的字段key"],
  "inferredFieldKeys": ["AI根据常识推断的字段key"],
  "candidateFieldOptions": {
    "字段key": ["当某个 select 字段可能有多个候选标准值时返回候选列表"]
  },
  "hardFieldKeys": ["需要优先确认的字段key"],
  "optionalFieldKeys": ["仍可补充但不是必须的字段key"],
  "suggestions": [
    {
      "fieldKey": "适合给建议的字段key",
      "label": "给老师看的短标签",
      "value": "建议值"
    }
  ],
  "slotSummary": [
    {
      "label": "给老师看的摘要标签",
      "value": "AI已理解的信息",
      "source": "explicit/inferred"
    }
  ]
}

要求：
1. recognized 里要尽量吃满老师已经明确说过的信息，尤其是 textarea/text 类型字段，不要漏掉老师已经说清的内容。
2. explicitFieldKeys 只放老师原话里明确说过的字段；inferredFieldKeys 只放 AI 猜测或归纳的字段。
3. 对 select 字段：如果你能唯一确定标准值，直接写进 recognized；如果只能缩小到 2-4 个候选标准值，就写进 candidateFieldOptions，不要乱填 recognized。
4. hardFieldKeys 只能保留真正还缺、且会影响生成质量的必填字段。老师已经说过的内容绝对不要再放进去。
5. optionalFieldKeys 只放可选增强字段；如果老师已经说过同类信息，不要再放。
6. 软建议优先针对教学目标、重难点、题量、难度、输出形式这类可由 AI 猜测的内容。
7. suggestions 返回 2-4 条即可，短小、可直接点击；不能和 explicitFieldKeys 重复。
8. slotSummary 要用老师看得懂的话总结“你已经理解了什么”，不要只是复述字段名。`;
}

function buildWorkflowSeedPrompt(workflow) {
  const commonFields = [
    { key: 'grade', label: '年级' },
    { key: 'subject', label: '学科' },
    { key: 'textbookVersion', label: '教材版本' },
    { key: 'unitName', label: '单元名称或课题' },
    { key: 'seedContext', label: '老师原始描述' }
  ];

  return `你是教学工作流的启动助手。请从老师一句大白话需求里拆出公共参数，并给出 3 条简短、可点选的“教学目标建议”。

工作流名称：${workflow.name}
工作流描述：${workflow.description}
公共字段：
${JSON.stringify(commonFields, null, 2)}

请只返回 JSON：
{
  "message": "一句简短确认",
  "recognized": {
    "grade": "",
    "subject": "",
    "textbookVersion": "",
    "unitName": "",
    "seedContext": ""
  },
  "explicitFieldKeys": [],
  "inferredFieldKeys": [],
  "slotSummary": [
    {
      "label": "给老师看的摘要标签",
      "value": "已经识别到的信息",
      "source": "explicit/inferred"
    }
  ],
  "suggestedObjectives": ["", "", ""]
}

要求：
1. grade 只写“几年级/初几/高几”这种形式。
2. subject 只写学科名，如“语文”“数学”。
3. unitName 可写课题或单元名，尽量从原话提取。
4. textbookVersion 没提到就留空。
5. seedContext 保留老师原始意图，用自然中文概括即可。
6. 老师原话里明确说过的内容，尽量直接放进 recognized，不要故意留空等追问。
7. explicitFieldKeys 只放老师原话里明确说过的字段；inferredFieldKeys 只放根据常识补出的字段。
8. slotSummary 要像在确认“我已经知道这些了”，不要太 AI。
9. suggestedObjectives 要像老师会点选的短句，不要太长。`;
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

function buildChatCompletionsUrl(baseUrl) {
  const normalized = normalizeBaseUrl(baseUrl);
  if (normalized.endsWith('/v1')) {
    return `${normalized}/chat/completions`;
  }
  return `${normalized}/v1/chat/completions`;
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
      const response = await fetch(buildChatCompletionsUrl(provider.baseUrl), {
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

async function streamNormalizedContent(upstream, res) {
  const contentType = upstream.headers.get('content-type') || '';

  if (!upstream.ok || !upstream.body) {
    const fallbackText = await upstream.text();
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: fallbackText || '' } }] })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
    return;
  }

  if (!contentType.includes('text/event-stream')) {
    const text = await upstream.text();
    let content = text;
    try {
      const parsed = JSON.parse(text);
      content =
        parsed?.choices?.[0]?.message?.content ||
        parsed?.choices?.[0]?.delta?.content ||
        parsed?.content ||
        text;
    } catch {}
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: content || '' } }] })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
    return;
  }

  const decoder = new TextDecoder();
  let pending = '';

  for await (const chunk of upstream.body) {
    pending += decoder.decode(typeof chunk === 'string' ? Buffer.from(chunk) : chunk, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (!data) continue;

      if (data === '[DONE]') {
        if (!res.writableEnded) {
          res.write('data: [DONE]\n\n');
          res.end();
        }
        return;
      }

      try {
        const parsed = JSON.parse(data);
        const delta = parsed?.choices?.[0]?.delta || {};
        const content = delta.content;
        if (!content) continue;
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
      } catch {}
    }
  }

  if (pending.trim().startsWith('data: ')) {
    const data = pending.trim().slice(6);
    if (data && data !== '[DONE]') {
      try {
        const parsed = JSON.parse(data);
        const content = parsed?.choices?.[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
        }
      } catch {}
    }
  }

  if (!res.writableEnded) {
    res.write('data: [DONE]\n\n');
    res.end();
  }
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

async function handleWorkflowSeedAnalyze(req, res) {
  const parsed = await collectJsonBody(req, res);
  if (!parsed) return;

  const workflow = { name: String(parsed.workflowName || '教学工作流').trim(), description: String(parsed.workflowDescription || '').trim() };
  const message = String(parsed.message || '').trim();

  if (!message) {
    return sendJson(res, 400, { error: 'message required' });
  }

  try {
    const upstream = await postToModel({
      stream: true,
      messages: [
        { role: 'system', content: buildWorkflowSeedPrompt(workflow) },
        { role: 'user', content: message }
      ]
    }, { mode: 'analyze' });
    const text = await readStreamingText(upstream);
    const result = extractJsonObject(text) || {
      message: '我先帮你拆出了一版基础信息。',
      recognized: { grade: '', subject: '', textbookVersion: '', unitName: '', seedContext: message },
      explicitFieldKeys: [],
      inferredFieldKeys: [],
      slotSummary: [],
      suggestedObjectives: []
    };
    return sendJson(res, 200, result);
  } catch (err) {
    console.error('Workflow seed analyze failed:', err.message);
    return sendJson(res, 500, { error: 'workflow seed analyze failed' });
  }
}

async function handleToolSeedAnalyze(req, res) {
  const parsed = await collectJsonBody(req, res);
  if (!parsed) return;

  const tool = getToolById(String(parsed.toolId || '').trim());
  const message = String(parsed.message || '').trim();

  if (!tool || !message) {
    return sendJson(res, 400, { error: 'toolId and message required' });
  }

  try {
    const upstream = await postToModel({
      stream: true,
      messages: [
        { role: 'system', content: buildToolSeedPrompt(tool) },
        { role: 'user', content: message }
      ]
    }, { toolId: tool.id, mode: 'analyze' });
    const text = await readStreamingText(upstream);
    const result = extractJsonObject(text) || {
      message: '我先帮你锁定了基础信息。',
      recognized: {},
      explicitFieldKeys: [],
      inferredFieldKeys: [],
      candidateFieldOptions: {},
      hardFieldKeys: [],
      optionalFieldKeys: [],
      slotSummary: [],
      suggestions: []
    };
    return sendJson(res, 200, result);
  } catch (err) {
    console.error('Tool seed analyze failed:', err.message);
    return sendJson(res, 500, { error: 'tool seed analyze failed' });
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

  res.writeHead(upstream.ok ? 200 : upstream.status, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  try {
    await streamNormalizedContent(upstream, res);
  } catch (err) {
    console.error('Generate stream error:', err.message);
  }
  if (!res.writableEnded) res.end();
}

async function handleReviseBlock(req, res) {
  const parsed = await collectJsonBody(req, res);
  if (!parsed) return;

  const tool = getToolById(String(parsed.toolId || '').trim());
  const formData = parsed.formData && typeof parsed.formData === 'object' ? parsed.formData : {};
  const fullContent = String(parsed.fullContent || '').trim();
  const selectedBlock = String(parsed.selectedBlock || '').trim();
  const instruction = String(parsed.instruction || '').trim();

  if (!tool || !selectedBlock || !instruction) {
    return sendJson(res, 400, { error: 'toolId, selectedBlock and instruction required' });
  }

  const systemPrompt = `${buildSystemPrompt(tool)}

你现在还承担一个“局部改写助手”的角色。
请只改写老师选中的这一段，不要重写整篇，不要补充与这一段无关的内容。
保持与原文整体风格、术语、年级语境一致。
如果老师要求“更简单”“更适合学生理解”，请优先降低表达难度、增强清晰度和可教性。
输出时只返回改写后的这一段正文，不要加标题、解释、引号或额外说明。`;

  const userPrompt = [
    `工具名称：${tool.name}`,
    '以下是整篇内容，供你理解上下文：',
    fullContent || '（未提供整篇内容）',
    '',
    '老师选中的原段落：',
    selectedBlock,
    '',
    '老师的修改要求：',
    instruction,
    '',
    '请只输出改写后的这一段。'
  ].join('\n');

  try {
    const upstream = await postToModel({
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    }, { toolId: tool.id, mode: 'generate' });
    const revisedText = (await readStreamingText(upstream)).trim();
    return sendJson(res, 200, {
      revisedBlock: sanitizeServerText(revisedText || selectedBlock)
    });
  } catch (err) {
    console.error('Revise block failed:', err.message);
    return sendJson(res, 500, { error: 'revise block failed' });
  }
}

function sanitizeServerText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/^```[a-zA-Z]*\n?/g, '')
    .replace(/\n?```$/g, '')
    .trim();
}

const server = http.createServer((req, res) => {
  const pathname = (req.url || '').split('?')[0];
  const workflowDetailMatch = pathname.match(/^\/api\/workflows\/([^/]+)$/);
  const workflowRunMatch = pathname.match(/^\/api\/workflow-runs\/([^/]+)$/);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-token, x-beike-user-id',
    });
    return res.end();
  }
  if (req.method === 'POST' && req.url === '/api/tools/analyze') {
    handleAnalyze(req, res).catch(err => {
      console.error('Analyze handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'analyze failed' });
    });
  } else if (req.method === 'POST' && req.url === '/api/tools/seed-analyze') {
    handleToolSeedAnalyze(req, res).catch(err => {
      console.error('Tool seed analyze handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'tool seed analyze failed' });
    });
  } else if (req.method === 'POST' && req.url === '/api/workflows/seed-analyze') {
    handleWorkflowSeedAnalyze(req, res).catch(err => {
      console.error('Workflow seed analyze handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'workflow seed analyze failed' });
    });
  } else if (req.method === 'POST' && req.url === '/api/tools/generate') {
    handleGenerate(req, res).catch(err => {
      console.error('Generate handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'generate failed' });
      if (!res.writableEnded) res.end();
    });
  } else if (req.method === 'POST' && req.url === '/api/tools/revise-block') {
    handleReviseBlock(req, res).catch(err => {
      console.error('Revise block handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'revise block failed' });
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
  } else if (pathname === '/api/workflows' && (req.method === 'GET' || req.method === 'POST')) {
    handleWorkflows(req, res).catch(err => {
      console.error('Workflows handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'workflows failed' });
    });
  } else if (workflowDetailMatch && req.method === 'DELETE') {
    handleWorkflowById(req, res, decodeURIComponent(workflowDetailMatch[1])).catch(err => {
      console.error('Workflow detail handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'workflow delete failed' });
    });
  } else if (workflowRunMatch && ['GET', 'PUT', 'DELETE'].includes(req.method || '')) {
    handleWorkflowRun(req, res, decodeURIComponent(workflowRunMatch[1])).catch(err => {
      console.error('Workflow run handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'workflow run failed' });
    });
  } else if (pathname === '/api/workflow-bundles' && req.method === 'POST') {
    handleWorkflowBundle(req, res).catch(err => {
      console.error('Workflow bundle handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'workflow bundle failed' });
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
