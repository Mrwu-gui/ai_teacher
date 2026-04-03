import React from 'react'
import Modal from './Modal'

const ConfirmInfoModal = ({ isOpen, onClose, onConfirm, values, onInputChange, fields = [], isValid = true }) => {
  const hasFields = fields.length > 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="确认基础信息"
      size="md"
      footer={
        <>
          <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            返回修改描述
          </button>
          <button onClick={onConfirm} disabled={!isValid} className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            确认并继续
          </button>
        </>
      }
    >
      <div className="mb-4 text-sm text-slate-500">
        AI 已从您的描述中识别出以下信息，请确认或修改：
      </div>
      {hasFields ? (
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </label>
              <input
                value={values?.[field.key] || ''}
                onChange={(e) => onInputChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          这条工作流没有需要统一前置确认的公共字段，确认后会直接进入下一步。
        </div>
      )}
      <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">
        💡 提示：这些信息会自动应用到工作流的所有步骤中，无需重复填写。
      </div>
    </Modal>
  )
}

export default ConfirmInfoModal
