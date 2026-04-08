export const hasFilledValue = (value) => {
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (typeof value === 'boolean') return value
  return true
}

export const FIELD_SEMANTIC_SLOT_MAP = {
  grade_subject: 'grade_subject',
  grade: 'grade',
  subject: 'subject',
  textbook_version: 'textbook_version',
  textbookVersion: 'textbook_version',
  topic: 'topic',
  lesson_topic: 'topic',
  unit_name: 'topic',
  unitName: 'topic',
  project_topic: 'topic',
  theme: 'topic',
  survey_theme: 'topic',
  scenario: 'topic',
  event_name: 'topic',
  comm_type: 'purpose',
  purpose: 'purpose',
  reply_goal: 'purpose',
  exercise_type: 'purpose',
  support_type: 'purpose',
  feedback_type: 'purpose',
  proofread_goal: 'purpose',
  goal_focus: 'purpose',
  recommendation_purpose: 'purpose',
  audience: 'audience',
  target_audience: 'audience',
  service_target: 'audience',
  content: 'core_content',
  key_facts: 'core_content',
  highlights: 'core_content',
  event_details: 'core_content',
  source_message: 'core_content',
  evaluation_content: 'core_content',
  source_text: 'core_content',
  student_issues: 'student_issue',
  student_situation: 'student_issue',
  improvements: 'student_issue',
  support_background: 'student_issue',
  typical_incident: 'student_issue',
  classroom_issue: 'student_issue',
  classroom_notes: 'student_issue',
  incident: 'student_issue',
  student_strengths: 'student_strength',
  strengths: 'student_strength',
  tone: 'tone',
  language_style: 'tone',
  response_style: 'tone',
  question_type: 'format',
  meeting_form: 'format',
  question_count: 'quantity',
  duration: 'quantity',
  support_duration: 'quantity',
}

export const getFieldSemanticSlot = (fieldKey) => FIELD_SEMANTIC_SLOT_MAP[fieldKey] || fieldKey

export const isFieldVisible = (field, values = {}) => {
  if (!field?.showWhen) return true
  const rule = field.showWhen
  const currentValue = values?.[rule.key]
  if (rule.equals !== undefined) return currentValue === rule.equals
  if (Array.isArray(rule.in)) return rule.in.includes(currentValue)
  return true
}

export const applyRecognizedAliases = (tool, recognized = {}) => {
  const next = { ...recognized }
  const toolFieldKeys = new Set(tool.fields.map((field) => field.key))
  const aliasPairs = [
    ['strengths', 'student_strengths'],
    ['student_strengths', 'strengths'],
    ['improvements', 'student_situation'],
    ['student_situation', 'improvements'],
    ['content', 'key_facts'],
    ['key_facts', 'content'],
    ['content', 'highlights'],
    ['highlights', 'content'],
  ]

  aliasPairs.forEach(([fromKey, toKey]) => {
    if (!toolFieldKeys.has(toKey)) return
    if (hasFilledValue(next[toKey])) return
    if (!hasFilledValue(next[fromKey])) return
    next[toKey] = next[fromKey]
  })

  return next
}

const extractClauseByKeywords = (message, keywords = []) => {
  const clauses = String(message || '')
    .split(/[。！？!?\n；;]/)
    .map((item) => item.trim())
    .filter(Boolean)

  return clauses.find((clause) => keywords.some((keyword) => clause.includes(keyword))) || ''
}

const normalizeDurationValue = (message, options = []) => {
  const text = String(message || '')
  if (!text) return ''

  const normalizedText = text.replace(/\s+/g, '')
  const mappings = [
    { patterns: ['1课时(40分钟)', '40分钟一课时', '一课时40分钟', '1课时40分钟', '40分钟'], target: '1课时(40分钟)' },
    { patterns: ['1课时(45分钟)', '45分钟一课时', '一课时45分钟', '1课时45分钟', '45分钟'], target: '1课时(45分钟)' },
    { patterns: ['2课时', '两课时'], target: '2课时' },
    { patterns: ['其他'], target: '其他' },
  ]

  for (const item of mappings) {
    if (!options.includes(item.target)) continue
    if (item.patterns.some((pattern) => normalizedText.includes(pattern.replace(/\s+/g, '')))) {
      return item.target
    }
  }

  return ''
}

const deriveTeachingDesignRecognizedFromMessage = (tool, message, recognized = {}, existingValues = {}) => {
  if (tool.category !== '教学设计') return recognized

  const next = { ...recognized }
  const mergedValues = { ...existingValues, ...next }
  const text = String(message || '').trim()
  if (!text) return next

  const toolFieldKeys = new Set(tool.fields.map((field) => field.key))

  const ensureField = (fieldKey, value) => {
    if (!toolFieldKeys.has(fieldKey)) return
    if (hasFilledValue(mergedValues[fieldKey]) || hasFilledValue(next[fieldKey])) return
    if (!hasFilledValue(value)) return
    next[fieldKey] = value
  }

  if (toolFieldKeys.has('duration')) {
    const durationField = tool.fields.find((field) => field.key === 'duration')
    const durationValue = normalizeDurationValue(text, durationField?.options || [])
    ensureField('duration', durationValue)
  }

  if (toolFieldKeys.has('evaluation_method')) {
    const evaluationKeywords = ['课堂提问', '当堂练习', '小组展示', '出口卡', '任务单', '观察记录', '自评', '互评', '小组汇报', '随堂检测']
    const evaluationClause = extractClauseByKeywords(text, evaluationKeywords)
    ensureField('evaluation_method', evaluationClause)
  }

  if (toolFieldKeys.has('key_difficult')) {
    const keyDiffMatch = text.match(/((?:重点|难点|重难点)[^。！？!?\n]*)/)
    ensureField('key_difficult', keyDiffMatch?.[1]?.trim() || '')
  }

  if (toolFieldKeys.has('student_situation')) {
    const studentKeywords = ['学情', '学生', '班里', '基础', '愿意表达', '表达积极', '差异', '注意力', '薄弱', '参与度', '课堂状态']
    const studentClause = extractClauseByKeywords(text, studentKeywords)
    if (studentClause && studentClause.length >= 6) {
      ensureField('student_situation', studentClause)
    }
  }

  return next
}

const normalizeOptionByIncludes = (text, options = [], aliasMap = {}) => {
  const rawText = String(text || '').trim()
  if (!rawText || !Array.isArray(options) || options.length === 0) return ''

  for (const option of options) {
    if (rawText.includes(option)) return option
  }

  for (const [keyword, target] of Object.entries(aliasMap)) {
    if (rawText.includes(keyword) && options.includes(target)) {
      return target
    }
  }

  return ''
}

const deriveCommunicationRecognizedFromMessage = (tool, message, recognized = {}, existingValues = {}) => {
  if (tool.category !== '沟通写作') return recognized

  const next = { ...recognized }
  const mergedValues = { ...existingValues, ...next }
  const text = String(message || '').trim()
  if (!text) return next

  const toolFieldKeys = new Set(tool.fields.map((field) => field.key))

  const ensureField = (fieldKey, value) => {
    if (!toolFieldKeys.has(fieldKey)) return
    if (hasFilledValue(mergedValues[fieldKey]) || hasFilledValue(next[fieldKey])) return
    if (!hasFilledValue(value)) return
    next[fieldKey] = value
  }

  const audienceField = tool.fields.find((field) => field.key === 'audience')
  ensureField('audience', normalizeOptionByIncludes(text, audienceField?.options || [], {
    家长群: '家长',
    家委: '家长',
    家长会: '家长',
    学生: '学生',
    同事: '同事',
    校长: '管理者',
    年级组长: '管理者',
    教导处: '管理者',
    机构: '外部机构',
  }))

  const purposeField = tool.fields.find((field) => field.key === 'purpose')
  ensureField('purpose', normalizeOptionByIncludes(text, purposeField?.options || [], {
    告知: '通知',
    提醒: '通知',
    回应: '回复',
    回信: '回复',
    邀请函: '邀请',
    请家长配合: '反馈',
    推荐信: '推荐',
    说明一下: '说明',
    解释: '说明',
  }))

  const toneField = tool.fields.find((field) => field.key === 'tone')
  ensureField('tone', normalizeOptionByIncludes(text, toneField?.options || [], {
    客气: '温和',
    温柔: '温和',
    简短: '简洁',
    简明: '简洁',
    紧急: '紧急',
    正式: '正式',
    鼓励: '鼓励',
    感谢: '感谢',
    坚定: '坚定',
    温暖: '温暖',
  }))

  const contentKeys = ['content', 'key_facts', 'highlights']
  const contentClause = extractClauseByKeywords(text, ['因为', '关于', '主要是', '想说', '提醒', '通知', '反馈', '说明', '活动', '孩子', '学生'])
  contentKeys.forEach((fieldKey) => ensureField(fieldKey, contentClause))

  if (toolFieldKeys.has('special_needs')) {
    const specialNeedsClause = extractClauseByKeywords(text, ['截止', '尽快', '简短', '口吻', '别太', '控制在', '像老师平时'])
    ensureField('special_needs', specialNeedsClause)
  }

  return next
}

const deriveExerciseRecognizedFromMessage = (tool, message, recognized = {}, existingValues = {}) => {
  if (tool.category !== '练习命题') return recognized

  const next = { ...recognized }
  const mergedValues = { ...existingValues, ...next }
  const text = String(message || '').trim()
  if (!text) return next

  const toolFieldKeys = new Set(tool.fields.map((field) => field.key))

  const ensureField = (fieldKey, value) => {
    if (!toolFieldKeys.has(fieldKey)) return
    if (hasFilledValue(mergedValues[fieldKey]) || hasFilledValue(next[fieldKey])) return
    if (!hasFilledValue(value)) return
    next[fieldKey] = value
  }

  const questionCountField = tool.fields.find((field) => field.key === 'question_count')
  if (questionCountField?.options?.length) {
    const matchedCount = questionCountField.options.find((option) => text.includes(option))
    ensureField('question_count', matchedCount || '')
  }

  const difficultyField = tool.fields.find((field) => field.key === 'difficulty')
  ensureField('difficulty', normalizeOptionByIncludes(text, difficultyField?.options || [], {
    简单: '简单',
    基础: '基础',
    中等: '中等',
    适中: '适中',
    提升: '提升',
    拔高: '提升',
    困难: '困难',
    挑战: '挑战',
    混合: '混合',
    基础巩固: '基础巩固',
    综合复习: '综合复习',
    中档提升: '中档提升',
    压轴: '压轴训练',
    梯度: '混合梯度',
  }))

  const exerciseTypeField = tool.fields.find((field) => field.key === 'exercise_type')
  ensureField('exercise_type', normalizeOptionByIncludes(text, exerciseTypeField?.options || [], {
    随堂: '随堂练习',
    测验: '单元测验',
    作业: '课后作业',
    专项: '专项训练',
  }))

  const topicLikeKeys = ['topic', 'source_text', 'lesson_topic']
  const topicClause = extractClauseByKeywords(text, ['围绕', '关于', '针对', '复习', '练', '做'])
  topicLikeKeys.forEach((fieldKey) => ensureField(fieldKey, topicClause))

  return next
}

const deriveFeedbackRecognizedFromMessage = (tool, message, recognized = {}, existingValues = {}) => {
  if (tool.category !== '反馈评价') return recognized

  const next = { ...recognized }
  const mergedValues = { ...existingValues, ...next }
  const text = String(message || '').trim()
  if (!text) return next

  const toolFieldKeys = new Set(tool.fields.map((field) => field.key))

  const ensureField = (fieldKey, value) => {
    if (!toolFieldKeys.has(fieldKey)) return
    if (hasFilledValue(mergedValues[fieldKey]) || hasFilledValue(next[fieldKey])) return
    if (!hasFilledValue(value)) return
    next[fieldKey] = value
  }

  const feedbackTypeField = tool.fields.find((field) => field.key === 'feedback_type')
  ensureField('feedback_type', normalizeOptionByIncludes(text, feedbackTypeField?.options || [], {
    优点和建议: '优点与建议',
    量规: '量规评价',
    评语: '评语',
    课堂观察: '课堂观察',
  }))

  const audienceField = tool.fields.find((field) => field.key === 'audience')
  ensureField('audience', normalizeOptionByIncludes(text, audienceField?.options || [], {
    学生: '学生',
    家长: '家长',
    教师: '教师',
    混合: '混合对象',
  }))

  const issueClause = extractClauseByKeywords(text, ['问题', '薄弱', '失分', '不会', '不足', '主要在'])
  ensureField('student_issues', issueClause)

  const evaluationClause = extractClauseByKeywords(text, ['作文', '作业', '课堂表现', '作品', '观察记录', '试卷', '讲评'])
  ensureField('evaluation_content', evaluationClause)

  return next
}

const deriveStudentSupportRecognizedFromMessage = (tool, message, recognized = {}, existingValues = {}) => {
  if (tool.category !== '学生支持') return recognized

  const next = { ...recognized }
  const mergedValues = { ...existingValues, ...next }
  const text = String(message || '').trim()
  if (!text) return next

  const toolFieldKeys = new Set(tool.fields.map((field) => field.key))

  const ensureField = (fieldKey, value) => {
    if (!toolFieldKeys.has(fieldKey)) return
    if (hasFilledValue(mergedValues[fieldKey]) || hasFilledValue(next[fieldKey])) return
    if (!hasFilledValue(value)) return
    next[fieldKey] = value
  }

  const supportTypeField = tool.fields.find((field) => field.key === 'support_type')
  ensureField('support_type', normalizeOptionByIncludes(text, supportTypeField?.options || [], {
    心理: '心理疏导',
    谈心: '心理疏导',
    规划: '成长规划',
    学习困难: '学业支持',
    学困: '学业支持',
    沟通: '家校协同',
    家长配合: '家校协同',
    行为: '行为引导',
  }))

  const issueClause = extractClauseByKeywords(text, ['拖延', '情绪', '走神', '作业', '压力', '冲突', '不愿', '波动', '困难', '问题'])
  ensureField('student_situation', issueClause)
  ensureField('support_background', extractClauseByKeywords(text, ['家庭', '转学', '最近', '此前', '以往', '背景']))
  ensureField('student_strengths', extractClauseByKeywords(text, ['优点', '优势', '愿意', '喜欢', '擅长', '积极']))

  return next
}

export const deriveRecognizedFromMessage = (tool, message, recognized = {}, existingValues = {}) => {
  let next = { ...recognized }
  next = deriveTeachingDesignRecognizedFromMessage(tool, message, next, existingValues)
  next = deriveCommunicationRecognizedFromMessage(tool, message, next, existingValues)
  next = deriveExerciseRecognizedFromMessage(tool, message, next, existingValues)
  next = deriveFeedbackRecognizedFromMessage(tool, message, next, existingValues)
  next = deriveStudentSupportRecognizedFromMessage(tool, message, next, existingValues)

  const mergedValues = { ...existingValues, ...next }
  const unresolvedRequiredTextFields = tool.fields.filter((field) => {
    if (!field.required || field.isAdvanced) return false
    if (!['text', 'textarea'].includes(field.type)) return false
    if (!isFieldVisible(field, mergedValues)) return false
    return !hasFilledValue(mergedValues[field.key])
  })

  if (unresolvedRequiredTextFields.length === 1) {
    const [targetField] = unresolvedRequiredTextFields
    next[targetField.key] = String(message || '').trim()
  }

  return next
}

export const buildRequiredFieldQueue = (tool, aiRequiredKeys = [], recognized = {}, existingFormData = {}, existingFieldAnswers = {}, optionHints = {}) => {
  const orderedKeys = []
  ;(aiRequiredKeys || []).forEach((key) => {
    if (key && !orderedKeys.includes(key)) orderedKeys.push(key)
  })
  tool.fields
    .filter((field) => field.required && !field.isAdvanced)
    .forEach((field) => {
      if (!orderedKeys.includes(field.key)) orderedKeys.push(field.key)
    })

  return orderedKeys
    .map((key) => {
      const field = tool.fields.find((item) => item.key === key && !item.isAdvanced)
      if (!field) return null

      const mergedValues = {
        ...existingFormData,
        ...existingFieldAnswers,
        ...recognized,
      }
      if (!isFieldVisible(field, mergedValues)) {
        return null
      }

      const recognizedValue = recognized[key]
      const existingValue = existingFieldAnswers[key] ?? existingFormData[key]
      if (hasFilledValue(recognizedValue) || hasFilledValue(existingValue)) {
        return null
      }

      return {
        key: field.key,
        label: field.label,
        type: field.type,
        required: !!field.required,
        placeholder: field.placeholder || '',
        options: (() => {
          const fieldOptions = field.options || []
          const hintedOptions = Array.isArray(optionHints[field.key]) ? optionHints[field.key] : []
          if (hintedOptions.length === 0) return fieldOptions
          const dedupedHints = hintedOptions.filter((option) => fieldOptions.includes(option))
          const rest = fieldOptions.filter((option) => !dedupedHints.includes(option))
          return [...dedupedHints, ...rest]
        })(),
        recommendedOptions: Array.isArray(optionHints[field.key]) ? optionHints[field.key] : [],
      }
    })
    .filter(Boolean)
}

export const getSoftOptionFields = (tool, suggestions = [], recognized = {}, existingFormData = {}, optionalFieldKeys = [], explicitFieldKeys = []) => {
  const suggestionKeys = suggestions
    .map((item) => item?.fieldKey)
    .filter(Boolean)
  const optionalFieldKeySet = new Set(optionalFieldKeys || [])
  const explicitKeySet = new Set(explicitFieldKeys || [])
  const mergedValues = {
    ...existingFormData,
    ...recognized,
  }

  return tool.fields.filter((field) => {
    if (!isFieldVisible(field, mergedValues)) return false
    if (hasFilledValue(mergedValues[field.key])) return false

    const slotKey = getFieldSemanticSlot(field.key)
    const hasExplicitSameSlot = tool.fields.some((candidate) => (
      getFieldSemanticSlot(candidate.key) === slotKey &&
      explicitKeySet.has(candidate.key) &&
      hasFilledValue(mergedValues[candidate.key])
    ))

    if (hasExplicitSameSlot) return false

    if (optionalFieldKeySet.size > 0) {
      return optionalFieldKeySet.has(field.key) || suggestionKeys.includes(field.key)
    }

    if (field.isAdvanced) return true
    if (!field.required && suggestionKeys.includes(field.key)) return true
    return false
  })
}

export const buildSeedSummary = (tool, values = {}, explicitKeys = [], inferredKeys = []) => {
  const explicitSet = new Set(explicitKeys)
  const inferredSet = new Set(inferredKeys)

  return tool.fields
    .filter((field) => hasFilledValue(values[field.key]))
    .map((field) => ({
      key: field.key,
      label: field.label,
      value: values[field.key],
      source: explicitSet.has(field.key) ? 'explicit' : (inferredSet.has(field.key) ? 'inferred' : 'explicit'),
    }))
}

export const buildSlotState = (tool, values = {}, explicitKeys = [], inferredKeys = []) => {
  const explicitSet = new Set(explicitKeys)
  const inferredSet = new Set(inferredKeys)
  const mergedValues = { ...values }

  return tool.fields
    .filter((field) => isFieldVisible(field, mergedValues))
    .map((field) => {
      const filled = hasFilledValue(mergedValues[field.key])
      return {
        key: field.key,
        label: field.label,
        required: Boolean(field.required && !field.isAdvanced),
        isAdvanced: Boolean(field.isAdvanced),
        filled,
        source: explicitSet.has(field.key) ? 'explicit' : (inferredSet.has(field.key) ? 'inferred' : (filled ? 'prefill' : 'missing')),
        value: mergedValues[field.key],
      }
    })
}

const normalizeCandidateHints = (candidateHints = {}) => {
  if (!candidateHints || typeof candidateHints !== 'object') return {}

  return Object.fromEntries(
    Object.entries(candidateHints)
      .map(([fieldKey, candidates]) => [
        fieldKey,
        Array.from(new Set((Array.isArray(candidates) ? candidates : []).filter(Boolean).map((item) => String(item).trim()))),
      ])
      .filter(([, candidates]) => candidates.length > 0)
  )
}

const normalizeRecognizedSelectValues = (tool, recognized = {}, existingValues = {}) => {
  const next = { ...recognized }
  const mergedValues = { ...existingValues, ...next }

  tool.fields.forEach((field) => {
    if (field.type !== 'select') return
    if (!hasFilledValue(next[field.key])) return

    const rawValue = String(next[field.key] || '').trim()
    if (!rawValue) return
    if ((field.options || []).includes(rawValue)) return

    const matched = (field.options || []).find((option) => {
      if (option === rawValue) return true
      return rawValue.includes(option) || option.includes(rawValue)
    })

    if (!matched) return
    if (hasFilledValue(mergedValues[field.key]) && mergedValues[field.key] === matched) return
    next[field.key] = matched
  })

  return next
}

export const resolveSelectFieldCandidates = (tool, recognized = {}, existingValues = {}, candidateHints = {}) => {
  const next = normalizeRecognizedSelectValues(tool, { ...recognized }, existingValues)
  const normalizedHints = normalizeCandidateHints(candidateHints)
  const mergedValues = { ...existingValues, ...next }
  const optionHints = {}
  const autoFilledKeys = []

  Object.entries(normalizedHints).forEach(([fieldKey, candidates]) => {
    const field = tool.fields.find((item) => item.key === fieldKey && item.type === 'select')
    if (!field) return
    if (hasFilledValue(mergedValues[fieldKey]) || hasFilledValue(next[fieldKey])) return

    const validCandidates = candidates.filter((candidate) => (field.options || []).includes(candidate))
    if (validCandidates.length === 1) {
      next[fieldKey] = validCandidates[0]
      autoFilledKeys.push(fieldKey)
      return
    }

    if (validCandidates.length > 1) {
      optionHints[fieldKey] = validCandidates
    }
  })

  return { recognized: next, autoFilledKeys, optionHints }
}

const KNOWN_SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '道德与法治', '政治', '科学', '音乐', '美术', '信息科技', '信息技术']
const KNOWN_TEXTBOOK_VERSIONS = ['部编版', '人教版', '北师大版', '苏教版', '沪教版', '教科版', '湘教版', '外研版', '译林版', '鲁科版', '粤教版', '浙教版', '青岛版']

const normalizeWorkflowGrade = (value) => {
  const text = String(value || '').trim()
  if (!text) return ''
  if (/^小学[一二三四五六]年级$/.test(text)) return text.replace(/^小学/, '')
  if (/^[一二三四五六]年级$/.test(text)) return text
  if (/^[七八九]年级$/.test(text)) return text
  if (/^初[一二三]$/.test(text)) return text
  if (/^高[一二三]$/.test(text)) return text
  return text
}

const extractWorkflowGrade = (message) => {
  const text = String(message || '')
  const matchers = [
    /(小学[一二三四五六]年级)/,
    /([一二三四五六]年级)/,
    /([七八九]年级)/,
    /(初[一二三])/,
    /(高[一二三])/,
  ]

  for (const matcher of matchers) {
    const matched = text.match(matcher)
    if (matched?.[1]) return normalizeWorkflowGrade(matched[1])
  }
  return ''
}

const extractWorkflowSubject = (message) => {
  const text = String(message || '')
  return KNOWN_SUBJECTS.find((subject) => text.includes(subject)) || ''
}

const extractWorkflowTextbookVersion = (message) => {
  const text = String(message || '')
  return KNOWN_TEXTBOOK_VERSIONS.find((version) => text.includes(version)) || ''
}

const extractWorkflowUnitName = (message) => {
  const text = String(message || '').trim()
  if (!text) return ''

  const quoted = text.match(/《([^》]{1,30})》/)
  if (quoted?.[1]) return quoted[1].trim()

  const topicMatchers = [
    /(?:围绕|讲|做|准备|设计|生成)([^，。；,\n]{2,24})(?:教案|练习|讲评|班会|说课|公开课|作业|教学设计)/,
    /([^，。；,\n]{2,24})(?:这一课|这节课|这个单元)/,
  ]

  for (const matcher of topicMatchers) {
    const matched = text.match(matcher)
    if (matched?.[1]) return matched[1].trim().replace(/^[给帮把将做一份套个次节课关于围绕]+/, '')
  }

  return ''
}

export const deriveWorkflowRecognizedFromMessage = (message, recognized = {}) => {
  const next = { ...recognized }
  const text = String(message || '').trim()
  if (!text) return next

  if (!hasFilledValue(next.grade)) {
    next.grade = extractWorkflowGrade(text)
  }

  if (!hasFilledValue(next.subject)) {
    next.subject = extractWorkflowSubject(text)
  }

  if (!hasFilledValue(next.textbookVersion)) {
    next.textbookVersion = extractWorkflowTextbookVersion(text)
  }

  if (!hasFilledValue(next.unitName)) {
    next.unitName = extractWorkflowUnitName(text)
  }

  if (!hasFilledValue(next.seedContext)) {
    next.seedContext = text
  }

  return next
}
