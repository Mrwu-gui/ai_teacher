import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpen, 
  FileText, 
  ClipboardList, 
  Layers, 
  MessageSquare, 
  Send, 
  Heart, 
  Zap,
  Search,
  ChevronDown,
  Sparkles
} from 'lucide-react'
import { categories, allTools, getToolsByCategory } from '../data/tools'

const ToolLibraryPage = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [hoveredToolId, setHoveredToolId] = useState(null)

  const iconMap = {
    BookOpen: BookOpen,
    FileText: FileText,
    ClipboardList: ClipboardList,
    Layers: Layers,
    MessageSquare: MessageSquare,
    Send: Send,
    Heart: Heart,
    Zap: Zap
  }

  // 根据分类映射图标
  const categoryIconMap = {
    '教学设计': BookOpen,
    '教学内容': FileText,
    '练习命题': ClipboardList,
    '差异化教学': Layers,
    '反馈评价': MessageSquare,
    '沟通写作': Send,
    '学生支持': Heart,
    '课堂助手': Zap,
  }

  // 获取工具图标
  const getToolIcon = (tool) => {
    // 如果工具有 icon 字段，优先使用
    if (tool.icon && iconMap[tool.icon]) {
      return iconMap[tool.icon]
    }
    // 否则根据分类返回图标
    if (tool.category && categoryIconMap[tool.category]) {
      return categoryIconMap[tool.category]
    }
    // 默认返回 BookOpen
    return BookOpen
  }

  const handleToolClick = (toolId) => {
    navigate(`/tool/${toolId}`)
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  const filteredTools = searchQuery 
    ? allTools.filter(tool => 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-slate-900 mb-3">工具库</h1>
          
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索工具..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 搜索结果 */}
      {filteredTools && (
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="mb-4 text-sm text-slate-500">
            找到 {filteredTools.length} 个工具
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filteredTools.map(tool => {
              const isHovered = hoveredToolId === tool.id
              
              return (
                <div
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  onMouseEnter={() => setHoveredToolId(tool.id)}
                  onMouseLeave={() => setHoveredToolId(null)}
                  className="relative bg-white border border-slate-200 rounded-lg p-3 cursor-pointer will-change-transform overflow-hidden"
                  style={{
                    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)' : '0 1px 2px rgba(0, 0, 0, 0.02)',
                    borderColor: isHovered ? '#cbd5e1' : '#e2e8f0',
                  }}
                >
                  {/* 左侧蓝色指示条 */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 transition-opacity duration-200"
                    style={{ opacity: isHovered ? 1 : 0.6 }}
                  />
                  
                  <div className="flex items-center gap-2 pl-2">
                    {/* 蓝色小圆点 */}
                    <div 
                      className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 transition-transform duration-200"
                      style={{ transform: isHovered ? 'scale(1.2)' : 'scale(1)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div 
                        className="text-sm font-medium transition-colors truncate"
                        style={{
                          color: isHovered ? '#2563eb' : '#334155',
                        }}
                      >
                        {tool.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {tool.description}
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover 时显示的箭头 */}
                  <div 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 transition-all duration-200"
                    style={{
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-4px)',
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 分类列表 */}
      {!filteredTools && (
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="space-y-4">
            {categories.map(category => {
              const Icon = iconMap[category.icon] || BookOpen
              const tools = getToolsByCategory(category.name)
              const isExpanded = expandedCategory === category.id
              
              return (
                <div key={category.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  {/* 分类头部 */}
                  <div
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-slate-900">{category.name}</h2>
                        <p className="text-xs text-slate-500">{tools.length} 个工具</p>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                  </div>
                  
                  {/* 工具列表 */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {tools.map(tool => {
                          const isHovered = hoveredToolId === tool.id
                          
                          return (
                            <div
                              key={tool.id}
                              onClick={() => handleToolClick(tool.id)}
                              onMouseEnter={() => setHoveredToolId(tool.id)}
                              onMouseLeave={() => setHoveredToolId(null)}
                              className="relative bg-white border border-slate-200 rounded-lg p-3 cursor-pointer will-change-transform overflow-hidden"
                              style={{
                                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                                boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)' : '0 1px 2px rgba(0, 0, 0, 0.02)',
                                borderColor: isHovered ? '#cbd5e1' : '#e2e8f0',
                              }}
                            >
                              {/* 左侧蓝色指示条 */}
                              <div 
                                className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 transition-opacity duration-200"
                                style={{ opacity: isHovered ? 1 : 0.6 }}
                              />
                              
                              <div className="flex items-center gap-2 pl-2">
                                {/* 蓝色小圆点 */}
                                <div 
                                  className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 transition-transform duration-200"
                                  style={{ transform: isHovered ? 'scale(1.2)' : 'scale(1)' }}
                                />
                                <div 
                                  className="text-sm font-medium transition-colors truncate"
                                  style={{
                                    color: isHovered ? '#2563eb' : '#334155',
                                  }}
                                >
                                  {tool.name}
                                </div>
                              </div>
                              
                              {/* Hover 时显示的箭头 */}
                              <div 
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 transition-all duration-200"
                                style={{
                                  opacity: isHovered ? 1 : 0,
                                  transform: isHovered ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-4px)',
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ToolLibraryPage
