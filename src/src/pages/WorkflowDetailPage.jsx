import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Download, FileText, GitBranch, Loader2, PlayCircle, RotateCcw, Sparkles, X } from 'lucide-react'
import { getToolById } from '../data/tools'
import { 
  createEmptyWorkflowRun,
  getWorkflowById, 
  getWorkflowExampleSeeds,
  getCurrentRun, 
  getWorkflowSummary, 
  resetCurrentRun, 
  summarizeNodeResult, 
  syncCustomWorkflowsFromServer, 
  syncWorkflowRunFromServer, 
  updateCurrentRun,
  archiveCurrentRun 
} from '../data/workflows'
import ConfirmInfoModal from '../components/ConfirmInfoModal'
import StepPromptModal from '../components/StepPromptModal'
import { markdownToHtml, sanitizeGeneratedResult, splitResultBlocks } from '../lib/resultMarkdown'
import {
  applyRecognizedAliases,
  deriveRecognizedFromMessage,
  deriveWorkflowRecognizedFromMessage,
  getFieldSemanticSlot,
  hasFilledValue,
  resolveSelectFieldCandidates,
} from '../lib/slotFilling'

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
      if (!data || data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) fullText += content
      } catch {}
    }

    if (done) {
      if (pending.startsWith('data: ') && pending !== 'data: [DONE]') {
        try {
          const parsed = JSON.parse(pending.slice(6))
          const content = parsed.choices?.[0]?.delta?.content
          if (content) fullText += content
        } catch {}
      }
      break
    }
  }

  return fullText.trim()
}

const COMMON_FIELD_KEYS = ['grade', 'subject', 'textbookVersion', 'unitName', 'seedContext', 'teachingObjectives']
const TOPIC_FIELD_KEYS = ['unit_name', 'topic', 'project_topic', 'lesson_topic']
const COMMON_TOOL_FIELD_KEYS = new Set(['grade_subject', 'grade', 'textbook_version', ...TOPIC_FIELD_KEYS])

const WORKFLOW_CONFIRM_FIELD_DEFS = {
  grade: { key: 'grade', label: '年级', placeholder: '如：三年级、初一' },
  subject: { key: 'subject', label: '学科', placeholder: '如：语文、数学' },
  textbookVersion: { key: 'textbookVersion', label: '教材版本', placeholder: '如：部编版、人教版' },
  unitName: { key: 'unitName', label: '课题/单元名称', placeholder: '如：荷花、圆柱的体积' },
}

const normalizeGrade = (value) => String(value || '').replace(/\s+/g, '').trim()

const gradeVariants = (grade) => {
  const normalized = normalizeGrade(grade)
  if (!normalized) return []

  const variants = new Set([normalized])

  if (/^[一二三四五六]年级$/.test(normalized)) {
    variants.add(`小学${normalized}`)
  }

  if (/^小学[一二三四五六]年级$/.test(normalized)) {
    variants.add(normalized.replace(/^小学/, ''))
  }

  if (/^初[一二三]$/.test(normalized) || /^高[一二三]$/.test(normalized)) {
    variants.add(normalized)
  }

  return Array.from(variants)
}

const toGradeSubject = (grade, subject, tool) => {
  if (!grade || !subject) return ''
  const options = tool.fields.find((field) => field.key === 'grade_subject')?.options || []

  for (const gradeValue of gradeVariants(grade)) {
    const merged = `${gradeValue}·${subject}`
    if (options.includes(merged)) return merged
  }

  const fuzzyMatched = options.find((option) => option.endsWith(`·${subject}`) && option.includes(normalizeGrade(grade).replace('年级', '')))
  return fuzzyMatched || ''
}

const getAliasedFieldValue = (fieldKey, extraFields, commonInput) => {
  const candidatesByField = {
    student_strengths: ['student_strengths', 'strengths'],
    strengths: ['strengths', 'student_strengths'],
    student_situation: ['student_situation', 'improvements', 'seedContext'],
    improvements: ['improvements', 'student_situation'],
  }

  const candidates = candidatesByField[fieldKey] || [fieldKey]
  for (const candidate of candidates) {
    const value =
      extraFields[candidate] !== undefined && extraFields[candidate] !== ''
        ? extraFields[candidate]
        : commonInput[candidate]
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }

  return ''
}

const COMMON_WORKFLOW_VALUE_KEYS = new Set(['grade', 'subject', 'textbookVersion', 'unitName', 'seedContext', 'teachingObjectives'])
const TOPIC_FIELD_KEY_SET = new Set(['topic', 'unit_name', 'project_topic', 'lesson_topic'])
const WORKFLOW_COMMON_FIELD_KEY_MAP = {
  textbook_version: 'textbookVersion',
  textbookVersion: 'textbookVersion',
  teaching_objectives: 'teachingObjectives',
  unit_name: 'unitName',
  topic: 'unitName',
  project_topic: 'unitName',
  lesson_topic: 'unitName',
}

const deriveWorkflowExtraFields = (steps, message, commonRecognized = {}) => {
  const mergedExtraFields = {}
  const semanticSlotValues = {}
  const baseValues = {
    grade: commonRecognized.grade || '',
    subject: commonRecognized.subject || '',
    textbookVersion: commonRecognized.textbookVersion || '',
    unitName: commonRecognized.unitName || '',
    seedContext: commonRecognized.seedContext || '',
    teachingObjectives: commonRecognized.teachingObjectives || '',
  }

  steps.forEach((tool) => {
    let recognized = deriveRecognizedFromMessage(tool, message, {}, {
      ...baseValues,
      ...mergedExtraFields,
    })
    recognized = applyRecognizedAliases(tool, recognized)
    recognized = resolveSelectFieldCandidates(tool, recognized, {
      ...baseValues,
      ...mergedExtraFields,
    }).recognized

    Object.entries(recognized).forEach(([fieldKey, value]) => {
      if (!hasFilledValue(value)) return

      const commonFieldKey = WORKFLOW_COMMON_FIELD_KEY_MAP[fieldKey]
      if (commonFieldKey && !hasFilledValue(baseValues[commonFieldKey])) {
        baseValues[commonFieldKey] = value
      }

      if (!COMMON_WORKFLOW_VALUE_KEYS.has(fieldKey)) {
        mergedExtraFields[fieldKey] = value
      }

      const semanticKey = getFieldSemanticSlot(fieldKey)
      if (!semanticSlotValues[semanticKey]) {
        semanticSlotValues[semanticKey] = value
      }
    })
  })

  steps.forEach((tool) => {
    tool.fields.forEach((field) => {
      if (hasFilledValue(mergedExtraFields[field.key])) return
      const semanticKey = getFieldSemanticSlot(field.key)
      const semanticValue = semanticSlotValues[semanticKey]
      if (!hasFilledValue(semanticValue)) return
      if (COMMON_WORKFLOW_VALUE_KEYS.has(field.key)) return
      if (TOPIC_FIELD_KEY_SET.has(field.key) && hasFilledValue(baseValues.unitName)) return
      mergedExtraFields[field.key] = semanticValue
    })
  })

  return {
    commonInputPatch: {
      grade: baseValues.grade,
      subject: baseValues.subject,
      textbookVersion: baseValues.textbookVersion,
      unitName: baseValues.unitName,
      seedContext: baseValues.seedContext,
      teachingObjectives: baseValues.teachingObjectives,
    },
    extraFields: mergedExtraFields,
  }
}

const buildToolFormData = (tool, commonInput, extraFields) => {
  const formData = {}

  tool.fields.forEach((field) => {
    if (extraFields[field.key] !== undefined && extraFields[field.key] !== '') {
      formData[field.key] = extraFields[field.key]
      return
    }

    if (field.key === 'grade_subject') {
      const value = toGradeSubject(commonInput.grade, commonInput.subject, tool)
      if (value) formData[field.key] = value
      return
    }

    if (field.key === 'textbook_version' && commonInput.textbookVersion) {
      formData[field.key] = commonInput.textbookVersion
      return
    }

    if (['unit_name', 'topic', 'project_topic', 'lesson_topic'].includes(field.key) && commonInput.unitName) {
      formData[field.key] = commonInput.unitName
      return
    }

    if (field.key === 'grade' && commonInput.grade) {
      formData[field.key] = commonInput.grade.replace('小学', '').replace('年级', '年级')
      return
    }

    if (field.key === 'teaching_objectives' && commonInput.teachingObjectives) {
      formData[field.key] = commonInput.teachingObjectives
      return
    }

    const aliasedValue = getAliasedFieldValue(field.key, extraFields, commonInput)
    if (aliasedValue !== '') {
      formData[field.key] = aliasedValue
      return
    }

    if (field.default !== undefined) {
      formData[field.key] = field.default
    }
  })

  return formData
}

const hasVisibleField = (tool, key) => tool.fields.some((field) => field.key === key && !field.isAdvanced)

const hasRequiredVisibleField = (tool, key) => tool.fields.some((field) => field.key === key && field.required && !field.isAdvanced)

const getWorkflowConfirmFields = (steps) => {
  if (!Array.isArray(steps) || steps.length === 0) return []

  const confirmFields = []
  const needsGrade = steps.some((tool) => hasVisibleField(tool, 'grade_subject') || hasVisibleField(tool, 'grade'))
  const needsSubject = steps.some((tool) => hasVisibleField(tool, 'grade_subject'))
  const needsTextbook = steps.some((tool) => hasVisibleField(tool, 'textbook_version'))
  const needsUnit = steps.some((tool) => TOPIC_FIELD_KEYS.some((key) => hasVisibleField(tool, key)))

  if (needsGrade) {
    confirmFields.push({
      ...WORKFLOW_CONFIRM_FIELD_DEFS.grade,
      required: steps.some((tool) => hasRequiredVisibleField(tool, 'grade_subject') || hasRequiredVisibleField(tool, 'grade')),
    })
  }

  if (needsSubject) {
    confirmFields.push({
      ...WORKFLOW_CONFIRM_FIELD_DEFS.subject,
      required: steps.some((tool) => hasRequiredVisibleField(tool, 'grade_subject')),
    })
  }

  if (needsTextbook) {
    confirmFields.push({
      ...WORKFLOW_CONFIRM_FIELD_DEFS.textbookVersion,
      required: steps.some((tool) => hasRequiredVisibleField(tool, 'textbook_version')),
    })
  }

  if (needsUnit) {
    confirmFields.push({
      ...WORKFLOW_CONFIRM_FIELD_DEFS.unitName,
      required: steps.some((tool) => TOPIC_FIELD_KEYS.some((key) => hasRequiredVisibleField(tool, key))),
    })
  }

  return confirmFields
}

const getFirstStepRequiredFields = (steps) => {
  const firstStep = steps[0]
  if (!firstStep) return []

  return firstStep.fields
    .filter((field) => field.required && !field.isAdvanced && !COMMON_TOOL_FIELD_KEYS.has(field.key))
    .map((field) => ({
      key: field.key,
      label: field.label,
      placeholder: field.placeholder || '请输入',
      required: true,
    }))
}

const isFieldVisible = (field, formData) => {
  if (!field.showWhen) return true
  const currentValue = formData[field.showWhen.key]
  if (Array.isArray(field.showWhen.in)) {
    return field.showWhen.in.includes(currentValue)
  }
  if (field.showWhen.equals !== undefined) {
    return currentValue === field.showWhen.equals
  }
  return true
}

const getMissingFields = (tool, formData) =>
  tool.fields.filter(
    (field) =>
      field.required &&
      !field.isAdvanced &&
      isFieldVisible(field, formData) &&
      (formData[field.key] === undefined || formData[field.key] === null || formData[field.key] === '')
  )

const formatResultSnippet = (text) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, 90)
const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const WORKFLOW_STARTER_COPY = {
  'lesson-prep-flow': {
    title: '开始一节课备课',
    description: '先把这节课的年级、课题和你的想法说出来，我会按步骤帮你把教案、练习和作业顺下来。',
    placeholder: '例如：我想给三年级讲《荷花》，希望课堂更生动一点。',
  },
  'unit-teaching-flow': {
    title: '开始单元整体备课',
    description: '先说这个单元的年级、主题和目标，我会接着把单元设计、学历案这些内容串起来。',
    placeholder: '例如：四年级语文第六单元，想做一套完整的单元整体设计。',
  },
  'assessment-review-flow': {
    title: '开始练习与讲评',
    description: '先说这次练习或测验围绕什么内容，我会接着把命题、讲评和反馈顺下来。',
    placeholder: '例如：给七年级分数运算做一套练习并配课堂讲评稿。',
  },
  'post-exam-feedback-flow': {
    title: '开始考后反馈',
    description: '先说考试或作业后最想处理的问题，我会接着把讲评、反馈和家校沟通材料串起来。',
    placeholder: '例如：期中考试后，想生成试卷讲评、作文反馈和家校沟通文案。',
  },
  'class-management-flow': {
    title: '开始班主任沟通流程',
    description: '先把班级或学生的情况说清楚，我会接着把班会、支持方案和家校沟通顺起来。',
    placeholder: '例如：班里最近纪律波动，想准备一场主题班会和后续家校沟通。',
  },
  'teaching-research-flow': {
    title: '开始教研活动支持',
    description: '先说这次教研要围绕什么内容展开，我会接着把说课、评课和活动方案准备起来。',
    placeholder: '例如：下周有公开课，想准备说课稿、听评课要点和教研活动方案。',
  },
}

const WorkflowDetailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { workflowId } = useParams()
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const isFreshEntry = searchParams.get('fresh') === '1'
  const isResumeEntry = searchParams.get('resume') === '1'
  const [refreshKey, setRefreshKey] = useState(0)
  const [isBooting, setIsBooting] = useState(true)
  const [phase, setPhase] = useState('idle')
  const [seedInput, setSeedInput] = useState('')
  const [analyzingSeed, setAnalyzingSeed] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [runError, setRunError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [expandedResultId, setExpandedResultId] = useState('')
  const [workflowReviseModalOpen, setWorkflowReviseModalOpen] = useState(false)
  const [workflowSelectedToolId, setWorkflowSelectedToolId] = useState('')
  const [workflowSelectedBlockIndex, setWorkflowSelectedBlockIndex] = useState(-1)
  const [workflowSelectedSnippet, setWorkflowSelectedSnippet] = useState('')
  const [workflowReviseInstruction, setWorkflowReviseInstruction] = useState('')
  const [workflowReviseError, setWorkflowReviseError] = useState('')
  const [workflowReviseSuccess, setWorkflowReviseSuccess] = useState('')
  const [workflowSelectionToolbar, setWorkflowSelectionToolbar] = useState(null)
  const [workflowSelectionNotice, setWorkflowSelectionNotice] = useState(null)
  const [isRevisingWorkflowBlock, setIsRevisingWorkflowBlock] = useState(false)
  const workflowResultPreviewRef = useRef(null)
  const [commonInput, setCommonInput] = useState({
    grade: '',
    subject: '',
    textbookVersion: '',
    unitName: '',
    seedContext: '',
    teachingObjectives: '',
  })
  const [extraFields, setExtraFields] = useState({})
  const [awaitingPrompt, setAwaitingPrompt] = useState(null)

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showStepPromptModal, setShowStepPromptModal] = useState(false)

  const workflow = useMemo(() => {
    const found = getWorkflowById(workflowId)
    return found ? getWorkflowSummary(found) : null
  }, [workflowId, refreshKey])

  const storedWorkflowRun = useMemo(() => getCurrentRun(workflowId), [workflowId, refreshKey])
  const workflowRun = useMemo(
    () => (isFreshEntry && !isResumeEntry ? createEmptyWorkflowRun() : storedWorkflowRun || createEmptyWorkflowRun()),
    [isFreshEntry, isResumeEntry, storedWorkflowRun]
  )
  const steps = useMemo(() => (workflow?.steps || workflow?.stepIds?.map((id) => getToolById(id)).filter(Boolean) || []), [workflow])
  const confirmFields = useMemo(
    () => [...getWorkflowConfirmFields(steps), ...getFirstStepRequiredFields(steps)],
    [steps]
  )
  const confirmValues = useMemo(() => ({ ...commonInput, ...extraFields }), [commonInput, extraFields])
  const isConfirmValid = useMemo(
    () => confirmFields.every((field) => !field.required || String(confirmValues[field.key] || '').trim()),
    [confirmFields, confirmValues]
  )
  const exampleChips = useMemo(() => getWorkflowExampleSeeds(workflowId), [workflowId])
  const starterCopy = WORKFLOW_STARTER_COPY[workflowId] || {
    title: `开始「${workflow?.name || '工作流'}」`,
    description: '先把这次要准备的内容和目标说出来，我会按这条流程接着往下整理。',
    placeholder: `例如：我想用「${workflow?.name || '这个工作流'}」把这次要用的材料一次整理出来。`,
  }
  const [stepStates, setStepStates] = useState([])

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      setIsBooting(true)
      setPhase('idle')
      setSeedInput('')
      setRunError('')
      setCommonInput({
        grade: '',
        subject: '',
        textbookVersion: '',
        unitName: '',
        seedContext: '',
        teachingObjectives: '',
      })
      setExtraFields({})
      setAwaitingPrompt(null)
      setShowConfirmModal(false)
      setShowStepPromptModal(false)
      await syncCustomWorkflowsFromServer()
      if (workflowId && !isFreshEntry) await syncWorkflowRunFromServer(workflowId)
      if (cancelled) return
      setRefreshKey((value) => value + 1)
      setIsBooting(false)
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [workflowId, isFreshEntry])

  useEffect(() => {
    if (!workflow) return
    if (isFreshEntry && !isResumeEntry) {
      setStepStates(
        steps.map((tool, index) => ({
          toolId: tool.id,
          name: tool.name,
          status: 'pending',
          result: '',
          summary: '',
          stepNumber: index + 1,
        }))
      )
      return
    }

    if (workflowRun?.meta?.commonInput && Object.keys(workflowRun.meta.commonInput).length > 0) {
      setCommonInput((current) => ({ ...current, ...workflowRun.meta.commonInput }))
    }
    if (workflowRun?.meta?.seedInput) {
      setSeedInput(workflowRun.meta.seedInput)
    }
    if (workflowRun?.meta?.extraFields) {
      setExtraFields(workflowRun.meta.extraFields)
    }
    if (workflowRun?.meta?.awaitingPrompt) {
      setAwaitingPrompt(workflowRun.meta.awaitingPrompt)
      setShowStepPromptModal(true)
    }
    if (['running', 'waiting', 'error', 'done', 'paused'].includes(workflowRun?.meta?.phase)) {
      setPhase('run')
    } else {
      setPhase('idle')
    }
    setStepStates(
      steps.map((tool, index) => ({
        toolId: tool.id,
        name: tool.name,
        status: workflowRun.steps?.[tool.id]?.result ? 'done' : (workflowRun.steps?.[tool.id]?.status || 'pending'),
        result: workflowRun.steps?.[tool.id]?.result || '',
        summary: workflowRun.steps?.[tool.id]?.summary || '',
        stepNumber: index + 1,
      }))
    )
  }, [workflow, workflowRun, steps, isFreshEntry, isResumeEntry])

  useEffect(() => {
    if (awaitingPrompt && phase === 'run') {
      setShowStepPromptModal(true)
    }
  }, [awaitingPrompt, phase])

  const clearWorkflowTextSelection = () => {
    if (typeof window === 'undefined') return
    window.getSelection()?.removeAllRanges()
  }

  const getWorkflowBlockIndexFromNode = (node) => {
    let current = node
    while (current) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const blockElement = current.closest?.('[data-workflow-result-block-index]')
        if (blockElement) {
          const index = Number(blockElement.getAttribute('data-workflow-result-block-index'))
          return Number.isNaN(index) ? -1 : index
        }
      }
      current = current.parentNode
    }
    return -1
  }

  const updateWorkflowSelectionToolbar = (toolId) => {
    if (!workflowResultPreviewRef.current) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setWorkflowSelectionToolbar(null)
      setWorkflowSelectionNotice(null)
      return
    }

    const text = selection.toString().trim()
    if (text.length < 2) {
      setWorkflowSelectionToolbar(null)
      setWorkflowSelectionNotice(null)
      return
    }

    const range = selection.getRangeAt(0)
    const commonAncestor = range.commonAncestorContainer
    if (!workflowResultPreviewRef.current.contains(commonAncestor)) {
      setWorkflowSelectionToolbar(null)
      setWorkflowSelectionNotice(null)
      return
    }

    const startIndex = getWorkflowBlockIndexFromNode(range.startContainer)
    const endIndex = getWorkflowBlockIndexFromNode(range.endContainer)
    const rect = range.getBoundingClientRect()
    if (startIndex < 0 || endIndex < 0 || startIndex !== endIndex) {
      setWorkflowSelectionToolbar(null)
      setWorkflowSelectionNotice({
        message: '当前只支持在同一段内改写，请缩小到单段内容再试。',
        top: Math.max(rect.top - 52, 16),
        left: clamp(rect.left + rect.width / 2, 180, window.innerWidth - 180),
      })
      return
    }

    setWorkflowSelectionNotice(null)
    setWorkflowSelectionToolbar({
      text,
      toolId,
      blockIndex: startIndex,
      top: Math.max(rect.top - 52, 16),
      left: clamp(rect.left + rect.width / 2, 120, window.innerWidth - 120),
    })
  }

  const openWorkflowReviseModal = (toolId, blockIndex, snippet = '') => {
    setWorkflowSelectedToolId(toolId)
    setWorkflowSelectedBlockIndex(blockIndex)
    setWorkflowSelectedSnippet(snippet)
    setWorkflowReviseInstruction('')
    setWorkflowReviseError('')
    setWorkflowReviseSuccess('')
    setWorkflowSelectionToolbar(null)
    setWorkflowReviseModalOpen(true)
  }

  const closeWorkflowReviseModal = () => {
    if (isRevisingWorkflowBlock) return
    setWorkflowReviseModalOpen(false)
    setWorkflowSelectedToolId('')
    setWorkflowSelectedBlockIndex(-1)
    setWorkflowSelectedSnippet('')
    setWorkflowReviseInstruction('')
    setWorkflowReviseError('')
  }

  const handleWorkflowResultMouseUp = (toolId) => {
    window.setTimeout(() => updateWorkflowSelectionToolbar(toolId), 0)
  }

  const handleWorkflowReviseBlock = async () => {
    const step = stepStates.find((item) => item.toolId === workflowSelectedToolId)
    if (!step || workflowSelectedBlockIndex < 0 || !workflowReviseInstruction.trim()) return
    const resultBlocks = splitResultBlocks(step.result || '')
    const targetBlock = resultBlocks[workflowSelectedBlockIndex]
    if (!targetBlock) return

    const instruction = workflowSelectedSnippet
      ? `请只改写这一段中的这部分内容：“${workflowSelectedSnippet}”。${workflowReviseInstruction.trim()}。请保持这段其他内容不变，并直接输出更新后的完整这一段。`
      : workflowReviseInstruction.trim()

    setIsRevisingWorkflowBlock(true)
    setWorkflowReviseError('')
    try {
      const response = await fetch('/api/tools/revise-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: workflowSelectedToolId,
          formData: workflowRun.steps?.[workflowSelectedToolId]?.input || {},
          fullContent: step.result,
          selectedBlock: targetBlock.content,
          instruction,
        }),
      })

      if (!response.ok) throw new Error('局部改写失败，请稍后重试。')
      const data = await response.json()
      const revisedBlock = sanitizeGeneratedResult(data?.revisedBlock || '')
      if (!revisedBlock) throw new Error('改写结果为空，请重试。')

      const nextBlocks = [...resultBlocks]
      nextBlocks[workflowSelectedBlockIndex] = {
        ...nextBlocks[workflowSelectedBlockIndex],
        content: revisedBlock,
      }
      const nextResult = sanitizeGeneratedResult(nextBlocks.map((block) => block.content).join('\n\n'))

      setStepStates((current) => current.map((item) => (
        item.toolId === workflowSelectedToolId
          ? { ...item, result: nextResult, summary: summarizeNodeResult(nextResult), status: 'done' }
          : item
      )))
      updateCurrentRun(workflow.id, (current) => ({
        ...current,
        steps: {
          ...(current.steps || {}),
          [workflowSelectedToolId]: {
            ...(current.steps?.[workflowSelectedToolId] || {}),
            status: 'done',
            result: nextResult,
            summary: summarizeNodeResult(nextResult),
          },
        },
        updatedAt: new Date().toISOString(),
      }))
      setWorkflowReviseSuccess(workflowSelectedSnippet ? '选中的内容已经更新' : '这一段已经更新')
      clearWorkflowTextSelection()
      closeWorkflowReviseModal()
    } catch (error) {
      setWorkflowReviseError(error?.message || '局部改写失败，请稍后重试。')
    } finally {
      setIsRevisingWorkflowBlock(false)
    }
  }

  if (isBooting) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto flex max-w-4xl items-center justify-center rounded-3xl border border-blue-100 bg-white p-10 text-slate-500">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-blue-500" />
          正在准备工作流...
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-3xl border border-blue-100 bg-white p-6">
          <div className="text-lg font-semibold text-slate-900">没有找到这条工作流</div>
        </div>
      </div>
    )
  }

  const completedCount = stepStates.filter((item) => item.status === 'done').length
  const progressPercent = stepStates.length ? Math.round((completedCount / stepStates.length) * 100) : 0
  const allDone = stepStates.length > 0 && completedCount === stepStates.length

  const updateStepState = (toolId, patch) => {
    setStepStates((current) => current.map((item) => (item.toolId === toolId ? { ...item, ...patch } : item)))
  }

  const persistNodeStatus = (tool, patch, extraMeta = {}) => {
    updateCurrentRun(workflow.id, (current) => ({
      ...current,
      workflowId: workflow.id,
      workflowName: workflow.name,
      topic: commonInput.unitName || seedInput.slice(0, 50),
      steps: {
        ...(current.steps || {}),
        [tool.id]: {
          ...(current.steps?.[tool.id] || {}),
          ...patch,
        },
      },
      meta: {
        ...(current.meta || {}),
        seedInput,
        commonInput,
        extraFields,
        updatedAt: new Date().toISOString(),
        ...extraMeta,
      },
    }))
  }

  const persistRun = (tool, toolFormData, result) => {
    const mergedFields = {
      ...(workflowRun.fields || {}),
      ...Object.fromEntries(Object.entries(commonInput).filter(([key]) => COMMON_FIELD_KEYS.includes(key))),
      ...extraFields,
      ...toolFormData,
    }

    updateCurrentRun(workflow.id, (current) => ({
      ...current,
      workflowId: workflow.id,
      workflowName: workflow.name,
      topic: commonInput.unitName || seedInput.slice(0, 50),
      fields: { ...(current.fields || {}), ...mergedFields },
      steps: {
        ...(current.steps || {}),
        [tool.id]: {
          ...(current.steps?.[tool.id] || {}),
          status: 'done',
          input: toolFormData,
          result,
          summary: summarizeNodeResult(result),
          attempts: (current.steps?.[tool.id]?.attempts || 0) + 1,
          completedAt: new Date().toISOString(),
        },
      },
      meta: {
        ...(current.meta || {}),
        phase: 'running',
        currentNodeId: tool.id,
        waitingNodeId: '',
        awaitingPrompt: null,
        lastError: '',
        seedInput,
        commonInput,
        extraFields,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  const buildWorkflowContextPayload = (stepIndex) => {
    const previousSummaries = steps
      .slice(0, stepIndex)
      .map((tool, index) => {
        const node = workflowRun.steps?.[tool.id]
        if (!node?.summary) return null
        return {
          step: index + 1,
          name: tool.name,
          summary: node.summary,
        }
      })
      .filter(Boolean)

    const immediatePreviousResult = stepIndex > 0 ? workflowRun.steps?.[steps[stepIndex - 1]?.id]?.result || '' : ''

    return {
      commonInput,
      previousSummaries,
      immediatePreviousResult: immediatePreviousResult ? immediatePreviousResult.slice(0, 1200) : '',
    }
  }

  const analyzeSeed = async () => {
    if (!seedInput.trim()) return
    setAnalyzingSeed(true)
    setRunError('')
    try {
      const response = await fetch('/api/workflows/seed-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowName: workflow.name,
          workflowDescription: workflow.description,
          message: seedInput.trim(),
        }),
      })
      if (!response.ok) throw new Error('分析失败')
      const data = await response.json()
      const recognized = deriveWorkflowRecognizedFromMessage(seedInput.trim(), data?.recognized || {})
      const workflowSeedExtraction = deriveWorkflowExtraFields(steps, seedInput.trim(), recognized)
      const mergedCommonInput = {
        ...commonInput,
        grade: workflowSeedExtraction.commonInputPatch.grade || recognized.grade || commonInput.grade,
        subject: workflowSeedExtraction.commonInputPatch.subject || recognized.subject || commonInput.subject,
        textbookVersion: workflowSeedExtraction.commonInputPatch.textbookVersion || recognized.textbookVersion || commonInput.textbookVersion,
        unitName: workflowSeedExtraction.commonInputPatch.unitName || recognized.unitName || commonInput.unitName,
        seedContext: workflowSeedExtraction.commonInputPatch.seedContext || recognized.seedContext || seedInput.trim(),
        teachingObjectives: workflowSeedExtraction.commonInputPatch.teachingObjectives || commonInput.teachingObjectives,
      }
      const mergedExtraFields = {
        ...extraFields,
        ...workflowSeedExtraction.extraFields,
      }
      setCommonInput((current) => ({
        ...current,
        ...mergedCommonInput,
      }))
      setExtraFields((current) => ({
        ...current,
        ...mergedExtraFields,
      }))
      updateCurrentRun(workflow.id, (current) => ({
        ...current,
        workflowId: workflow.id,
        workflowName: workflow.name,
        topic: mergedCommonInput.unitName || seedInput.slice(0, 50),
        meta: {
          ...(current.meta || {}),
          phase: 'confirm',
          seedInput: seedInput.trim(),
          commonInput: mergedCommonInput,
          extraFields: mergedExtraFields,
          updatedAt: new Date().toISOString(),
        },
      }))
      setAnalyzingSeed(false)
      setShowConfirmModal(true)
    } catch (error) {
      setAnalyzingSeed(false)
      setRunError(error?.message || '种子分析失败')
    }
  }

  const handleConfirmInfo = () => {
    if (!isConfirmValid) {
      const missingLabels = confirmFields
        .filter((field) => field.required && !String(confirmValues[field.key] || '').trim())
        .map((field) => field.label)
      setRunError(`请先确认：${missingLabels.join('、')}`)
      return
    }
    setShowConfirmModal(false)
    startRun()
  }

  const startRun = async (teachingObjectives = '') => {
    const finalCommonInput = teachingObjectives ? { ...commonInput, teachingObjectives } : commonInput
    const finalExtraFields = { ...extraFields }
    const missingRequiredFields = confirmFields
      .filter((field) => {
        const value = field.key in finalCommonInput ? finalCommonInput[field.key] : finalExtraFields[field.key]
        return field.required && !String(value || '').trim()
      })
      .map((field) => field.label)

    if (missingRequiredFields.length > 0) {
      setRunError(`请先确认：${missingRequiredFields.join('、')}`)
      return
    }

    setCommonInput(finalCommonInput)
    setExtraFields(finalExtraFields)

    resetCurrentRun(workflow.id)
    setAwaitingPrompt(null)
    setStepStates((current) => current.map((item) => ({ ...item, status: 'pending', result: '' })))
    setPhase('run')
    await runFromStep(0, finalExtraFields, finalCommonInput)
  }

  const runFromStep = async (startIndex, mergedExtraFields = extraFields, currentCommonInput = commonInput, options = {}) => {
    const stopAfterCurrent = options.stopAfterCurrent || false
    setRunError('')
    setIsRunning(true)
    setAwaitingPrompt(null)

    try {
      for (let index = startIndex; index < steps.length; index += 1) {
        const tool = steps[index]
        const toolFormData = buildToolFormData(tool, currentCommonInput, mergedExtraFields)
        const missingFields = getMissingFields(tool, toolFormData).filter((field) => {
          if (field.key === 'grade_subject') return false
          if (field.key === 'textbook_version' && currentCommonInput.textbookVersion) return false
          if (['topic', 'unit_name', 'project_topic', 'lesson_topic'].includes(field.key) && currentCommonInput.unitName) return false
          if (field.key === 'teaching_objectives' && currentCommonInput.teachingObjectives) return false
          return true
        })

        if (missingFields.length > 0) {
          updateStepState(tool.id, { status: 'waiting' })
          const nextPrompt = {
            stepIndex: index,
            toolId: tool.id,
            toolName: tool.name,
            fields: missingFields.map((field) => ({
              key: field.key,
              label: field.label,
              type: field.type,
              options: field.options || [],
              placeholder: field.placeholder || '',
              required: Boolean(field.required),
            })),
            values: Object.fromEntries(missingFields.map((field) => [field.key, mergedExtraFields[field.key] || ''])),
          }
          setAwaitingPrompt(nextPrompt)
          persistNodeStatus(tool, { status: 'waiting' }, { phase: 'waiting', currentNodeId: tool.id, waitingNodeId: tool.id, awaitingPrompt: nextPrompt })
          setIsRunning(false)
          setShowStepPromptModal(true)
          return
        }

        updateStepState(tool.id, { status: 'running', result: '' })
        persistNodeStatus(tool, { status: 'running', startedAt: new Date().toISOString() }, { phase: 'running', currentNodeId: tool.id, waitingNodeId: '', awaitingPrompt: null, lastError: '' })
        const response = await fetch('/api/tools/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId: tool.id, formData: { ...toolFormData, __workflowContext: buildWorkflowContextPayload(index) } }),
        })
        const result = sanitizeGeneratedResult(await readStreamingText(response))
        updateStepState(tool.id, { status: 'done', result, summary: summarizeNodeResult(result) })
        persistRun(tool, toolFormData, result)

        if (stopAfterCurrent) {
          updateCurrentRun(workflow.id, (current) => ({
            ...current,
            meta: {
              ...(current.meta || {}),
              phase: 'paused',
              currentNodeId: '',
              waitingNodeId: '',
              awaitingPrompt: null,
              lastError: '',
              seedInput,
              commonInput: currentCommonInput,
              extraFields: mergedExtraFields,
              updatedAt: new Date().toISOString(),
            },
          }))
          setRefreshKey((value) => value + 1)
          return
        }
      }

      updateCurrentRun(workflow.id, (current) => ({
        ...current,
        completedAt: new Date().toISOString(),
        meta: {
          ...(current.meta || {}),
          phase: 'done',
          currentNodeId: '',
          waitingNodeId: '',
          awaitingPrompt: null,
          lastError: '',
          seedInput,
          commonInput: currentCommonInput,
          extraFields: mergedExtraFields,
          updatedAt: new Date().toISOString(),
        },
      }))
      
      // 归档到历史记录
      archiveCurrentRun(workflow.id)
      
      setRefreshKey((value) => value + 1)
    } catch (error) {
      updateCurrentRun(workflow.id, (current) => ({
        ...current,
        meta: {
          ...(current.meta || {}),
          phase: 'error',
          lastError: error?.message || '工作流执行失败',
          seedInput,
          commonInput: currentCommonInput,
          extraFields: mergedExtraFields,
          updatedAt: new Date().toISOString(),
        },
      }))
      
      // 错误时也归档
      archiveCurrentRun(workflow.id)
      
      setRunError(error?.message || '工作流执行失败，请稍后重试。')
    } finally {
      setIsRunning(false)
    }
  }

  const handleContinuePrompt = async () => {
    if (!awaitingPrompt) return
    const missing = awaitingPrompt.fields.filter((field) => !awaitingPrompt.values[field.key])
    if (missing.length > 0) {
      setRunError(`还需要补充：${missing.map((field) => field.label).join('、')}`)
      return
    }

    const nextExtraFields = { ...extraFields, ...awaitingPrompt.values }
    setExtraFields(nextExtraFields)
    setShowStepPromptModal(false)
    setAwaitingPrompt(null)
    await runFromStep(awaitingPrompt.stepIndex, nextExtraFields)
  }

  const handleSkipPrompt = () => {
    setShowStepPromptModal(false)
    setAwaitingPrompt(null)
  }

  const handleReopenPrompt = () => {
    if (!awaitingPrompt) return
    setShowStepPromptModal(true)
    setRunError('')
  }

  const handleResumeRun = async () => {
    const nextIndex = steps.findIndex((tool) => workflowRun.steps?.[tool.id]?.status !== 'done')
    setPhase('run')
    await runFromStep(nextIndex >= 0 ? nextIndex : 0, extraFields)
  }

  const handleRerunNode = async (toolId) => {
    const targetIndex = steps.findIndex((tool) => tool.id === toolId)
    if (targetIndex === -1) return
    updateCurrentRun(workflow.id, (current) => ({
      ...current,
      steps: {
        ...(current.steps || {}),
        [toolId]: {
          ...(current.steps?.[toolId] || {}),
          status: 'pending',
          result: '',
          summary: '',
        },
      },
      meta: {
        ...(current.meta || {}),
        phase: 'running',
        currentNodeId: toolId,
        waitingNodeId: '',
        awaitingPrompt: null,
        lastError: '',
        updatedAt: new Date().toISOString(),
      },
    }))
    setStepStates((current) => current.map((item) => item.toolId === toolId ? { ...item, status: 'pending', result: '', summary: '' } : item))
    setAwaitingPrompt(null)
    setPhase('run')
    await runFromStep(targetIndex, extraFields, commonInput, { stopAfterCurrent: true })
  }

  const handleExportBundle = async () => {
    const finishedSteps = stepStates.filter((item) => item.result)
    if (finishedSteps.length === 0) return
    setExporting(true)
    try {
      const response = await fetch('/api/workflow-bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflow.id,
          workflowName: workflow.name,
          formData: commonInput,
          files: finishedSteps.map((item) => ({
            filename: `${item.stepNumber}-${item.name}.md`,
            content: item.result,
          })),
        }),
      })
      if (!response.ok) throw new Error('导出失败')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${workflow.name}.zip`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setRunError(error?.message || '导出失败')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <button onClick={() => navigate('/workflows')} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          返回工作流
        </button>

        <div className="rounded-3xl border border-blue-100 bg-white p-6">
          <div className="flex items-center gap-2 text-blue-600">
            <GitBranch className="h-4 w-4" />
            <span className="text-sm font-medium">{workflow.name}</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">AI 工作流</div>
          <div className="mt-2 text-sm text-slate-500">{workflow.description}</div>
        </div>

        {/* idle 状态：极简启动 */}
        {phase === 'idle' && (
          <div className="rounded-3xl border border-blue-100 bg-white p-8">
            <div className="mx-auto max-w-2xl">
              <div className="mb-6 text-center">
                <div className="text-2xl font-bold text-slate-900 mb-2">{starterCopy.title}</div>
                <div className="text-slate-500">{starterCopy.description}</div>
              </div>

              <div className="mb-4">
                <textarea
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  rows={4}
                  placeholder={starterCopy.placeholder}
                  className="w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-base outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                {exampleChips.map((chip, index) => (
                  <button
                    key={index}
                    onClick={() => setSeedInput(chip)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>

                <button
                  onClick={analyzeSeed}
                  disabled={!seedInput.trim() || analyzingSeed}
                  className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    {analyzingSeed ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
                  {analyzingSeed ? '正在整理信息...' : '开始流程'}
                  </div>
                </button>

              {runError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {runError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* run 状态：执行控制台 */}
        {phase === 'run' && (
          <>
            <div className="rounded-3xl border border-blue-100 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-600">正在执行「{workflow.name}」</div>
                  <div className="mt-2 text-sm text-slate-500">课题：{commonInput.unitName || '待确认'}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">{progressPercent}%</div>
                  <div className="text-xs text-slate-500">{completedCount}/{stepStates.length} 步骤</div>
                </div>
              </div>
              <div className="mt-3 h-3 rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-blue-500 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {allDone && (
                  <button
                    onClick={handleExportBundle}
                    disabled={exporting}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    导出结果包
                  </button>
                )}
                {['running', 'waiting', 'error', 'paused'].includes(workflowRun.meta?.phase || '') && !isRunning && (
                  <button
                    onClick={handleResumeRun}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    继续未完成节点
                  </button>
                )}
                {awaitingPrompt && !showStepPromptModal && (
                  <button
                    onClick={handleReopenPrompt}
                    className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    继续补充参数
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white p-6">
              <div className="mb-4 text-lg font-semibold text-slate-900">执行清单</div>
              <div className="space-y-3">
                {stepStates.map((item) => {
                  const isExpanded = expandedResultId === item.toolId
                  const displayStatus = item.result ? 'done' : item.status
                  const statusColors = {
                    pending: 'text-slate-400',
                    running: 'text-blue-600',
                    waiting: 'text-amber-600',
                    done: 'text-emerald-600',
                    error: 'text-red-600',
                  }
                  const statusIcons = {
                    pending: <CheckCircle2 className="h-4 w-4" />,
                    running: <Loader2 className="h-4 w-4 animate-spin" />,
                    waiting: <CheckCircle2 className="h-4 w-4" />,
                    done: <CheckCircle2 className="h-4 w-4" />,
                    error: <CheckCircle2 className="h-4 w-4" />,
                  }

                  return (
                    <div key={item.toolId} className="rounded-2xl border border-slate-200 px-4 py-4 hover:border-slate-300 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">{item.stepNumber}. {item.name}</div>
                          <div className={`mt-2 text-sm inline-flex items-center gap-1 ${statusColors[displayStatus]}`}>
                            {statusIcons[displayStatus]}
                            {displayStatus === 'done' && '已完成'}
                            {displayStatus === 'running' && '草稿生成中...'}
                            {displayStatus === 'waiting' && '等待补充参数'}
                            {displayStatus === 'pending' && '等待'}
                            {displayStatus === 'error' && '执行失败'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {displayStatus === 'waiting' && awaitingPrompt?.toolId === item.toolId && !showStepPromptModal && (
                            <button
                              onClick={handleReopenPrompt}
                              className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              继续补充参数
                            </button>
                          )}
                          {(item.result || displayStatus === 'done') && (
                            <button onClick={() => setExpandedResultId(isExpanded ? '' : item.toolId)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                              {isExpanded ? '收起' : '查看结果'}
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          )}
                          {displayStatus === 'done' && (
                            <button
                              onClick={() => handleRerunNode(item.toolId)}
                              className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              重算
                            </button>
                          )}
                        </div>
                      </div>
                      {item.result && (
                        <div
                          ref={isExpanded ? workflowResultPreviewRef : null}
                          className="mt-3 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600"
                          onMouseUp={() => handleWorkflowResultMouseUp(item.toolId)}
                        >
                          {isExpanded ? (
                            <>
                              {workflowSelectionToolbar?.toolId === item.toolId && (
                                <div
                                  className="fixed z-40 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-xl"
                                  style={{
                                    top: `${workflowSelectionToolbar.top}px`,
                                    left: `${workflowSelectionToolbar.left}px`,
                                    transform: 'translateX(-50%)',
                                  }}
                                >
                                  <button
                                    onClick={() => openWorkflowReviseModal(item.toolId, workflowSelectionToolbar.blockIndex, workflowSelectionToolbar.text)}
                                    className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-600 shadow-sm hover:bg-blue-50"
                                  >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    优化这段
                                  </button>
                                </div>
                              )}
                              {workflowSelectionNotice && (
                                <div
                                  className="fixed z-40 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700 shadow-lg"
                                  style={{
                                    top: `${workflowSelectionNotice.top}px`,
                                    left: `${workflowSelectionNotice.left}px`,
                                    transform: 'translateX(-50%)',
                                  }}
                                >
                                  {workflowSelectionNotice.message}
                                </div>
                              )}
                              <div className="space-y-5">
                                {splitResultBlocks(item.result).map((block, index) => (
                                  <div
                                    key={`${item.toolId}-${block.id}`}
                                    data-workflow-result-block-index={index}
                                    className="group relative rounded-2xl transition-colors hover:bg-blue-50/20"
                                  >
                                    <div
                                      className="px-1"
                                      dangerouslySetInnerHTML={{ __html: markdownToHtml(block.content) }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : `${formatResultSnippet(item.result)}...`}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white p-6 text-sm text-slate-500">
              <div className="mb-2 flex items-center gap-2 text-slate-900">
                <FileText className="h-4 w-4 text-blue-500" />
                交互说明
              </div>
              先用一句大白话启动流程，AI 先锁定公共信息。真正的步骤专属参数，会在执行到那一步时再轻量补问。
            </div>

            {runError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {runError}
              </div>
            )}
          </>
        )}

        {/* 弹框们 */}
        <ConfirmInfoModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false)
            setPhase('idle')
          }}
          onConfirm={handleConfirmInfo}
          values={confirmValues}
          fields={confirmFields}
          isValid={isConfirmValid}
          onInputChange={(key, value) => {
            if (COMMON_FIELD_KEYS.includes(key)) {
              setCommonInput((current) => ({ ...current, [key]: value }))
              return
            }
            setExtraFields((current) => ({ ...current, [key]: value }))
          }}
        />

        <StepPromptModal
          isOpen={showStepPromptModal}
          onClose={() => setShowStepPromptModal(false)}
          onContinue={handleContinuePrompt}
          onSkip={handleSkipPrompt}
          prompt={awaitingPrompt}
          onValueChange={(key, value) => {
            setAwaitingPrompt((current) => ({
              ...current,
              values: { ...(current?.values || {}), [key]: value },
            }))
          }}
        />

        {workflowReviseModalOpen && workflowSelectedToolId && workflowSelectedBlockIndex >= 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">
                    {workflowSelectedSnippet ? '优化选中的内容' : '优化这一段'}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {workflowSelectedSnippet
                      ? '告诉我你想怎么改这段选中文本，我会尽量只动这部分，并保持这一步其他内容稳定。'
                      : '告诉我这一段你想怎么调整，我只改这一段，其他内容不动。'}
                  </p>
                </div>
                <button
                  onClick={closeWorkflowReviseModal}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4 max-h-48 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {workflowSelectedSnippet ? (
                  <div className="whitespace-pre-wrap text-sm text-slate-700">{workflowSelectedSnippet}</div>
                ) : (
                  <div
                    className="text-sm text-slate-700"
                    dangerouslySetInnerHTML={{
                      __html: markdownToHtml(
                        splitResultBlocks(stepStates.find((item) => item.toolId === workflowSelectedToolId)?.result || '')[workflowSelectedBlockIndex]?.content || ''
                      ),
                    }}
                  />
                )}
              </div>

              <textarea
                value={workflowReviseInstruction}
                onChange={(e) => setWorkflowReviseInstruction(e.target.value)}
                placeholder="比如：这段更像班主任真实会写的话；更适合三年级学生理解；保留原意但更简洁。"
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />

              {workflowReviseError && (
                <p className="mt-3 text-sm text-red-500">{workflowReviseError}</p>
              )}
              {workflowReviseSuccess && (
                <p className="mt-3 text-sm text-emerald-600">{workflowReviseSuccess}</p>
              )}

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={closeWorkflowReviseModal}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600"
                >
                  取消
                </button>
                <button
                  onClick={handleWorkflowReviseBlock}
                  disabled={!workflowReviseInstruction.trim() || isRevisingWorkflowBlock}
                  className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRevisingWorkflowBlock ? '处理中...' : '确认改写'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkflowDetailPage
