import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  ImagePlus, 
  MessageSquare, 
  Send, 
  ShieldCheck,
  User,
  Clock,
  GitBranch,
  Wrench,
  Settings,
  HelpCircle,
  Info,
  ChevronRight,
  X
} from 'lucide-react'
import { getRunHistory } from '../data/workflows'

const feedbackTypeOptions = [
  '功能建议',
  'Prompt改进',
  '结果质量',
  '交互体验',
  'Bug反馈',
  '其他'
]

const ProfilePage = () => {
  const navigate = useNavigate()
  const [feedbackType, setFeedbackType] = useState('功能建议')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [imageBase64, setImageBase64] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitState, setSubmitState] = useState('')
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  
  // 统计数据
  const [stats, setStats] = useState({
    toolUsage: 0,
    workflowUsage: 0,
    totalDays: 0,
  })

  useEffect(() => {
    // 计算工具使用次数
    const toolHistory = JSON.parse(localStorage.getItem('beike_history') || '[]')
    
    // 计算工作流使用次数
    const workflowHistory = getRunHistory(100)
    
    // 计算使用天数
    const firstUse = toolHistory.length > 0 
      ? new Date(toolHistory[toolHistory.length - 1].createdAt) 
      : new Date()
    const totalDays = Math.floor((new Date() - firstUse) / (1000 * 60 * 60 * 24)) + 1
    
    setStats({
      toolUsage: toolHistory.length,
      workflowUsage: workflowHistory.length,
      totalDays,
    })
  }, [])

  const feedbackTips = useMemo(
    () => [
      '例如：生成教案时没有"板书设计"，这个字段内容里比形式更重要。',
      '例如：推荐问题不够贴近语文课文场景，希望首屏问法更像老师真实表达。',
      '例如：这个工具生成结果整体可用，但语气还不够自然，希望更像老师常用表达。'
    ],
    []
  )

  const handlePickImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageBase64(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const submitFeedback = async () => {
    if (!message.trim()) {
      setSubmitState('请先填写反馈内容')
      return
    }

    setSubmitting(true)
    setSubmitState('')

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackType,
          message: message.trim(),
          contact: contact.trim(),
          screenshot: imageBase64
        })
      })

      if (!response.ok) {
        throw new Error('submit failed')
      }

      setSubmitState('反馈已提交，感谢老师帮助我们继续打磨。')
      setMessage('')
      setContact('')
      setImageBase64('')
      setTimeout(() => {
        setShowFeedbackModal(false)
        setSubmitState('')
      }, 2000)
    } catch {
      setSubmitState('提交失败，请稍后再试。')
    } finally {
      setSubmitting(false)
    }
  }

  const menuItems = [
    {
      id: 'history',
      icon: Clock,
      label: '历史记录',
      description: '查看工作流和工具使用记录',
      onClick: () => navigate('/history'),
    },
    {
      id: 'feedback',
      icon: MessageSquare,
      label: '意见反馈',
      description: '帮助我们改进产品体验',
      onClick: () => setShowFeedbackModal(true),
    },
    {
      id: 'settings',
      icon: Settings,
      label: '设置',
      description: '个性化配置',
      onClick: () => {},
    },
    {
      id: 'help',
      icon: HelpCircle,
      label: '帮助中心',
      description: '使用指南和常见问题',
      onClick: () => {},
    },
    {
      id: 'about',
      icon: Info,
      label: '关于',
      description: '版本信息',
      onClick: () => {},
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* 顶部标题 */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">我的</h1>
            <p className="text-sm text-slate-500">管理你的账户和设置</p>
          </div>
        </div>

        {/* 用户信息卡片 */}
        <div className="mb-6 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-6 text-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <User className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="text-xl font-semibold">老师你好</div>
              <div className="mt-1 text-sm text-blue-50">
                已使用 {stats.totalDays} 天
              </div>
            </div>
          </div>
          
          {/* 使用统计 */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-3">
              <div className="flex items-center gap-2 text-blue-50">
                <Wrench className="h-4 w-4" />
                <span className="text-sm">工具使用</span>
              </div>
              <div className="mt-1 text-2xl font-bold">{stats.toolUsage}</div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-3">
              <div className="flex items-center gap-2 text-blue-50">
                <GitBranch className="h-4 w-4" />
                <span className="text-sm">工作流使用</span>
              </div>
              <div className="mt-1 text-2xl font-bold">{stats.workflowUsage}</div>
            </div>
          </div>
        </div>

        {/* 菜单列表 */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                onClick={item.onClick}
                className={`flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.description}</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            )
          })}
        </div>

        {/* 版本信息 */}
        <div className="mt-6 text-center text-xs text-slate-400">
          AI 备课工作台 v1.0.0
        </div>
      </div>

      {/* 反馈弹框 */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/30 backdrop-blur-sm">
          <div className="relative w-full max-w-lg sm:max-w-xl lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-white shadow-2xl">
            {/* 弹框头部 */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 text-blue-600">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">意见反馈</h2>
                  <p className="hidden sm:block text-xs text-slate-500">越具体越好，我们会据此改 Prompt、改字段、改交互</p>
                </div>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="rounded-lg sm:rounded-xl p-1.5 sm:p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 弹框内容 */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* 反馈类型 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">反馈类型</label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                >
                  {feedbackTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* 反馈内容 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">反馈内容</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="请尽量写具体：是哪个工具、哪一步、缺什么字段、结果哪里不对、你更希望它怎么生成。"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 sm:leading-7 text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </div>

              {/* 联系方式 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">联系方式（可选）</label>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="微信 / 邮箱 / 手机号"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </div>

              {/* 上传截图 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">上传截图（可选）</label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500 transition hover:border-blue-400 hover:bg-blue-50">
                  <ImagePlus className="h-4 w-4" />
                  <span>{imageBase64 ? '已选择截图，点这里重新上传' : '上传问题截图或结果截图'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
                </label>
              </div>

              {/* 反馈提示 */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-amber-900">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-sm font-medium">我们最希望收到的反馈</span>
                </div>
                <div className="space-y-2 text-xs text-amber-700">
                  {feedbackTips.map((tip, index) => (
                    <div key={index}>• {tip}</div>
                  ))}
                </div>
              </div>

              {/* 提交状态 */}
              {submitState && (
                <div className={`rounded-2xl border px-4 py-3 text-sm ${
                  submitState.includes('感谢') 
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}>
                  {submitState}
                </div>
              )}

              {/* 提交按钮 */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 sm:py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={submitFeedback}
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 sm:py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? '提交中...' : '提交反馈'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage
