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
  ChevronDown
} from 'lucide-react'
import { categories, allTools, getToolsByCategory } from '../data/tools'

const ToolLibraryPage = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState(null)

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTools.map(tool => {
              const Icon = iconMap[tool.icon] || BookOpen
              
              return (
                <div
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {tool.description}
                      </p>
                      <div className="text-xs text-slate-400 mt-2">
                        {tool.category}
                      </div>
                    </div>
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
                <div key={category.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {/* 分类头部 */}
                  <div
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-slate-900">{category.name}</h2>
                        <p className="text-xs text-slate-500">{tools.length} 个工具</p>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                  </div>
                  
                  {/* 工具列表 */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tools.map(tool => {
                          const toolIcon = iconMap[tool.icon] || BookOpen
                          
                          return (
                            <div
                              key={tool.id}
                              onClick={() => handleToolClick(tool.id)}
                              className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer group"
                            >
                              <div className="text-slate-500 flex-shrink-0">
                                <toolIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {tool.name}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                  {tool.description}
                                </p>
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
