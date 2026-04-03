import { allTools, getToolById } from './tools'

export const COMMON_WORKFLOWS = [
  {
    id: 'lesson-prep-flow',
    type: 'common',
    name: '一节课备课流程',
    description: '从教案到课堂练习与作业,一条线完成一节课的备课。',
    scenario: '日常备课、公开课前准备',
    estimatedTime: '约 10 分钟',
    stepIds: ['lesson-plan', 'lesson-hook', 'worksheet-gen', 'layered-homework'],
    exampleSeeds: [
      '我想给三年级讲《荷花》，希望课堂更生动一点。',
      '五年级语文《慈母情深》，想兼顾朗读和情感体验。',
      '初二数学反比例函数，想做一节思路清晰的常规课。',
    ],
  },
  {
    id: 'unit-teaching-flow',
    type: 'common',
    name: '单元整体备课流程',
    description: '围绕单元目标完成核心素养拆解、整体设计与学历案生成。',
    scenario: '单元整体教学、教务检查、资料存档',
    estimatedTime: '约 15 分钟',
    stepIds: ['core-literacy-breakdown', 'unit-plan', 'unit-learning-plan', 'math-review-set'],
    exampleSeeds: [
      '四年级语文第六单元，想做一套完整的单元整体教学设计。',
      '七年级历史第二单元，需要单元目标拆解和学习任务安排。',
      '高一英语必修一某单元，想把核心素养和评价节点一起梳理出来。',
    ],
  },
  {
    id: 'assessment-review-flow',
    type: 'common',
    name: '练习与讲评流程',
    description: '从命题到讲评与反馈，适合测验后快速生成课堂材料。',
    scenario: '随堂测验、周测、单元讲评',
    estimatedTime: '约 12 分钟',
    stepIds: ['exercise-gen', 'multiple-choice-quiz', 'exam-review', 'student-comment'],
    exampleSeeds: [
      '给七年级分数运算做一套练习并配讲评稿。',
      '五年级语文单元测后，想快速出一份课堂讲评材料。',
      '高二化学电解质，想做练习题并附上错因讲评。',
    ],
  },
  {
    id: 'post-exam-feedback-flow',
    type: 'common',
    name: '考后反馈流程',
    description: '讲评、作文反馈与家校沟通一体完成。',
    scenario: '月考、期中期末、综合检测后',
    estimatedTime: '约 12 分钟',
    stepIds: ['exam-review', 'writing-feedback', 'parent-communication'],
    exampleSeeds: [
      '期中考试后，想生成试卷讲评、作文反馈和家校沟通文案。',
      '月考结束后，需要一套班级层面的反馈材料。',
      '语文大作文批改后，想同步整理给家长的沟通话术。',
    ],
  },
  {
    id: 'class-management-flow',
    type: 'common',
    name: '班主任沟通流程',
    description: '班会、支持方案与家校沟通串成完整班级工作流。',
    scenario: '班主任工作、学生个案跟进',
    estimatedTime: '约 10 分钟',
    stepIds: ['class-meeting', 'student-support', 'parent-communication', 'classroom-management'],
    exampleSeeds: [
      '班里最近纪律波动，想准备一场主题班会和后续家校沟通。',
      '有个学生课堂注意力不集中，想整理支持方案并和家长沟通。',
      '想做一次关于同伴相处的班会，并配套家校协同建议。',
    ],
  },
  {
    id: 'teaching-research-flow',
    type: 'common',
    name: '教研活动支持流程',
    description: '说课、听评课与校本教研方案协同完成。',
    scenario: '公开课、磨课、教研活动',
    estimatedTime: '约 12 分钟',
    stepIds: ['lesson-talk', 'classroom-observation', 'pd-planner'],
    exampleSeeds: [
      '下周有公开课，想准备说课稿、听评课要点和教研活动方案。',
      '校本教研要围绕阅读教学展开，想先生成一套活动支持材料。',
      '准备磨一节示范课，需要说课和评课材料一起整理。',
    ],
  },
]

const CUSTOM_TEMPLATES_KEY = 'beike_custom_workflow_templates'
const CURRENT_RUNS_KEY = 'beike_workflow_current_runs'
const RUN_HISTORY_KEY = 'beike_workflow_run_history'
const USER_KEY = 'beike_guest_user_id'

const isBrowser = typeof window !== 'undefined'

const readStorageJson = (key, fallback) => {
  if (!isBrowser) return fallback
  try {
    const value = JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
    return value
  } catch {
    return fallback
  }
}

const writeStorageJson = (key, value) => {
  if (!isBrowser) return
  localStorage.setItem(key, JSON.stringify(value))
}

const isMeaningfulObject = (value) => value && typeof value === 'object' && Object.keys(value).length > 0

export const hasMeaningfulRun = (run) => {
  if (!run) return false

  const phase = run.meta?.phase || 'idle'
  const hasSteps = Object.values(run.steps || {}).some(
    (step) => (step?.status && step.status !== 'pending') || step?.result || step?.summary
  )

  return Boolean(
    run.workflowId ||
    run.workflowName ||
    run.topic ||
    run.meta?.seedInput ||
    isMeaningfulObject(run.meta?.commonInput) ||
    isMeaningfulObject(run.meta?.extraFields) ||
    isMeaningfulObject(run.fields) ||
    hasSteps ||
    !['idle', 'done'].includes(phase)
  )
}

// 创建空的运行实例
export const createEmptyWorkflowRun = () => ({
  id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  workflowId: '',
  workflowName: '',
  topic: '',
  fields: {},
  steps: {},
  meta: {
    phase: 'idle',
    currentNodeId: '',
    waitingNodeId: '',
    lastError: '',
    seedInput: '',
    commonInput: {},
    extraFields: {},
    awaitingPrompt: null,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completedAt: '',
})

export const getClientUserId = () => {
  if (!isBrowser) return 'guest-server'
  const existing = localStorage.getItem(USER_KEY)
  if (existing) return existing
  const created = `guest-${crypto.randomUUID()}`
  localStorage.setItem(USER_KEY, created)
  return created
}

const requestWorkflowApi = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-beike-user-id': getClientUserId(),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    throw new Error(`workflow api failed: ${response.status}`)
  }

  if (response.status === 204) return null
  return response.json()
}

// ========== 模板相关 ==========

export const getWorkflowSteps = (workflow) =>
  (workflow.stepIds || [])
    .map((id) => getToolById(id))
    .filter(Boolean)

export const getCommonWorkflows = () =>
  COMMON_WORKFLOWS.map((workflow) => ({
    ...workflow,
    steps: getWorkflowSteps(workflow),
  }))

export const getCustomWorkflows = () => {
  try {
    const stored = readStorageJson(CUSTOM_TEMPLATES_KEY, [])
    if (!Array.isArray(stored)) return []
    return stored
      .map((workflow) => ({
        ...workflow,
        type: 'custom',
        steps: getWorkflowSteps(workflow),
      }))
      .filter((workflow) => workflow.steps.length > 0)
  } catch {
    return []
  }
}

export const getWorkflowById = (workflowId) => {
  const common = getCommonWorkflows().find((item) => item.id === workflowId)
  if (common) return common
  return getCustomWorkflows().find((item) => item.id === workflowId) || null
}

export const getWorkflowExampleSeeds = (workflowId) => {
  const workflow = getWorkflowById(workflowId)
  return Array.isArray(workflow?.exampleSeeds) && workflow.exampleSeeds.length > 0
    ? workflow.exampleSeeds
    : [
        `我想用「${workflow?.name || '这个工作流'}」快速开始准备内容。`,
        `请帮我围绕这条工作流生成一套完整材料。`,
        `我先说一句需求，你来帮我拆解这条工作流。`,
      ]
}

export const saveCustomWorkflow = (workflow) => {
  const current = getCustomWorkflows().map(({ steps, ...rest }) => rest)
  const timestamp = new Date().toISOString()
  const nextWorkflow = {
    createdAt: workflow.createdAt || timestamp,
    updatedAt: timestamp,
    ...workflow,
  }
  const next = [nextWorkflow, ...current.filter((item) => item.id !== workflow.id)]
  writeStorageJson(CUSTOM_TEMPLATES_KEY, next)
  requestWorkflowApi('/api/workflows', {
    method: 'POST',
    body: JSON.stringify(nextWorkflow),
  }).catch(() => {})
}

export const deleteCustomWorkflow = (workflowId) => {
  const current = getCustomWorkflows().map(({ steps, ...rest }) => rest)
  const next = current.filter((item) => item.id !== workflowId)
  writeStorageJson(CUSTOM_TEMPLATES_KEY, next)
  requestWorkflowApi(`/api/workflows/${workflowId}`, {
    method: 'DELETE',
  }).catch(() => {})
}

export const getAllWorkflowTools = () =>
  allTools.map((tool) => ({
    id: tool.id,
    name: tool.name,
    category: tool.category,
    description: tool.description,
  }))

// ========== 当前运行相关 ==========

export const getCurrentRun = (workflowId) => {
  try {
    const runs = readStorageJson(CURRENT_RUNS_KEY, {})
    return runs[workflowId] || null
  } catch {
    return null
  }
}

export const updateCurrentRun = (workflowId, updater) => {
  const runs = readStorageJson(CURRENT_RUNS_KEY, {})
  const current = runs[workflowId] || createEmptyWorkflowRun()
  const next = {
    ...createEmptyWorkflowRun(),
    ...updater(current),
    updatedAt: new Date().toISOString(),
  }
  runs[workflowId] = next
  writeStorageJson(CURRENT_RUNS_KEY, runs)
  requestWorkflowApi(`/api/workflow-runs/${workflowId}`, {
    method: 'PUT',
    body: JSON.stringify(next),
  }).catch(() => {})
  return next
}

export const resetCurrentRun = (workflowId) => {
  const runs = readStorageJson(CURRENT_RUNS_KEY, {})
  delete runs[workflowId]
  writeStorageJson(CURRENT_RUNS_KEY, runs)
  requestWorkflowApi(`/api/workflow-runs/${workflowId}`, {
    method: 'DELETE',
  }).catch(() => {})
}

// 兼容旧代码
export const getWorkflowRun = getCurrentRun
export const updateWorkflowRun = updateCurrentRun

export const getCurrentRuns = () => {
  const runs = readStorageJson(CURRENT_RUNS_KEY, {})
  return Object.entries(runs)
    .map(([workflowId, run]) => ({
      workflowId,
      ...run,
      workflowId: run?.workflowId || workflowId,
    }))
    .filter(hasMeaningfulRun)
}

// ========== 运行历史相关 ==========

export const getRunHistory = (limit = 20) => {
  try {
    const history = readStorageJson(RUN_HISTORY_KEY, [])
    if (!Array.isArray(history)) return []
    return history
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  } catch {
    return []
  }
}

export const getRunHistoryByWorkflow = (workflowId, limit = 10) => {
  const history = getRunHistory(100)
  return history
    .filter((run) => run.workflowId === workflowId)
    .slice(0, limit)
}

export const getRunById = (runId) => {
  const history = getRunHistory(100)
  return history.find((run) => run.id === runId) || null
}

export const saveRunToHistory = (run) => {
  const history = getRunHistory(100)
  const existingIndex = history.findIndex((item) => item.id === run.id)
  
  if (existingIndex >= 0) {
    history[existingIndex] = { ...run, updatedAt: new Date().toISOString() }
  } else {
    history.unshift({ ...run, createdAt: new Date().toISOString() })
  }
  
  writeStorageJson(RUN_HISTORY_KEY, history)
}

export const deleteRunFromHistory = (runId) => {
  const history = getRunHistory(100)
  const next = history.filter((run) => run.id !== runId)
  writeStorageJson(RUN_HISTORY_KEY, next)
}

export const deleteRunRecord = (runId) => {
  const runs = readStorageJson(CURRENT_RUNS_KEY, {})
  const nextRuns = { ...runs }

  Object.entries(nextRuns).forEach(([workflowId, run]) => {
    if (run?.id === runId) {
      delete nextRuns[workflowId]
    }
  })

  writeStorageJson(CURRENT_RUNS_KEY, nextRuns)
  deleteRunFromHistory(runId)
}

export const getDisplayRunHistory = (limit = 20) => {
  const currentRuns = getCurrentRuns()
  const archivedRuns = getRunHistory(100)
  const merged = [...currentRuns, ...archivedRuns]
  const deduped = merged.filter((run, index, list) => list.findIndex((item) => item.id === run.id) === index)

  return deduped
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
    .slice(0, limit)
}

