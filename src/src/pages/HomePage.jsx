import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  BookOpen, 
  ClipboardList, 
  MessageSquare, 
  Users, 
  ArrowRight,
  Sparkles,
  Search,
  GitBranch,
  Wrench
} from 'lucide-react'
import { mainTasks, getToolById } from '../data/tools'

const iconMap = {
  BookOpen,
  ClipboardList,
  MessageSquare,
  Users,
}

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
  const [greeting, setGreeting] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredTaskId, setHoveredTaskId] = useState(null)
  const [hoveredToolId, setHoveredToolId] = useState(null)

  // 根据时间设置问候语
  const hour = new Date().getHours()
  if (hour < 6) {
    if (greeting !== '夜深了') setGreeting('夜深了')
  } else if (hour < 12) {
    if (greeting !== '早上好') setGreeting('早上好')
  } else if (hour < 14) {
    if (greeting !== '中午好') setGreeting('中午好')
  } else if (hour < 18) {
    if (greeting !== '下午好') setGreeting('下午好')
  } else {
    if (greeting !== '晚上好') setGreeting('晚上好')
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
              AI 备课工作台，帮你 10 分钟搞定备课、出题、家校沟通全流程
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
              const isHovered = hoveredTaskId === task.id
              
              return (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl border border-blue-100 p-4 cursor-pointer will-change-transform"
                  onClick={() => handleQuickStart(task.tools[0].id)}
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                  style={{
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease',
                    transform: isHovered ? 'scale(1.08) translateY(-8px)' : 'scale(1) translateY(0)',
                    boxShadow: isHovered ? '0 20px 40px rgba(0, 0, 0, 0.12)' : '0 0px 0px rgba(0, 0, 0, 0)',
                    borderColor: isHovered ? '#bfdbfe' : '#dbeafe',
                    zIndex: isHovered ? 10 : 1,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon 
                      className="w-5 h-5 text-blue-500"
                      style={{
                        transition: 'color 0.3s ease',
                        color: isHovered ? '#2563eb' : '#3b82f6',
                      }}
                    />
                    <ArrowRight 
                      className="w-4 h-4 text-blue-300"
                      style={{
                        transition: 'transform 0.3s ease, color 0.3s ease',
                        transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                        color: isHovered ? '#3b82f6' : '#93c5fd',
                      }}
                    />
                  </div>
                  <h3 
                    className="font-semibold text-sm text-slate-900 mb-1"
                    style={{
                      transition: 'color 0.3s ease',
                      color: isHovered ? '#2563eb' : '#0f172a',
                    }}
                  >
                    {task.name}
                  </h3>
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
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {practicalTools.map((tool) => {
              const isHovered = hoveredToolId === tool.id
              
              return (
                <div
                  key={tool.id}
                  onClick={() => handleQuickStart(tool.id)}
                  onMouseEnter={() => setHoveredToolId(tool.id)}
                  onMouseLeave={() => setHoveredToolId(null)}
                  className="group relative bg-white rounded-xl p-3 cursor-pointer will-change-transform overflow-hidden"
                  style={{
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isHovered ? 'translateY(-3px) scale(1.02)' : 'translateY(0) scale(1)',
                    boxShadow: isHovered 
                      ? '0 8px 24px rgba(59, 130, 246, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)' 
                      : '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
                    border: isHovered ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                  }}
                >
                  {/* 渐变背景 */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  
                  {/* 顶部装饰线 */}
                  <div 
                    className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300"
                    style={{ 
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
                    }}
                  />
                  
                  <div className="relative">
                    {/* 工具名称 */}
                    <div className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors duration-200 truncate">
                      {tool.name}
                    </div>
                    
                    {/* 箭头图标 */}
                    <div 
                      className="absolute right-0 bottom-0 transition-all duration-200"
                      style={{
                        opacity: isHovered ? 1 : 0,
                        transform: isHovered ? 'translateX(0)' : 'translateX(-4px)',
                      }}
                    >
                      <svg 
                        className="w-3.5 h-3.5 text-blue-500"
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 进入工具库 */}
      <div className="px-4 mt-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 工作流入口 */}
            <Link
              to="/workflows"
              className="block rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-6 text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl group"
            >
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium w-fit">
                  <GitBranch className="h-3.5 w-3.5" />
                  教学工作流
                </div>
                <div className="text-xl font-semibold">把备课、练习、讲评串成一条完整流程</div>
                <div className="text-sm text-blue-50/90">
                  选择通用工作流，或把常用工具组合成自己的工作流，一步步接着做下去。
                </div>
                <div className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-blue-600 w-fit group-hover:shadow-lg transition-shadow">
                  进入工作流
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* 工具库入口 */}
            <Link
              to="/tools"
              className="block rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-500 p-6 text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl group"
            >
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium w-fit">
                  <Wrench className="h-3.5 w-3.5" />
                  教学工具库
                </div>
                <div className="text-xl font-semibold">60+ 教学工具随心选用</div>
                <div className="text-sm text-teal-50/90">
                  覆盖教案、练习、评价、沟通等教学全场景，每个工具独立使用。
                </div>
                <div className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-teal-600 w-fit group-hover:shadow-lg transition-shadow">
                  查看工具库
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>


    </div>
  )
}

export default HomePage
