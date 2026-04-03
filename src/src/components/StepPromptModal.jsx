import React from 'react'
import { AlertCircle } from 'lucide-react'
import Modal from './Modal'

const StepPromptModal = ({ isOpen, onClose, onContinue, onSkip, prompt, onValueChange }) => {
  if (!prompt) return null
  const canSkip = prompt.fields.some((field) => !field.required)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="还需要补充一点信息"
      size="sm"
      footer={
        <>
          {onSkip && canSkip && (
            <button onClick={onSkip} className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              跳过
            </button>
          )}
          <button onClick={onContinue} className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            继续执行
          </button>
        </>
      }
    >
      <div className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          执行到「{prompt.toolName}」时，需要补充以下信息：
        </span>
      </div>

      <div className="space-y-4">
        {prompt.fields.map((field) => (
          <div key={field.key}>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </label>
            {field.type === 'select' ? (
              <select
                value={prompt.values[field.key] || ''}
                onChange={(e) => onValueChange(field.key, e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              >
                <option value="">请选择</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={prompt.values[field.key] || ''}
                onChange={(e) => onValueChange(field.key, e.target.value)}
                placeholder={field.placeholder || '请输入'}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            )}
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default StepPromptModal
