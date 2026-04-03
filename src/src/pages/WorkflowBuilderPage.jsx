import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUp, ArrowDown, Plus, Trash2, Search, GripVertical, Check } from 'lucide-react'
import { getAllWorkflowTools, saveCustomWorkflow } from '../data/workflows'

const WorkflowBuilderPage = () => {
  const navigate = useNavigate()
  const toolOptions = useMemo(() => getAllWorkflowTools(), [])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scenario, setScenario] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [stepIds, setStepIds] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('全部')

  // 按分类分组工具
  const categories = useMemo(() => {
    const cats = new Set(['全部'])
    toolOptions.forEach(tool => cats.add(tool.category))
    return Array.from(cats)
  }, [toolOptions])

  // 过滤工具
  const filteredTools = useMemo(() => {
    return toolOptions.filter(tool => {
      const matchSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = selectedCategory === '全部' || tool.category === selectedCategory
      return matchSearch && matchCategory
    })
  }, [toolOptions, searchQuery, selectedCategory])

  // 添加步骤
  const addStep = (toolId) => {
    setStepIds(prev => [...prev, toolId])
  }

  // 移动步骤
  const moveStep = (index, direction) => {
    setStepIds((prev) => {
      const next = [...prev]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  // 删除步骤
  const removeStep = (index) => {
    setStepIds((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  // 清空所有步骤
  const clearAllSteps = () => {
    setStepIds([])
  }

  // 保存工作流
  const handleSave = () => {
    if (!name.trim() || stepIds.length === 0) return
    const workflow = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || '自定义工作流',
      scenario: scenario.trim() || '按自己的教学习惯组合',
      estimatedTime: '按步骤灵活完成',
      stepIds,
    }
    saveCustomWorkflow(workflow)
    navigate('/workflows')
  }

  // 检查工具是否已添加
  const isToolAdded = (toolId) => stepIds.includes(toolId)

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/workflows')}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回工作流
        </button>

        {/* 基本信息卡片 */}
        <div className="rounded-3xl border border-blue-100 bg-white p-6">
          <h1 className="text-2xl font-bold text-slate-900">新建自定义工作流</h1>
          <p className="mt-2 text-sm text-slate-500">
            你可以把常用工具按顺序串起来，后续只要一步步往下做就行。
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">
                工作流名称 <span className="text-red-500">*</span>
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：公开课备课流程"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">适用场景</div>
              <input
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="例如：公开课、教研活动、单元复习"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">工作流说明</div>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简单写一下这条工作流是做什么的"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* 左右布局：工具库 + 已选步骤 */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* 左侧：工具库 */}
          <div className="rounded-3xl border border-blue-100 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">工具库</h2>
              <div className="text-sm text-slate-500">{filteredTools.length} 个工具</div>
            </div>

            {/* 搜索和分类筛选 */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索工具名称或描述..."
                  className="w-full rounded-2xl border border-slate-200 pl-11 pr-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* 工具列表 */}
            <div className="max-h-[600px] space-y-2 overflow-y-auto pr-2">
              {filteredTools.map((tool) => {
                const added = isToolAdded(tool.id)
                return (
                  <div
                    key={tool.id}
                    className={`group rounded-2xl border-2 p-4 transition-all cursor-pointer ${
                      added
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                    }`}
                    onClick={() => !added && addStep(tool.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className={`text-sm font-semibold ${added ? 'text-blue-700' : 'text-slate-900'}`}>
                            {tool.name}
                          </div>
                          {added && (
                            <span className="flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                              <Check className="h-3 w-3" />
                              已添加
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{tool.category}</div>
                        <div className="mt-2 text-sm text-slate-600">{tool.description}</div>
                      </div>
                      {!added && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            addStep(tool.id)
                          }}
                          className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {filteredTools.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  没有找到匹配的工具
                </div>
              )}
            </div>
          </div>

          {/* 右侧：已选步骤 */}
          <div className="rounded-3xl border border-blue-100 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                已选步骤 <span className="text-base font-normal text-slate-500">({stepIds.length})</span>
              </h2>
              {stepIds.length > 0 && (
                <button
                  onClick={clearAllSteps}
                  className="text-xs text-red-600 hover:text-red-700 transition-colors"
                >
                  清空全部
                </button>
              )}
            </div>

            {/* 步骤列表 */}
            <div className="space-y-3">
              {stepIds.length > 0 ? (
                stepIds.map((toolId, index) => {
                  const tool = toolOptions.find((item) => item.id === toolId)
                  return (
                    <div
                      key={`${toolId}-${index}`}
                      className="group rounded-2xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        {/* 拖拽手柄 + 序号 */}
                        <div className="flex flex-col items-center gap-1">
                          <GripVertical className="h-4 w-4 text-slate-400" />
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            {index + 1}
                          </div>
                        </div>

                        {/* 工具信息 */}
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-900">{tool?.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{tool?.category}</div>
                          <div className="mt-2 text-xs text-slate-600 line-clamp-2">{tool?.description}</div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => moveStep(index, 'up')}
                            disabled={index === 0}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 transition-all"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveStep(index, 'down')}
                            disabled={index === stepIds.length - 1}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 transition-all"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeStep(index)}
                            className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                  <div className="text-sm text-slate-500 mb-2">还没有添加任何步骤</div>
                  <div className="text-xs text-slate-400">从左侧工具库点击添加工具</div>
                </div>
              )}
            </div>

            {/* 提示信息 */}
            {stepIds.length > 0 && (
              <div className="mt-4 rounded-xl bg-blue-50 p-4 text-xs text-blue-700">
                💡 提示：后续步骤会尽量继承前一步已填写的信息，减少重复输入。
              </div>
            )}

            {/* 保存按钮 */}
            <button
              onClick={handleSave}
              disabled={!name.trim() || stepIds.length === 0}
              className="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:bg-slate-300 transition-all"
            >
              {stepIds.length === 0 
                ? '请至少添加一个步骤' 
                : !name.trim() 
                  ? '请填写工作流名称' 
                  : `保存工作流 (${stepIds.length} 个步骤)`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkflowBuilderPage
