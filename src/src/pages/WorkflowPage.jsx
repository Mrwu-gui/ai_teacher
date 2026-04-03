import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Download, GitBranch, Loader2, PlusCircle, Sparkles, Trash2, XCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { deleteCustomWorkflow, deleteRunRecord, getCommonWorkflows, getCustomWorkflows, getDisplayRunHistory, getWorkflowSummary, syncCustomWorkflowsFromServer } from '../data/workflows'

// 格式化时间
const formatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  
  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 工作流模板卡片（不显示进度条）
const WorkflowTemplateCard = ({ workflow, onOpen, onDelete }) => {
  const stats = workflow.stats || {}
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef(null)
  
  return (
    <div
      ref={cardRef}
      onClick={() => onOpen(workflow.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer rounded-2xl border border-blue-100 bg-white p-5 will-change-transform"
      style={{
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease',
        transform: isHovered ? 'scale(1.08) translateY(-8px)' : 'scale(1) translateY(0)',
        boxShadow: isHovered ? '0 20px 40px rgba(0, 0, 0, 0.12)' : '0 0px 0px rgba(0, 0, 0, 0)',
        borderColor: isHovered ? '#bfdbfe' : '#dbeafe',
        zIndex: isHovered ? 10 : 1,
      }}
    >
      {/* 标题区域 */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div 
            className="text-lg font-bold text-slate-900"
            style={{
              transition: 'color 0.3s ease',
              color: isHovered ? '#2563eb' : '#0f172a',
            }}
          >
            {workflow.name}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {workflow.type === 'custom' && onDelete && (
            <button
              onClick={(event) => {
                event.stopPropagation()
                onDelete(workflow.id)
              }}
              className="rounded-xl border border-red-100 p-2 text-red-400 hover:bg-red-50 hover:text-red-500"
              style={{ transition: 'background-color 0.2s ease, color 0.2s ease' }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <ArrowRight 
            className="h-4 w-4 shrink-0 text-blue-400" 
            style={{
              transition: 'transform 0.3s ease',
              transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
            }}
          />
        </div>
      </div>
      
      {/* 描述区域 */}
      <div className="mb-4 text-sm text-slate-600 leading-relaxed">{workflow.description}</div>
      
      {/* 轻量提示区域 */}
      {stats.lastRunAt && (
        <div className="mb-5 flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          <span>最近使用：{formatTime(stats.lastRunAt)}</span>
          {stats.lastRunTopic && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600">{stats.lastRunTopic}</span>
            </>
          )}
        </div>
      )}
      
      {/* 步骤预览 - 悬停展开动画 */}
      <div 
        className="overflow-hidden"
        style={{
          transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: isHovered ? `${workflow.steps.length * 36 + 24}px` : '144px',
        }}
      >
        <div className="space-y-2">
          {workflow.steps.map((step, index) => (
            <div 
              key={step.id} 
              className="flex items-center gap-2 text-sm text-slate-700"
              style={{ 
                transition: 'opacity 0.3s ease, transform 0.3s ease',
                opacity: isHovered || index < 3 ? 1 : 0.3,
                transform: isHovered ? 'translateY(0)' : 'translateY(0)',
              }}
            >
              <span 
                className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600"
                style={{
                  transition: 'background-color 0.3s ease',
                  backgroundColor: isHovered ? '#dbeafe' : '#eff6ff',
                }}
              >
                {index + 1}
              </span>
              <span 
                className="font-medium"
                style={{
                  transition: 'color 0.3s ease',
                  color: isHovered ? '#0f172a' : '#334155',
                }}
              >
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* "还有 X 个步骤" 提示 - 悬停时淡出 */}
      {workflow.steps.length > 3 && (
        <div 
          className="text-xs text-slate-400 pl-8 overflow-hidden"
          style={{
            transition: 'opacity 0.3s ease, max-height 0.3s ease, margin-top 0.3s ease',
            opacity: isHovered ? 0 : 1,
            maxHeight: isHovered ? '0px' : '20px',
            marginTop: isHovered ? '0' : '0.5rem',
          }}
        >
          还有 {workflow.steps.length - 3} 个步骤...
        </div>
      )}
      
      <button
        onClick={(event) => {
          event.stopPropagation()
          onOpen(workflow.id)
        }}
        className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 active:scale-95"
        style={{
          transition: 'background-color 0.2s ease, transform 0.1s ease',
        }}
      >
        开始流程
      </button>
    </div>
  )
}



const WorkflowPage = () => {
  const navigate = useNavigate()
  const [commonWorkflows, setCommonWorkflows] = useState([])
  const [customWorkflows, setCustomWorkflows] = useState([])
  const [runHistory, setRunHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    
    // 加载模板
    setCommonWorkflows(getCommonWorkflows().map(getWorkflowSummary))
    setCustomWorkflows(getCustomWorkflows().map(getWorkflowSummary))
    
    // 同步服务器数据
    await syncCustomWorkflowsFromServer()
    
    // 重新加载
    setCommonWorkflows(getCommonWorkflows().map(getWorkflowSummary))
    setCustomWorkflows(getCustomWorkflows().map(getWorkflowSummary))
    
    // 加载运行历史
    setRunHistory(getDisplayRunHistory(20))
    
    setIsLoading(false)
  }

  const handleDeleteCustomWorkflow = (workflowId) => {
    deleteCustomWorkflow(workflowId)
    setCustomWorkflows(getCustomWorkflows().map(getWorkflowSummary))
  }

  const handleDeleteRun = (runId) => {
    deleteRunRecord(runId)
    setRunHistory(getDisplayRunHistory(20))
  }

  const handleOpenWorkflow = (workflowId) => {
    navigate(`/workflows/${workflowId}?fresh=1`)
  }

  const handleOpenRun = (run) => {
    navigate(`/workflows/${run.workflowId}?resume=1`)
  }

  const handleExportRun = (run) => {
    // TODO: 实现导出功能
    console.log('Export run:', run.id)
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* 页面标题 */}
        <div className="rounded-3xl border border-blue-100 bg-white p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-600">
                <GitBranch className="h-5 w-5" />
                <span className="text-sm font-medium">工作流</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">教学工作流</h1>
              <p className="mt-2 text-sm text-slate-500">
                把备课、出题、讲评、沟通串成一条顺手的教学流程。
              </p>
            </div>
            <Link
              to="/workflows/custom/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4" />
              新建自定义工作流
            </Link>
          </div>
        </div>

        {/* 第一层：通用工作流模板 */}
        <section>
          <div className="mb-4 flex items-center gap-2 text-slate-900">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <h2 className="text-lg font-semibold">通用工作流</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {commonWorkflows.map((workflow) => (
              <WorkflowTemplateCard
                key={workflow.id}
                workflow={workflow}
                onOpen={handleOpenWorkflow}
              />
            ))}
          </div>
        </section>

        {/* 第二层：我的自定义工作流模板 */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">我的自定义工作流</h2>
            <span className="text-xs text-slate-400">仅当前老师可见</span>
          </div>
          {customWorkflows.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {customWorkflows.map((workflow) => (
                <WorkflowTemplateCard
                  key={workflow.id}
                  workflow={workflow}
                  onOpen={handleOpenWorkflow}
                  onDelete={handleDeleteCustomWorkflow}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white p-6 text-sm text-slate-500">
              你还没有创建自己的工作流。可以把常用工具按顺序组合起来，后续一键复用。
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default WorkflowPage
