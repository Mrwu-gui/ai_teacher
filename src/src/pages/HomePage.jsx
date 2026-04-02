import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  BookOpen, 
  ClipboardList, 
  MessageSquare, 
  Users, 
  ArrowRight,
  Clock,
  Sparkles,
  Search
} from 'lucide-react'
import { mainTasks, getToolById, allTools, categories } from '../data/tools'

const practicalToolIds = [
  'lesson-plan',
  'lesson-talk',
  'lesson-hook',
  'worksheet-gen',
  'multiple-choice-quiz',
  'exam-review',
  'writing-feedback',
  'student-comment',
  'parent-communication',
  'class-meeting',
  'classroom-management',
  'custom-chatbot'
]

const HomePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [greeting, setGreeting] = useState('')
  const [recentUsed, setRecentUsed] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const loadRecentUsed = () => {
    const history = JSON.parse(localStorage.getItem('beike_history') || '[]')
      .filter(item => item.result && String(item.result).trim())
      .map(item => ({
        ...item,
        status: '成功',
        timestamp: item.createdAt
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 4)

    setRecentUsed(history)
  }

  useEffect(() => {
    // 根据时间设置问候语
    const hour = new Date().getHours()
    if (hour < 6) setGreeting('夜深了')
    else if (hour < 12) setGreeting('早上好')
    else if (hour < 14) setGreeting('中午好')
    else if (hour < 18) setGreeting('下午好')
    else setGreeting('晚上好')

    loadRecentUsed()
  }, [])

  useEffect(() => {
    loadRecentUsed()
  }, [location.pathname])

  const iconMap = {
    BookOpen: BookOpen,
    ClipboardList: ClipboardList,
    MessageSquare: MessageSquare,
    Users: Users
  }

  const handleQuickStart = (toolId, historyItem = null) => {
    navigate(`/tool/${toolId}`, historyItem ? { state: { historyItem } } : undefined)
  }

  const handleSearch = () => {
    const query = searchQuery.trim()
    navigate(query ? `/tools?q=${encodeURIComponent(query)}` : '/tools')
  }

  const practicalTools = practicalToolIds
    .map((id) => getToolById(id))
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部区域 */}
      <div className="bg-white border-b border-blue-50 px-4 pt-6 pb-8">
        <div className="max-w-5xl mx-auto">
          {/* 欢迎语和搜索 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {greeting}，老师 👋
            </h1>
            <p className="text-slate-500 text-sm">
              今天想做什么？AI备课工作台随时为您服务
            </p>
          </div>

          {/* 快捷搜索框 */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
            <input
              type="text"
              placeholder="搜索工具，如：教案、练习、班会..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              className="w-full pl-12 pr-4 py-3 bg-blue-50/30 border border-blue-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 主任务入口 */}
      <div className="px-4 -mt-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {mainTasks.map((task) => {
              const Icon = iconMap[task.icon]
              
              return (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl border border-blue-100 p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                  onClick={() => handleQuickStart(task.tools[0].id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                    <ArrowRight className="w-4 h-4 text-blue-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{task.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 快捷工具入口 */}
      <div className="px-4 mt-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            高频工具
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {practicalTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => handleQuickStart(tool.id)}
                className="bg-white border border-blue-100 rounded-xl p-3 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="font-medium text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                  {tool.name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {tool.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 进入工具库 */}
      <div className="px-4 mt-8">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/tools"
            className="block w-full bg-white border-2 border-dashed border-blue-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
          >
            <div className="flex items-center justify-center gap-2 text-blue-600 group-hover:text-blue-700">
              <span className="font-medium">查看完整工具库</span>
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="text-sm text-blue-400 mt-1">
              {categories.length}大分类 · {allTools.length}个教学工具
            </div>
          </Link>
        </div>
      </div>

      {/* 最近使用 */}
      {recentUsed.length > 0 && (
        <div className="px-4 mt-8 pb-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                最近使用
              </h2>
              <Link
                to="/history"
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                查看全部
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {recentUsed.map((item) => {
                const tool = getToolById(item.templateId)
                const statusClass = item.status === '草稿'
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'

                return (
                  <div
                    key={item.id}
                    onClick={() => handleQuickStart(item.templateId, item)}
                    className="bg-white border border-blue-100 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm text-slate-900 line-clamp-1">
                        {tool?.name || item.templateName}
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClass}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 line-clamp-1">
                      {item.input?.topic || item.input?.grade_subject || '查看详情'}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                      {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