export const archiveCurrentRun = (workflowId) => {
  const currentRun = getCurrentRun(workflowId)
  if (!currentRun) return
  
  const workflow = getWorkflowById(workflowId)
  const topic = currentRun.meta?.commonInput?.unitName || currentRun.meta?.seedInput || '未命名'
  
  const archivedRun = {
    ...currentRun,
    workflowId,
    workflowName: workflow?.name || '未知工作流',
    topic,
    completedAt: currentRun.meta?.phase === 'done' ? new Date().toISOString() : '',
  }
  
  saveRunToHistory(archivedRun)
  resetCurrentRun(workflowId)
  
  return archivedRun
}

// ========== 模板统计信息 ==========

export const getTemplateStats = (workflowId) => {
  const history = getRunHistoryByWorkflow(workflowId, 10)

  if (history.length === 0) {
    return {
      lastRunAt: '',
      totalRuns: 0,
    }
  }

  const lastRun = history[0]

  return {
    lastRunAt: lastRun?.createdAt || '',
    lastRunTopic: lastRun?.topic || '',
    totalRuns: history.length,
  }
}

// ========== 其他工具函数 ==========

export const buildWorkflowPrefill = (tool, workflowRun) => {
  const fields = workflowRun?.fields || {}
  const next = {}
  tool.fields.forEach((field) => {
    if (fields[field.key] !== undefined && fields[field.key] !== null && fields[field.key] !== '') {
      next[field.key] = fields[field.key]
    }
  })
  return next
}

export const getWorkflowProgress = (workflow) => {
  const steps = workflow.steps || getWorkflowSteps(workflow)
  const run = getCurrentRun(workflow.id)
  if (!run) {
    return {
      completedCount: 0,
      totalCount: steps.length,
      progressPercent: 0,
      nextStepId: steps[0]?.id || '',
      nextStepName: steps[0]?.name || '',
      isStarted: false,
      isCompleted: false,
      lastCompletedAt: '',
      phase: 'idle',
    }
  }
  
  const completedSteps = steps.filter((step) => Boolean(run.steps?.[step.id]?.status === 'done'))
  const nextPendingStep = steps.find((step) => run.steps?.[step.id]?.status !== 'done') || null
  const lastCompletedAt = completedSteps
    .map((step) => run.steps?.[step.id]?.completedAt)
    .filter(Boolean)
    .sort()
    .at(-1) || ''

  return {
    completedCount: completedSteps.length,
    totalCount: steps.length,
    progressPercent: steps.length ? Math.round((completedSteps.length / steps.length) * 100) : 0,
    nextStepId: nextPendingStep?.id || '',
    nextStepName: nextPendingStep?.name || '',
    isStarted: completedSteps.length > 0 || Object.keys(run.fields || {}).length > 0 || run.meta?.phase === 'running',
    isCompleted: completedSteps.length > 0 && completedSteps.length === steps.length,
    lastCompletedAt,
    phase: run.meta?.phase || 'idle',
  }
}

export const getWorkflowSummary = (workflow) => ({
  ...workflow,
  steps: workflow.steps || getWorkflowSteps(workflow),
  stats: getTemplateStats(workflow.id),
})

export const syncCustomWorkflowsFromServer = async () => {
  try {
    const data = await requestWorkflowApi('/api/workflows')
    const items = Array.isArray(data?.items) ? data.items : []
    writeStorageJson(CUSTOM_TEMPLATES_KEY, items)
    return items
  } catch {
    return getCustomWorkflows().map(({ steps, ...rest }) => rest)
  }
}

export const syncWorkflowRunFromServer = async (workflowId) => {
  try {
    const data = await requestWorkflowApi(`/api/workflow-runs/${workflowId}`)
    const runs = readStorageJson(CURRENT_RUNS_KEY, {})
    if (hasMeaningfulRun(data?.item)) {
      runs[workflowId] = data.item
    } else {
      delete runs[workflowId]
    }
    writeStorageJson(CURRENT_RUNS_KEY, runs)
    return runs[workflowId] || null
  } catch {
    return getCurrentRun(workflowId)
  }
}

export const summarizeNodeResult = (text) => {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  return normalized.slice(0, 180)
}
