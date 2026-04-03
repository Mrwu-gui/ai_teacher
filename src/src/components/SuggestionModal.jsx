import React, { useState } from 'react'
import { Sparkles, Check } from 'lucide-react'
import Modal from './Modal'

const SuggestionModal = ({ isOpen, onClose, onAdopt, onSkip, suggestions, onSuggestionSelect, selectedSuggestion, customInput, onCustomInputChange }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onSkip}
      title="AI 建议补充"
      size="md"
      footer={
        <>
          <button onClick={onSkip} className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            跳过，直接执行
          </button>
          <button onClick={onAdopt} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Sparkles className="h-4 w-4" />
            采用并开始执行
          </button>
        </>
      }
    >
      <div className="mb-4 text-sm text-slate-500">
        根据您的描述，AI 建议补充以下内容，让生成的教案更精准：
      </div>

      {suggestions.length > 0 && (
        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">教学目标建议</label>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionSelect(suggestion)}
                className={`w-full rounded-2xl border-2 px-4 py-3 text-left text-sm transition-all ${
                  selectedSuggestion === suggestion ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {selectedSuggestion === suggestion && <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />}
                  <span className="flex-1">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          或自己补充教学目标
        </label>
        <textarea
          value={customInput}
          onChange={(e) => onCustomInputChange(e.target.value)}
          placeholder="例如：让学生理解文章主旨，体会作者情感..."
          rows={3}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
        />
      </div>

      <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
        💡 建议：选择或填写教学目标后，生成的教案会更符合您的教学需求。
      </div>
    </Modal>
  )
}

export default SuggestionModal
