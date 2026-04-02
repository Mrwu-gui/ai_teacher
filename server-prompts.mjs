const line = (label, value) => (value ? `- ${label}：${value}` : '')

const yesNo = (value, yesText, noText = '') => {
  if (value === true) return yesText
  if (value === false) return noText
  return ''
}

const compact = (parts) => parts.filter(Boolean).join('\n')

const extractQuestionCount = (value) => {
  if (!value) return ''
  const match = String(value).match(/\d+/)
  return match ? match[0] : String(value)
}

const withOutput = (prompt, outputSections, extra = []) => {
  const sectionText = outputSections.map((item, index) => `${index + 1}. ${item}`).join('\n')
  const extraText = extra.filter(Boolean).join('\n')

  return compact([
    prompt.trim(),
    '请按以下结构输出：',
    sectionText,
    extraText
  ])
}

const toneGuideByCategory = {
  '反馈评价': [
    '语气要求：',
    '- 优先使用鼓励式、支持性、成长型表达。',
    '- 不要使用直白的负面评价或给学生贴标签，例如“差、懒、笨、糟糕、失败、没救了”等。',
    '- 先肯定已有表现，再指出需要继续提升的地方。',
    '- 改进建议要具体、温和、可执行。'
  ],
  '沟通写作': [
    '语气要求：',
    '- 表达要专业、克制、尊重、合作导向。',
    '- 不要使用带指责感、对立感或情绪化的负面措辞。',
    '- 涉及问题时，用“需要进一步关注”“建议继续改进”“建议家校协同支持”等表达替代简单否定。'
  ],
  '学生支持': [
    '语气要求：',
    '- 始终采用支持性、保护性、发展性表达。',
    '- 不把学生定义为问题本身，不使用负面标签化描述。',
    '- 优先描述学生优势、可用资源和支持路径，再说明当前需要帮助的方面。',
    '- 建议要体现尊重、具体和可落地。'
  ]
}

const applyToneGuide = (tool, prompt) => {
  const guide = toneGuideByCategory[tool.category]
  if (!guide) return prompt
  return compact([prompt, ...guide])
}

const promptBuilders = {
  'lesson-plan': (values) =>
    withOutput(
      compact([
        '你是一名熟悉课堂教学法与课程设计的教学设计专家，请根据教师需求生成一份完整的教学方案。',
        '',
        '教师输入：',
        line('年级/课程', values.grade_subject),
        line('教材版本', values.textbook_version),
        line('主题或单元', values.topic),
        line('课程标准或教学目标', values.teaching_objectives),
        line('教学类型', '常规课'),
        line('课时长度', values.duration),
        line('可用资源', values.resources),
        line('学情描述', values.student_situation),
        line('预期评价方式', values.evaluation_method),
        line('教学重点难点', values.key_difficult),
        line('特别要求', values.extra_requirements),
        yesNo(values.need_inquiry, '- 教学结构：请采用导入、探究、建构、迁移应用、评价反馈五环节组织流程'),
        yesNo(values.need_blackboard, '- 输出中需要包含板书设计'),
        yesNo(values.need_homework, '- 输出中需要包含分层作业设计（必做+选做）')
      ]),
      ['教学概述', '教学目标', '教学准备', '教学流程', '过程性评价', '评价方式', '板书设计', '作业布置', '教学反思', '差异化教学与拓展建议'],
      [
        '要求：',
        '- 生成结构完整、逻辑连贯、真实可执行的教学方案。',
        '- 明确教师活动、学生活动、检查理解方式与结束性评价。',
        '- 内容要贴近中国中小学课堂，不要空泛套话。'
      ]
    ),
  'lesson-5e': (values) =>
    withOutput(
      compact([
        '你是一名熟悉课堂教学法与课程设计的教学设计专家，请根据教师需求生成一份完整的五环节探究教学方案。',
        '',
        '教师输入：',
        line('年级/课程', values.grade_subject),
        line('教材版本', values.textbook_version),
        line('主题或单元', values.topic),
        line('课程标准或教学目标', values.teaching_objectives),
        line('教学类型', '5E 课'),
        line('课时长度', values.duration),
        line('可用资源', values.resources),
        line('学情描述', values.student_situation),
        line('预期评价方式', values.evaluation_method),
        line('探究重点', values.inquiry_focus),
        line('特别要求', values.extra_requirements)
      ]),
      ['教学概述', '教学目标', '教学准备', '引入', '探究', '解释', '迁移/拓展', '评价', '板书设计', '作业布置', '教学反思', '差异化教学与拓展建议'],
      [
        '要求：',
        '- 每个环节写清教师活动、学生活动、设计意图与时间分配。',
        '- 探究活动要具备问题链和学生参与过程。',
        '- 保持中国课堂可执行性，避免照搬西式术语。'
      ]
    ),
  'pe-lesson-plan': (values) =>
    withOutput(
      compact([
        '你是一名熟悉中国学校体育教学与学生安全管理的体育教师，请根据以下信息生成一份可直接上课使用的体育教案。',
        '',
        '基本信息：',
        line('年级与学科', values.grade_subject),
        line('教学内容', values.topic),
        line('教学目标', values.teaching_objectives),
        line('场地与器材', values.venue_equipment),
        line('课型', values.class_type),
        line('学情说明', values.student_situation),
        line('安全注意事项', values.safety_notes),
        yesNo(values.need_game, '- 教学中需要加入游戏化或竞赛化环节')
      ]),
      ['教学目标', '教学重点与难点', '场地器材准备', '热身活动', '基本部分', '放松整理', '安全提示', '课后反思'],
      [
        '要求：',
        '- 写清教师组织方式、队形安排、练习次数和时间分配。',
        '- 体现运动负荷控制和安全管理。',
        '- 表达要符合中国学校体育课教案习惯。'
      ]
    ),
  'unit-plan': (values) =>
    withOutput(
      compact([
        '你是一名擅长单元整体教学设计的教师，请根据以下信息生成一份单元整体设计方案。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('单元名称', values.unit_name),
        line('单元目标', values.unit_goals),
        line('教材版本', values.textbook_version),
        line('单元课时数', values.unit_hours),
        line('单元重难点', values.key_difficult)
      ]),
      ['单元定位与价值', '单元目标', '课时安排总览', '每课时重点任务', '关键问题链设计', '过程性评价与终结性评价', '分层作业与单元拓展', '教师实施建议']
    ),
  'lesson-talk': (values) =>
    withOutput(
      compact([
        '你是一名熟悉中国中小学教研表达方式的教师，请根据以下信息生成一份结构清晰、可直接用于教研交流或比赛展示的说课稿。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('课题', values.topic),
        line('说课重点', values.talk_focus),
        line('教材版本', values.textbook_version),
        line('教学方法说明', values.teaching_method)
      ]),
      ['教材分析', '学情分析', '教学目标', '教学重难点', '教法与学法', '教学过程设计', '板书设计', '设计亮点与反思'],
      [
        '要求：',
        '- 语言符合中国学校教研场景。',
        '- 既要讲清为什么这样教，也要讲清怎样教。',
        '- 如果教师未提供完整学情，请基于常见班情做合理化表达。'
      ]
    ),
  'project-based-learning': (values) =>
    withOutput(
      compact([
        '你是一名擅长项目式学习设计的教师，请根据以下信息生成一份项目式学习方案。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('项目主题', values.project_topic),
        line('项目目标', values.teaching_objectives),
        line('项目周期', values.duration),
        line('可用资源', values.resources),
        line('成果评价方式', values.assessment_plan)
      ]),
      ['项目概述', '驱动性问题', '项目目标', '项目实施阶段与任务安排', '小组协作与教师支持方式', '项目成果形式', '评价量规建议', '风险点与实施提醒']
    ),
  'science-lab': (values) =>
    withOutput(
      compact([
        '你是一名擅长科学探究教学的教师，请根据以下信息生成一份实验课设计。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('实验主题', values.topic),
        line('实验目标', values.teaching_objectives),
        line('实验材料与条件', values.resources),
        line('学生基础与风险点', values.student_situation)
      ]),
      ['实验课目标', '实验材料清单', '实验步骤与教师指导语', '学生观察记录建议', '安全注意事项', '数据分析与结论形成', '评价与反思']
    ),
  'group-work': (values) =>
    withOutput(
      compact([
        '你是一名擅长合作学习设计与课堂任务编排的教师，请根据以下信息生成一份可直接实施的小组活动方案。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('活动主题或课题', values.topic),
        line('活动目标', values.teaching_objectives),
        line('合作任务重点', values.group_goal),
        line('建议组人数', values.group_size),
        line('可用资源', values.resources)
      ]),
      ['活动目标', '活动流程设计', '小组分工建议', '教师指导语与巡视重点', '成果展示方式', '评价建议与风险提醒']
    ),
  'pd-planner': (values) =>
    withOutput(
      compact([
        '你是一名熟悉校本研修和教师专业发展活动设计的教研负责人，请根据以下信息生成一份教师培训计划。',
        '',
        '输入信息：',
        line('培训主题', values.training_theme),
        line('培训对象', values.audience),
        line('培训目标', values.teaching_objectives),
        line('培训时长', values.duration),
        line('可用资源或案例', values.resources)
      ]),
      ['培训定位', '培训目标', '活动流程安排', '互动任务设计', '所需材料与准备', '培训后跟进建议']
    ),
  'content-gen': (values) =>
    withOutput(
      compact([
        '你是一名熟悉课程标准与课堂教学的课程内容编写专家，请根据教师提供的信息生成一份原创教学内容。',
        '',
        '教师输入：',
        line('年级/学科', values.grade_subject),
        line('主题', values.topic),
        line('课程标准或教学目标', values.teaching_objectives),
        line('内容类型', values.content_type),
        line('阅读水平或认知难度', values.difficulty),
        line('重点词汇或核心概念', values.key_terms),
        line('篇幅要求', values.length_requirement),
        line('差异化教学备注', values.differentiation_notes)
      ]),
      ['标题', '正文内容', '教师使用建议', '差异化教学提示'],
      [
        '要求：',
        '- 内容必须原创，适合中国课堂直接使用。',
        '- 使内容紧扣主题与教学目标。',
        '- 在适当情况下自然融入重点词汇与核心概念。',
        '- 保持可教性、可练性与可延展性。'
      ]
    ),
  'expository-text': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一篇适合课堂使用的说明性文本。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('说明主题', values.topic),
        line('教学目标', values.teaching_objectives),
        line('难度', values.difficulty),
        line('篇幅要求', values.length_requirement)
      ]),
      ['标题', '说明性正文', '教师使用建议', '差异化教学提示']
    ),
  'phonics-reader': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一篇适合低龄学生使用的拼读文本或注音读物。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('主题', values.topic),
        line('重点字词', values.key_terms),
        line('篇幅要求', values.length_requirement),
        line('使用目标', values.teaching_objectives)
      ]),
      ['标题', '正文文本', '重点字词提示', '教师使用建议'],
      [
        '- 语言要简洁、节奏清楚，便于朗读与识字训练。',
        '- 必须适合小学低年级课堂直接使用。'
      ]
    ),
  'vocab-text': (values) =>
    withOutput(
      compact([
        '你是一名熟悉中国中小学阅读教学与词汇教学的课程内容编写教师，请根据以下信息生成一篇自然融入重点词汇的教学文本。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('文本主题', values.topic),
        line('重点词汇', values.target_vocab),
        line('文本类型', values.text_style),
        line('篇幅要求', values.length_requirement),
        line('教学目标', values.teaching_objectives)
      ]),
      ['标题', '正文文本', '重点词汇使用标注', '教师使用建议'],
      [
        '要求：',
        '- 所有重点词汇都要自然出现在文本中，不要生硬堆砌。',
        '- 文本难度要符合对应年级。',
        '- 适合中国课堂朗读、讲解或词汇训练直接使用。'
      ]
    ),
  'vocab-list': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一份重点词汇清单，用于中国课堂的预习、讲解或复习。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('课文或主题', values.topic),
        line('词汇数量', values.word_count),
        line('使用目标', values.teaching_objectives),
        yesNo(values.need_examples, '- 需要配例句'),
        yesNo(values.need_extension, '- 需要补充易错提醒或拓展提示')
      ]),
      ['词汇清单', '词义解释', '课堂例句', '教学提示'],
      [
        '要求：',
        '- 词汇选择要紧扣课文或主题。',
        '- 解释要符合学生理解水平。',
        '- 如果提供例句，要简洁自然。'
      ]
    ),
  'data-analysis-task': (values) =>
    withOutput(
      compact([
        '请根据以下数据材料生成一组课堂数据分析任务。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('主题', values.topic),
        line('数据表内容', values.data_source),
        line('任务目标', values.task_goal),
        line('问题数量', values.question_count)
      ]),
      ['任务说明', '数据分析问题', '参考结论方向', '教师组织建议'],
      [
        '要求：',
        '- 问题要从读取信息、比较分析到形成结论逐步深入。',
        '- 表达要贴近中国课堂任务单风格。'
      ]
    ),
  'real-world-connection': (values) =>
    withOutput(
      compact([
        '请将课堂知识与现实生活或社会情境建立联系，生成可直接用于课堂的情境化材料。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('知识点或主题', values.topic),
        line('情境方向', values.connection_goal),
        line('教学目标', values.teaching_objectives),
        line('情境数量', values.scenario_count)
      ]),
      ['现实情境设计', '课堂提问建议', '与知识点的连接说明', '教师使用建议']
    ),
  'lesson-hook': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一段适合中国课堂使用的课堂导入设计。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('课题', values.topic),
        line('导入方式', values.hook_style),
        line('导入目标', values.teaching_objectives),
        line('导入时长', values.duration)
      ]),
      ['导入设计思路', '教师导入话术', '学生回应预设', '过渡到新课的连接语', '使用提醒'],
      [
        '要求：',
        '- 导入要短、准、有效，不要喧宾夺主。',
        '- 话术要自然，适合中国教师直接使用。'
      ]
    ),
  'math-word-problem': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一组数学应用题。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('数学知识点', values.topic),
        line('题目数量', values.question_count),
        line('难度', values.difficulty),
        yesNo(values.need_answer, '- 需要答案解析')
      ]),
      ['题目说明', '应用题', '参考答案', '解析与能力点说明'],
      [
        `- 必须严格生成 ${extractQuestionCount(values.question_count) || '指定数量'} 道应用题。`,
        '- 情境要真实自然，不能脱离学生生活经验太远。'
      ]
    ),
  'math-review-set': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一组数学复习题组。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('复习主题', values.topic),
        line('题目数量', values.question_count),
        line('复习梯度', values.difficulty),
        yesNo(values.need_answer, '- 需要答案解析')
      ]),
      ['题组说明', '复习题组', '参考答案', '梯度设计说明']
    ),
  'sel-lesson-plan': (values) =>
    withOutput(
      compact([
        '你是一名熟悉中国学校德育与社会情感学习活动设计的教师，请根据以下信息生成一份课程方案。',
        '',
        '输入信息：',
        line('适用年级', values.grade),
        line('主题', values.topic),
        line('培养目标', values.teaching_objectives),
        line('课时长度', values.duration),
        line('偏好活动形式', values.activity_preference)
      ]),
      ['课程背景', '课程目标', '活动准备', '活动流程', '教师引导语', '评价与反思', '后续延伸建议']
    ),
  'syllabus-generator': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一份适合中国学校场景的课程纲要。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('课程名称', values.course_name),
        line('课程目标', values.course_goals),
        line('课程周期', values.weeks),
        line('评价方式', values.evaluation_method)
      ]),
      ['课程定位', '课程目标', '阶段安排', '学习内容概览', '评价方式', '学习要求与建议']
    ),
  'exercise-gen': (values) =>
    withOutput(
      compact([
        '你是一名经验丰富的中国中小学命题教师，请根据以下信息生成一套练习与检测内容。',
        '',
        '基本信息：',
        line('年级与学科', values.grade_subject),
        line('教材版本', values.textbook_version),
        line('课题或知识点', values.topic),
        line('教学目标', values.teaching_objectives),
        line('练习类型', values.exercise_type),
        line('题型', values.question_type),
        line('难度层次', values.difficulty),
        line('题量要求', values.question_count),
        line('认知水平要求', values.cognitive_requirement),
        line('特殊要求', values.special_requirements),
        yesNo(values.need_answer, '- 需要答案与解析')
      ]),
      ['题目说明', '题目内容', '随堂检测题（3-5题）', '参考答案', '解析与能力标签'],
      [
        '要求：',
        `- 严格按照教师要求生成 ${extractQuestionCount(values.question_count) || '指定数量'} 道题，不能额外增加题目。`,
        `- 如果教师指定了题型为“${values.question_type || '未指定'}”，则题目必须全部符合该题型；只有在“混合题型”时才能混出多种题型。`,
        '- 题目表述准确、规范，符合中国学校课堂练习语境。',
        '- 难度分布合理，由易到难排列。',
        '- 如果不需要答案解析，则不要输出参考答案和解析内容，只保留题目。',
        '- 如果需要答案，请提供简明但有用的解析。'
      ]
    ),
  'worksheet-gen': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一份课堂练习单或学习任务单。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('教材版本', values.textbook_version),
        line('主题或知识点', values.topic),
        line('教学目标', values.teaching_objectives),
        line('主要题型', values.question_type),
        line('题目数量', values.question_count),
        line('难度层次', values.difficulty),
        line('特殊要求', values.special_requirements),
        yesNo(values.need_answer, '- 需要答案解析')
      ]),
      ['练习单说明', '题目内容', '随堂检测题（3-5题）', '参考答案', '简要解析或能力标签'],
      [
        '- 练习单要适合直接发放给学生使用。',
        '- 随堂检测题需要覆盖本课核心知识点。'
      ]
    ),
  'multiple-choice-quiz': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一套选择题测评。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('教材版本', values.textbook_version),
        line('知识点', values.topic),
        line('教学目标', values.teaching_objectives),
        line('题目数量', values.question_count),
        line('难度', values.difficulty),
        line('特殊要求', values.special_requirements),
        yesNo(values.need_answer, '- 需要答案与解析')
      ]),
      ['题目说明', '选择题', '随堂检测题（3-5题）', '参考答案', '解析与命题说明'],
      [
        `- 必须严格生成 ${extractQuestionCount(values.question_count) || '指定数量'} 道选择题。`,
        '- 每题需提供4个规范选项。'
      ]
    ),
  'cognitive-questions': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一组体现不同认知层次的问题。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('教材版本', values.textbook_version),
        line('主题或文本', values.topic),
        line('教学目标', values.teaching_objectives),
        line('认知层次', values.cognitive_levels),
        line('问题数量', values.question_count),
        yesNo(values.need_answer, '- 需要参考答案')
      ]),
      ['问题设计说明', '问题列表', '参考答案或答题方向', '教师使用建议']
    ),
  'text-dependent-questions': (values) =>
    withOutput(
      compact([
        '请基于给定文本生成文本依赖性阅读理解问题。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('教材版本', values.textbook_version),
        line('阅读文本', values.source_text),
        line('教学目标', values.teaching_objectives),
        line('问题数量', values.question_count),
        line('难度', values.difficulty),
        yesNo(values.need_answer, '- 需要答案解析')
      ]),
      ['题目说明', '阅读理解问题', '参考答案', '文本证据提示'],
      [
        '- 所有问题都必须能够从文本中找到证据支持。',
        '- 不要脱离文本泛泛发问。'
      ]
    ),
  'text-analysis-task': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一组文本分析任务。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('教材版本', values.textbook_version),
        line('文本内容', values.source_text),
        line('教学目标', values.teaching_objectives),
        line('分析重点', values.analysis_focus),
        line('任务数量', values.question_count),
        yesNo(values.need_answer, '- 需要参考要点')
      ]),
      ['任务说明', '分析任务', '参考要点', '教师评价建议']
    ),
  'video-questions': (values) =>
    withOutput(
      compact([
        '请根据教学视频信息生成一组视频学习问题。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('教材版本', values.textbook_version),
        line('视频内容简介', values.video_summary),
        line('教学目标', values.teaching_objectives),
        line('问题数量', values.question_count),
        line('问题类型', values.question_type),
        yesNo(values.need_answer, '- 需要参考答案')
      ]),
      ['观看任务说明', '视频学习问题', '参考答案或要点', '课堂讨论建议']
    ),
  'math-drill': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一组高强度数学专项训练。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('教材版本', values.textbook_version),
        line('数学知识点', values.topic),
        line('教学目标', values.teaching_objectives),
        line('题目数量', values.question_count),
        line('训练强度', values.difficulty),
        yesNo(values.need_answer, '- 需要答案解析')
      ]),
      ['训练说明', '专项训练题', '参考答案', '难度梯度说明'],
      [
        `- 必须严格生成 ${extractQuestionCount(values.question_count) || '指定数量'} 道数学题。`,
        '- 题目要体现梯度，避免全都同一难度。'
      ]
    ),
  'english-reading-assessment': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一套英语阅读测评任务。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('教材版本', values.textbook_version),
        line('阅读材料', values.source_text),
        line('教学目标', values.teaching_objectives),
        line('题目数量', values.question_count),
        line('难度', values.difficulty),
        yesNo(values.need_answer, '- 需要答案解析')
      ]),
      ['阅读材料说明', '阅读理解题', '参考答案', '能力点分析']
    ),
  'science-3d-assessment': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一份科学探究能力评价任务。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('科学主题', values.topic),
        line('评价目标', values.teaching_objectives),
        line('任务形式', values.task_type),
        line('任务数量', values.question_count),
        yesNo(values.need_rubric, '- 需要评价量规')
      ]),
      ['任务背景', '评价任务设计', '学生作答要求', '评价要点', '评价量规建议', '教师使用提醒']
    ),
  'multi-step-assignment': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一份多步骤任务型作业。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('任务主题', values.topic),
        line('任务目标', values.teaching_objectives),
        line('任务步骤数', values.step_count),
        line('成果形式', values.output_form),
        yesNo(values.need_rubric, '- 需要评价标准')
      ]),
      ['任务说明', '步骤安排', '每一步提交要求', '成果展示形式', '评价标准', '教师实施提醒']
    ),
  'layered-homework': (values) =>
    withOutput(
      compact([
        '你是一名擅长差异化教学的中国中小学教师，请根据以下信息生成一份分层作业方案。',
        '',
        '基本信息：',
        line('年级与学科', values.grade_subject),
        line('课题', values.topic),
        line('作业目标', values.teaching_objectives),
        line('分层方式', values.homework_levels),
        yesNo(values.need_answers, '- 需要参考答案与评分建议')
      ]),
      ['作业设计说明', '必做题', '选做题A·巩固层', '选做题B·提升层', '选做题C·拓展层', '参考答案与评分建议', '教师使用说明'],
      [
        '要求：',
        '- 三层作业之间难度梯度清晰。',
        '- 必做题覆盖基础目标，拓展题体现思维提升。'
      ]
    ),
  'choice-board': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一份学生可自主选择完成的选择板。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('学习主题', values.topic),
        line('学习目标', values.teaching_objectives),
        line('任务格数', values.board_size),
        line('任务类型倾向', values.task_types)
      ]),
      ['选择板设计说明', '任务格内容', '完成建议', '教师使用提醒'],
      [
        '- 任务之间要有难度差异和类型差异。',
        '- 既要有基础任务，也要有创作或表达类任务。'
      ]
    ),
  'text-scaffold': (values) =>
    withOutput(
      compact([
        '请在不改变核心教学目标的前提下，对以下学习材料进行差异化教学改写和教学支架设计。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('原始材料或任务', values.source_text),
        line('核心教学目标', values.teaching_objectives),
        line('支架类型', values.scaffold_type),
        line('学困生支持需求', values.struggling_support),
        line('资优生拓展方向', values.gifted_extension)
      ]),
      ['核心目标保留说明', '学困生支架版', '常规课堂版', '资优生拓展任务', '教师使用建议']
    ),
  'exam-review': (values) =>
    withOutput(
      compact([
        '你是一名经验丰富的中国中小学教师，请根据以下信息生成一份试卷讲评课方案。',
        '',
        '输入信息：',
        line('考试名称', values.exam_name),
        line('年级与学科', values.grade_subject),
        line('学生主要问题', values.student_issues),
        line('成绩分析数据', values.score_analysis),
        line('典型错误统计', values.common_mistakes)
      ]),
      ['成绩与问题概览', '共性错因分析', '讲评重点与顺序', '课堂讲评流程', '典型题讲解思路', '当堂巩固练习', '后续补救建议'],
      [
        '要求：',
        '- 讲评重点放在错因分析和改进方法，不只是公布答案。',
        '- 输出应能直接用于一节讲评课。'
      ]
    ),
  'feedback-rubric': (values) =>
    withOutput(
      compact([
        '你是一名具备评价素养的教师，请根据给定材料和评价要求，生成具体、客观、可执行的反馈。',
        '',
        '教师输入：',
        line('待评价内容', values.evaluation_content),
        line('评价标准或量规', values.evaluation_criteria),
        line('输出语气', values.language_style),
        line('面向对象', values.target_audience),
        line('输出形式', values.feedback_type),
        line('补充评价维度', values.evaluation_aspects)
      ]),
      ['总体评价', '主要优点', '需要改进之处', '后续建议'],
      [
        '要求：',
        '- 基于可见证据提炼表现亮点。',
        '- 找出最值得优先改进的问题。',
        '- 建议要可操作，便于教师直接使用。'
      ]
    ),
  'student-comment': (values) =>
    withOutput(
      compact([
        '你是一名富有教育情怀的中国中小学班主任，擅长写出真诚、具体、有温度的学生评语。请根据以下信息为学生撰写个性化评语。',
        '',
        '学生信息：',
        line('姓名', values.student_name),
        line('年级', values.grade),
        line('主要优点', values.strengths),
        line('需要改进的地方', values.improvements),
        line('评语风格', values.comment_style)
      ]),
      ['正式评语', '简短版评语', '给家长的私信版'],
      [
        '要求：',
        '- 评语要具体，避免套话。',
        '- 改进建议用鼓励性语言表达。'
      ]
    ),
  'classroom-observation': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一份适合学校教研活动使用的听评课反馈。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('授课内容', values.lesson_topic),
        line('观察重点', values.observation_focus),
        line('课堂记录', values.classroom_notes),
        line('反馈风格', values.feedback_tone)
      ]),
      ['课堂亮点', '目标达成分析', '教学组织与学生活动观察', '值得优化的问题', '可操作改进建议', '综合评价']
    ),
  'survey-creator': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一份问卷。',
        '',
        '输入信息：',
        line('问卷主题', values.survey_theme),
        line('调查对象', values.audience),
        line('调查目标', values.survey_goal),
        line('题目数量', values.question_count),
        line('题型结构', values.question_type)
      ]),
      ['问卷说明', '问卷题目', '作答方式建议', '教师使用提醒'],
      [
        `- 必须严格生成 ${extractQuestionCount(values.question_count) || '指定数量'} 题。`,
        '- 题目表述要清晰、中立，适合教学调查或活动反馈场景。'
      ]
    ),
  'writing-feedback': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一份写作反馈。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('写作内容', values.evaluation_content),
        line('评价重点', values.evaluation_criteria),
        line('反馈语气', values.language_style),
        yesNo(values.need_revision_suggestion, '- 需要修改示例')
      ]),
      ['总体评价', '主要优点', '需要改进之处', '修改建议', '鼓励性总结'],
      [
        '- 反馈要具体，避免空泛套话。',
        '- 如果提供修改建议，最好给出可模仿的示例表达。'
      ]
    ),
  'text-proofreader': (values) =>
    withOutput(
      compact([
        '请根据以下信息对文本进行校对与润色。',
        '',
        '输入信息：',
        line('原始文本', values.source_text),
        line('处理目标', values.proofread_goal),
        line('适用对象', values.target_audience),
        line('目标风格', values.language_style)
      ]),
      ['问题诊断', '修改建议', '润色后文本', '使用提醒']
    ),
  'class-meeting': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一份适合中国学校班主任直接使用的主题班会方案。',
        '',
        '输入信息：',
        line('班会主题', values.theme),
        line('适用年级', values.grade),
        line('班会时长', values.duration),
        line('班会形式', values.meeting_form),
        yesNo(values.need_materials, '- 输出中需要包含准备材料清单')
      ]),
      ['班会背景', '班会目标', '班会准备', '班会流程', '学生参与活动设计', '班主任总结发言', '班会后续跟进建议'],
      [
        '要求：',
        '- 贴近中国学校德育和班级管理语境。',
        '- 活动环节具体，避免空洞说教。'
      ]
    ),
  'parent-communication': (values) =>
    withOutput(
      compact([
        '你是一名沟通能力出色的中国中小学教师，请根据以下信息生成家校沟通文本。',
        '',
        '基本信息：',
        line('沟通类型', values.comm_type),
        line('适用年级', values.grade),
        line('主要内容', values.content),
        line('语气风格', values.tone),
        line('特殊需求', values.special_needs),
        yesNo(values.need_signature, '- 需要附带家长签字回执提醒')
      ]),
      ['主要沟通文本', '简短版', '注意事项'],
      [
        '要求：',
        '- 客观描述事实，避免制造家长对立情绪。',
        '- 建议要可操作，体现家校合作。'
      ]
    ),
  'professional-email': (values) =>
    withOutput(
      compact([
        '你是一名熟悉学校沟通规范的教师，请根据以下信息撰写一段适合目标对象的正式沟通文本。',
        '',
        '输入信息：',
        line('沟通对象', values.audience),
        line('沟通目的', values.purpose),
        line('关键信息', values.key_facts),
        line('语气要求', values.tone),
        line('特殊需求', values.special_needs)
      ]),
      ['标题或主题句', '正文内容', '简短版摘要']
    ),
  'class-newsletter': (values) =>
    withOutput(
      compact([
        '你是一名班主任，请根据以下信息生成一份适合发送给家长的班级通讯。',
        '',
        '输入信息：',
        line('班级名称', values.class_name),
        line('时间范围', values.time_range),
        line('本期亮点与事项', values.highlights),
        line('语气风格', values.tone)
      ]),
      ['标题', '本期回顾', '学习重点', '家校配合提醒', '结尾寄语']
    ),
  'email-reply': (values) =>
    withOutput(
      compact([
        '请根据以下来信信息生成一封正式、得体的回复。',
        '',
        '输入信息：',
        line('来信对象', values.audience),
        line('原始来信或要点', values.source_message),
        line('回复目标', values.reply_goal),
        line('回复语气', values.tone),
        line('特殊需求', values.special_needs)
      ]),
      ['回复主题', '回复正文', '简短版回复']
    ),
  'recommendation-letter': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一封推荐信。',
        '',
        '输入信息：',
        line('被推荐人', values.candidate_name),
        line('推荐对象身份', values.candidate_role),
        line('主要优势与事例', values.strengths),
        line('推荐用途', values.recommendation_purpose),
        line('文本风格', values.tone)
      ]),
      ['称呼', '推荐信正文', '核心推荐理由总结']
    ),
  'thank-you-letter': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一封感谢信。',
        '',
        '输入信息：',
        line('感谢对象', values.audience),
        line('感谢原因', values.thank_reason),
        line('使用场景', values.occasion),
        line('语气风格', values.tone)
      ]),
      ['标题或称呼', '感谢正文', '结尾祝福']
    ),
  'promo-copy': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成宣传文案。',
        '',
        '输入信息：',
        line('活动名称', values.event_name),
        line('活动亮点', values.event_details),
        line('面向对象', values.audience),
        line('文案风格', values.tone)
      ]),
      ['标题文案', '主文案', '短版宣传语', '发布建议']
    ),
  'student-support': (values) =>
    withOutput(
      compact([
        '你是一名具有学生支持与班级管理经验的中国中小学教师，请根据以下信息生成一份学生支持方案。',
        '',
        '学生信息：',
        line('学生优势', values.student_strengths),
        line('学生需求或困难', values.student_situation),
        line('相关背景', values.support_background),
        line('课堂表现或典型事件', values.typical_incident),
        line('支持类型', values.support_type),
        line('输出语气', values.support_tone),
        line('年级', values.grade),
        line('辅导周期', values.support_duration),
        yesNo(values.need_follow_up, '- 需要后续跟踪建议')
      ]),
      ['学生情况分析', '支持目标', '课堂教学调整策略', '行为支持策略', '家校协同建议', '进展监测方法', '资源与工具推荐'],
      [
        '要求：',
        '- 请先说明：以下内容为草案，需结合学校实际情况与专业评估意见后使用。',
        '- 使用尊重学生、聚焦支持的表达方式。',
        '- 建议要具体可执行，避免标签化。',
        '- 充分考虑普通班级教师的可落实性。'
      ]
    ),
  'teaching-adjustment': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成教学调整建议。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('学生情况', values.student_situation),
        line('当前教学目标', values.teaching_objectives),
        line('调整重点', values.support_type),
        yesNo(values.need_follow_up, '- 需要跟踪建议')
      ]),
      ['情况分析', '课堂调整建议', '作业与评价调整建议', '家校配合建议', '跟踪观察重点'],
      [
        '- 请先说明：以下内容为草案，需结合学校实际情况与专业意见后使用。'
      ]
    ),
  'support-goals': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成学生阶段性发展目标。',
        '',
        '输入信息：',
        line('年级', values.grade),
        line('学生现状', values.student_situation),
        line('目标方向', values.goal_focus),
        line('目标周期', values.support_duration)
      ]),
      ['现状分析', '阶段性目标', '可观察指标', '教师支持建议', '家校配合建议']
    ),
  'social-story': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一篇适合学生理解的社交故事。',
        '',
        '输入信息：',
        line('年级', values.grade),
        line('场景', values.scenario),
        line('学生当前困难', values.student_situation),
        line('表达风格', values.story_tone)
      ]),
      ['故事标题', '社交故事正文', '教师使用提示', '可配套练习'],
      [
        '- 请先说明：以下内容为草案，需结合学生实际情况后使用。'
      ]
    ),
  'restorative-reflection': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一份修复式反思任务。',
        '',
        '输入信息：',
        line('年级', values.grade),
        line('事件经过', values.incident),
        line('反思目标', values.reflection_goal),
        line('任务语气', values.tone)
      ]),
      ['事件回顾引导', '反思问题', '修复行动建议', '后续跟进建议']
    ),
  'classroom-management': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成课堂管理建议。',
        '',
        '输入信息：',
        line('年级与学科', values.grade_subject),
        line('课堂管理问题', values.classroom_issue),
        line('课堂场景', values.teaching_context),
        line('改善目标', values.management_goal)
      ]),
      ['问题诊断', '即时管理建议', '规则与流程优化', '师生互动建议', '后续观察重点']
    ),
  'inclusive-support-plan': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一份普通班级中的随班支持计划草案。',
        '',
        '输入信息：',
        line('年级', values.grade),
        line('学生优势', values.student_strengths),
        line('学生需求或困难', values.student_situation),
        line('相关背景', values.support_background),
        yesNo(values.need_follow_up, '- 需要跟踪建议')
      ]),
      ['学生情况概述', '支持建议或方案要点', '落地实施建议', '后续观察与跟踪建议'],
      [
        '请先说明：以下内容为草案，需结合学校实际情况与专业评估意见后使用。'
      ]
    ),
  'individual-support-plan': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一份个别化支持计划草案。',
        '',
        '输入信息：',
        line('年级', values.grade),
        line('学生优势', values.student_strengths),
        line('学生需求或困难', values.student_situation),
        line('支持重点', values.goal_focus),
        line('计划周期', values.support_duration)
      ]),
      ['学生情况概述', '支持目标', '支持措施', '实施建议', '后续观察与跟踪建议'],
      [
        '请先说明：以下内容为草案，需结合学校实际情况与专业评估意见后使用。'
      ]
    ),
  'behavior-support-plan': (values) =>
    withOutput(
      compact([
        '请根据以下信息生成一份行为支持计划草案。',
        '',
        '输入信息：',
        line('年级', values.grade),
        line('典型事件或行为模式', values.typical_incident),
        line('学生优势', values.student_strengths),
        line('支持目标', values.reflection_goal),
        yesNo(values.need_follow_up, '- 需要跟踪建议')
      ]),
      ['学生情况概述', '行为支持目标', '支持措施', '落地实施建议', '后续观察与跟踪建议'],
      [
        '请先说明：以下内容为草案，需结合学校实际情况与专业评估意见后使用。'
      ]
    ),
  'subject-resource-bot': (values) =>
    withOutput(
      compact([
        '请为学科资源使用场景配置一个课堂助手。',
        '',
        '要求明确：',
        line('机器人名称或角色', values.bot_role),
        line('服务年级和学科', values.grade_subject),
        line('资源主题范围', values.theme_scope),
        line('回答风格', values.response_style)
      ]),
      ['角色定位', '服务对象', '资源范围', '回答风格', '示例提问', '使用边界']
    ),
  'roleplay-bot': (values) =>
    withOutput(
      compact([
        '请为角色扮演课堂活动配置一个对话助手。',
        '',
        '要求明确：',
        line('角色定位', values.bot_role),
        line('服务对象', values.service_target),
        line('使用场景', values.theme_scope),
        line('对话风格', values.response_style)
      ]),
      ['角色设定', '适用场景', '对话规则', '示例开场', '使用边界']
    ),
  'doc-qa-bot': (values) =>
    withOutput(
      compact([
        '请为文档问答场景配置一个课堂助手。',
        '',
        '要求明确：',
        line('机器人角色', values.bot_role),
        line('文档范围', values.document_scope),
        line('服务对象', values.service_target),
        line('回答风格', values.response_style)
      ]),
      ['角色定位', '文档范围', '问答规则', '回答风格', '示例提问', '使用边界']
    ),
  'custom-chatbot': (values) =>
    withOutput(
      compact([
        '请为教学场景配置一个自定义聊天机器人。',
        '',
        '要求明确：',
        line('角色定位', values.bot_role),
        line('服务对象', values.service_target),
        line('主题范围', values.theme_scope),
        line('回答风格', values.response_style),
        line('能做什么', values.can_do),
        line('不能做什么', values.cannot_do)
      ]),
      ['角色定位', '服务对象', '主题范围', '回答风格', '能做什么', '不能做什么', '示例提问', '首轮欢迎语']
    ),
  'standards-chatbot': (values) =>
    withOutput(
      compact([
        '请为课程标准解读与对齐场景配置一个课堂助手。',
        '',
        '要求明确：',
        line('机器人角色', values.bot_role),
        line('服务年级和学科', values.grade_subject),
        line('课程标准范围', values.standard_scope),
        line('回答风格', values.response_style),
        line('重点支持什么', values.can_do)
      ]),
      ['角色定位', '适用标准范围', '可支持的任务', '回答风格', '示例提问', '使用边界', '首轮欢迎语']
    ),
  'ai-chatbot': (values) =>
    withOutput(
      compact([
        '请为课堂场景配置一个可复用的课堂对话助手。',
        '',
        '要求明确：',
        line('角色定位', values.bot_role),
        line('服务对象', values.service_target),
        line('主题范围', values.theme_scope),
        line('回答风格', values.response_style),
        line('能做什么', values.can_do),
        line('不能做什么', values.cannot_do)
      ]),
      ['角色定位', '服务对象', '主题范围', '回答风格', '能做什么', '不能做什么', '示例提问', '首轮欢迎语'],
      [
        '要求：',
        '- 机器人既要有帮助，也要有边界感。',
        '- 避免代替学生完成学习任务或代替教师做最终评价。'
      ]
    )
}

export const buildPrompt = (tool, values) => {
  const builder = promptBuilders[tool.id]

  if (!builder) {
    throw new Error(`缺少工具 ${tool.id} 的独立 prompt builder`)
  }

  return applyToneGuide(tool, builder(values))
}

const systemPromptByTool = {
  'lesson-plan': '你是一名熟悉中国课程标准、课堂教学与教案写作规范的资深教师。',
  'lesson-5e': '你是一名熟悉探究式课堂设计与中国学校教学语境的资深教师。',
  'pe-lesson-plan': '你是一名熟悉中国学校体育教学、安全管理与课时组织的资深体育教师。',
  'unit-plan': '你是一名擅长单元整体教学设计、任务统整与评价设计的资深教师。',
  'lesson-talk': '你是一名熟悉中国学校教研、说课展示与教学表达的资深教师。',
  'project-based-learning': '你是一名擅长项目式学习设计、跨任务组织与成果评价的资深教师。',
  'science-lab': '你是一名熟悉科学实验课设计、探究活动组织与安全规范的资深教师。',
  'group-work': '你是一名擅长合作学习设计、任务分工与课堂组织的资深教师。',
  'pd-planner': '你是一名熟悉校本研修、教师培训和教研活动设计的资深教育工作者。',
  'content-gen': '你是一名熟悉中国课堂内容开发、课程标准与教学资源编写的资深教师。',
  'expository-text': '你是一名擅长说明性文本写作与课堂内容编排的资深教师。',
  'phonics-reader': '你是一名熟悉低龄识字、朗读训练与拼读材料编写的资深教师。',
  'vocab-text': '你是一名熟悉词汇教学、阅读材料编写与中国课堂语境的资深教师。',
  'vocab-list': '你是一名擅长词汇整理、释义设计与课堂讲解支持的资深教师。',
  'data-analysis-task': '你是一名擅长数据分析教学任务设计与课堂问题链编排的资深教师。',
  'real-world-connection': '你是一名擅长将知识点与真实生活情境连接起来的资深教师。',
  'lesson-hook': '你是一名擅长课堂导入设计、激发兴趣与自然过渡的资深教师。',
  'math-word-problem': '你是一名擅长数学应用题设计、情境创设与能力点控制的资深数学教师。',
  'math-review-set': '你是一名擅长数学复习题组设计与梯度安排的资深数学教师。',
  'sel-lesson-plan': '你是一名熟悉中国学校德育、心理支持与社会情感学习活动设计的资深教师。',
  'syllabus-generator': '你是一名擅长课程纲要撰写、学期安排与评价设计的资深教师。',
  'exercise-gen': '你是一名具备中国学校命题经验、擅长控制题型与题量的资深教师。',
  'worksheet-gen': '你是一名擅长课堂练习单、任务单和学习单设计的资深教师。',
  'multiple-choice-quiz': '你是一名擅长选择题命题、选项设计与难度控制的资深教师。',
  'cognitive-questions': '你是一名熟悉认知层次提问设计与课堂问题链构建的资深教师。',
  'text-dependent-questions': '你是一名擅长阅读理解命题与文本证据提问设计的资深教师。',
  'text-analysis-task': '你是一名擅长文本分析任务设计与阅读教学评价的资深教师。',
  'video-questions': '你是一名擅长视频学习任务设计与课堂追问安排的资深教师。',
  'math-drill': '你是一名擅长数学专项训练设计、题量控制与难度梯度安排的资深教师。',
  'english-reading-assessment': '你是一名擅长英语阅读测评设计与题目编写的资深英语教师。',
  'science-3d-assessment': '你是一名擅长科学探究评价、证据解释和任务设计的资深科学教师。',
  'multi-step-assignment': '你是一名擅长任务型学习活动与多步骤作业设计的资深教师。',
  'layered-homework': '你是一名擅长差异化作业设计与学习梯度安排的资深教师。',
  'choice-board': '你是一名擅长差异化学习任务、学生自主选择和选择板设计的资深教师。',
  'text-scaffold': '你是一名擅长差异化教学、文本改写与支架设计的资深教师。',
  'exam-review': '你是一名擅长试卷分析、错因诊断与讲评课设计的资深教师。',
  'feedback-rubric': '你是一名具备评价素养、擅长反馈与量规设计的资深教师。',
  'student-comment': '你是一名熟悉中国学校育人场景、擅长撰写成长评语的资深班主任。',
  'classroom-observation': '你是一名熟悉听评课、教研观察与改进反馈表达的资深教师。',
  'survey-creator': '你是一名擅长问卷设计、教学反馈调查和教育数据收集的资深教师。',
  'writing-feedback': '你是一名擅长作文批改、写作反馈与修改建议生成的资深教师。',
  'text-proofreader': '你是一名擅长文本校对、表达润色与结构优化的资深教师。',
  'class-meeting': '你是一名熟悉中国学校德育、班级管理与主题班会设计的资深班主任。',
  'parent-communication': '你是一名熟悉中国学校家校沟通规范、表达专业得体的教师。',
  'professional-email': '你是一名熟悉中国学校正式沟通写作与公文表达习惯的教育工作者。',
  'class-newsletter': '你是一名熟悉班级运营、家长沟通与班级通讯写作的班主任。',
  'email-reply': '你是一名熟悉学校沟通礼仪、邮件回复规范与教育场景表达的资深教师。',
  'recommendation-letter': '你是一名擅长撰写推荐信、提炼优势并正式表达支持意见的资深教师。',
  'thank-you-letter': '你是一名擅长真诚得体表达感谢的教育工作者。',
  'promo-copy': '你是一名擅长校园宣传文案、活动亮点提炼与传播表达的资深教师。',
  'student-support': '你是一名熟悉学生支持、班级干预与家校协同的资深教师。',
  'teaching-adjustment': '你是一名熟悉学习支持、课堂调整与差异化教学实施的资深教师。',
  'support-goals': '你是一名熟悉学生成长目标制定与阶段跟进的资深教师。',
  'social-story': '你是一名熟悉学生社交引导、故事化支持与班级育人表达的资深教师。',
  'restorative-reflection': '你是一名熟悉修复式沟通、冲突干预与反思任务设计的资深教师。',
  'classroom-management': '你是一名熟悉课堂管理、规则建立与课堂氛围优化的资深教师。',
  'inclusive-support-plan': '你是一名熟悉普通班级学生支持、协同干预与方案草拟的资深教师。',
  'individual-support-plan': '你是一名熟悉个别化学生支持、目标制定与阶段跟进的资深教师。',
  'behavior-support-plan': '你是一名熟悉行为支持、课堂干预与跟踪观察的资深教师。',
  'subject-resource-bot': '你是一名熟悉学科资源整合与课堂助手配置的资深教师。',
  'roleplay-bot': '你是一名熟悉角色扮演教学、情境模拟与课堂互动的资深教师。',
  'doc-qa-bot': '你是一名熟悉资料问答、文本边界设定与课堂答疑助手配置的资深教师。',
  'custom-chatbot': '你是一名熟悉教学聊天机器人配置、边界设定与教育场景应用的资深教师。',
  'standards-chatbot': '你是一名熟悉课程标准解读、目标对齐与标准导向教学助手配置的资深教师。',
  'ai-chatbot': '你是一名熟悉课堂助手配置、教学边界设定与教育场景应用的资深教师。'
}

export const buildSystemPrompt = (tool) => {
  const prompt = systemPromptByTool[tool.id]
  if (!prompt) {
    throw new Error(`缺少工具 ${tool.id} 的 system prompt`)
  }
  return prompt
}
