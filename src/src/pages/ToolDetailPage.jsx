import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  ArrowLeft,
  Send,
  Loader2,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Settings,
  Save,
  Clock,
  Sparkles,
  MessageSquare,
  Check,
  X,
  Brain,
  FileText,
  FileCode,
  File,
  GitBranch,
} from 'lucide-react'
import { getToolById } from '../data/tools'
import { getWorkflowRun, syncWorkflowRunFromServer, updateWorkflowRun } from '../data/workflows'

const countTableDelimiters = (line) => (line.match(/(?<!\\)\|/g) || []).length

const getTableCells = (line) => {
  let normalized = line
    .replace(/\\\|/g, '|')
    .replace(/\s*\\\s*(?=\|)/g, ' ')
    .replace(/\s*\\\s*$/g, '')
    .trim()

  if (!normalized.startsWith('|')) return null

  const delimiterCount = countTableDelimiters(normalized)
  if (delimiterCount < 2) return null

  if (!normalized.startsWith('|')) normalized = `| ${normalized}`
  if (!normalized.endsWith('|')) normalized = `${normalized} |`

  const cells = normalized
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean)

  return cells.length >= 2 ? cells : null
}

const normalizeTableBlock = (rows) => {
  if (rows.length < 2) return rows

  const normalizedRows = rows.map((row) => {
    const cells = getTableCells(row)
    if (!cells) return row.trim()
    return `| ${cells.join(' | ')} |`
  })

  const secondRowCells = getTableCells(normalizedRows[1])
  const isSeparatorRow = secondRowCells?.every((cell) => /^:?-{3,}:?$/.test(cell))

  if (isSeparatorRow) return normalizedRows

  const headerCells = getTableCells(normalizedRows[0]) || []
  const separatorRow = `| ${headerCells.map(() => '---').join(' | ')} |`
  return [normalizedRows[0], separatorRow, ...normalizedRows.slice(1)]
}

const normalizeGeneratedMarkdown = (text) => {
  const lines = text.split('\n')
  const normalizedLines = []
  let tableBuffer = []

  const flushTableBuffer = () => {
    if (!tableBuffer.length) return
    if (tableBuffer.length >= 2) {
      normalizedLines.push(...normalizeTableBlock(tableBuffer))
    } else {
      normalizedLines.push(tableBuffer[0].trim())
    }
    tableBuffer = []
  }

  lines.forEach((rawLine) => {
    const line = rawLine
      .trimEnd()
      .replace(/\s*\\+\s*$/g, '')
      .replace(/\s+\|\s*$/g, '')
    const isCandidateTableRow = !!getTableCells(line)

    if (isCandidateTableRow) {
      tableBuffer.push(line)
      return
    }

    flushTableBuffer()
    if (line === '|' || line === '\\') return
    normalizedLines.push(line)
  })

  flushTableBuffer()

  return normalizedLines
    .join('\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const replaceFormMarkup = (text) => text
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/<input[^>]*type=['"]checkbox['"][^>]*checked[^>]*\/?>/gi, '☑ ')
  .replace(/<input[^>]*type=['"]checkbox['"][^>]*\/?>/gi, '□ ')
  .replace(/<input[^>]*type=['"]radio['"][^>]*checked[^>]*\/?>/gi, '◉ ')
  .replace(/<input[^>]*type=['"]radio['"][^>]*\/?>/gi, '○ ')
  .replace(/<input[^>]*type=['"]text['"][^>]*value=['"]([^'"]*)['"][^>]*\/?>/gi, '[$1]')
  .replace(/<input[^>]*type=['"]text['"][^>]*placeholder=['"]([^'"]*)['"][^>]*\/?>/gi, '[$1]')
  .replace(/<textarea[^>]*placeholder=['"]([^'"]*)['"][^>]*><\/textarea>/gi, '\n[$1]\n')
  .replace(/<textarea[^>]*>([\s\S]*?)<\/textarea>/gi, '\n$1\n')
  .replace(/<button[^>]*>([\s\S]*?)<\/button>/gi, '$1')
  .replace(/<label[^>]*>([\s\S]*?)<\/label>/gi, '$1')
  .replace(/<option[^>]*>([\s\S]*?)<\/option>/gi, '- $1\n')
  .replace(/<select[^>]*>/gi, '\n')
  .replace(/<\/select>/gi, '\n')
  .replace(/<form[^>]*>/gi, '\n')
  .replace(/<\/form>/gi, '\n')
  .replace(/<input[^>]*\/?>/gi, '')

const sanitizeGeneratedResult = (text) => {
  if (!text) return ''

  let cleaned = text.replace(/\r\n/g, '\n').trimStart()

  cleaned = replaceFormMarkup(cleaned)

  // 先处理 HTML 实体
  cleaned = cleaned.replace(/&amp;/gi, '&')
  cleaned = cleaned.replace(/&lt;/gi, '<')
  cleaned = cleaned.replace(/&gt;/gi, '>')
  cleaned = cleaned.replace(/&nbsp;/gi, ' ')
  cleaned = cleaned.replace(/&quot;/gi, '"')
  cleaned = cleaned.replace(/&#39;/gi, "'")
  cleaned = cleaned.replace(/&ldquo;/gi, '"')
  cleaned = cleaned.replace(/&rdquo;/gi, '"')
  cleaned = cleaned.replace(/&lsquo;/gi, "'")
  cleaned = cleaned.replace(/&rsquo;/gi, "'")
  cleaned = cleaned.replace(/&mdash;/gi, '——')
  cleaned = cleaned.replace(/&ndash;/gi, '–')
  cleaned = replaceFormMarkup(cleaned)

  // 处理换行类标签
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n')
  cleaned = cleaned.replace(/<\/p>/gi, '\n')
  cleaned = cleaned.replace(/<p[^>]*>/gi, '\n')
  cleaned = cleaned.replace(/<\/div>/gi, '\n')
  cleaned = cleaned.replace(/<div[^>]*>/gi, '\n')

  // 处理标题标签
  cleaned = cleaned.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
  cleaned = cleaned.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
  cleaned = cleaned.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
  cleaned = cleaned.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n')
  cleaned = cleaned.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n')
  cleaned = cleaned.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n')

  // 处理文本样式标签
  cleaned = cleaned.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**')
  cleaned = cleaned.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*')
  cleaned = cleaned.replace(/<(u)[^>]*>(.*?)<\/(u)>/gi, '$2')
  cleaned = cleaned.replace(/<(s|strike|del)[^>]*>(.*?)<\/(s|strike|del)>/gi, '~~$2~~')
  cleaned = cleaned.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1')

  // 处理列表标签
  cleaned = cleaned.replace(/<ul[^>]*>/gi, '\n')
  cleaned = cleaned.replace(/<\/ul>/gi, '\n')
  cleaned = cleaned.replace(/<ol[^>]*>/gi, '\n')
  cleaned = cleaned.replace(/<\/ol>/gi, '\n')
  cleaned = cleaned.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')

  // 处理引用标签
  cleaned = cleaned.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n> $1\n')

  // 处理代码标签
  cleaned = cleaned.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '\n```\n$1\n```\n')
  cleaned = cleaned.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')

  // 处理表格标签
  cleaned = cleaned.replace(/<table[^>]*>/gi, '\n')
  cleaned = cleaned.replace(/<\/table>/gi, '\n')
  cleaned = cleaned.replace(/<thead[^>]*>/gi, '')
  cleaned = cleaned.replace(/<\/thead>/gi, '')
  cleaned = cleaned.replace(/<tbody[^>]*>/gi, '')
  cleaned = cleaned.replace(/<\/tbody>/gi, '')
  cleaned = cleaned.replace(/<tr[^>]*>/gi, '\n| ')
  cleaned = cleaned.replace(/<\/tr>/gi, ' |')
  cleaned = cleaned.replace(/<(th|td)[^>]*>(.*?)<\/(th|td)>/gi, ' $2 |')

  // 处理链接和图片标签
  cleaned = cleaned.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  cleaned = cleaned.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
  cleaned = cleaned.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)')

  // 处理分隔线
  cleaned = cleaned.replace(/<hr\s*\/?>/gi, '\n---\n')

  // 移除其他未处理的HTML标签
  cleaned = cleaned.replace(/<[^>]+>/g, '')

  // 清理多余的空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  return normalizeGeneratedMarkdown(cleaned)
}

const escapeHtml = (text) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const formatInlineMarkdown = (text) => {
  let html = replaceFormMarkup(text)

  // 处理 HTML 标签
  html = html.replace(/<br\s*\/?>/gi, '\n')
  html = html.replace(/<\/?p>/gi, '\n')
  html = html.replace(/<\/?div>/gi, '\n')
  html = html.replace(/<\/?span>/gi, '')

  // 处理行内代码
  const codeBlocks = []
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    const index = codeBlocks.length
    codeBlocks.push(`<code>${escapeHtml(code)}</code>`)
    return `__CODE_${index}__`
  })

  // 处理图片
  const images = []
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    const index = images.length
    images.push(`<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" />`)
    return `__IMG_${index}__`
  })

  // 处理链接
  const links = []
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    const index = links.length
    links.push(`<a href="${escapeHtml(url)}" target="_blank">${escapeHtml(text)}</a>`)
    return `__LINK_${index}__`
  })

  // 转义 HTML
  html = escapeHtml(html)

  // 处理加粗
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')

  // 处理斜体
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>')

  // 处理删除线
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')

  // 恢复链接、图片、代码块
  links.forEach((link, index) => {
    html = html.replace(`__LINK_${index}__`, link)
  })
  images.forEach((img, index) => {
    html = html.replace(`__IMG_${index}__`, img)
  })
  codeBlocks.forEach((code, index) => {
    html = html.replace(`__CODE_${index}__`, code)
  })

  return html
}

const markdownToHtml = (markdown) => {
  if (!markdown) return ''

  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let paragraph = []
  let listType = null
  let listItems = []
  let tableRows = []
  let inTable = false
  let inCodeBlock = false
  let codeBlockLines = []
  let codeBlockLang = ''

  const flushParagraph = () => {
    if (!paragraph.length) return
    const formattedLines = paragraph.map(line => formatInlineMarkdown(line))
    blocks.push(`<p>${formattedLines.join('\n')}</p>`)
    paragraph = []
  }

  const flushList = () => {
    if (!listItems.length || !listType) return
    const tag = listType === 'ol' ? 'ol' : 'ul'
    blocks.push(`<${tag}>${listItems.map(item => `<li>${formatInlineMarkdown(item)}</li>`).join('')}</${tag}>`)
    listItems = []
    listType = null
  }

  const flushTable = () => {
    if (tableRows.length === 0) return
    if (tableRows.length < 2) {
      blocks.push(`<p>${tableRows.map((row) => formatInlineMarkdown(row)).join('\n')}</p>`)
      tableRows = []
      inTable = false
      return
    }
    let html = '<table>'
    tableRows.forEach((row, index) => {
      const cells = (getTableCells(row) || [])
        .map((cell) => formatInlineMarkdown(cell))
      if (cells.length === 0) return
      const tag = index === 0 ? 'th' : 'td'
      const cellHtml = cells.map(c => `<${tag}>${c}</${tag}>`).join('')
      html += `<tr>${cellHtml}</tr>`
    })
    html += '</table>'
    blocks.push(html)
    tableRows = []
    inTable = false
  }

  const flushCodeBlock = () => {
    if (codeBlockLines.length === 0) return
    const code = codeBlockLines.join('\n')
    blocks.push(`<pre><code class="language-${codeBlockLang}">${escapeHtml(code)}</code></pre>`)
    codeBlockLines = []
    codeBlockLang = ''
    inCodeBlock = false
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.trim()

    // 处理代码块
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        flushParagraph()
        flushList()
        flushTable()
        inCodeBlock = true
        codeBlockLang = line.slice(3).trim()
        continue
      } else {
        flushCodeBlock()
        continue
      }
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine)
      continue
    }

    if (!line) {
      flushParagraph()
      flushList()
      flushTable()
      continue
    }

    // 检测表格行
    if (getTableCells(line)) {
      if (/^\|[\s\-:|]+\|$/.test(line) || /^[\s\-:|]+$/.test(line.replace(/\|/g, ''))) {
        continue
      }
      flushParagraph()
      flushList()
      inTable = true
      tableRows.push(line)
      continue
    }

    if (inTable) {
      flushTable()
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      blocks.push(`<h${level}>${formatInlineMarkdown(heading[2])}</h${level}>`)
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(line)) {
      flushParagraph()
      flushList()
      blocks.push('<hr />')
      continue
    }

    // 任务列表
    const taskItem = line.match(/^[-*]\s+\[([ x])\]\s+(.+)$/i)
    if (taskItem) {
      flushParagraph()
      if (listType && listType !== 'ul') flushList()
      listType = 'ul'
      const marker = taskItem[1].toLowerCase() === 'x' ? '☑' : '□'
      listItems.push(`${marker} ${taskItem[2]}`)
      continue
    }

    const orderedItem = line.match(/^\d+\.\s+(.+)$/)
    if (orderedItem) {
      flushParagraph()
      if (listType && listType !== 'ol') flushList()
      listType = 'ol'
      listItems.push(orderedItem[1])
      continue
    }

    const unorderedItem = line.match(/^[-*]\s+(.+)$/)
    if (unorderedItem) {
      flushParagraph()
      if (listType && listType !== 'ul') flushList()
      listType = 'ul'
      listItems.push(unorderedItem[1])
      continue
    }

    const quote = line.match(/^>\s?(.+)$/)
    if (quote) {
      flushParagraph()
      flushList()
      blocks.push(`<blockquote>${formatInlineMarkdown(quote[1])}</blockquote>`)
      continue
    }

    if (listType) flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()
  flushTable()
  flushCodeBlock()
  return blocks.join('')
}

const splitResultBlocks = (markdown) => {
  if (!markdown) return []

  return markdown
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => ({
      id: `block-${index}`,
      content: block
    }))
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const buildExportHtml = (title, content) => `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; color: #1e293b; line-height: 1.8; padding: 32px; max-width: 800px; margin: 0 auto; }
      h1, h2, h3, h4, h5, h6 { color: #0f172a; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.8em; }
      h1 { font-size: 1.75em; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.4em; }
      h2 { font-size: 1.4em; }
      h3 { font-size: 1.2em; }
      p { margin: 0.8em 0; }
      ul, ol { margin: 1em 0 1em 1.5em; padding: 0; }
      li { margin: 0.5em 0; line-height: 1.7; }
      blockquote { margin: 1.2em 0; padding: 1em 1.2em; border-left: 4px solid #3b82f6; background: #eff6ff; color: #1e40af; border-radius: 0 8px 8px 0; }
      code { display: inline-block; padding: 0.15em 0.4em; border-radius: 4px; background: #f1f5f9; color: #0f172a; font-size: 0.9em; font-family: "Courier New", monospace; }
      pre { background: #1e293b; color: #e2e8f0; padding: 1em; border-radius: 8px; overflow-x: auto; margin: 1em 0; }
      pre code { background: none; color: inherit; padding: 0; }
      table { width: 100%; border-collapse: collapse; margin: 1.2em 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
      th, td { border: 1px solid #e2e8f0; padding: 0.75em 1em; text-align: left; vertical-align: top; }
      th { background: #f8fafc; color: #0f172a; font-weight: 600; }
      hr { border: none; border-top: 2px solid #e2e8f0; margin: 1.5em 0; }
      strong { color: #0f172a; font-weight: 600; }
      em { font-style: italic; color: #475569; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    ${markdownToHtml(content)}
  </body>
</html>`

const readStreamingText = async (response) => {
  if (!response.ok || !response.body) {
    throw new Error(`请求失败：${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    const chunk = decoder.decode(value || new Uint8Array(), { stream: !done })
    pending += chunk
    const lines = pending.split('\n')
    pending = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) fullText += content
      } catch {}
    }

    if (done) {
      if (pending.startsWith('data: ')) {
        const data = pending.slice(6)
        if (data && data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) fullText += content
          } catch {}
        }
      }
      break
    }
  }

  return fullText
}

const extractJsonObject = (text) => {
  if (!text) return null
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i)
  const raw = fenced?.[1] || text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

const buildInitialFormData = (tool, prefill = {}) => {
  const initialData = {}
  tool.fields.forEach((field) => {
    initialData[field.key] = prefill[field.key] ?? field.default ?? (field.type === 'toggle' ? false : '')
  })
  return initialData
}

const shuffleList = (items) => [...items].sort(() => Math.random() - 0.5)

const FIELD_PROMPT_BANK = {
  grade_subject: ['五年级语文', '三年级数学', '初二物理', '高一英语', '七年级历史', '六年级科学'],
  grade: ['三年级', '五年级', '初一', '初二', '高一'],
  textbook_version: ['部编版', '人教版'],
  topic: ['《慈母情深》', '分数的初步认识', '光的反射', '背影', '一次函数', '校园消防安全'],
  unit_name: ['三年级上册第一单元', '第六单元', '光现象', '分数单元', '阅读策略单元'],
  project_topic: ['校园节水行动', '家乡文化小研究', '班级阅读节策划'],
  lesson_topic: ['勾股定理', '背影', '分数应用'],
  teaching_objectives: ['突出朗读体验和情感理解', '让学生能说清知识点并学会迁移', '希望课堂更生动、任务更清晰'],
  unit_goals: ['梳理单元目标、课时安排和评价节点', '兼顾知识落实和核心素养发展'],
  talk_focus: ['重点讲清教材处理和学生活动设计', '希望说课稿更适合校内展示'],
  group_goal: ['让小组讨论更有分工，最后能有成果展示', '突出合作探究和课堂参与'],
  resources: ['学校现有常规器材就行，注意安全提醒', '尽量用教室里容易准备的材料'],
  training_theme: ['核心素养导向课堂设计', '作业分层设计'],
  audience: ['家长', '班主任', '学生', '全体教师', '校内师生'],
  purpose: ['通知', '回复', '反馈', '邀请'],
  content: ['最近孩子作业拖延比较明显，想和家长沟通配合方式', '想提醒家长关注孩子课堂状态和作业完成情况'],
  comm_type: ['通知', '家长信', '学习建议'],
  special_needs: ['语气温和一点，不要太生硬', '希望更像班主任平时真实会说的话'],
  exercise_type: ['随堂练习', '课后作业', '单元检测'],
  question_type: ['阅读题', '填空题', '简答题', '混合题型'],
  question_count: ['5题', '8题', '10题', '15题'],
  difficulty: ['基础', '适中', '提升'],
  cognitive_levels: ['理解+应用', '应用+分析'],
  source_text: ['我会贴一段课文节选，想围绕它出题', '我有一段阅读材料，想直接转成课堂任务'],
  video_summary: ['一段关于消防逃生的短视频', '一个介绍光合作用的科普视频'],
  data_source: ['一次班级阅读习惯调查结果', '一张关于家庭用电的统计表'],
  task_goal: ['想训练学生读图、比较和表达结论', '希望学生能从数据里发现规律并提出解释'],
  student_situation: ['学生课堂注意力不集中，作业也拖延', '学生基础薄弱，但愿意配合，缺少方法', '最近情绪波动比较明显，和同伴相处有点紧张'],
  student_strengths: ['表达欲强，愿意参与课堂互动', '动手能力不错，也愿意接受提醒', '有责任心，和熟悉同学相处比较自然'],
  support_type: ['学困生辅导', '心理疏导', '成长规划'],
  student_name: ['小明', '李想', '王悦'],
  strengths: ['课堂积极发言，乐于帮助同学', '做事认真，值日有责任心'],
  improvements: ['作业完成质量还需提升', '课堂专注度还不够稳定'],
  exam_name: ['初三语文月考', '八年级数学单元测', '五年级英语随堂测'],
  student_issues: ['作文审题不准，文言文失分多', '计算错误多，压轴题思路不清', '阅读理解抓不住关键信息'],
  evaluation_content: ['一篇五年级习作', '一份学生实验报告', '一次课堂展示记录'],
  evaluation_criteria: ['重点看内容、结构和语言表达', '重点看任务完成度、思路和规范性'],
  feedback_type: ['优点与建议', '量规评价', '评语'],
  language_style: ['鼓励性', '客观型', '教师批注型'],
  bot_role: ['初中语文阅读助教', '小学数学错题讲解助手', '英语口语陪练老师'],
  theme_scope: ['阅读理解、作文训练和古诗文积累', '分层练习、错题复盘和方法点拨'],
  response_style: ['启发式', '严谨清晰', '鼓励式'],
  event_name: ['校园读书节', '消防安全宣传周', '科技节成果展'],
  event_details: ['想写一段能发到家长群和公众号的活动文案', '需要把活动亮点、时间和参与方式写清楚'],
  tone: ['正式宣传', '热情号召', '简洁海报文案'],
  class_name: ['三年级2班', '七年级1班'],
  time_range: ['第5周', '3月班级通讯'],
  highlights: ['本周班级活动、学习重点和家长提醒', '最近的班级亮点和后续安排'],
}

const TOOL_SCENARIO_OVERRIDES = {
  'parent-communication': [
    '孩子最近课堂走神和作业拖延比较明显，帮我写一段发给家长的话，语气温和但要把问题说清楚。',
    '想和家长沟通孩子最近阅读状态下滑的问题，最好给出可以在家配合的建议。',
    '班里一个学生最近情绪波动大，想先和家长做一次比较柔和的沟通。',
    '我要给家长发一段学习建议，重点讲作业习惯和复习节奏。'
  ],
  'student-support': [
    '一个三年级学生课堂愿意参与，但作业总拖延，帮我做一份学困生辅导支持方案。',
    '一个初一学生最近情绪起伏比较大，想做一份偏心理支持的个别化建议。',
    '学生有表达欲，也愿意互动，但学习方法比较乱，帮我做成长规划方向的支持方案。',
    '想给一个基础薄弱但愿意配合的学生做一份可执行的学习支持建议。'
  ],
  'student-comment': [
    '给三年级学生小明写一段期末综合素质评语，优点是乐于帮助同学，改进点是作业质量还要提升。',
    '帮我写一段更有温度的学生评语，适合五年级，既写优点也点出努力方向。',
    '我想给一个课堂积极但有时粗心的学生写综合评语，语气鼓励一点。',
    '帮我生成一段不空泛的学生评语，要像班主任真正会写的。'
  ],
}

const buildPromptFromScenario = (tool, scenario) => {
  const keys = tool.fields.filter((field) => !field.isAdvanced).map((field) => field.key)
  const detailParts = []

  if (scenario.grade_subject && keys.includes('grade_subject')) detailParts.push(scenario.grade_subject)
  if (scenario.grade && keys.includes('grade')) detailParts.push(scenario.grade)
  if (scenario.textbook_version && keys.includes('textbook_version')) detailParts.push(scenario.textbook_version)
  if (scenario.unit_name && keys.includes('unit_name')) detailParts.push(scenario.unit_name)
  if (scenario.topic && keys.includes('topic')) detailParts.push(scenario.topic)
  if (scenario.lesson_topic && keys.includes('lesson_topic')) detailParts.push(scenario.lesson_topic)
  if (scenario.project_topic && keys.includes('project_topic')) detailParts.push(scenario.project_topic)

  const prefix = detailParts.length > 0 ? `${detailParts.join('，')}，` : ''

  switch (tool.category) {
    case '教学设计':
      return `${prefix}帮我生成一份${tool.name}，${scenario.teaching_objectives || '希望目标清晰、课堂活动自然、能直接拿去用'}。`
    case '教学内容':
      return `${prefix}我想做一份${tool.name}，${scenario.teaching_objectives || '内容要贴近课堂使用，学生读起来不吃力'}。`
    case '练习命题':
      return `${prefix}帮我生成一份${tool.name}，${scenario.question_type || '题型尽量丰富'}，${scenario.difficulty || '难度适中'}。`
    case '差异化教学':
      return `${prefix}我想做一份${tool.name}，${scenario.student_situation || '要兼顾基础学生和需要拔高的学生'}。`
    case '反馈评价':
      if (keys.includes('student_name')) {
        return `${scenario.grade || '三年级'}学生${scenario.student_name || '小明'}，优点是${scenario.strengths || '课堂积极'}，不足是${scenario.improvements || '作业质量还要提升'}，帮我生成一份${tool.name}。`
      }
      if (keys.includes('exam_name')) {
        return `${scenario.exam_name || '一次单元测验'}，${scenario.student_issues || '学生在阅读和审题上问题比较集中'}，帮我生成一份${tool.name}。`
      }
      return `${prefix}帮我做一份${tool.name}，${scenario.evaluation_content || '我会提供待评价内容'}，${scenario.evaluation_criteria || '重点突出可操作建议'}。`
    case '学生支持':
      return `${scenario.grade || '三年级'}学生，${scenario.support_type || '学困生辅导'}方向，${scenario.student_strengths || '学生有一些积极表现'}，${scenario.student_situation || '目前学习和课堂状态需要支持'}，帮我做一份${tool.name}。`
    case '沟通写作':
      if (keys.includes('event_name')) {
        return `${scenario.event_name || '校园活动'}，${scenario.event_details || '需要把活动亮点和参与方式写清楚'}，帮我生成一份${tool.name}。`
      }
      return `${scenario.audience || '家长'}沟通场景，${scenario.content || '我会先告诉你具体情况'}，帮我生成一份${tool.name}，${scenario.special_needs || '语气自然一点'}。`
    case '课堂助手':
      return `我想配置一个「${scenario.bot_role || tool.name}」，服务${scenario.grade_subject || '当前学段学生'}，围绕${scenario.theme_scope || '课堂答疑和方法点拨'}工作，回答风格${scenario.response_style || '清晰易懂'}。`
    default:
      return `${prefix}帮我生成一份${tool.name}，尽量贴近真实课堂场景。`
  }
}

const buildToolScenarioPool = (tool) => {
  if (TOOL_SCENARIO_OVERRIDES[tool.id]) {
    return TOOL_SCENARIO_OVERRIDES[tool.id]
  }

  const presets = [
    {
      grade_subject: '五年级语文',
      grade: '五年级',
      textbook_version: '部编版',
      topic: '《慈母情深》',
      unit_name: '第六单元',
      teaching_objectives: '想突出朗读体验和人物情感理解',
      question_type: '阅读题为主',
      difficulty: '难度适中',
      student_situation: '学生能读懂内容，但表达比较浅',
      student_strengths: '课堂愿意发言，也愿意配合任务',
      exam_name: '五年级语文单元测',
      student_issues: '阅读理解失分比较集中',
      evaluation_content: '一篇五年级习作',
      evaluation_criteria: '重点看内容具体和情感表达',
      audience: '家长',
      content: '最近孩子阅读状态不错，但书写和作业习惯还需要家校一起跟进',
      special_needs: '语气温和、具体一点',
      bot_role: '小学语文阅读助教',
      theme_scope: '阅读理解、写作表达和课文预习',
      response_style: '启发式',
    },
    {
      grade_subject: '三年级数学',
      grade: '三年级',
      textbook_version: '人教版',
      topic: '分数的初步认识',
      unit_name: '分数单元',
      teaching_objectives: '想让学生能结合操作活动理解概念',
      question_type: '填空题和应用题混合',
      difficulty: '基础+提升',
      student_situation: '学生基础一般，容易把概念混淆',
      student_strengths: '动手积极，愿意参与操作活动',
      exam_name: '三年级数学随堂测',
      student_issues: '概念理解还不稳，应用题容易出错',
      evaluation_content: '一份数学学习单',
      evaluation_criteria: '重点看概念理解和表达过程',
      audience: '家长',
      content: '想和家长沟通孩子最近数学概念掌握不稳的问题',
      special_needs: '希望更像老师平时真实会说的话',
      bot_role: '小学数学错题讲解助手',
      theme_scope: '概念讲解、错题复盘和练习推荐',
      response_style: '清晰易懂',
    },
    {
      grade_subject: '初二物理',
      grade: '初二',
      textbook_version: '人教版',
      topic: '光的反射',
      unit_name: '光现象',
      teaching_objectives: '希望把实验观察和规律总结讲清楚',
      question_type: '简答题和实验题',
      difficulty: '适中',
      student_situation: '学生对现象有兴趣，但抽象归纳能力偏弱',
      student_strengths: '实验参与度高，愿意表达观察结果',
      exam_name: '八年级物理月考',
      student_issues: '实验分析和作图题错误偏多',
      evaluation_content: '一次实验报告',
      evaluation_criteria: '重点看现象描述、结论和证据对应',
      audience: '家长',
      content: '想反馈孩子最近物理实验课表现和学习建议',
      special_needs: '表达专业但不要太生硬',
      bot_role: '初中物理实验助教',
      theme_scope: '实验设计、现象解释和错题讲评',
      response_style: '严谨清晰',
    },
    {
      grade_subject: '高一英语',
      grade: '高一',
      textbook_version: '人教版',
      topic: '环境保护主题阅读',
      unit_name: '人与环境单元',
      teaching_objectives: '想让学生在阅读中积累表达并能开口讨论',
      question_type: '阅读题和表达题结合',
      difficulty: '适中',
      student_situation: '学生词汇量还可以，但口头表达不够主动',
      student_strengths: '阅读速度不错，合作学习比较积极',
      exam_name: '高一英语周测',
      student_issues: '长难句理解和观点表达比较弱',
      evaluation_content: '一份英语展示稿',
      evaluation_criteria: '重点看表达完整度、语言准确度和逻辑',
      audience: '家长',
      content: '想沟通孩子英语学习中的阅读和表达问题',
      special_needs: '语气真诚一点，别太模板化',
      bot_role: '高中英语口语陪练助手',
      theme_scope: '阅读理解、表达训练和课堂讨论支持',
      response_style: '鼓励式',
    },
    {
      grade_subject: '七年级历史',
      grade: '初一',
      textbook_version: '部编版',
      topic: '秦统一中国',
      unit_name: '中国古代史单元',
      teaching_objectives: '希望学生能梳理事件背景、影响和历史意义',
      question_type: '材料题和简答题',
      difficulty: '适中',
      student_situation: '学生记忆点多，但不会串联历史脉络',
      student_strengths: '愿意讲故事，课堂参与感不错',
      exam_name: '七年级历史单元测',
      student_issues: '材料题提取信息不完整',
      evaluation_content: '一份历史探究任务单',
      evaluation_criteria: '重点看史实准确和表达逻辑',
      audience: '家长',
      content: '想沟通孩子历史学科目前的学习状态和改进方向',
      special_needs: '想更具体一点，不要太空泛',
      bot_role: '初中历史探究助教',
      theme_scope: '史料阅读、知识梳理和课堂提问引导',
      response_style: '结构化',
    },
  ]

  return presets.map((scenario) => buildPromptFromScenario(tool, scenario))
}

const ToolDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const usageTrackedRef = useRef('')
  const streamingQueueRef = useRef('')
  const renderedTextRef = useRef('')
  const streamingTimerRef = useRef(null)
  const resultPreviewRef = useRef(null)

  const [tool, setTool] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // 新的交互状态
  const [interactionPhase, setInteractionPhase] = useState('chat') // 'chat' | 'confirm' | 'guiding' | 'result'
  const [chatMessages, setChatMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // 引导式填写状态
  const [requiredFields, setRequiredFields] = useState([])
  const [advancedFields, setAdvancedFields] = useState([])
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const [formData, setFormData] = useState({})
  const [fieldAnswers, setFieldAnswers] = useState({})
  const [seedSuggestions, setSeedSuggestions] = useState([])
  const [lockedFieldKeys, setLockedFieldKeys] = useState([])
  
  // 高级选项状态
  const [showAdvancedTip, setShowAdvancedTip] = useState(false)
  const [showAdvancedForm, setShowAdvancedForm] = useState(false)
  
  // 生成结果状态
  const [result, setResult] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [historyMode, setHistoryMode] = useState(false)
  const [reviseModalOpen, setReviseModalOpen] = useState(false)
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(-1)
  const [reviseTargetType, setReviseTargetType] = useState('block')
  const [selectedSnippet, setSelectedSnippet] = useState('')
  const [reviseInstruction, setReviseInstruction] = useState('')
  const [isRevisingBlock, setIsRevisingBlock] = useState(false)
  const [reviseError, setReviseError] = useState('')
  const [reviseSuccess, setReviseSuccess] = useState('')
  const [selectionToolbar, setSelectionToolbar] = useState(null)
  const [selectionNotice, setSelectionNotice] = useState(null)
  const [lastRevisionSnapshot, setLastRevisionSnapshot] = useState(null)
  const [isUndoingRevision, setIsUndoingRevision] = useState(false)

  // 推荐问题列表
  const [suggestedQuestions, setSuggestedQuestions] = useState([])

  const workflowContext = location.state?.workflowContext || null
  const workflowStepIds = workflowContext?.stepIds || []
  const currentWorkflowStepIndex = workflowStepIds.findIndex((stepId) => stepId === id)
  const nextWorkflowStepId =
    currentWorkflowStepIndex >= 0 && currentWorkflowStepIndex < workflowStepIds.length - 1
      ? workflowStepIds[currentWorkflowStepIndex + 1]
      : ''
  const nextWorkflowTool = nextWorkflowStepId ? getToolById(nextWorkflowStepId) : null

  useEffect(() => {
    return () => {
      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current)
        streamingTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const clearToolbar = () => setSelectionToolbar(null)
    window.addEventListener('scroll', clearToolbar, true)
    window.addEventListener('resize', clearToolbar)
    return () => {
      window.removeEventListener('scroll', clearToolbar, true)
      window.removeEventListener('resize', clearToolbar)
    }
  }, [])

  useEffect(() => {
    setSelectionToolbar(null)
    setSelectionNotice(null)
    setSelectedSnippet('')
    setReviseTargetType('block')
  }, [result])

  // 加载工具数据
  useEffect(() => {
    let cancelled = false

    const loadTool = async () => {
      const toolData = getToolById(id)
      if (!toolData) {
        if (!cancelled) setIsLoading(false)
        return
      }

      const workflowId = location.state?.workflowContext?.workflowId
      if (workflowId) {
        await syncWorkflowRunFromServer(workflowId)
      }

      if (cancelled) return

      setTool(toolData)
      const workflowPrefill = location.state?.workflowContext?.prefill || {}
      const initialData = buildInitialFormData(toolData, workflowPrefill)
      setFormData(initialData)

      const historyItem = location.state?.historyItem
      const workflowStepState = workflowId
        ? getWorkflowRun(workflowId).steps?.[toolData.id]
        : null
      if (historyItem && historyItem.templateId === toolData.id) {
        setHistoryMode(true)
        setFormData(historyItem.input || initialData)
        setFieldAnswers(historyItem.input || {})
        setResult(sanitizeGeneratedResult(historyItem.result || ''))
        setInteractionPhase('result')
      } else if (workflowStepState?.result) {
        const stepInput = workflowStepState.input || initialData
        setHistoryMode(false)
        setFormData({ ...initialData, ...stepInput })
        setFieldAnswers(stepInput)
        setResult(sanitizeGeneratedResult(workflowStepState.result || ''))
        setInteractionPhase('result')
      } else {
        setHistoryMode(false)
        setResult('')
        setInteractionPhase('chat')
        setChatMessages([])
        setFieldAnswers(workflowPrefill)
        setSeedSuggestions([])
        setLockedFieldKeys([])
        setCurrentFieldIndex(0)
        setShowAdvancedTip(false)
        setShowAdvancedForm(false)
      }

      setSuggestedQuestions(generateSuggestedQuestions(toolData))
      setIsLoading(false)
    }

    loadTool()

    return () => {
      cancelled = true
    }
  }, [id, location.state])

  useEffect(() => {
    if (!tool || usageTrackedRef.current === tool.id) return

    usageTrackedRef.current = tool.id
    fetch('/api/tool-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolId: tool.id,
        toolName: tool.name
      })
    }).catch(() => {})
  }, [tool])

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // 生成推荐问题
  const generateSuggestedQuestions = (tool) => {
    const categoryTemplates = buildToolScenarioPool(tool)
    const fieldDrivenTemplates = tool.fields
      .filter((field) => !field.isAdvanced)
      .map((field) => FIELD_PROMPT_BANK[field.key])
      .filter(Boolean)
      .flat()

    const genericTemplates = [
      `想做一份更贴近真实课堂的${tool.name}，我会先告诉你年级、主题和场景。`,
      `请按中国学校的真实教学场景，帮我生成一份可直接使用的${tool.name}。`,
    ]

    const templates = [...categoryTemplates, ...genericTemplates, ...fieldDrivenTemplates.map((item) => `围绕「${item}」这个场景，帮我生成一份${tool.name}。`)]
    const deduped = templates.filter((item, index) => templates.indexOf(item) === index)
    return shuffleList(deduped).slice(0, 4)
  }

  const getFriendlyQuestion = (field) => {
    const questionMap = {
      grade_subject: '先告诉我这节内容是给哪个年级、哪个学科用的？',
      grade: '先确认一下，是哪个年级？',
      topic: '这次主要围绕哪篇课文、哪个知识点或主题？',
      teaching_objectives: '你最希望学生通过这次学习收获什么？',
      textbook_version: '教材版本想按哪个来写？',
      extra_requirements: '有没有你特别想加进去的环节或要求？',
      question_type: '这次更想出哪种题型？',
      question_count: '大概想要几题比较合适？',
      exercise_type: '这组内容更偏随堂练习、作业，还是单元检测？',
      exam_name: '先告诉我这次是哪一场考试或测验？',
      student_issues: '这次学生最突出的问题主要是什么？',
      evaluation_content: '把需要我帮你评价的内容发给我就行。',
      evaluation_criteria: '你更看重哪些评价标准？',
      content: '这次最想跟家长或学生沟通什么内容？',
      audience: '这份正式沟通文本主要是写给谁的？',
      purpose: '这次沟通的主要目的是什么？',
      support_type: '这次更需要哪一类学生支持？',
      student_situation: '你方便简单说一下学生当前的具体情况吗？',
      unit_name: '这次是哪个单元？',
      unit_goals: '这个单元你最想达成哪些目标？',
      project_topic: '这次项目式学习准备围绕什么主题展开？',
      theme: '这次班会想围绕什么主题？',
      bot_role: '你想把这个课堂助手设定成什么角色？'
    }

    return questionMap[field.key] || `${field.label}${field.required ? '（这项需要先确认）' : ''}`
  }

  const isFilledValue = (value) => {
    if (value === undefined || value === null) return false
    if (typeof value === 'string') return value.trim() !== ''
    if (typeof value === 'boolean') return value
    return true
  }

  const buildRequiredFieldQueue = (tool, aiRequiredFields = [], recognized = {}, existingFormData = {}, existingFieldAnswers = {}) => {
    const aiFieldMap = new Map(
      (aiRequiredFields || [])
        .filter((field) => field?.key)
        .map((field) => [field.key, field])
    )

    const orderedKeys = []
    ;(aiRequiredFields || []).forEach((field) => {
      if (field?.key && !orderedKeys.includes(field.key)) orderedKeys.push(field.key)
    })
    tool.fields
      .filter((field) => field.required && !field.isAdvanced)
      .forEach((field) => {
        if (!orderedKeys.includes(field.key)) orderedKeys.push(field.key)
      })

    return orderedKeys
      .map((key) => {
        const field = tool.fields.find((item) => item.key === key && !item.isAdvanced)
        if (!field) return null

        const recognizedValue = recognized[key]
        const existingValue = existingFieldAnswers[key] ?? existingFormData[key]
        if (isFilledValue(recognizedValue) || isFilledValue(existingValue)) {
          return null
        }

        const aiField = aiFieldMap.get(key)
        return {
          key: field.key,
          label: field.label,
          type: field.type,
          required: !!field.required,
          placeholder: aiField?.placeholder || getFriendlyQuestion(field),
          options: aiField?.options?.length ? aiField.options : (field.options || [])
        }
      })
      .filter(Boolean)
  }

  const getHardConstraintDefaults = (tool) =>
    tool.fields
      .filter((field) => ['grade_subject', 'grade', 'topic', 'unit_name', 'project_topic', 'lesson_topic', 'textbook_version'].includes(field.key))
      .map((field) => field.key)

  const continueFromConfirm = () => {
    const mergedAdvancedFields = tool.fields.filter((field) => field.isAdvanced)
    const filteredRequiredFields = buildRequiredFieldQueue(
      tool,
      [],
      fieldAnswers,
      formData,
      fieldAnswers
    )

    setRequiredFields(filteredRequiredFields)
    setAdvancedFields(mergedAdvancedFields)
    setInteractionPhase('guiding')
    setCurrentFieldIndex(0)

    if (filteredRequiredFields.length === 0) {
      if (mergedAdvancedFields.length > 0) {
        setShowAdvancedTip(true)
      } else {
        setInteractionPhase('result')
        setTimeout(() => handleGenerate(), 0)
      }
    } else {
      setShowAdvancedTip(false)
    }
  }

  const persistWorkflowStep = (nextFields, nextResult = '') => {
    if (!workflowContext?.workflowId) return null

    return updateWorkflowRun(workflowContext.workflowId, (current) => ({
      ...current,
      fields: {
        ...(current.fields || {}),
        ...nextFields,
      },
      steps: {
        ...(current.steps || {}),
        [tool.id]: {
          completedAt: new Date().toISOString(),
          input: nextFields,
          result: nextResult || current.steps?.[tool.id]?.result || '',
        },
      },
    }))
  }

  const openNextWorkflowStep = () => {
    if (!workflowContext?.workflowId || !nextWorkflowTool) return

    const workflowRun = getWorkflowRun(workflowContext.workflowId)
    const prefill = {}
    nextWorkflowTool.fields.forEach((field) => {
      const value = workflowRun.fields?.[field.key]
      if (value !== undefined && value !== null && value !== '') {
        prefill[field.key] = value
      }
    })

    navigate(`/tool/${nextWorkflowTool.id}`, {
      state: {
        workflowContext: {
          ...workflowContext,
          prefill,
        },
      },
    })
  }

  // 发送消息
  const handleSendMessage = async () => {
    if (!userInput.trim()) return

    const message = userInput.trim()
    setUserInput('')

    // 新一轮自然语言分析前，清空上一次引导状态，避免把旧识别结果误判成这次也已填写
    if (!historyMode) {
      const resetData = buildInitialFormData(tool, workflowContext?.prefill || {})
      setFormData(resetData)
      setFieldAnswers(workflowContext?.prefill || {})
      setRequiredFields([])
      setAdvancedFields([])
      setSeedSuggestions([])
      setLockedFieldKeys([])
      setCurrentFieldIndex(0)
      setShowAdvancedTip(false)
      setShowAdvancedForm(false)
      setResult('')
    }
    
    // 添加用户消息
    setChatMessages(prev => [...prev, { role: 'user', content: message }])
    
    // 分析用户输入
    setIsAnalyzing(true)
    
    try {
      const seedResult = await analyzeToolSeed(message)
      
      // 添加AI回复
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: seedResult.message || '我先帮你锁定了基础信息。'
      }])
      
      const recognized = seedResult.recognized || {}
      setFieldAnswers(prev => ({ ...prev, ...recognized }))
      setFormData(prev => ({ ...prev, ...recognized }))
      setSeedSuggestions(Array.isArray(seedResult.suggestions) ? seedResult.suggestions : [])
      setLockedFieldKeys(seedResult.hardFieldKeys?.length ? seedResult.hardFieldKeys : getHardConstraintDefaults(tool))
      setInteractionPhase('confirm')
      setShowAdvancedForm(false)
      setIsAnalyzing(false)

    } catch (error) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，分析失败，请重新描述您的需求。' 
      }])
    }
    
    setIsAnalyzing(false)
  }

  const analyzeToolSeed = async (message) => {
    const response = await fetch('/api/tools/seed-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolId: tool.id,
        message
      })
    })

    if (!response.ok) {
      throw new Error('分析失败')
    }

    return response.json()
  }

  // AI分析用户输入
  const analyzeUserInput = async (message) => {
    const response = await fetch('/api/tools/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolId: tool.id,
        message
      })
    })
    if (!response.ok) {
      throw new Error('分析失败')
    }
    const parsed = await response.json()

    const recognized = parsed?.recognized && typeof parsed.recognized === 'object' ? parsed.recognized : {}

    if (Object.keys(recognized).length > 0) {
      setFormData(prev => ({ ...prev, ...recognized }))
      setFieldAnswers(prev => ({ ...prev, ...recognized }))
    }

    if (parsed) {
      return {
        message: parsed.message || '我先帮你梳理了一下需求，还差几项关键信息。',
        recognized,
        requiredFields: Array.isArray(parsed.requiredFields) ? parsed.requiredFields : [],
        advancedFields: Array.isArray(parsed.advancedFields) ? parsed.advancedFields : []
      }
    }

      return {
        message: '我先帮你梳理了一下需求，还差几项关键信息。',
        recognized: {},
        requiredFields: tool.fields.filter(f => f.required && !f.isAdvanced).slice(0, 3).map((field) => ({
          key: field.key,
          label: field.label,
        type: field.type,
        required: !!field.required,
        placeholder: getFriendlyQuestion(field),
        options: field.options || []
      })),
      advancedFields: []
    }
  }

  // 处理引导式填写
  const handleFieldAnswer = (value) => {
    const currentField = requiredFields[currentFieldIndex]
    setFieldAnswers(prev => ({
      ...prev,
      [currentField.key]: value
    }))
    setFormData(prev => ({
      ...prev,
      [currentField.key]: value
    }))

    // 下一个问题
    if (currentFieldIndex < requiredFields.length - 1) {
      setCurrentFieldIndex(prev => prev + 1)
    } else {
      // 必填完成后，如有可补充字段则温和提醒；否则直接生成
      setCurrentFieldIndex(requiredFields.length)
      if (advancedFields.length > 0) {
        setShowAdvancedTip(true)
      } else {
        setInteractionPhase('result')
        handleGenerate()
      }
    }
  }

  // 跳过当前问题
  const handleSkipField = () => {
    const currentField = requiredFields[currentFieldIndex]
    if (!currentField.required) {
      if (currentFieldIndex < requiredFields.length - 1) {
        setCurrentFieldIndex(prev => prev + 1)
      } else {
        if (advancedFields.length > 0) {
          setShowAdvancedTip(true)
        } else {
          setInteractionPhase('result')
          handleGenerate()
        }
      }
    }
  }

  // 进入补充信息
  const handleShowAdvanced = () => {
    setShowAdvancedForm(true)
    setShowAdvancedTip(false)
  }

  // 跳过补充信息，直接生成
  const handleSkipAdvanced = () => {
    setInteractionPhase('result')
    handleGenerate()
  }

  const stopStreamingRender = () => {
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current)
      streamingTimerRef.current = null
    }
  }

  const flushStreamingRender = () => {
    if (!streamingQueueRef.current) {
      return
    }
    renderedTextRef.current += streamingQueueRef.current
    streamingQueueRef.current = ''
    setResult(sanitizeGeneratedResult(renderedTextRef.current))
  }

  const ensureStreamingRender = () => {
    if (streamingTimerRef.current) return

    streamingTimerRef.current = setInterval(() => {
      if (!streamingQueueRef.current) {
        return
      }

      const nextChunk = streamingQueueRef.current.slice(0, 8)
      streamingQueueRef.current = streamingQueueRef.current.slice(8)
      renderedTextRef.current += nextChunk
      setResult(sanitizeGeneratedResult(renderedTextRef.current))

      if (!streamingQueueRef.current && !isGenerating) {
        stopStreamingRender()
      }
    }, 24)
  }

  const appendStreamingContent = (content) => {
    if (!content) return
    streamingQueueRef.current += content
    ensureStreamingRender()
  }

  // 生成内容
  const handleGenerate = async () => {
    setIsGenerating(true)
    setResult('')
    setGenerateError('')
    stopStreamingRender()
    streamingQueueRef.current = ''
    renderedTextRef.current = ''

    try {
      const response = await fetch('/api/tools/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: tool.id,
          formData
        })
      })

      if (!response.ok) {
        let message = '生成失败，请稍后重试。'
        try {
          const errorBody = await response.json()
          message = errorBody?.message || errorBody?.error || message
        } catch {}
        throw new Error(message)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let generatedText = ''
      let pending = ''

      while (true) {
        const { done, value } = await reader.read()
        const chunk = decoder.decode(value || new Uint8Array(), { stream: !done })
        pending += chunk
        const lines = pending.split('\n')
        pending = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6))
              const content = data.choices?.[0]?.delta?.content
              if (content) {
                generatedText += content
                appendStreamingContent(content)
              }
            } catch (e) {}
          }
        }

        if (done) {
          if (pending.startsWith('data: ') && pending !== 'data: [DONE]') {
            try {
              const data = JSON.parse(pending.slice(6))
              const content = data.choices?.[0]?.delta?.content
              if (content) {
                generatedText += content
                appendStreamingContent(content)
              }
            } catch (e) {}
          }
          break
        }
      }

      flushStreamingRender()
      const finalResult = sanitizeGeneratedResult(generatedText)
      renderedTextRef.current = finalResult
      setResult(finalResult)
      persistWorkflowStep(formData, finalResult)

      // 保存到历史
      saveToHistory(formData, finalResult)

    } catch (error) {
      console.error('生成失败:', error)
      stopStreamingRender()
      setGenerateError(error?.message || '生成失败，请稍后重试。')
    }

    setIsGenerating(false)
    if (!streamingQueueRef.current) {
      stopStreamingRender()
    }
  }

  // 保存到历史
  const saveToHistory = (data, result) => {
    const history = JSON.parse(localStorage.getItem('beike_history') || '[]')
    history.unshift({
      id: Date.now().toString(),
      templateId: id,
      templateName: tool.name,
      input: data,
      result: result,
      createdAt: new Date().toISOString()
    })
    localStorage.setItem('beike_history', JSON.stringify(history.slice(0, 50)))
  }

  // 下载文件
  const downloadFile = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportWord = () => {
    if (!result) return
    const htmlContent = buildExportHtml(tool.name, result)
    downloadFile(`${tool.name}.doc`, htmlContent, 'application/msword')
    setShowDownloadMenu(false)
  }

  const handleExportMarkdown = () => {
    if (!result) return
    downloadFile(`${tool.name}.md`, result, 'text/markdown;charset=utf-8')
    setShowDownloadMenu(false)
  }

  const handleExportHtml = () => {
    if (!result) return
    downloadFile(`${tool.name}.html`, buildExportHtml(tool.name, result), 'text/html;charset=utf-8')
    setShowDownloadMenu(false)
  }

  const resultBlocks = splitResultBlocks(result)

  const clearTextSelection = () => {
    if (typeof window === 'undefined') return
    const selection = window.getSelection()
    selection?.removeAllRanges()
  }

  const openReviseModal = (blockIndex, snippet = '') => {
    setSelectedBlockIndex(blockIndex)
    setReviseTargetType(snippet ? 'selection' : 'block')
    setSelectedSnippet(snippet)
    setReviseInstruction('')
    setReviseError('')
    setReviseSuccess('')
    setSelectionToolbar(null)
    setReviseModalOpen(true)
  }

  const closeReviseModal = () => {
    if (isRevisingBlock) return
    setReviseModalOpen(false)
    setSelectedBlockIndex(-1)
    setReviseTargetType('block')
    setSelectedSnippet('')
    setReviseInstruction('')
    setReviseError('')
  }

  const getBlockIndexFromNode = (node) => {
    let current = node
    while (current) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const blockElement = current.closest?.('[data-result-block-index]')
        if (blockElement) {
          const index = Number(blockElement.getAttribute('data-result-block-index'))
          return Number.isNaN(index) ? -1 : index
        }
      }
      current = current.parentNode
    }
    return -1
  }

  const updateSelectionToolbar = () => {
    if (!resultPreviewRef.current) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setSelectionToolbar(null)
      setSelectionNotice(null)
      return
    }

    const text = selection.toString().trim()
    if (text.length < 2) {
      setSelectionToolbar(null)
      setSelectionNotice(null)
      return
    }

    const range = selection.getRangeAt(0)
    const commonAncestor = range.commonAncestorContainer
    if (!resultPreviewRef.current.contains(commonAncestor)) {
      setSelectionToolbar(null)
      setSelectionNotice(null)
      return
    }

    const startIndex = getBlockIndexFromNode(range.startContainer)
    const endIndex = getBlockIndexFromNode(range.endContainer)
    const rect = range.getBoundingClientRect()
    if (startIndex < 0 || endIndex < 0 || startIndex !== endIndex) {
      setSelectionToolbar(null)
      setSelectionNotice({
        message: '当前只支持在同一段内改写，请缩小到单段内容再试。',
        top: Math.max(rect.top - 52, 16),
        left: clamp(rect.left + rect.width / 2, 180, window.innerWidth - 180),
      })
      return
    }

    if (!rect.width && !rect.height) {
      setSelectionToolbar(null)
      setSelectionNotice(null)
      return
    }

    setSelectionNotice(null)
    setSelectionToolbar({
      text,
      blockIndex: startIndex,
      top: Math.max(rect.top - 52, 16),
      left: clamp(rect.left + rect.width / 2, 120, window.innerWidth - 120),
    })
  }

  const handleResultMouseUp = () => {
    window.setTimeout(updateSelectionToolbar, 0)
  }

  const handleResultKeyUp = () => {
    window.setTimeout(updateSelectionToolbar, 0)
  }

  const handleUndoLastRevision = async () => {
    if (!lastRevisionSnapshot || isUndoingRevision) return

    setIsUndoingRevision(true)
    setReviseError('')
    try {
      setResult(lastRevisionSnapshot.result)
      persistWorkflowStep(formData, lastRevisionSnapshot.result)
      saveToHistory(formData, lastRevisionSnapshot.result)
      setReviseSuccess('已撤销上一次局部改写')
      setSelectionToolbar(null)
      setSelectionNotice(null)
      clearTextSelection()
      setLastRevisionSnapshot(null)
    } catch (error) {
      setReviseError(error?.message || '撤销失败，请稍后重试。')
    } finally {
      setIsUndoingRevision(false)
    }
  }

  const submitRevision = async (instructionText, options = {}) => {
    const targetIndex = options.blockIndex ?? selectedBlockIndex
    const targetSnippet = options.selectedSnippet ?? selectedSnippet
    const targetBlock = resultBlocks[targetIndex]
    if (!targetBlock || !instructionText.trim()) return

    const instruction = targetSnippet
      ? `请只改写这一段中的这部分内容：“${targetSnippet}”。${instructionText.trim()}。请保持这段其他内容不变，并直接输出更新后的完整这一段。`
      : instructionText.trim()

    setIsRevisingBlock(true)
    setReviseError('')

    try {
      const response = await fetch('/api/tools/revise-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: tool.id,
          formData,
          fullContent: result,
          selectedBlock: targetBlock.content,
          instruction
        })
      })

      if (!response.ok) {
        let message = '局部改写失败，请稍后重试。'
        try {
          const errorBody = await response.json()
          message = errorBody?.message || errorBody?.error || message
        } catch {}
        throw new Error(message)
      }

      const data = await response.json()
      const revisedBlock = sanitizeGeneratedResult(data?.revisedBlock || '')
      if (!revisedBlock) {
        throw new Error('改写结果为空，请重新尝试。')
      }

      setLastRevisionSnapshot({
        result,
        blockIndex: targetIndex,
        selectedSnippet: targetSnippet,
      })
      const nextBlocks = [...resultBlocks]
      nextBlocks[targetIndex] = {
        ...nextBlocks[targetIndex],
        content: revisedBlock
      }
      const nextResult = sanitizeGeneratedResult(nextBlocks.map((block) => block.content).join('\n\n'))
      setResult(nextResult)
      persistWorkflowStep(formData, nextResult)
      saveToHistory(formData, nextResult)
      setReviseSuccess(targetSnippet ? '选中的内容已经更新' : '这一段已经更新')
      clearTextSelection()
      setSelectionToolbar(null)
      if (options.keepModalOpen) {
        setReviseInstruction('')
      } else {
        closeReviseModal()
      }
    } catch (error) {
      setReviseError(error?.message || '局部改写失败，请稍后重试。')
    } finally {
      setIsRevisingBlock(false)
    }
  }

  const handleReviseBlock = async () => {
    await submitRevision(reviseInstruction)
  }

  // 早期返回：加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-blue-500">加载中...</div>
      </div>
    )
  }

  // 早期返回：工具不存在
  if (!tool) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-blue-500">工具不存在</div>
      </div>
    )
  }

  // 渲染聊天界面
  const renderChatPhase = () => (
    <div className="flex flex-col min-h-[500px] md:min-h-[600px]">
      {/* AI 分析中 */}
      {isAnalyzing ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center animate-pulse">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">AI 正在分析你的需求</h3>
          <p className="text-sm text-slate-500 text-center max-w-md">
            正在提取关键信息，准备为你定制专属内容...
          </p>
          <div className="mt-6 flex gap-1.5">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      ) : (
        <>
          {/* 欢迎界面 */}
          <div className="flex-1 flex flex-col justify-center px-6 py-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">先说一下你想做什么</h3>
              <p className="text-sm text-slate-500">描述需求，AI 会帮你拆解成关键信息并逐步完善</p>
            </div>

            {/* 推荐问题 */}
            <div className="space-y-2 max-w-md mx-auto">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setUserInput(q)}
                  className="w-full px-4 py-3 bg-blue-50/30 hover:bg-blue-50 border border-slate-200 hover:border-slate-200 rounded-3xl text-sm text-slate-700 hover:text-blue-700 transition-colors text-left group"
                >
                  <Sparkles className="w-4 h-4 inline-block mr-2 text-blue-400 group-hover:text-blue-500 transition-colors" />
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* 输入框 */}
          <div className="border-t border-slate-200 px-4 py-4 pb-20 md:pb-4">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="比如：给五年级语文生成一份《慈母情深》教案，加入朗读环节。"
                className="flex-1 px-4 py-3 border border-slate-200 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
              <button
                onClick={handleSendMessage}
                disabled={!userInput.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-3xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderConfirmPhase = () => {
    const lockedFields = tool.fields.filter((field) => lockedFieldKeys.includes(field.key))

    return (
      <div className="px-6 py-6 pb-24 md:pb-6">
        <div className="rounded-3xl border border-blue-100 bg-white p-6">
          <div className="mb-2 text-lg font-semibold text-slate-900">确认 AI 预填信息</div>
          <p className="mb-5 text-sm text-slate-500">先锁定硬约束，再从 AI 建议里挑选更合适的软建议。</p>

          <div className="grid gap-4 md:grid-cols-2">
            {lockedFields.map((field) => (
              <div key={field.key}>
                <label className="mb-2 block text-sm font-medium text-slate-700">{field.label}</label>
                <input
                  value={formData[field.key] || ''}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                    setFieldAnswers((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>
            ))}
          </div>

          {seedSuggestions.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-sm font-medium text-slate-700">AI 软建议</div>
              <div className="flex flex-wrap gap-2">
                {seedSuggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.fieldKey}-${index}`}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, [suggestion.fieldKey]: suggestion.value }))
                      setFieldAnswers((prev) => ({ ...prev, [suggestion.fieldKey]: suggestion.value }))
                    }}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-600"
                  >
                    {suggestion.label || suggestion.fieldKey}：{suggestion.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={continueFromConfirm}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white"
            >
              继续生成
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 渲染引导式填写界面
  const renderGuidingPhase = () => {
    const currentField = requiredFields[currentFieldIndex]

    return (
      <div className="px-6 py-6 pb-24 md:pb-6">
        {/* 进度指示 - 更醒目 */}
        {!showAdvancedTip && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{currentFieldIndex + 1}</span>
                </div>
                <span className="text-sm font-medium text-slate-700">基本信息收集</span>
              </div>
              <span className="text-sm text-slate-500">
                <span className="font-semibold text-blue-600">{currentFieldIndex + 1}</span>
                <span className="mx-1">/</span>
                <span>{requiredFields.length}</span>
              </span>
            </div>

            {/* 步骤指示器 */}
            <div className="flex gap-1.5">
              {requiredFields.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i < currentFieldIndex
                      ? 'bg-blue-500'
                      : i === currentFieldIndex
                      ? 'bg-blue-400 animate-pulse'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 当前问题卡片 */}
        {currentField && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 border border-slate-200 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-3xl bg-blue-500 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 leading-relaxed">
                  {getFriendlyQuestion(currentField)}
                  {currentField.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                {currentField.placeholder && (
                  <p className="text-sm text-slate-500 mt-1">{currentField.placeholder}</p>
                )}
              </div>
            </div>
          <div className="mb-6">

            {/* 已填写的信息标签 */}
            {Object.keys(fieldAnswers).length > 0 && (
              <div className="mb-4 p-3 bg-white/60 rounded-2xl backdrop-blur-sm">
                <p className="text-xs text-slate-500 mb-2 font-medium">我已经了解这些信息：</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(fieldAnswers).map(([key, value]) => {
                    const field = requiredFields.find(f => f.key === key)
                    return (
                      <span 
                        key={key} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs text-slate-700 border border-slate-200 shadow-sm"
                      >
                        <span className="font-medium">{field?.label}:</span>
                        <span>{value}</span>
                        <Check className="w-3 h-3 text-emerald-500" />
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 输入区域 - 根据字段类型 */}
            {currentField.type === 'select' ? (
              <div className="grid grid-cols-2 gap-2">
                {currentField.options?.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleFieldAnswer(opt)}
                    className={`px-4 py-3.5 border-2 rounded-3xl text-sm text-left font-medium shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
                      (fieldAnswers[currentField.key] || formData[currentField.key]) === opt
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : currentField.type === 'textarea' ? (
              <div>
                <textarea
                  value={fieldAnswers[currentField.key] || ''}
                  onChange={(e) => {
                    setFieldAnswers(prev => ({ ...prev, [currentField.key]: e.target.value }))
                    setFormData(prev => ({ ...prev, [currentField.key]: e.target.value }))
                  }}
                  placeholder={currentField.placeholder || '请输入...'}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-3">
                  {!currentField.required && (
                    <button
                      onClick={handleSkipField}
                      className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-colors font-medium"
                    >
                      跳过此题
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const value = fieldAnswers[currentField.key]
                      if (value) handleFieldAnswer(value)
                    }}
                    disabled={!fieldAnswers[currentField.key] && currentField.required}
                    className="px-6 py-2.5 bg-blue-500 text-white rounded-3xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2"
                  >
                    确认
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={fieldAnswers[currentField.key] || ''}
                  onChange={(e) => {
                    setFieldAnswers(prev => ({ ...prev, [currentField.key]: e.target.value }))
                    setFormData(prev => ({ ...prev, [currentField.key]: e.target.value }))
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = fieldAnswers[currentField.key]
                      if (value) handleFieldAnswer(value)
                    }
                  }}
                  placeholder={currentField.placeholder || '请输入...'}
                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-3">
                  {!currentField.required && (
                    <button
                      onClick={handleSkipField}
                      className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-colors font-medium"
                    >
                      跳过此题
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const value = fieldAnswers[currentField.key]
                      if (value) handleFieldAnswer(value)
                    }}
                    disabled={!fieldAnswers[currentField.key] && currentField.required}
                    className="px-6 py-2.5 bg-blue-500 text-white rounded-3xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2"
                  >
                    下一步
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        )}

        {/* 补充信息提示 */}
        {showAdvancedTip && (
          <div className="mt-8 relative">
            {/* 成功提示 */}
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-3xl">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">基本信息已收集完成</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">可以开始生成内容了</p>
                </div>
              </div>
            </div>

            {/* 补充信息提醒 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-slate-100 rounded-3xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-slate-500" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-slate-900 mb-2">
                      再补充一些信息，我能生成得更精准哦
                    </h4>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                      下面的信息可以帮我更了解你的班级和学生，不填也没关系，填了会生成更贴合实际的内容哦。
                    </p>
                    
                    {/* 提示点 */}
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        <span>更符合教学场景</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        <span>更精准的内容定位</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        <span>更适合学生水平</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        <span>更多细节支持</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleShowAdvanced}
                        className="flex-1 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-3xl text-sm font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        继续补充
                      </button>
                      <button
                        onClick={handleSkipAdvanced}
                        className="flex-1 px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-3xl text-sm font-medium transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        开始生成
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 补充信息表单 */}
        {showAdvancedForm && advancedFields.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-5">
              <Settings className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-semibold text-slate-900">补充信息</h3>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">可选</span>
            </div>

            <div className="space-y-4 bg-blue-50/30 rounded-3xl p-5">
              {advancedFields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 bg-white"
                    >
                      <option value="">请选择</option>
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'toggle' ? (
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-2xl border-2 border-slate-200 hover:border-amber-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData[field.key] || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.checked }))}
                        className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-100"
                      />
                      <span className="text-sm text-slate-700 font-medium">
                        {formData[field.key] ? '是' : '否'}
                      </span>
                    </label>
                  ) : (
                    <input
                      type="text"
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder || '选填...'}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 bg-white"
                    />
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                setInteractionPhase('result')
                handleGenerate()
              }}
              className="mt-6 w-full px-5 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-3xl font-medium transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              开始生成
            </button>
          </div>
        )}
      </div>
    )
  }

  // 渲染结果界面
  const renderResultPhase = () => (
    <div className="p-6 pb-24 md:pb-6">
      {result ? (
        <>
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">生成结果</h3>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">已生成</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-colors text-sm font-medium shadow-sm"
              >
                <Download className="w-4 h-4" />
                导出
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showDownloadMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDownloadMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-lg z-20 overflow-hidden">
                    <div className="px-4 py-2 bg-blue-50/50 border-b border-slate-100">
                      <span className="text-xs font-medium text-blue-600">选择导出格式</span>
                    </div>
                    <button
                      onClick={handleExportWord}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                    >
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">Word 文档</div>
                        <div className="text-xs text-slate-500">.doc 格式</div>
                      </div>
                    </button>
                    <button
                      onClick={handleExportMarkdown}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                    >
                      <FileCode className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">Markdown</div>
                        <div className="text-xs text-slate-500">.md 格式</div>
                      </div>
                    </button>
                    <button
                      onClick={handleExportHtml}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                    >
                      <File className="w-5 h-5 text-orange-500" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">HTML 网页</div>
                        <div className="text-xs text-slate-500">.html 格式</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div
            ref={resultPreviewRef}
            className="result-preview"
            onMouseUp={handleResultMouseUp}
            onKeyUp={handleResultKeyUp}
          >
            {reviseSuccess && (
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:flex-row md:items-center md:justify-between">
                <span>{reviseSuccess}</span>
                {lastRevisionSnapshot && (
                  <button
                    onClick={handleUndoLastRevision}
                    disabled={isUndoingRevision}
                    className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUndoingRevision ? '撤销中...' : '撤销上一次改写'}
                  </button>
                )}
              </div>
            )}
            {selectionToolbar && (
              <div
                className="fixed z-40 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-xl"
                style={{
                  top: `${selectionToolbar.top}px`,
                  left: `${selectionToolbar.left}px`,
                  transform: 'translateX(-50%)',
                }}
              >
                <button
                  onClick={() => openReviseModal(selectionToolbar.blockIndex, selectionToolbar.text)}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-600 shadow-sm hover:bg-blue-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  优化这段
                </button>
              </div>
            )}
            {selectionNotice && (
              <div
                className="fixed z-40 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700 shadow-lg"
                style={{
                  top: `${selectionNotice.top}px`,
                  left: `${selectionNotice.left}px`,
                  transform: 'translateX(-50%)',
                }}
              >
                {selectionNotice.message}
              </div>
            )}
            <div className="space-y-5">
              {resultBlocks.map((block, index) => (
                <div
                  key={block.id}
                  data-result-block-index={index}
                  className="group relative rounded-2xl transition-colors hover:bg-blue-50/20"
                >
                  <div
                    className="px-1"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(block.content) }}
                  />
                </div>
              ))}
            </div>
          </div>

          {workflowContext?.workflowId && (
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900">当前步骤已保存到工作流</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {nextWorkflowTool ? `可以继续进入下一步：${nextWorkflowTool.name}` : '这条工作流已经完成，可以回到流程页查看整体进度。'}
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => navigate(`/workflows/${workflowContext.workflowId}`)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    返回工作流
                  </button>
                  {nextWorkflowTool && (
                    <button
                      onClick={openNextWorkflowStep}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white"
                    >
                      下一步
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px]">
          {isGenerating ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className="text-sm text-slate-500">正在生成内容...</p>
            </>
          ) : generateError ? (
            <div className="max-w-md text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
                <span className="text-red-500 text-xl">!</span>
              </div>
              <p className="text-sm font-medium text-red-600 mb-2">生成失败</p>
              <p className="text-sm text-slate-500 mb-4">{generateError}</p>
              <button
                onClick={handleGenerate}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-sm font-medium transition-colors"
              >
                重新生成
              </button>
            </div>
          ) : (
            <>
              <Sparkles className="w-12 h-12 text-blue-300 mb-3" />
              <p className="text-sm text-blue-400">准备生成...</p>
            </>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 pt-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>
            <div className="min-w-0 text-center">
              {workflowContext?.workflowName && (
                <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                  <GitBranch className="h-3.5 w-3.5" />
                  {workflowContext.workflowName}
                </div>
              )}
              <h1 className="text-base font-semibold text-slate-900">{tool.name}</h1>
            </div>
            <div className="w-16 shrink-0" />
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          {workflowContext?.workflowName && (
            <div className="border-b border-blue-100 bg-blue-50/70 px-6 py-4">
              <div className="flex flex-col gap-1 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                <div>
                  正在执行工作流「{workflowContext.workflowName}」
                </div>
                <div className="text-xs text-blue-600">
                  步骤 {Math.max(currentWorkflowStepIndex + 1, 1)} / {workflowStepIds.length || 1}
                </div>
              </div>
            </div>
          )}
          {interactionPhase === 'chat' && renderChatPhase()}
          {interactionPhase === 'confirm' && renderConfirmPhase()}
          {interactionPhase === 'guiding' && renderGuidingPhase()}
          {interactionPhase === 'result' && renderResultPhase()}
        </div>
      </div>

      {reviseModalOpen && selectedBlockIndex >= 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">
                  {selectedSnippet ? '优化选中的内容' : '优化这一段'}
                </h4>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedSnippet
                    ? '告诉我你想怎么改这段选中文本，我会尽量只动这部分，并保持所在段落其他内容稳定。'
                    : '告诉我这一段你想怎么调整，我只改这一段，其他内容不动。'}
                </p>
              </div>
              <button
                onClick={closeReviseModal}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-4 max-h-48 overflow-auto">
              {selectedSnippet ? (
                <div className="text-sm text-slate-700 whitespace-pre-wrap">{selectedSnippet}</div>
              ) : (
                <div
                  className="text-sm text-slate-700"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(resultBlocks[selectedBlockIndex]?.content || '') }}
                />
              )}
            </div>

            <textarea
              value={reviseInstruction}
              onChange={(e) => setReviseInstruction(e.target.value)}
              placeholder={
                selectedSnippet
                  ? '比如：把这句改得更像老师课堂表达；更适合三年级学生理解；保留原意但更生动。'
                  : '比如：这段再简单一点，更适合初二学生理解；加一个更贴近课堂的例子。'
              }
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
            />

            {reviseError && (
              <p className="mt-3 text-sm text-red-500">{reviseError}</p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={closeReviseModal}
                className="px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                onClick={handleReviseBlock}
                disabled={!reviseInstruction.trim() || isRevisingBlock}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-500 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRevisingBlock ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {selectedSnippet ? '确认优化选中内容' : '确认优化'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ToolDetailPage
