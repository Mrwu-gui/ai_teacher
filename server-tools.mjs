// 年级学科选项
export const GRADE_SUBJECT_OPTIONS = [
  '小学一年级·语文', '小学一年级·数学', '小学一年级·英语', '小学一年级·体育',
  '小学二年级·语文', '小学二年级·数学', '小学二年级·英语', '小学二年级·体育',
  '小学三年级·语文', '小学三年级·数学', '小学三年级·英语', '小学三年级·科学', '小学三年级·道德与法治', '小学三年级·体育',
  '小学四年级·语文', '小学四年级·数学', '小学四年级·英语', '小学四年级·科学', '小学四年级·道德与法治', '小学四年级·体育',
  '小学五年级·语文', '小学五年级·数学', '小学五年级·英语', '小学五年级·科学', '小学五年级·道德与法治', '小学五年级·体育',
  '小学六年级·语文', '小学六年级·数学', '小学六年级·英语', '小学六年级·科学', '小学六年级·道德与法治', '小学六年级·体育',
  '初一·语文', '初一·数学', '初一·英语', '初一·历史', '初一·地理', '初一·生物', '初一·道德与法治', '初一·体育',
  '初二·语文', '初二·数学', '初二·英语', '初二·物理', '初二·历史', '初二·地理', '初二·生物', '初二·道德与法治', '初二·体育',
  '初三·语文', '初三·数学', '初三·英语', '初三·物理', '初三·化学', '初三·历史', '初三·道德与法治', '初三·体育',
  '高一·语文', '高一·数学', '高一·英语', '高一·物理', '高一·化学', '高一·生物', '高一·历史', '高一·地理', '高一·政治', '高一·体育',
  '高二·语文', '高二·数学', '高二·英语', '高二·物理', '高二·化学', '高二·生物', '高二·历史', '高二·地理', '高二·政治', '高二·体育',
  '高三·语文', '高三·数学', '高三·英语', '高三·物理', '高三·化学', '高三·生物', '高三·历史', '高三·地理', '高三·政治', '高三·体育'
]

// 年级选项
export const GRADE_OPTIONS = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '初一', '初二', '初三', '高一', '高二', '高三'
]

// 教材版本选项
export const TEXTBOOK_OPTIONS = [
  '人教版', '部编版', '北师大版', '苏教版', '教科版', '外研版', '沪教版', '其他'
]

// 课时长度选项
export const DURATION_OPTIONS = [
  '1课时(40分钟)', '1课时(45分钟)', '2课时', '其他'
]

// 工具分类
export const categories = [
  { id: 'teaching-design', name: '教学设计', icon: 'BookOpen' },
  { id: 'teaching-content', name: '教学内容', icon: 'FileText' },
  { id: 'exercise', name: '练习命题', icon: 'ClipboardList' },
  { id: 'differentiation', name: '差异化教学', icon: 'Layers' },
  { id: 'feedback', name: '反馈评价', icon: 'MessageSquare' },
  { id: 'communication', name: '沟通写作', icon: 'Send' },
  { id: 'student-support', name: '学生支持', icon: 'Heart' },
  { id: 'classroom', name: '课堂助手', icon: 'Zap' }
]

// 主任务入口
export const mainTasks = [
  {
    id: 'lesson-prep',
    name: '我要备课',
    description: '教案、说课稿、单元设计',
    icon: 'BookOpen',
    tools: [
      { id: 'lesson-plan', name: '常规教案', desc: '日常备课与公开课设计' },
      { id: 'pe-lesson-plan', name: '体育教案', desc: '热身·技能训练·安全提示' },
      { id: 'lesson-5e', name: '探究教案', desc: '导入·探究·建构·迁移·评价' },
      { id: 'unit-plan', name: '单元整体设计', desc: '课时安排与目标梯度' },
      { id: 'lesson-talk', name: '说课稿', desc: '教材分析·学情·设计思路' }
    ]
  },
  {
    id: 'assessment',
    name: '我要出题',
    description: '练习、作业、试卷讲评',
    icon: 'ClipboardList',
    tools: [
      { id: 'exercise-gen', name: '练习与检测', desc: '随堂练习·测验·讲评' },
      { id: 'layered-homework', name: '分层作业', desc: '必做+选做+拓展' },
      { id: 'text-scaffold', name: '分层支架', desc: '改写·支架·拓展任务' },
      { id: 'exam-review', name: '试卷讲评', desc: '错因分析·讲评流程' }
    ]
  },
  {
    id: 'feedback-review',
    name: '我要讲评与反馈',
    description: '试卷讲评、评语、量规',
    icon: 'MessageSquare',
    tools: [
      { id: 'exam-review', name: '试卷讲评', desc: '错因分析·讲评流程' },
      { id: 'feedback-rubric', name: '反馈与量规', desc: '评语·量规·课堂观察' },
      { id: 'student-comment', name: '学生评语', desc: '期末评语·成长记录' },
      { id: 'classroom-observation', name: '听评课反馈', desc: '教研记录·改进建议' }
    ]
  },
  {
    id: 'class-management',
    name: '我要班级与沟通',
    description: '班会、家校沟通、学生支持',
    icon: 'Users',
    tools: [
      { id: 'class-meeting', name: '主题班会', desc: '德育主题·活动流程' },
      { id: 'parent-communication', name: '家校沟通', desc: '通知·家长信' },
      { id: 'professional-email', name: '正式沟通', desc: '通知·回复·说明' },
      { id: 'student-support', name: '学生支持', desc: '学困生辅导·心理疏导' }
    ]
  }
]

