import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Clock3, 
  Trash2, 
  GitBranch, 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Download,
  Eye
} from 'lucide-react'
import { getToolById } from '../data/tools'
import { getRunHistory, deleteRunFromHistory } from '../data/workflows'

const HistoryPage = () => {
  const navigate = useNavigate()
  const [toolHistory, setToolHistory] = useState([])
  const [workflowHistory, setWorkflowHistory] = useState([])
  const [activeTab, setActiveTab] = useState('workflow') // 'workflow' | 'tool'

  // 加载工具历史
  const loadToolHistory = () => {
    const history = JSON.parse(localStorage.getItem('beike_history') || '[]')
      .filter((item) => item && item.id)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    setToolHistory(history)
  }

  // 加载工作流历史
  const loadWorkflowHistory = () => {
    const history = getRunHistory(50)
    setWorkflowHistory(history)
  }

  useEffect(() => {
    loadToolHistory()
    loadWorkflowHistory()
  }, [])

  // 删除工具历史
  const removeToolItem = (id) => {
    const next = toolHistory.filter((item) => item.id !== id)
    localStorage.setItem('beike_history', JSON.stringify(next))
    setToolHistory(next)
  }

  // 删除工作流历史
  const removeWorkflowItem = (id) => {
    deleteRunFromHistory(id)
    loadWorkflowHistory()
  }

  // 清空工具历史
  const clearToolHistory = () => {
    localStorage.removeItem('beike_history')
    setToolHistory([])
  }

  // 清空工作流历史
  const clearWorkflowHistory = () => {
    localStorage.removeItem('beike_workflow_run_history')
    setWorkflowHistory([])
  }

  // 格式化时间
  const formatTime = (value) => {
    if (!value) return ''
    const date = new Date(value)
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 工作流状态配置
  const workflowStatusConfig = {
    done: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2, label: '已完成' },
    running: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Loader2, label: '进行中' },
    waiting: { color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock3, label: '等待补充' },
    error: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle, label: '执行失败' },
    paused: { color: 'text-slate-600', bg: 'bg-slate-50', icon: Clock3, label: '已暂停' },
  }

  // 导出工作流结果
  const handleExportWorkflow = (run) => {
    // TODO: 实现导出功能
    console.log('Export workflow:', run.id)
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        {/* 顶部标题 */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">历史记录</h1>
              <p className="text-sm text-slate-500">查看老师已生成过的内容与草稿痕迹</p>
            </div>
          </div>

          {(workflowHistory.length > 0 || toolHistory.length > 0) && (
            <div className="flex gap-2">
              {activeTab === 'workflow' && workflowHistory.length > 0 && (
                <button
                  onClick={clearWorkflowHistory}
                  className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                >
                  清空工作流历史
                </button>
              )}
              {activeTab === 'tool' && toolHistory.length > 0 && (
                <button
                  onClick={clearToolHistory}
                  className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                >
                  清空工具历史
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab 切换 */}
        <div className="mb-6 flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === 'workflow'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            工作流记录
            {workflowHistory.length > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
                {workflowHistory.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('tool')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === 'tool'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="h-4 w-4" />
            工具记录
            {toolHistory.length > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
                {toolHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* 工作流历史 */}
        {activeTab === 'workflow' && (
          <>
            {workflowHistory.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-blue-200 bg-white px-6 py-20 text-center">
                <GitBranch className="mx-auto mb-4 h-12 w-12 text-blue-300" />
                <div className="text-lg font-medium text-slate-700">还没有工作流历史记录</div>
                <p className="mt-2 text-sm text-slate-500">
                  去工作流页面执行一个工作流，这里就会自动保存记录。
                </p>
                <button
                  onClick={() => navigate('/workflows')}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  前往工作流
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {workflowHistory.map((run) => {
                  const phase = run.meta?.phase || 'idle'
                  const config = workflowStatusConfig[phase] || workflowStatusConfig.paused
                  const StatusIcon = config.icon
                  
                  // 计算进度
                  const steps = run.steps || {}
                  const stepIds = Object.keys(steps)
                  const completedCount = stepIds.filter(id => steps[id]?.status === 'done').length
                  const totalCount = stepIds.length
                  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

                  return (
                    <div
                      key={run.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg transition-all group"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {run.workflowName}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">{run.topic || '未命名课题'}</div>
                        </div>
                        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
                          <StatusIcon className={`h-3.5 w-3.5 ${phase === 'running' ? 'animate-spin' : ''}`} />
                          <span>{config.label}</span>
                        </div>
                      </div>

                      <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          <span>{formatTime(run.createdAt)}</span>
                        </div>
                        <span className="text-slate-300">·</span>
                        <span>{completedCount}/{totalCount} 步骤</span>
                      </div>

                      {/* 进度条 */}
                      <div className="mb-4">
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                          <span>进度</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/workflows/${run.workflowId}`)}
                          className="flex-1 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Eye className="h-4 w-4" />
                            查看详情
                          </div>
                        </button>
                        {phase === 'done' && (
                          <button
                            onClick={() => handleExportWorkflow(run)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => removeWorkflowItem(run.id)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* 工具历史 */}
        {activeTab === 'tool' && (
          <>
            {toolHistory.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-blue-200 bg-white px-6 py-20 text-center">
                <Wrench className="mx-auto mb-4 h-12 w-12 text-blue-300" />
                <div className="text-lg font-medium text-slate-700">还没有工具历史记录</div>
                <p className="mt-2 text-sm text-slate-500">
                  先去工具库生成一条内容，这里就会自动保存成功记录。
                </p>
                <button
                  onClick={() => navigate('/tools')}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  前往工具库
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {toolHistory.map((item) => {
                  const tool = getToolById(item.templateId)
                  const title = tool?.name || item.templateName || '未命名工具'
                  const subtitle = item.input?.topic || item.input?.exam_name || item.input?.theme || item.input?.grade_subject || '查看详情'

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg transition-all group"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {title}
                            </h2>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                              成功
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                        </div>
                        <button
                          onClick={() => removeToolItem(item.id)}
                          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="mb-3 line-clamp-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {item.result || '暂无结果内容'}
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                          {formatTime(item.createdAt)}
                        </p>
                        <button
                          onClick={() => navigate(`/tool/${item.templateId}`, { state: { historyItem: item } })}
                          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          查看详情
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default HistoryPage
