import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ImagePlus, MessageSquare, Send, ShieldCheck } from 'lucide-react'

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

  const feedbackTips = useMemo(
    () => [
      '例如：生成教案时没有“板书设计”，这个字段内容里比形式更重要。',
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
    } catch {
      setSubmitState('提交失败，请稍后再试。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">我的</h1>
            <p className="text-sm text-slate-500">给我们反馈使用体验，帮助把工具打磨得更好用。</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">教师反馈</h2>
                <p className="text-sm text-slate-500">越具体越好，我们会据此改 Prompt、改字段、改交互。</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">反馈类型</label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  {feedbackTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">反馈内容</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  placeholder="请尽量写具体：是哪个工具、哪一步、缺什么字段、结果哪里不对、你更希望它怎么生成。"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">联系方式（可选）</label>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="微信 / 邮箱 / 手机号"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">上传截图（可选）</label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500 transition hover:border-blue-300 hover:bg-blue-50">
                  <ImagePlus className="h-4 w-4" />
                  <span>{imageBase64 ? '已选择截图，点这里重新上传' : '上传问题截图或结果截图'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
                </label>
              </div>

              {submitState && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {submitState}
                </div>
              )}

              <button
                onClick={submitFeedback}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {submitting ? '提交中...' : '提交反馈'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-slate-900">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <h2 className="text-base font-semibold">我们最希望收到的反馈</h2>
              </div>
              <div className="space-y-3">
                {feedbackTips.map((tip) => (
                  <div key={tip} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-600">
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">管理员反馈列表</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                仅管理员可见，入口是隐藏路由 <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">/feedback-admin</code>。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
