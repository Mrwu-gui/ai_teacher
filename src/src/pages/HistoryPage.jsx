import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock3, Trash2 } from 'lucide-react'
import { getToolById } from '../data/tools'

const HistoryPage = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])

  const loadItems = () => {
    const next = JSON.parse(localStorage.getItem('beike_history') || '[]')
      .filter((item) => item && item.id)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    setItems(next)
  }

  useEffect(() => {
    loadItems()
  }, [])

  const groupedItems = useMemo(() => items, [items])

  const removeItem = (id) => {
    const next = items.filter((item) => item.id !== id)
    localStorage.setItem('beike_history', JSON.stringify(next))
    setItems(next)
  }

  const clearHistory = () => {
    localStorage.removeItem('beike_history')
    setItems([])
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">历史记录</h1>
              <p className="text-sm text-slate-500">查看老师已生成过的内容与草稿痕迹</p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearHistory}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
            >
              清空历史
            </button>
          )}
        </div>

        {groupedItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center">
            <Clock3 className="mx-auto mb-4 h-10 w-10 text-slate-300" />
            <div className="text-lg font-medium text-slate-700">还没有历史记录</div>
            <p className="mt-2 text-sm text-slate-500">先去生成一条内容，这里就会自动保存成功记录。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {groupedItems.map((item) => {
              const tool = getToolById(item.templateId)
              const title = tool?.name || item.templateName || '未命名工具'
              const subtitle = item.input?.topic || item.input?.exam_name || item.input?.theme || item.input?.grade_subject || '查看详情'

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => navigate(`/tool/${item.templateId}`, { state: { historyItem: item } })}
                    >
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-slate-900">{title}</h2>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                          成功
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
                      <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {item.result || '暂无结果内容'}
                      </p>
                      <p className="mt-3 text-xs text-slate-400">
                        {new Date(item.createdAt || Date.now()).toLocaleString('zh-CN')}
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryPage
