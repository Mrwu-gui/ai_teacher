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
} from 'lucide-react'
import { getToolById } from '../data/tools'

const sanitizeGeneratedResult = (text) => {
  if (!text) return ''

  let cleaned = text.replace(/\r\n/g, '\n').trimStart()

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

  return cleaned
}

const escapeHtml = (text) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const formatInlineMarkdown = (text) => {
  let html = text

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
    let html = '<table>'
    tableRows.forEach((row, index) => {
      const cells = row.split('|').filter(c => c.trim() !== '').map(c => formatInlineMarkdown(c.trim()))
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
    if (line.includes('|') && line.match(/\|.+\|/)) {
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
      const checked = taskItem[1].toLowerCase() === 'x' ? 'checked' : ''
      listItems.push(`<input type="checkbox" ${checked} disabled /> ${taskItem[2]}`)
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

const ToolDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const [tool, setTool] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // 新的交互状态
  const [interactionPhase, setInteractionPhase] = useState('chat') // 'chat' | 'guiding' | 'result'
  const [chatMessages, setChatMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // 引导式填写状态
  const [requiredFields, setRequiredFields] = useState([])
  const [advancedFields, setAdvancedFields] = useState([])
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const [formData, setFormData] = useState({})
  const [fieldAnswers, setFieldAnswers] = useState({})
  
  // 高级选项状态
  const [showAdvancedTip, setShowAdvancedTip] = useState(false)
  const [showAdvancedForm, setShowAdvancedForm] = useState(false)
  
  // 生成结果状态
  const [result, setResult] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [historyMode, setHistoryMode] = useState(false)

  // 推荐问题列表
  const [suggestedQuestions, setSuggestedQuestions] = useState([])

  // 加载工具数据
  useEffect(() => {
    const toolData = getToolById(id)
    if (toolData) {
      setTool(toolData)
      const initialData = {}
      toolData.fields.forEach((field) => {
        initialData[field.key] = field.default || (field.type === 'toggle' ? false : '')
      })
      setFormData(initialData)

      const historyItem = location.state?.historyItem
      if (historyItem && historyItem.templateId === toolData.id) {
        setHistoryMode(true)
        setFormData(historyItem.input || initialData)
        setFieldAnswers(historyItem.input || {})
        setResult(historyItem.result || '')
        setInteractionPhase('result')
      } else {
        setHistoryMode(false)
        setResult('')
        setInteractionPhase('chat')
        setChatMessages([])
        setFieldAnswers({})
        setCurrentFieldIndex(0)
        setShowAdvancedTip(false)
        setShowAdvancedForm(false)
      }

      // 生成随机推荐问题
      const questions = generateSuggestedQuestions(toolData)
      setSuggestedQuestions(questions)
    }
    setIsLoading(false)
  }, [id, location.state])

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // 生成推荐问题
  const generateSuggestedQuestions = (tool) => {
    const templatesByTool = {
      'lesson-plan': [
        '给五年级语文生成一份《慈母情深》教案，加入朗读环节。',
        '帮我做一份三年级数学《分数的初步认识》教案，想有操作活动。',
        '给初二物理设计一节《光的反射》教案，最好有实验探究。',
        '做一份高一英语阅读课教案，主题是环境保护。'
      ],
      'exercise-gen': [
        '给初二数学出10道一元二次方程练习，要答案解析。',
        '帮我做一份五年级语文《慈母情深》阅读检测，偏理解题。',
        '给六年级数学出一组百分数应用题专项训练。',
        '做一份高一英语课后作业，主题是健康生活。'
      ],
      'exam-review': [
        '给初三语文月考试卷做一份讲评方案，作文和文言文失分多。',
        '帮我设计一节八年级数学试卷讲评课，重点分析高频错题。',
        '给五年级英语单元测验做讲评，学生阅读理解较弱。',
        '做一份高二物理讲评方案，突出典型错误和解题思路。'
      ],
      'feedback-rubric': [
        '帮我给这篇五年级作文做反馈，重点看内容和细节描写。',
        '生成一份课堂观察反馈，面向授课教师，语气专业客观。',
        '给七年级英语口语展示做一个量规。',
        '帮我写一段鼓励性的作业反馈，面向学生本人。'
      ]
    }

    const templates = templatesByTool[tool.id] || [
      `帮我生成一份${tool.name}。`,
      `我需要一份${tool.name}，我先告诉你主题和目标。`,
      `请根据我的教学场景，帮我设计${tool.name}。`,
      `我想做一个更贴近课堂实际的${tool.name}。`,
    ]
    // 随机返回2-3个
    const shuffled = [...templates].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 4)
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

  // 发送消息
  const handleSendMessage = async () => {
    if (!userInput.trim()) return

    const message = userInput.trim()
    setUserInput('')

    // 新一轮自然语言分析前，清空上一次引导状态，避免把旧识别结果误判成这次也已填写
    if (!historyMode) {
      const resetData = {}
      tool.fields.forEach((field) => {
        resetData[field.key] = field.default || (field.type === 'toggle' ? false : '')
      })
      setFormData(resetData)
      setFieldAnswers({})
      setRequiredFields([])
      setAdvancedFields([])
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
      // 调用AI分析
      const analysisResult = await analyzeUserInput(message)
      
      // 添加AI回复
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: analysisResult.message 
      }])
      
      const recognized = analysisResult.recognized || {}
      const mergedAdvancedFields = tool.fields.filter(f => f.isAdvanced)
      const filteredRequiredFields = buildRequiredFieldQueue(
        tool,
        analysisResult.requiredFields || [],
        recognized,
        formData,
        fieldAnswers
      )

      // 设置需要收集的字段
      setRequiredFields(filteredRequiredFields)
      setAdvancedFields(analysisResult.advancedFields?.length ? analysisResult.advancedFields : mergedAdvancedFields)

      // 直接进入引导阶段
      setInteractionPhase('guiding')
      setCurrentFieldIndex(0)
      setFieldAnswers(prev => ({ ...prev, ...recognized }))
      setFormData(prev => ({ ...prev, ...recognized }))
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
      setShowAdvancedForm(false)
      setIsAnalyzing(false)
      inputRef.current?.focus()

    } catch (error) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，分析失败，请重新描述您的需求。' 
      }])
    }
    
    setIsAnalyzing(false)
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

  // 生成内容
  const handleGenerate = async () => {
    setIsGenerating(true)
    setResult('')

    try {
      const response = await fetch('/api/tools/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: tool.id,
          formData
        })
      })

      if (!response.ok) throw new Error('请求失败')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let generatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6))
              const content = data.choices?.[0]?.delta?.content
              if (content) {
                generatedText += content
                setResult(sanitizeGeneratedResult(generatedText))
              }
            } catch (e) {}
          }
        }
      }

      // 保存到历史
      saveToHistory(formData, generatedText)

    } catch (error) {
      console.error('生成失败:', error)
    }

    setIsGenerating(false)
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
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-50 rounded-3xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-blue-500" />
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
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        <span>更符合教学场景</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        <span>更精准的内容定位</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        <span>更适合学生水平</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        <span>更多细节支持</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleShowAdvanced}
                        className="flex-1 px-5 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-3xl text-sm font-medium transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        补充信息
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
          
          <div className="result-preview">
            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(result) }} />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px]">
          {isGenerating ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className="text-sm text-slate-500">正在生成内容...</p>
            </>
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
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>
            <h1 className="text-base font-semibold text-slate-900">{tool.name}</h1>
            <div className="w-16" />
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          {interactionPhase === 'chat' && renderChatPhase()}
          {interactionPhase === 'guiding' && renderGuidingPhase()}
          {interactionPhase === 'result' && renderResultPhase()}
        </div>
      </div>
    </div>
  )
}

export default ToolDetailPage