// 所有工具的完整定义
const baseTools = [
  {
    id: 'lesson-plan',
    name: '教案生成',
    description: '根据课题与教学目标，一键生成结构完整、可直接使用的教案',
    category: '教学设计',
    icon: 'BookOpen',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '这节课讲什么？', type: 'text', placeholder: '例如：分数的初步认识', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '你希望学生学会什么？', type: 'textarea', placeholder: '描述本节课的教学目标，如：理解分数的基本概念，能用分数表示简单的部分与整体关系', required: true, isAdvanced: false },
      { key: 'textbook_version', label: '教材版本', type: 'select', options: TEXTBOOK_OPTIONS, isAdvanced: false },
      { key: 'resources', label: '可用教学资源', type: 'textarea', placeholder: '例如：PPT、学具、实验材料、视频片段', isAdvanced: false },
      { key: 'extra_requirements', label: '有什么特别要注意的？', type: 'text', placeholder: '例如：适合公开课、需要小组活动、学生基础较弱', isAdvanced: false },
      // 高级选项
      { key: 'key_difficult', label: '教学重点难点', type: 'textarea', placeholder: '请描述教学重点和难点', isAdvanced: true },
      { key: 'student_situation', label: '学情说明', type: 'textarea', placeholder: '描述学生的基础水平、学习习惯等', isAdvanced: true },
      { key: 'duration', label: '课时长度', type: 'select', options: DURATION_OPTIONS, isAdvanced: true },
      { key: 'evaluation_method', label: '预期评价方式', type: 'textarea', placeholder: '例如：课堂提问、当堂练习、小组展示、出口卡', isAdvanced: true },
      { key: 'need_blackboard', label: '需要板书设计', type: 'toggle', default: true, isAdvanced: true },
      { key: 'need_homework', label: '需要分层作业（必做+选做）', type: 'toggle', default: true, isAdvanced: true },
      { key: 'need_inquiry', label: '使用五环节探究结构', type: 'toggle', default: false, isAdvanced: true }
    ]
  },
  {
    id: 'pe-lesson-plan',
    name: '体育教案',
    description: '面向中国学校体育课堂生成可直接使用的体育课教案',
    category: '教学设计',
    icon: 'BookOpen',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS.filter(option => option.endsWith('体育')), required: true, isAdvanced: false },
      { key: 'topic', label: '教学内容', type: 'text', placeholder: '例如：50米快速跑 / 篮球原地运球 / 跳绳', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '教学目标', type: 'textarea', placeholder: '描述技能、体能、规则意识和合作目标', required: true, isAdvanced: false },
      { key: 'venue_equipment', label: '场地与器材', type: 'textarea', placeholder: '例如：操场、标志桶、跳绳、篮球', required: true, isAdvanced: false },
      { key: 'class_type', label: '课型', type: 'select', options: ['新授课', '复习课', '练习课', '考核课'], isAdvanced: false },
      { key: 'student_situation', label: '学情说明', type: 'textarea', placeholder: '例如：班级人数较多，学生体能差异明显', isAdvanced: true },
      { key: 'safety_notes', label: '安全注意事项', type: 'textarea', placeholder: '例如：跑步时注意间距，器材使用前先示范', isAdvanced: true },
      { key: 'need_game', label: '加入游戏化环节', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'lesson-5e',
    name: '探究教案',
    description: '基于5E教学模式（导入·探究·建构·迁移·评价）设计教案',
    category: '教学设计',
    icon: 'BookOpen',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '探究主题', type: 'text', placeholder: '例如：植物的生长条件', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '课程标准或教学目标', type: 'textarea', placeholder: '描述本节课要达成的知识、能力与素养目标', required: true, isAdvanced: false },
      { key: 'inquiry_focus', label: '探究重点', type: 'textarea', placeholder: '描述本节课的探究重点', required: true, isAdvanced: false },
      { key: 'textbook_version', label: '教材版本', type: 'select', options: TEXTBOOK_OPTIONS, isAdvanced: false },
      { key: 'resources', label: '可用教学资源', type: 'textarea', placeholder: '例如：实验材料、PPT、图片、任务单', isAdvanced: false },
      { key: 'extra_requirements', label: '有什么特别要注意的？', type: 'text', isAdvanced: false },
      // 高级选项
      { key: 'student_situation', label: '学情说明', type: 'textarea', placeholder: '描述学生的基础水平、学习习惯等', isAdvanced: true },
      { key: 'duration', label: '课时长度', type: 'select', options: DURATION_OPTIONS, isAdvanced: true },
      { key: 'evaluation_method', label: '预期评价方式', type: 'textarea', placeholder: '例如：观察记录、任务单、小组汇报、出口卡', isAdvanced: true }
    ]
  },
  {
    id: 'unit-plan',
    name: '单元整体设计',
    description: '生成单元整体教学设计，包含课时安排与目标梯度',
    category: '教学设计',
    icon: 'BookOpen',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'unit_name', label: '单元名称', type: 'text', placeholder: '例如：小数的认识', required: true, isAdvanced: false },
      { key: 'unit_goals', label: '单元目标', type: 'textarea', placeholder: '描述本单元的教学目标', required: true, isAdvanced: false },
      { key: 'textbook_version', label: '教材版本', type: 'select', options: TEXTBOOK_OPTIONS, isAdvanced: false },
      // 高级选项
      { key: 'unit_hours', label: '单元课时数', type: 'number', placeholder: '例如：8', isAdvanced: true },
      { key: 'key_difficult', label: '单元重难点', type: 'textarea', isAdvanced: true }
    ]
  },
  {
    id: 'lesson-talk',
    name: '说课稿',
    description: '生成完整的说课稿，包含教材分析、学情、设计思路',
    category: '教学设计',
    icon: 'FileText',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '课题', type: 'text', placeholder: '例如：背影', required: true, isAdvanced: false },
      { key: 'talk_focus', label: '说课重点', type: 'textarea', placeholder: '描述说课的重点内容', required: true, isAdvanced: false },
      { key: 'textbook_version', label: '教材版本', type: 'select', options: TEXTBOOK_OPTIONS, isAdvanced: false },
      // 高级选项
      { key: 'teaching_method', label: '教学方法说明', type: 'textarea', placeholder: '说明采用的教学方法', isAdvanced: true }
    ]
  },
  {
    id: 'project-based-learning',
    name: '项目式学习设计',
    description: '围绕真实问题生成项目任务、阶段安排与成果评价',
    category: '教学设计',
    icon: 'BookOpen',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'project_topic', label: '项目主题', type: 'text', placeholder: '例如：校园节水行动方案', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '项目目标', type: 'textarea', placeholder: '描述知识、能力与素养目标', required: true, isAdvanced: false },
      { key: 'duration', label: '项目周期', type: 'select', options: ['1周', '2周', '3周', '4周及以上'], isAdvanced: false },
      { key: 'resources', label: '可用资源', type: 'textarea', placeholder: '例如：校园场地、网络资料、实验材料、社区资源', isAdvanced: true },
      { key: 'assessment_plan', label: '成果评价方式', type: 'textarea', placeholder: '例如：展示汇报、作品评审、过程档案袋', isAdvanced: true }
    ]
  },
  {
    id: 'science-lab',
    name: '科学实验课设计',
    description: '生成实验课流程、材料清单、安全提示与观察记录建议',
    category: '教学设计',
    icon: 'BookOpen',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '实验主题', type: 'text', placeholder: '例如：探究浮力大小规律', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '实验目标', type: 'textarea', placeholder: '描述本次实验的知识与探究目标', required: true, isAdvanced: false },
      { key: 'resources', label: '实验材料与条件', type: 'textarea', placeholder: '例如：烧杯、量筒、弹簧测力计、清水', required: true, isAdvanced: false },
      { key: 'student_situation', label: '学生基础与风险点', type: 'textarea', placeholder: '例如：学生第一次使用测力计，需要操作示范', isAdvanced: true }
    ]
  },
  {
    id: 'content-gen',
    name: '教学内容生成',
    description: '根据主题与教学目标生成可直接用于课堂的原创材料',
    category: '教学内容',
    icon: 'FileText',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '主题', type: 'text', placeholder: '例如：二十四节气中的清明', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '教学目标', type: 'textarea', placeholder: '描述本次内容需要服务的教学目标', required: true, isAdvanced: false },
      { key: 'content_type', label: '内容类型', type: 'select', options: ['阅读材料', '说明性文本', '拼读文本或注音读物', '例题', '应用题', '复习题组'], required: true, isAdvanced: false },
      { key: 'key_terms', label: '重点词汇或核心概念', type: 'textarea', placeholder: '例如：分数、分子、分母、平均分', isAdvanced: false },
      { key: 'difficulty', label: '难度', type: 'select', options: ['基础', '适中', '提升', '挑战'], isAdvanced: true },
      { key: 'length_requirement', label: '篇幅要求', type: 'select', options: ['简短', '适中', '详细'], isAdvanced: true },
      { key: 'differentiation_notes', label: '差异化教学备注', type: 'textarea', placeholder: '例如：学困生需要更直观的例子，资优生可加入迁移任务', isAdvanced: true }
    ]
  },
  {
    id: 'expository-text',
    name: '说明性文本生成',
    description: '围绕概念、现象或主题生成适合课堂讲解的说明性文本',
    category: '教学内容',
    icon: 'FileText',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '说明主题', type: 'text', placeholder: '例如：火山喷发 / 垃圾分类 / 分数的意义', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '教学目标', type: 'textarea', placeholder: '说明本次文本要服务什么教学目标', required: true, isAdvanced: false },
      { key: 'difficulty', label: '难度', type: 'select', options: ['基础', '适中', '提升'], required: true, isAdvanced: false },
      { key: 'length_requirement', label: '篇幅要求', type: 'select', options: ['200字以内', '300字左右', '500字左右', '800字左右'], isAdvanced: true }
    ]
  },
  {
    id: 'phonics-reader',
    name: '拼读文本/注音读物生成',
    description: '为低龄阅读或语文基础教学生成适合朗读与识字的文本',
    category: '教学内容',
    icon: 'FileText',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS.filter(option => option.startsWith('小学')), required: true, isAdvanced: false },
      { key: 'topic', label: '主题', type: 'text', placeholder: '例如：春天来了 / 爱护眼睛 / 小兔子过河', required: true, isAdvanced: false },
      { key: 'key_terms', label: '重点字词', type: 'textarea', placeholder: '例如：春、花、草、眼、护', required: true, isAdvanced: false },
      { key: 'length_requirement', label: '篇幅要求', type: 'select', options: ['50字以内', '100字左右', '150字左右'], required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '使用目标', type: 'textarea', placeholder: '例如：识字、朗读、拼读训练', isAdvanced: true }
    ]
  },
  {
    id: 'vocab-text',
    name: '词汇嵌入文本生成',
    description: '将指定重点词汇自然嵌入教学文本，服务词汇理解与语境学习',
    category: '教学内容',
    icon: 'FileText',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '文本主题', type: 'text', placeholder: '例如：春天的校园 / 火山喷发 / 我的家乡', required: true, isAdvanced: false },
      { key: 'target_vocab', label: '重点词汇', type: 'textarea', placeholder: '例如：慈祥、疲惫、攥着、皱纹', required: true, isAdvanced: false },
      { key: 'text_style', label: '文本类型', type: 'select', options: ['记叙文', '说明文', '对话文本', '短文阅读'], required: true, isAdvanced: false },
      { key: 'length_requirement', label: '篇幅要求', type: 'select', options: ['200字以内', '300字左右', '500字左右', '800字左右'], isAdvanced: true },
      { key: 'teaching_objectives', label: '教学目标', type: 'textarea', placeholder: '例如：帮助学生在语境中理解重点词汇并完成朗读训练', isAdvanced: true }
    ]
  },
  {
    id: 'vocab-list',
    name: '重点词汇清单生成',
    description: '围绕课文或主题整理核心词汇、释义、例句与教学提示',
    category: '教学内容',
    icon: 'FileText',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '课文或主题', type: 'text', placeholder: '例如：《慈母情深》 / 光合作用 / 辛亥革命', required: true, isAdvanced: false },
      { key: 'word_count', label: '词汇数量', type: 'select', options: ['5个', '8个', '10个', '15个'], required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '使用目标', type: 'textarea', placeholder: '例如：预习、课堂讲解、复习巩固', required: true, isAdvanced: false },
      { key: 'need_examples', label: '需要例句', type: 'toggle', default: true, isAdvanced: true },
      { key: 'need_extension', label: '需要易错提醒或拓展', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'data-analysis-task',
    name: '数据表分析任务生成',
    description: '根据数据表或统计信息生成课堂分析任务和问题链',
    category: '教学内容',
    icon: 'FileText',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'data_source', label: '数据表内容', type: 'textarea', placeholder: '粘贴或描述需要分析的数据表、统计图或调查结果', required: true, isAdvanced: false },
      { key: 'topic', label: '主题', type: 'text', placeholder: '例如：家庭用水量调查 / 城市人口变化', required: true, isAdvanced: false },
      { key: 'task_goal', label: '任务目标', type: 'textarea', placeholder: '例如：培养数据读取、比较分析与结论表达能力', required: true, isAdvanced: false },
      { key: 'question_count', label: '问题数量', type: 'select', options: ['3题', '5题', '8题'], isAdvanced: true }
    ]
  },
  {
    id: 'real-world-connection',
    name: '现实情境连接生成',
    description: '把知识点与真实生活或社会情境连接起来，增强课堂代入感',
    category: '教学内容',
    icon: 'FileText',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '知识点或主题', type: 'text', placeholder: '例如：百分数 / 生态平衡 / 抗战精神', required: true, isAdvanced: false },
      { key: 'connection_goal', label: '希望连接到什么场景', type: 'textarea', placeholder: '例如：生活消费、校园现象、社会新闻、职业实践', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '教学目标', type: 'textarea', placeholder: '例如：帮助学生理解知识在现实中的应用价值', required: true, isAdvanced: false },
      { key: 'scenario_count', label: '情境数量', type: 'select', options: ['1个', '3个', '5个'], isAdvanced: true }
    ]
  },
  {
    id: 'lesson-hook',
    name: '课堂导入生成',
    description: '围绕课题生成导入话术、情境和问题链，帮助老师快速开课',
    category: '教学内容',
    icon: 'FileText',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '课题', type: 'text', placeholder: '例如：《慈母情深》 / 平行线的性质', required: true, isAdvanced: false },
      { key: 'hook_style', label: '导入方式', type: 'select', options: ['故事导入', '问题导入', '情境导入', '实验导入', '视频导入'], required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '导入后要引向什么目标', type: 'textarea', placeholder: '例如：激发兴趣并自然过渡到本课重点', required: true, isAdvanced: false },
      { key: 'duration', label: '导入时长', type: 'select', options: ['2分钟', '3分钟', '5分钟', '8分钟'], isAdvanced: true }
    ]
  },
  {
    id: 'math-word-problem',
    name: '数学应用题生成',
    description: '围绕数学知识点生成真实情境下的应用题',
    category: '教学内容',
    icon: 'FileText',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS.filter(option => option.includes('数学')), required: true, isAdvanced: false },
      { key: 'topic', label: '数学知识点', type: 'text', placeholder: '例如：分数应用 / 一元一次方程 / 圆柱体积', required: true, isAdvanced: false },
      { key: 'question_count', label: '题目数量', type: 'select', options: ['3题', '5题', '8题', '10题'], required: true, isAdvanced: false },
      { key: 'difficulty', label: '难度', type: 'select', options: ['基础', '适中', '提升'], required: true, isAdvanced: false },
      { key: 'need_answer', label: '需要答案解析', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'math-review-set',
    name: '数学复习题组生成',
    description: '围绕单元或专题生成有梯度的数学复习题组',
    category: '教学内容',
    icon: 'FileText',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS.filter(option => option.includes('数学')), required: true, isAdvanced: false },
      { key: 'topic', label: '复习主题', type: 'text', placeholder: '例如：小数四则运算 / 二次函数 / 概率初步', required: true, isAdvanced: false },
      { key: 'question_count', label: '题目数量', type: 'select', options: ['10题', '15题', '20题', '30题'], required: true, isAdvanced: false },
      { key: 'difficulty', label: '复习梯度', type: 'select', options: ['基础巩固', '基础+提升', '综合复习'], required: true, isAdvanced: false },
      { key: 'need_answer', label: '需要答案解析', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'sel-lesson-plan',
    name: '社会情感学习教案',
    description: '围绕情绪管理、同伴合作、自我认知等主题生成课程方案',
    category: '教学设计',
    icon: 'BookOpen',
    fields: [
      { key: 'grade', label: '年级', type: 'select', options: GRADE_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '主题', type: 'text', placeholder: '例如：情绪管理 / 同伴沟通 / 抗挫能力', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '培养目标', type: 'textarea', placeholder: '描述希望学生在情感、认知和行为上达成什么', required: true, isAdvanced: false },
      { key: 'duration', label: '课时长度', type: 'select', options: ['1课时(40分钟)', '1课时(45分钟)', '2课时'], required: true, isAdvanced: false },
      { key: 'activity_preference', label: '偏好活动形式', type: 'select', options: ['讨论', '角色扮演', '游戏活动', '案例分析'], isAdvanced: true }
    ]
  },
  {
    id: 'syllabus-generator',
    name: '课程纲要生成',
    description: '生成学期课程纲要、学习安排与评价说明',
    category: '教学设计',
    icon: 'BookOpen',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'course_name', label: '课程名称', type: 'text', placeholder: '例如：七年级下册历史 / 高一物理必修', required: true, isAdvanced: false },
      { key: 'course_goals', label: '课程目标', type: 'textarea', placeholder: '概述本学期课程目标与学习重点', required: true, isAdvanced: false },
      { key: 'weeks', label: '课程周期', type: 'select', options: ['8周', '12周', '16周', '18周'], required: true, isAdvanced: false },
      { key: 'evaluation_method', label: '评价方式', type: 'textarea', placeholder: '例如：平时作业+单元测验+项目成果', isAdvanced: true }
    ]
  },
  {
    id: 'group-work',
    name: '小组活动生成',
    description: '围绕课堂目标生成可直接实施的小组合作活动设计',
    category: '教学设计',
    icon: 'Users',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '活动主题或课题', type: 'text', placeholder: '例如：慈母情深 / 分数的初步认识 / 垃圾分类', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '活动目标', type: 'textarea', placeholder: '描述希望通过小组活动达成什么学习目标', required: true, isAdvanced: false },
      { key: 'group_goal', label: '合作任务重点', type: 'textarea', placeholder: '例如：资料整理、观点讨论、实验记录、角色分工展示', required: true, isAdvanced: false },
      { key: 'group_size', label: '建议组人数', type: 'select', options: ['2人', '4人', '6人', '按班情建议'], isAdvanced: true },
      { key: 'resources', label: '可用资源', type: 'textarea', placeholder: '例如：任务单、图片、实验材料、海报纸', isAdvanced: true }
    ]
  },
  {
    id: 'pd-planner',
    name: '教师培训计划生成',
    description: '围绕教研主题、培训对象和活动目标生成教师培训方案',
    category: '教学设计',
    icon: 'BookOpen',
    fields: [
      { key: 'training_theme', label: '培训主题', type: 'text', placeholder: '例如：核心素养导向课堂设计 / 作业分层设计', required: true, isAdvanced: false },
      { key: 'audience', label: '培训对象', type: 'select', options: ['新教师', '备课组', '全体教师', '班主任', '学科组长'], required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '培训目标', type: 'textarea', placeholder: '说明本次培训希望达成的目标', required: true, isAdvanced: false },
      { key: 'duration', label: '培训时长', type: 'select', options: ['30分钟', '45分钟', '60分钟', '90分钟', '半天'], required: true, isAdvanced: false },
      { key: 'resources', label: '可用资源或案例', type: 'textarea', placeholder: '例如：优秀课例、学校案例、评价表、视频片段', isAdvanced: true }
    ]
  },
  {
    id: 'exercise-gen',
    name: '练习与检测',
    description: '生成随堂练习、单元测验、课后作业',
    category: '练习命题',
    icon: 'ClipboardList',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'textbook_version', label: '教材版本', type: 'select', options: TEXTBOOK_OPTIONS, isAdvanced: false },
      { key: 'topic', label: '知识点', type: 'text', placeholder: '例如：一元二次方程', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '教学目标', type: 'textarea', placeholder: '说明本次练习主要测查什么', isAdvanced: false },
      { key: 'exercise_type', label: '练习类型', type: 'select', options: ['随堂练习', '单元测验', '课后作业', '专项训练'], isAdvanced: false },
      { key: 'question_type', label: '题型', type: 'select', options: ['选择题', '填空题', '简答题', '阅读题', '任务单', '混合题型'], required: true, isAdvanced: false },
      { key: 'question_mix_rule', label: '混合题型怎么分配？', type: 'text', placeholder: '例如：4道选择题+4道填空题+2道简答题', isAdvanced: true, showWhen: { key: 'question_type', equals: '混合题型' } },
      // 高级选项
      { key: 'difficulty', label: '难度', type: 'select', options: ['简单', '中等', '困难', '混合'], isAdvanced: true },
      { key: 'question_count', label: '题目数量', type: 'select', options: ['5题', '10题', '20题', '30题'], isAdvanced: true },
      { key: 'cognitive_requirement', label: '认知水平要求', type: 'select', options: ['记忆理解', '理解应用', '应用分析', '综合提升'], isAdvanced: true },
      { key: 'special_requirements', label: '特殊要求', type: 'textarea', placeholder: '例如：贴近中考风格、加入生活情境、控制文字量', isAdvanced: true },
      { key: 'need_answer', label: '需要答案解析', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'worksheet-gen',
    name: '练习单生成',
    description: '围绕课题生成适合课堂发放的练习单或学习任务单',
    category: '练习命题',
    icon: 'ClipboardList',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'textbook_version', label: '教材版本', type: 'select', options: TEXTBOOK_OPTIONS, isAdvanced: false },
      { key: 'topic', label: '主题或知识点', type: 'text', placeholder: '例如：《背影》阅读理解 / 电流与电压 / 二元一次方程组', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '教学目标', type: 'textarea', placeholder: '说明本练习单要落实哪些学习目标', required: true, isAdvanced: false },
      { key: 'question_type', label: '主要题型', type: 'select', options: ['填空题', '简答题', '阅读题', '任务单', '混合'], required: true, isAdvanced: false },
      { key: 'question_count', label: '题目数量', type: 'select', options: ['5题', '8题', '10题', '12题'], isAdvanced: true },
      { key: 'difficulty', label: '难度层次', type: 'select', options: ['基础', '提升', '拓展'], isAdvanced: true },
      { key: 'special_requirements', label: '特殊要求', type: 'textarea', placeholder: '例如：增加探究题、控制阅读量、适合课堂合作', isAdvanced: true },
      { key: 'need_answer', label: '需要答案解析', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'multiple-choice-quiz',
    name: '选择题测评生成',
    description: '围绕知识点快速生成规范的选择题测评',
    category: '练习命题',
    icon: 'ClipboardList',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'textbook_version', label: '教材版本', type: 'select', options: TEXTBOOK_OPTIONS, isAdvanced: false },
      { key: 'topic', label: '知识点', type: 'text', placeholder: '例如：勾股定理 / 中国近代化探索', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '教学目标', type: 'textarea', placeholder: '说明这套选择题主要想测什么', isAdvanced: false },
      { key: 'question_count', label: '题目数量', type: 'select', options: ['5题', '10题', '15题', '20题'], required: true, isAdvanced: false },
      { key: 'difficulty', label: '难度', type: 'select', options: ['基础', '中等', '提升'], required: true, isAdvanced: false },
      { key: 'special_requirements', label: '特殊要求', type: 'textarea', placeholder: '例如：偏基础巩固、贴近期末题风格', isAdvanced: true },
      { key: 'need_answer', label: '需要答案解析', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'cognitive-questions',
    name: '认知层次问题生成',
    description: '按记忆、理解、应用、分析等层次生成提问与练习问题',
    category: '练习命题',
    icon: 'ClipboardList',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'textbook_version', label: '教材版本', type: 'select', options: TEXTBOOK_OPTIONS, isAdvanced: false },
      { key: 'topic', label: '主题或文本', type: 'text', placeholder: '例如：《背影》 / 牛顿第一定律', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '教学目标', type: 'textarea', placeholder: '说明希望通过问题训练什么思维层次', isAdvanced: false },
      { key: 'cognitive_levels', label: '认知层次', type: 'select', options: ['记忆+理解', '理解+应用', '应用+分析', '全层次混合'], required: true, isAdvanced: false },
      { key: 'question_count', label: '问题数量', type: 'select', options: ['4题', '6题', '8题', '10题'], required: true, isAdvanced: false },
      { key: 'need_answer', label: '需要参考答案', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'text-dependent-questions',
    name: '文本依赖性阅读理解题',
    description: '基于给定文本生成紧扣文本证据的阅读理解问题',
    category: '练习命题',
    icon: 'ClipboardList',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'textbook_version', label: '教材版本', type: 'select', options: TEXTBOOK_OPTIONS, isAdvanced: false },
      { key: 'source_text', label: '阅读文本', type: 'textarea', placeholder: '粘贴阅读材料或课文节选', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '教学目标', type: 'textarea', placeholder: '说明本次阅读理解主要测查什么', isAdvanced: false },
      { key: 'question_count', label: '问题数量', type: 'select', options: ['3题', '5题', '8题'], required: true, isAdvanced: false },
      { key: 'difficulty', label: '难度', type: 'select', options: ['基础', '中等', '提升'], required: true, isAdvanced: false },
      { key: 'need_answer', label: '需要答案解析', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'text-analysis-task',
    name: '文本分析任务生成',
    description: '围绕篇章结构、表达效果、人物形象等角度生成分析任务',
    category: '练习命题',
    icon: 'ClipboardList',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'textbook_version', label: '教材版本', type: 'select', options: TEXTBOOK_OPTIONS, isAdvanced: false },
      { key: 'source_text', label: '文本内容', type: 'textarea', placeholder: '粘贴文本或描述分析对象', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '教学目标', type: 'textarea', placeholder: '说明本分析任务主要训练什么能力', isAdvanced: false },
      { key: 'analysis_focus', label: '分析重点', type: 'select', options: ['人物形象', '写作手法', '语言表达', '论证思路', '结构层次'], required: true, isAdvanced: false },
      { key: 'question_count', label: '任务数量', type: 'select', options: ['3项', '5项', '8项'], required: true, isAdvanced: false },
      { key: 'need_answer', label: '需要参考要点', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'video-questions',
    name: '视频学习问题生成',
    description: '根据教学视频生成观看任务、思考问题与课堂讨论题',
    category: '练习命题',
    icon: 'ClipboardList',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'textbook_version', label: '教材版本', type: 'select', options: TEXTBOOK_OPTIONS, isAdvanced: false },
      { key: 'video_summary', label: '视频内容简介', type: 'textarea', placeholder: '概述视频主题、主要内容或关键片段', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '教学目标', type: 'textarea', placeholder: '说明视频学习后学生应掌握什么', isAdvanced: false },
      { key: 'question_count', label: '问题数量', type: 'select', options: ['3题', '5题', '8题', '10题'], required: true, isAdvanced: false },
      { key: 'question_type', label: '问题类型', type: 'select', options: ['观看前预测', '观看中记录', '观看后思考', '混合'], required: true, isAdvanced: false },
      { key: 'need_answer', label: '需要参考答案', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'math-drill',
    name: '高强度数学练习题',
    description: '快速生成题量更足、训练梯度更清晰的数学专项训练',
    category: '练习命题',
    icon: 'ClipboardList',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS.filter(option => option.includes('数学')), required: true, isAdvanced: false },
      { key: 'textbook_version', label: '教材版本', type: 'select', options: TEXTBOOK_OPTIONS, isAdvanced: false },
      { key: 'topic', label: '数学知识点', type: 'text', placeholder: '例如：一次函数 / 立体几何 / 排列组合', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '教学目标', type: 'textarea', placeholder: '说明这组训练主要测查和提升什么', isAdvanced: false },
      { key: 'question_count', label: '题目数量', type: 'select', options: ['10题', '20题', '30题', '40题'], required: true, isAdvanced: false },
      { key: 'difficulty', label: '训练强度', type: 'select', options: ['基础巩固', '中档提升', '压轴训练', '混合梯度'], required: true, isAdvanced: false },
      { key: 'need_answer', label: '需要答案解析', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'english-reading-assessment',
    name: '高强度英语阅读测评',
    description: '围绕英语阅读材料生成较完整的阅读理解测评任务',
    category: '练习命题',
    icon: 'ClipboardList',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS.filter(option => option.includes('英语')), required: true, isAdvanced: false },
      { key: 'textbook_version', label: '教材版本', type: 'select', options: TEXTBOOK_OPTIONS, isAdvanced: false },
      { key: 'source_text', label: '阅读材料', type: 'textarea', placeholder: '粘贴英文材料或概述阅读主题', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '教学目标', type: 'textarea', placeholder: '说明本次阅读测评重点考查什么', isAdvanced: false },
      { key: 'question_count', label: '题目数量', type: 'select', options: ['5题', '8题', '10题', '12题'], required: true, isAdvanced: false },
      { key: 'difficulty', label: '难度', type: 'select', options: ['基础', '中等', '提升'], required: true, isAdvanced: false },
      { key: 'need_answer', label: '需要答案解析', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'science-3d-assessment',
    name: '科学探究能力评价任务生成',
    description: '围绕科学概念、探究实践和证据解释生成三维科学评价任务',
    category: '练习命题',
    icon: 'ClipboardList',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS.filter(option => option.includes('科学') || option.includes('生物') || option.includes('物理') || option.includes('化学')), required: true, isAdvanced: false },
      { key: 'topic', label: '科学主题', type: 'text', placeholder: '例如：浮力 / 蒸发与凝结 / 植物生长条件', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '评价目标', type: 'textarea', placeholder: '说明想评价学生的科学概念、探究能力或证据解释能力', required: true, isAdvanced: false },
      { key: 'task_type', label: '任务形式', type: 'select', options: ['实验探究任务', '数据分析任务', '情境解释任务', '综合评价任务'], required: true, isAdvanced: false },
      { key: 'question_count', label: '任务数量', type: 'select', options: ['1个', '2个', '3个'], isAdvanced: true },
      { key: 'need_rubric', label: '需要评价量规', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'multi-step-assignment',
    name: '多步骤任务型作业',
    description: '生成带有步骤推进、资料处理和成果输出的任务型作业',
    category: '练习命题',
    icon: 'ClipboardList',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '任务主题', type: 'text', placeholder: '例如：家乡节气调查 / 一元二次方程复盘任务', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '任务目标', type: 'textarea', placeholder: '说明希望学生通过任务完成什么学习目标', required: true, isAdvanced: false },
      { key: 'step_count', label: '任务步骤数', type: 'select', options: ['3步', '4步', '5步'], required: true, isAdvanced: false },
      { key: 'output_form', label: '成果形式', type: 'select', options: ['表格', '短文', '海报', '口头展示', '综合任务单'], isAdvanced: true },
      { key: 'need_rubric', label: '需要评价标准', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'layered-homework',
    name: '分层作业',
    description: '围绕同一教学目标生成必做、选做与拓展作业',
    category: '差异化教学',
    icon: 'Layers',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '知识点或课题', type: 'text', placeholder: '例如：分式方程', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '作业目标', type: 'textarea', placeholder: '描述本次作业要巩固和提升什么', required: true, isAdvanced: false },
      { key: 'homework_levels', label: '分层方式', type: 'select', options: ['必做+选做', '基础+提高', '巩固+提升+拓展'], isAdvanced: false },
      { key: 'need_answers', label: '需要参考答案', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'choice-board',
    name: '选择板生成',
    description: '生成供学生自主选择完成的学习任务面板',
    category: '差异化教学',
    icon: 'Layers',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'topic', label: '学习主题', type: 'text', placeholder: '例如：走近鲁迅 / 分数应用 / 垃圾分类', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '学习目标', type: 'textarea', placeholder: '说明希望学生通过选择任务达成什么目标', required: true, isAdvanced: false },
      { key: 'board_size', label: '任务格数', type: 'select', options: ['3格', '6格', '9格'], required: true, isAdvanced: false },
      { key: 'task_types', label: '希望包含的任务类型', type: 'textarea', placeholder: '例如：阅读、表达、实践、创作、复习、合作', isAdvanced: true }
    ]
  },
  {
    id: 'text-scaffold',
    name: '差异化改写与支架',
    description: '对文本或任务做分层改写、支架设计与拓展任务生成',
    category: '差异化教学',
    icon: 'Layers',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'source_text', label: '原始材料或任务', type: 'textarea', placeholder: '粘贴需要改写或支架化的文本/任务', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '核心教学目标', type: 'textarea', placeholder: '描述这份材料服务的教学目标', required: true, isAdvanced: false },
      { key: 'scaffold_type', label: '支架类型', type: 'select', options: ['文本改写', '文本支架化', '文本分级', '清晰指令', '句式支架', '任务拆分', '常见误区预测'], required: true, isAdvanced: false },
      { key: 'struggling_support', label: '学困生支持需求', type: 'textarea', placeholder: '例如：需要关键词提示、分步指导、示例句', isAdvanced: true },
      { key: 'gifted_extension', label: '资优生拓展方向', type: 'textarea', placeholder: '例如：增加开放讨论、迁移任务、跨学科连接', isAdvanced: true }
    ]
  },
  {
    id: 'exam-review',
    name: '试卷讲评',
    description: '分析试卷，生成讲评流程和错因分析',
    category: '反馈评价',
    icon: 'MessageSquare',
    fields: [
      { key: 'exam_name', label: '考试名称', type: 'text', placeholder: '例如：期中数学测试', required: true, isAdvanced: false },
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'student_issues', label: '学生主要问题', type: 'textarea', placeholder: '描述学生普遍存在的问题', required: true, isAdvanced: false },
      { key: 'has_score_analysis', label: '手头有成绩数据', type: 'toggle', default: false, isAdvanced: true },
      // 高级选项
      { key: 'score_analysis', label: '成绩分析数据', type: 'textarea', placeholder: '填写平均分、最高分、最低分等数据', isAdvanced: true, showWhen: { key: 'has_score_analysis', equals: true } },
      { key: 'common_mistakes', label: '典型错误统计', type: 'textarea', placeholder: '列举高频错误题型', isAdvanced: true }
    ]
  },
  {
    id: 'feedback-rubric',
    name: '反馈与量规',
    description: '生成评语、量规、课堂观察表',
    category: '反馈评价',
    icon: 'MessageSquare',
    fields: [
      { key: 'feedback_type', label: '反馈类型', type: 'select', options: ['优点与建议', '量规评价', '评语', '课堂观察'], required: true, isAdvanced: false },
      { key: 'evaluation_content', label: '待评价内容', type: 'textarea', placeholder: '粘贴学生作品、作文、作业内容或课堂观察记录', required: true, isAdvanced: false },
      { key: 'evaluation_criteria', label: '评价标准或量规', type: 'textarea', placeholder: '例如：内容完整、表达清晰、思路合理、书写规范', required: true, isAdvanced: false },
      // 高级选项
      { key: 'evaluation_aspects', label: '评价维度', type: 'text', placeholder: '例如：学习态度、合作能力、创新思维', isAdvanced: true },
      { key: 'language_style', label: '输出语气', type: 'select', options: ['鼓励性', '客观型', '正式型'], isAdvanced: true },
      { key: 'target_audience', label: '面向对象', type: 'select', options: ['学生', '家长', '教师', '教研组'], isAdvanced: true }
    ]
  },
  {
    id: 'student-comment',
    name: '学生评语',
    description: '根据学生表现生成个性化、具体、有温度的成长评语',
    category: '反馈评价',
    icon: 'MessageSquare',
    fields: [
      { key: 'student_name', label: '学生姓名', type: 'text', placeholder: '例如：小明', required: true, isAdvanced: false },
      { key: 'grade', label: '年级', type: 'select', options: GRADE_OPTIONS, required: true, isAdvanced: false },
      { key: 'strengths', label: '主要优点', type: 'textarea', placeholder: '例如：课堂积极发言，乐于帮助同学', required: true, isAdvanced: false },
      { key: 'improvements', label: '需要改进的地方', type: 'textarea', placeholder: '例如：作业完成质量还需提升', required: true, isAdvanced: false },
      { key: 'comment_style', label: '评语风格', type: 'select', options: ['温暖鼓励型', '客观平实型', '严格要求型'], isAdvanced: true }
    ]
  },
  {
    id: 'classroom-observation',
    name: '听评课反馈',
    description: '生成适合教研组、备课组使用的听评课记录与改进建议',
    category: '反馈评价',
    icon: 'MessageSquare',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'lesson_topic', label: '授课内容', type: 'text', placeholder: '例如：勾股定理 / 背影', required: true, isAdvanced: false },
      { key: 'observation_focus', label: '观察重点', type: 'textarea', placeholder: '例如：目标达成、提问设计、学生活动、课堂评价', required: true, isAdvanced: false },
      { key: 'classroom_notes', label: '课堂记录', type: 'textarea', placeholder: '记录课堂亮点、问题和具体片段', required: true, isAdvanced: false },
      { key: 'feedback_tone', label: '反馈风格', type: 'select', options: ['专业客观', '温和建设性', '简洁明确'], isAdvanced: true }
    ]
  },
  {
    id: 'survey-creator',
    name: '问卷生成',
    description: '围绕教学反馈、活动调查或学生感受生成问卷题目',
    category: '反馈评价',
    icon: 'MessageSquare',
    fields: [
      { key: 'survey_theme', label: '问卷主题', type: 'text', placeholder: '例如：课堂反馈 / 阅读习惯 / 活动满意度', required: true, isAdvanced: false },
      { key: 'audience', label: '调查对象', type: 'select', options: ['学生', '家长', '教师', '混合对象'], required: true, isAdvanced: false },
      { key: 'survey_goal', label: '调查目标', type: 'textarea', placeholder: '说明这份问卷想了解什么信息', required: true, isAdvanced: false },
      { key: 'question_count', label: '题目数量', type: 'select', options: ['5题', '8题', '10题', '15题'], required: true, isAdvanced: false },
      { key: 'question_type', label: '题型结构', type: 'select', options: ['单选为主', '量表为主', '开放题为主', '混合'], isAdvanced: true }
    ]
  },
  {
    id: 'writing-feedback',
    name: '写作反馈生成',
    description: '根据学生作文或写作内容生成具体反馈与修改建议',
    category: '反馈评价',
    icon: 'MessageSquare',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'evaluation_content', label: '写作内容', type: 'textarea', placeholder: '粘贴作文、段落或写作任务完成内容', required: true, isAdvanced: false },
      { key: 'evaluation_criteria', label: '评价重点', type: 'textarea', placeholder: '例如：立意、结构、语言表达、书写规范', required: true, isAdvanced: false },
      { key: 'language_style', label: '反馈语气', type: 'select', options: ['鼓励性', '客观型', '教师批注型'], required: true, isAdvanced: false },
      { key: 'need_revision_suggestion', label: '需要修改示例', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'text-proofreader',
    name: '文本校对润色',
    description: '对学生或教师文本做病句、表达与结构优化建议',
    category: '反馈评价',
    icon: 'MessageSquare',
    fields: [
      { key: 'source_text', label: '原始文本', type: 'textarea', placeholder: '粘贴需要校对或润色的文本', required: true, isAdvanced: false },
      { key: 'proofread_goal', label: '处理目标', type: 'select', options: ['病句修改', '表达润色', '逻辑梳理', '综合优化'], required: true, isAdvanced: false },
      { key: 'target_audience', label: '适用对象', type: 'select', options: ['学生作业', '教师文稿', '家长通知', '活动总结'], required: true, isAdvanced: false },
      { key: 'language_style', label: '目标风格', type: 'select', options: ['简洁清晰', '正式规范', '自然生动'], isAdvanced: true }
    ]
  },
  {
    id: 'class-meeting',
    name: '主题班会',
    description: '设计主题班会活动流程',
    category: '学生支持',
    icon: 'Heart',
    fields: [
      { key: 'theme', label: '班会主题', type: 'text', placeholder: '例如：文明礼仪伴我行', required: true, isAdvanced: false },
      { key: 'grade', label: '年级', type: 'select', options: GRADE_OPTIONS, required: true, isAdvanced: false },
      // 高级选项
      { key: 'duration', label: '时长', type: 'select', options: ['40分钟', '45分钟', '60分钟', '90分钟'], isAdvanced: true },
      { key: 'meeting_form', label: '班会形式', type: 'select', options: ['讨论式', '活动式', '演讲式', '观看视频'], isAdvanced: true },
      { key: 'need_materials', label: '需要准备材料清单', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'parent-communication',
    name: '家校沟通',
    description: '生成家长通知、家长信、学习建议',
    category: '沟通写作',
    icon: 'Send',
    fields: [
      { key: 'comm_type', label: '沟通类型', type: 'select', options: ['通知', '家长信', '学习建议'], required: true, isAdvanced: false },
      { key: 'grade', label: '年级', type: 'select', options: GRADE_OPTIONS, required: true, isAdvanced: false },
      { key: 'content', label: '主要内容', type: 'textarea', placeholder: '描述需要沟通的内容', required: true, isAdvanced: false },
      // 高级选项
      { key: 'tone', label: '语气风格', type: 'select', options: ['正式', '亲切', '紧急'], isAdvanced: true },
      { key: 'special_needs', label: '特殊需求', type: 'textarea', placeholder: '例如：需要双语版本、需要明确时间节点', isAdvanced: true },
      { key: 'need_signature', label: '需要家长签字回执', type: 'toggle', default: false, isAdvanced: true, showWhen: { key: 'comm_type', equals: '通知' } }
    ]
  },
  {
    id: 'professional-email',
    name: '正式沟通文本生成',
    description: '面向家长、同事或管理者生成正式沟通文本',
    category: '沟通写作',
    icon: 'Send',
    fields: [
      { key: 'audience', label: '沟通对象', type: 'select', options: ['家长', '同事', '管理者', '外部机构'], required: true, isAdvanced: false },
      { key: 'purpose', label: '沟通目的', type: 'select', options: ['通知', '回复', '邀请', '反馈', '推荐', '说明'], required: true, isAdvanced: false },
      { key: 'key_facts', label: '关键信息', type: 'textarea', placeholder: '输入文本必须包含的事实与要点', required: true, isAdvanced: false },
      { key: 'tone', label: '语气要求', type: 'select', options: ['正式', '温和', '简洁', '鼓励'], isAdvanced: true },
      { key: 'special_needs', label: '特殊需求', type: 'textarea', placeholder: '例如：需要明确截止时间', isAdvanced: true, showWhen: { key: 'purpose', in: ['通知', '邀请', '说明'] } }
    ]
  },
  {
    id: 'class-newsletter',
    name: '班级通讯生成',
    description: '生成适合班级群或班级月报使用的班级通讯文本',
    category: '沟通写作',
    icon: 'Send',
    fields: [
      { key: 'class_name', label: '班级名称', type: 'text', placeholder: '例如：三年级2班', required: true, isAdvanced: false },
      { key: 'time_range', label: '时间范围', type: 'text', placeholder: '例如：第5周 / 3月班级通讯', required: true, isAdvanced: false },
      { key: 'highlights', label: '本期亮点与事项', type: 'textarea', placeholder: '输入活动亮点、学习重点、提醒事项', required: true, isAdvanced: false },
      { key: 'tone', label: '语气风格', type: 'select', options: ['温暖亲切', '正式清晰', '活泼有参与感'], isAdvanced: true }
    ]
  },
  {
    id: 'email-reply',
    name: '邮件回复生成',
    description: '根据来信内容生成专业、得体的回复文本',
    category: '沟通写作',
    icon: 'Send',
    fields: [
      { key: 'audience', label: '来信对象', type: 'select', options: ['家长', '同事', '管理者', '外部机构'], required: true, isAdvanced: false },
      { key: 'source_message', label: '原始来信或要点', type: 'textarea', placeholder: '粘贴邮件、消息或概述来信内容', required: true, isAdvanced: false },
      { key: 'reply_goal', label: '回复目标', type: 'select', options: ['说明情况', '回应疑问', '表达感谢', '婉拒请求', '邀请配合'], required: true, isAdvanced: false },
      { key: 'tone', label: '回复语气', type: 'select', options: ['正式', '温和', '坚定', '感谢'], isAdvanced: true }
      ,{ key: 'special_needs', label: '特殊需求', type: 'textarea', placeholder: '例如：需要双语版本、需要简短版', isAdvanced: true }
    ]
  },
  {
    id: 'recommendation-letter',
    name: '推荐信生成',
    description: '根据学生或教师的表现信息生成结构完整的推荐信',
    category: '沟通写作',
    icon: 'Send',
    fields: [
      { key: 'candidate_name', label: '被推荐人', type: 'text', placeholder: '例如：李明', required: true, isAdvanced: false },
      { key: 'candidate_role', label: '推荐对象身份', type: 'select', options: ['学生', '教师'], required: true, isAdvanced: false },
      { key: 'strengths', label: '主要优势与事例', type: 'textarea', placeholder: '描述能力、品质和具体事例', required: true, isAdvanced: false },
      { key: 'recommendation_purpose', label: '推荐用途', type: 'text', placeholder: '例如：评优评先、活动报名、岗位申请', required: true, isAdvanced: false },
      { key: 'tone', label: '文本风格', type: 'select', options: ['正式有力', '真诚温暖', '简洁清晰'], isAdvanced: true }
    ]
  },
  {
    id: 'thank-you-letter',
    name: '感谢信生成',
    description: '为家长、同事、志愿者或合作单位生成感谢信',
    category: '沟通写作',
    icon: 'Send',
    fields: [
      { key: 'audience', label: '感谢对象', type: 'select', options: ['家长', '同事', '学生', '志愿者', '合作单位'], required: true, isAdvanced: false },
      { key: 'thank_reason', label: '感谢原因', type: 'textarea', placeholder: '描述对方提供了哪些帮助或支持', required: true, isAdvanced: false },
      { key: 'occasion', label: '使用场景', type: 'text', placeholder: '例如：家长会后、活动结束后、学期末', required: true, isAdvanced: false },
      { key: 'tone', label: '语气风格', type: 'select', options: ['正式', '温暖', '真诚朴实'], isAdvanced: true }
    ]
  },
  {
    id: 'promo-copy',
    name: '宣传文案生成',
    description: '为校园活动、班级活动或课程成果生成宣传文案',
    category: '沟通写作',
    icon: 'Send',
    fields: [
      { key: 'event_name', label: '活动名称', type: 'text', placeholder: '例如：校园读书节 / 科技节成果展', required: true, isAdvanced: false },
      { key: 'event_details', label: '活动亮点', type: 'textarea', placeholder: '描述时间、内容、亮点与参与方式', required: true, isAdvanced: false },
      { key: 'audience', label: '面向对象', type: 'select', options: ['校内师生', '家长', '社会公众'], required: true, isAdvanced: false },
      { key: 'tone', label: '文案风格', type: 'select', options: ['正式宣传', '热情号召', '简洁海报文案'], required: true, isAdvanced: false }
    ]
  },
  {
    id: 'student-support',
    name: '学生支持',
    description: '学困生辅导、心理疏导、成长规划',
    category: '学生支持',
    icon: 'Heart',
    fields: [
      { key: 'support_type', label: '支持类型', type: 'select', options: ['学困生辅导', '心理疏导', '成长规划'], required: true, isAdvanced: false },
      { key: 'grade', label: '年级', type: 'select', options: GRADE_OPTIONS, isAdvanced: false },
      { key: 'student_strengths', label: '学生优势', type: 'textarea', placeholder: '描述学生已有的长处、兴趣或积极表现', required: true, isAdvanced: false },
      { key: 'student_situation', label: '学生情况', type: 'textarea', placeholder: '描述学生的具体情况', required: true, isAdvanced: false },
      { key: 'support_background', label: '相关背景', type: 'textarea', placeholder: '例如：家庭情况、转学经历、近期状态变化', isAdvanced: false, showWhen: { key: 'support_type', in: ['心理疏导', '成长规划'] } },
      { key: 'typical_incident', label: '课堂表现或典型事件', type: 'textarea', placeholder: '例如：课堂走神、与同伴冲突、作业拖延等具体表现', isAdvanced: false, showWhen: { key: 'support_type', in: ['学困生辅导', '心理疏导'] } },
      // 高级选项
      { key: 'support_duration', label: '辅导周期', type: 'select', options: ['单次', '一周', '一个月', '一学期'], isAdvanced: true },
      { key: 'support_tone', label: '输出语气', type: 'select', options: ['客观', '支持性', '专业'], isAdvanced: true },
      { key: 'need_follow_up', label: '需要后续跟踪建议', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'teaching-adjustment',
    name: '教学调整建议生成',
    description: '针对学生学习困难或课堂表现生成可执行的教学调整建议',
    category: '学生支持',
    icon: 'Heart',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'student_situation', label: '学生情况', type: 'textarea', placeholder: '描述学生当前的学习困难、课堂表现或行为特点', required: true, isAdvanced: false },
      { key: 'teaching_objectives', label: '当前教学目标', type: 'textarea', placeholder: '说明本阶段要帮助学生达到什么', required: true, isAdvanced: false },
      { key: 'support_type', label: '调整重点', type: 'select', options: ['课堂参与', '任务难度', '作业支持', '评价方式', '综合调整'], required: true, isAdvanced: false },
      { key: 'need_follow_up', label: '需要跟踪建议', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'support-goals',
    name: '发展目标生成',
    description: '围绕学生当前状态生成阶段性成长目标与跟进建议',
    category: '学生支持',
    icon: 'Heart',
    fields: [
      { key: 'grade', label: '年级', type: 'select', options: GRADE_OPTIONS, required: true, isAdvanced: false },
      { key: 'student_situation', label: '学生现状', type: 'textarea', placeholder: '描述学习、行为、情绪或交往方面的现状', required: true, isAdvanced: false },
      { key: 'goal_focus', label: '目标方向', type: 'select', options: ['学习习惯', '课堂参与', '情绪管理', '同伴交往', '综合发展'], required: true, isAdvanced: false },
      { key: 'support_duration', label: '目标周期', type: 'select', options: ['一周', '两周', '一个月', '一学期'], required: true, isAdvanced: false }
    ]
  },
  {
    id: 'social-story',
    name: '社交故事生成',
    description: '围绕具体校园场景生成适合学生理解与练习的社交故事',
    category: '学生支持',
    icon: 'Heart',
    fields: [
      { key: 'grade', label: '年级', type: 'select', options: GRADE_OPTIONS, required: true, isAdvanced: false },
      { key: 'scenario', label: '场景', type: 'text', placeholder: '例如：排队、借东西、课间冲突、上课举手发言', required: true, isAdvanced: false },
      { key: 'student_situation', label: '学生当前困难', type: 'textarea', placeholder: '描述学生在该场景中的具体表现', required: true, isAdvanced: false },
      { key: 'story_tone', label: '表达风格', type: 'select', options: ['温和引导', '简洁直接', '故事化'], isAdvanced: true }
    ]
  },
  {
    id: 'restorative-reflection',
    name: '修复式反思任务',
    description: '针对冲突、违纪或不当行为生成修复式反思任务和提问',
    category: '学生支持',
    icon: 'Heart',
    fields: [
      { key: 'grade', label: '年级', type: 'select', options: GRADE_OPTIONS, required: true, isAdvanced: false },
      { key: 'incident', label: '事件经过', type: 'textarea', placeholder: '描述发生了什么，涉及哪些人', required: true, isAdvanced: false },
      { key: 'reflection_goal', label: '希望达成的反思目标', type: 'textarea', placeholder: '例如：认识影响、学会道歉、制定改进行动', required: true, isAdvanced: false },
      { key: 'tone', label: '任务语气', type: 'select', options: ['温和引导', '客观理性', '坚定但尊重'], isAdvanced: true }
    ]
  },
  {
    id: 'classroom-management',
    name: '课堂管理建议生成',
    description: '围绕课堂秩序、参与度和规则执行生成管理建议',
    category: '学生支持',
    icon: 'Heart',
    fields: [
      { key: 'grade_subject', label: '年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'classroom_issue', label: '课堂管理问题', type: 'textarea', placeholder: '例如：走神多、插话多、小组合作混乱', required: true, isAdvanced: false },
      { key: 'teaching_context', label: '课堂场景', type: 'textarea', placeholder: '例如：复习课、实验课、大班额、小组活动多', required: true, isAdvanced: false },
      { key: 'management_goal', label: '希望改善到什么程度', type: 'textarea', placeholder: '描述期待的课堂状态', isAdvanced: true }
    ]
  },
  {
    id: 'inclusive-support-plan',
    name: '随班支持计划草案',
    description: '围绕学生在普通班级中的学习与参与需求生成支持计划草案',
    category: '学生支持',
    icon: 'Heart',
    fields: [
      { key: 'grade', label: '年级', type: 'select', options: GRADE_OPTIONS, required: true, isAdvanced: false },
      { key: 'student_strengths', label: '学生优势', type: 'textarea', placeholder: '描述学生已有的长处、兴趣或积极表现', required: true, isAdvanced: false },
      { key: 'student_situation', label: '学生需求或困难', type: 'textarea', placeholder: '描述学生在学习、参与或适应上的主要需求', required: true, isAdvanced: false },
      { key: 'support_background', label: '相关背景', type: 'textarea', placeholder: '例如：转学经历、家庭情况、以往支持方式', required: true, isAdvanced: false },
      { key: 'need_follow_up', label: '需要跟踪建议', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'individual-support-plan',
    name: '个别化支持计划草案',
    description: '针对学生个体差异生成阶段性目标、支持措施和跟踪建议',
    category: '学生支持',
    icon: 'Heart',
    fields: [
      { key: 'grade', label: '年级', type: 'select', options: GRADE_OPTIONS, required: true, isAdvanced: false },
      { key: 'student_strengths', label: '学生优势', type: 'textarea', placeholder: '描述学生的优势、兴趣或已有基础', required: true, isAdvanced: false },
      { key: 'student_situation', label: '学生需求或困难', type: 'textarea', placeholder: '说明目前最需要支持的方面', required: true, isAdvanced: false },
      { key: 'goal_focus', label: '支持重点', type: 'select', options: ['学习目标', '行为习惯', '情绪管理', '社交沟通', '综合发展'], required: true, isAdvanced: false },
      { key: 'support_duration', label: '计划周期', type: 'select', options: ['两周', '一个月', '一学期'], isAdvanced: true }
    ]
  },
  {
    id: 'behavior-support-plan',
    name: '行为支持计划草案',
    description: '围绕学生行为表现生成行为支持目标、策略和跟踪建议',
    category: '学生支持',
    icon: 'Heart',
    fields: [
      { key: 'grade', label: '年级', type: 'select', options: GRADE_OPTIONS, required: true, isAdvanced: false },
      { key: 'typical_incident', label: '典型事件或行为模式', type: 'textarea', placeholder: '描述高频行为问题、触发情境和影响', required: true, isAdvanced: false },
      { key: 'student_strengths', label: '学生优势', type: 'textarea', placeholder: '描述可以作为支持切入点的优势', required: true, isAdvanced: false },
      { key: 'reflection_goal', label: '支持目标', type: 'textarea', placeholder: '例如：减少冲突、提升规则意识、改善课堂参与', required: true, isAdvanced: false },
      { key: 'need_follow_up', label: '需要跟踪建议', type: 'toggle', default: true, isAdvanced: true }
    ]
  },
  {
    id: 'subject-resource-bot',
    name: '学科资源机器人配置',
    description: '配置围绕某一学科或专题持续提供资源与建议的课堂助手',
    category: '课堂助手',
    icon: 'Zap',
    fields: [
      { key: 'bot_role', label: '机器人名称或角色', type: 'text', placeholder: '例如：初中语文阅读助教', required: true, isAdvanced: false },
      { key: 'grade_subject', label: '服务年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'theme_scope', label: '资源主题范围', type: 'textarea', placeholder: '例如：阅读教学、作文训练、古诗文积累', required: true, isAdvanced: false },
      { key: 'response_style', label: '回答风格', type: 'select', options: ['资源推荐型', '结构清晰型', '启发式'], required: true, isAdvanced: false }
    ]
  },
  {
    id: 'roleplay-bot',
    name: '角色扮演机器人配置',
    description: '配置能在课堂中进行角色扮演、对话演练和情境模拟的助手',
    category: '课堂助手',
    icon: 'Zap',
    fields: [
      { key: 'bot_role', label: '角色定位', type: 'text', placeholder: '例如：古代使者 / 英语面试官 / 历史人物', required: true, isAdvanced: false },
      { key: 'service_target', label: '服务对象', type: 'select', options: ['学生', '教师', '混合对象'], required: true, isAdvanced: false },
      { key: 'theme_scope', label: '使用场景', type: 'textarea', placeholder: '例如：口语练习、历史对话、班会情景演练', required: true, isAdvanced: false },
      { key: 'response_style', label: '对话风格', type: 'select', options: ['沉浸式', '启发式', '轻松互动'], required: true, isAdvanced: false }
    ]
  },
  {
    id: 'doc-qa-bot',
    name: '文档问答机器人配置',
    description: '配置能够围绕资料、讲义、校本材料进行问答的课堂助手',
    category: '课堂助手',
    icon: 'Zap',
    fields: [
      { key: 'bot_role', label: '机器人角色', type: 'text', placeholder: '例如：教材问答助手 / 讲义答疑机器人', required: true, isAdvanced: false },
      { key: 'document_scope', label: '文档范围', type: 'textarea', placeholder: '描述将提供什么资料、讲义或文本给机器人参考', required: true, isAdvanced: false },
      { key: 'service_target', label: '服务对象', type: 'select', options: ['学生', '教师', '家长'], required: true, isAdvanced: false },
      { key: 'response_style', label: '回答风格', type: 'select', options: ['严谨清晰', '简洁直达', '启发式'], required: true, isAdvanced: false }
    ]
  },
  {
    id: 'custom-chatbot',
    name: '自定义聊天机器人配置',
    description: '自由定义教学聊天机器人的角色、边界、能力与示例问题',
    category: '课堂助手',
    icon: 'Zap',
    fields: [
      { key: 'bot_role', label: '角色定位', type: 'text', placeholder: '例如：中考英语阅读陪练助手', required: true, isAdvanced: false },
      { key: 'service_target', label: '服务对象', type: 'select', options: ['学生', '教师', '家长', '混合对象'], required: true, isAdvanced: false },
      { key: 'theme_scope', label: '主题范围', type: 'textarea', placeholder: '描述机器人应该围绕哪些内容工作', required: true, isAdvanced: false },
      { key: 'response_style', label: '回答风格', type: 'select', options: ['启发式', '鼓励式', '严谨清晰', '简洁直达'], required: true, isAdvanced: false },
      { key: 'can_do', label: '能做什么', type: 'textarea', placeholder: '例如：引导提问、总结知识点、提供思路提示', required: true, isAdvanced: true },
      { key: 'cannot_do', label: '不能做什么', type: 'textarea', placeholder: '例如：不能代写作业、不能替代教师评分', required: true, isAdvanced: true }
    ]
  },
  {
    id: 'standards-chatbot',
    name: '课程标准聊天机器人配置',
    description: '围绕课程标准、学段要求和目标拆解配置标准导向型教学助手',
    category: '课堂助手',
    icon: 'Zap',
    fields: [
      { key: 'bot_role', label: '机器人角色', type: 'text', placeholder: '例如：语文课程标准解读助手', required: true, isAdvanced: false },
      { key: 'grade_subject', label: '服务年级和学科', type: 'select', options: GRADE_SUBJECT_OPTIONS, required: true, isAdvanced: false },
      { key: 'standard_scope', label: '课程标准范围', type: 'textarea', placeholder: '例如：阅读理解目标、写作要求、实验探究要求', required: true, isAdvanced: false },
      { key: 'response_style', label: '回答风格', type: 'select', options: ['严谨清晰', '启发式', '结构化'], required: true, isAdvanced: false },
      { key: 'can_do', label: '重点支持什么', type: 'textarea', placeholder: '例如：拆解目标、对齐活动、生成评价建议', isAdvanced: true }
    ]
  },
  {
    id: 'ai-chatbot',
    name: '课堂助手配置',
    description: '为课堂场景配置有边界、可复用的课堂对话助手',
    category: '课堂助手',
    icon: 'Zap',
    fields: [
      { key: 'bot_role', label: '机器人角色定位', type: 'text', placeholder: '例如：七年级历史探究助教', required: true, isAdvanced: false },
      { key: 'service_target', label: '服务对象', type: 'select', options: ['学生', '教师', '家长', '混合对象'], required: true, isAdvanced: false },
      { key: 'theme_scope', label: '主题范围', type: 'textarea', placeholder: '例如：中国古代史导学、材料分析、课堂提问引导', required: true, isAdvanced: false },
      { key: 'response_style', label: '回答风格', type: 'select', options: ['启发式', '鼓励式', '严谨清晰', '简洁直达'], required: true, isAdvanced: false },
      { key: 'can_do', label: '能做什么', type: 'textarea', placeholder: '例如：引导提问、总结知识点、生成练习建议', required: true, isAdvanced: true },
      { key: 'cannot_do', label: '不能做什么', type: 'textarea', placeholder: '例如：不能直接代写作业、不能替代教师评价', required: true, isAdvanced: true }
    ]
  }
]

const compactVisibleFieldKeys = {
  'lesson-plan': ['grade_subject', 'topic', 'teaching_objectives', 'textbook_version'],
  'pe-lesson-plan': ['grade_subject', 'topic', 'teaching_objectives', 'class_type'],
  'lesson-5e': ['grade_subject', 'topic', 'teaching_objectives', 'textbook_version'],
  'unit-plan': ['grade_subject', 'unit_name', 'unit_goals', 'textbook_version'],
  'lesson-talk': ['grade_subject', 'topic', 'talk_focus'],
  'project-based-learning': ['grade_subject', 'project_topic', 'teaching_objectives', 'duration'],
  'science-lab': ['grade_subject', 'topic', 'teaching_objectives', 'resources'],
  'group-work': ['grade_subject', 'topic', 'teaching_objectives', 'group_goal'],
  'pd-planner': ['training_theme', 'audience', 'teaching_objectives', 'duration'],
  'content-gen': ['grade_subject', 'topic', 'teaching_objectives', 'content_type'],
  'expository-text': ['grade_subject', 'topic', 'teaching_objectives', 'difficulty'],
  'phonics-reader': ['grade_subject', 'topic', 'key_terms', 'length_requirement'],
  'vocab-text': ['grade_subject', 'topic', 'target_vocab', 'text_style'],
  'vocab-list': ['grade_subject', 'topic', 'word_count', 'teaching_objectives'],
  'data-analysis-task': ['grade_subject', 'data_source', 'topic', 'task_goal'],
  'real-world-connection': ['grade_subject', 'topic', 'connection_goal', 'teaching_objectives'],
  'lesson-hook': ['grade_subject', 'topic', 'hook_style', 'teaching_objectives'],
  'math-word-problem': ['grade_subject', 'topic', 'question_count', 'difficulty'],
  'math-review-set': ['grade_subject', 'topic', 'question_count', 'difficulty'],
  'sel-lesson-plan': ['grade', 'topic', 'teaching_objectives', 'duration'],
  'syllabus-generator': ['grade_subject', 'course_name', 'course_goals', 'weeks'],
  'exercise-gen': ['grade_subject', 'topic', 'teaching_objectives', 'question_type', 'question_mix_rule', 'question_count'],
  'worksheet-gen': ['grade_subject', 'topic', 'teaching_objectives', 'question_type'],
  'multiple-choice-quiz': ['grade_subject', 'topic', 'teaching_objectives', 'question_count', 'difficulty'],
  'cognitive-questions': ['grade_subject', 'topic', 'teaching_objectives', 'cognitive_levels', 'question_count'],
  'text-dependent-questions': ['grade_subject', 'source_text', 'teaching_objectives', 'question_count', 'difficulty'],
  'text-analysis-task': ['grade_subject', 'source_text', 'teaching_objectives', 'analysis_focus', 'question_count'],
  'video-questions': ['grade_subject', 'video_summary', 'teaching_objectives', 'question_count', 'question_type'],
  'math-drill': ['grade_subject', 'topic', 'teaching_objectives', 'question_count', 'difficulty'],
  'english-reading-assessment': ['grade_subject', 'source_text', 'teaching_objectives', 'question_count', 'difficulty'],
  'science-3d-assessment': ['grade_subject', 'topic', 'teaching_objectives', 'task_type'],
  'multi-step-assignment': ['grade_subject', 'topic', 'teaching_objectives', 'step_count'],
  'layered-homework': ['grade_subject', 'topic', 'teaching_objectives', 'homework_levels'],
  'choice-board': ['grade_subject', 'topic', 'teaching_objectives', 'board_size'],
  'text-scaffold': ['grade_subject', 'source_text', 'teaching_objectives', 'scaffold_type'],
  'exam-review': ['exam_name', 'grade_subject', 'student_issues'],
  'feedback-rubric': ['feedback_type', 'evaluation_content', 'evaluation_criteria'],
  'student-comment': ['student_name', 'grade', 'strengths', 'improvements'],
  'classroom-observation': ['grade_subject', 'lesson_topic', 'observation_focus', 'classroom_notes'],
  'survey-creator': ['survey_theme', 'audience', 'survey_goal', 'question_count'],
  'writing-feedback': ['grade_subject', 'evaluation_content', 'evaluation_criteria', 'language_style'],
  'text-proofreader': ['source_text', 'proofread_goal', 'target_audience'],
  'class-meeting': ['theme', 'grade'],
  'parent-communication': ['comm_type', 'grade', 'content', 'special_needs'],
  'professional-email': ['audience', 'purpose', 'key_facts'],
  'class-newsletter': ['class_name', 'time_range', 'highlights'],
  'email-reply': ['audience', 'source_message', 'reply_goal', 'special_needs'],
  'recommendation-letter': ['candidate_name', 'candidate_role', 'strengths', 'recommendation_purpose'],
  'thank-you-letter': ['audience', 'thank_reason', 'occasion'],
  'promo-copy': ['event_name', 'event_details', 'audience', 'tone'],
  'student-support': ['support_type', 'grade', 'student_strengths', 'student_situation'],
  'teaching-adjustment': ['grade_subject', 'student_situation', 'teaching_objectives', 'support_type'],
  'support-goals': ['grade', 'student_situation', 'goal_focus', 'support_duration'],
  'social-story': ['grade', 'scenario', 'student_situation'],
  'restorative-reflection': ['grade', 'incident', 'reflection_goal'],
  'classroom-management': ['grade_subject', 'classroom_issue', 'teaching_context'],
  'inclusive-support-plan': ['grade', 'student_strengths', 'student_situation', 'support_background'],
  'individual-support-plan': ['grade', 'student_strengths', 'student_situation', 'goal_focus'],
  'behavior-support-plan': ['grade', 'typical_incident', 'student_strengths', 'reflection_goal'],
  'subject-resource-bot': ['bot_role', 'grade_subject', 'theme_scope', 'response_style'],
  'roleplay-bot': ['bot_role', 'service_target', 'theme_scope', 'response_style'],
  'doc-qa-bot': ['bot_role', 'document_scope', 'service_target', 'response_style'],
  'custom-chatbot': ['bot_role', 'service_target', 'theme_scope', 'response_style'],
  'standards-chatbot': ['bot_role', 'grade_subject', 'standard_scope', 'response_style'],
  'ai-chatbot': ['bot_role', 'service_target', 'theme_scope', 'response_style']
}

const forceCompactFields = (tool) => {
  const visibleKeys = compactVisibleFieldKeys[tool.id]
  if (!visibleKeys) return tool

  return {
    ...tool,
    fields: tool.fields.map((field) => ({
      ...field,
      isAdvanced: !visibleKeys.includes(field.key)
    }))
  }
}

export const allTools = baseTools.map(forceCompactFields)

// 获取工具详情
export const getToolById = (id) => {
  return allTools.find(tool => tool.id === id)
}

// 获取分类下的工具
export const getToolsByCategory = (categoryName) => {
  return allTools.filter(tool => tool.category === categoryName)
}
