import { useEffect, useMemo, useState } from 'react'
import {
  Wind,
  BookHeart,
  Target,
  Sparkles,
  RotateCcw,
  Heart,
  Coffee,
  Flower2,
  CircleDot,
  Puzzle,
  RefreshCw,
  Play,
  Pause,
  Sun,
  Moon,
  Stars,
  Leaf,
  Trash2,
  Sparkle,
  Zap,
  Gift,
  MessageCircle,
  Loader2,
  Check,
} from 'lucide-react'

const stories = [
  {
    id: 1,
    text: '一位学生偷偷在作业本里夹了一张纸条："老师,你昨天嗓子不舒服，我带了润喉糖放在讲台抽屉里。" 那一刻，所有的疲惫都融化了。',
    author: '小学语文老师',
  },
  {
    id: 2,
    text: '批改作文时看到一篇《我最喜欢的老师》，写的是我。最后一句："她让我知道，原来做错题不用害怕，因为她说错误是成长的台阶。"',
    author: '初中数学老师',
  },
  {
    id: 3,
    text: '教师节收到一个已经毕业孩子的微信："老师，我现在也成了一名老师，每次走上讲台就会想起你当年的样子。"',
    author: '高中班主任',
  },
  {
    id: 4,
    text: '班里内向的女孩，悄悄在我办公桌放了一幅画，上面是向日葵和太阳，写着："老师，你是我的光。"',
    author: '小学美术老师',
  },
  {
    id: 5,
    text: '家长会后一位爸爸对我说："老师，我家孩子以前不爱说话，现在每天回家都跟我讲学校的事，谢谢你。"',
    author: '小学英语老师',
  },
]

const fortuneCards = [
  { id: 1, title: '今日宜', content: '给自己买一杯喜欢的饮品', type: 'positive' },
  { id: 2, title: '小确幸', content: '今天会有一个温暖的时刻等着你', type: 'happy' },
  { id: 3, title: '提醒', content: '别忘了给自己倒杯温水', type: 'care' },
  { id: 4, title: '运势', content: '今天适合做一件让自己开心的小事', type: 'action' },
  { id: 5, title: '能量', content: '你已经比昨天更棒了', type: 'energy' },
  { id: 6, title: '小建议', content: '站起来伸展一下肩膀吧', type: 'care' },
  { id: 7, title: '吉签', content: '你的努力和付出都值得被看见', type: 'positive' },
  { id: 8, title: '暖心话', content: '你是一个温柔又有力量的人', type: 'happy' },
  { id: 9, title: '小提示', content: '深呼吸三次，感受当下的平静', type: 'care' },
  { id: 10, title: '幸运', content: '今天会有小惊喜等着你', type: 'energy' },
  { id: 11, title: '鼓励', content: '你的坚持本身就是一种成功', type: 'positive' },
  { id: 12, title: '休息', content: '找个安静的地方闭目养神5分钟', type: 'care' },
]

const cardSymbols = ['heart', 'star', 'flower', 'moon', 'sun', 'leaf']

const symbolIcons = {
  heart: Heart,
  star: Stars,
  flower: Flower2,
  moon: Moon,
  sun: Sun,
  leaf: Leaf,
}

const breathingSteps = [
  { text: '吸气 4 秒', duration: 4000, scale: 1.4, icon: Wind },
  { text: '屏息 7 秒', duration: 7000, scale: 1.6, icon: CircleDot },
  { text: '呼气 8 秒', duration: 8000, scale: 1, icon: Leaf },
]

function shuffle(array) {
  const next = [...array]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }
  return next
}

const TeacherCompanionPage = () => {
  const [breathing, setBreathing] = useState({
    active: false,
    stepIndex: 0,
    cycle: 0,
    text: '点击开始呼吸练习',
    scale: 1,
  })
  const [storyIndex, setStoryIndex] = useState(() => Math.floor(Math.random() * stories.length))
  const [merits, setMerits] = useState(0)
  const [meritPopups, setMeritPopups] = useState([])
  const [stressInput, setStressInput] = useState('')
  const [shredding, setShredding] = useState(false)
  const [shreddedItems, setShreddedItems] = useState([])
  const [showStressPaper, setShowStressPaper] = useState(false)
  const [paperPhase, setPaperPhase] = useState('idle') // idle, show, crumple, drop, shredding, complete
  const [fortune, setFortune] = useState(null)
  const [drawing, setDrawing] = useState(false)
  const [showFortuneModal, setShowFortuneModal] = useState(false)
  const [cards, setCards] = useState(() => shuffle([...cardSymbols, ...cardSymbols]))
  const [openedCards, setOpenedCards] = useState([])
  const [matchedCards, setMatchedCards] = useState([])
  const [gameLocked, setGameLocked] = useState(false)

  useEffect(() => {
    if (!breathing.active) return undefined

    if (breathing.cycle >= 6) {
      setBreathing({
        active: false,
        stepIndex: 0,
        cycle: 0,
        text: '完成啦，今天也值得被温柔对待。',
        scale: 1,
      })
      return undefined
    }

    const currentStep = breathingSteps[breathing.stepIndex]
    const timeoutId = window.setTimeout(() => {
      setBreathing((previous) => {
        const nextStepIndex = previous.stepIndex + 1
        if (nextStepIndex >= breathingSteps.length) {
          return {
            ...previous,
            stepIndex: 0,
            cycle: previous.cycle + 1,
            text: breathingSteps[0].text,
            scale: breathingSteps[0].scale,
          }
        }
        return {
          ...previous,
          stepIndex: nextStepIndex,
          text: breathingSteps[nextStepIndex].text,
          scale: breathingSteps[nextStepIndex].scale,
        }
      })
    }, currentStep.duration)

    return () => window.clearTimeout(timeoutId)
  }, [breathing])

  const currentStory = useMemo(() => stories[storyIndex], [storyIndex])

  const startBreathing = () => {
    setBreathing({
      active: true,
      stepIndex: 0,
      cycle: 0,
      text: breathingSteps[0].text,
      scale: breathingSteps[0].scale,
    })
  }

  const stopBreathing = () => {
    setBreathing({
      active: false,
      stepIndex: 0,
      cycle: 0,
      text: '呼吸已停止，先慢慢缓一口气。',
      scale: 1,
    })
  }

  const handleShredStress = () => {
    if (!stressInput.trim() || shredding) return
    
    setShredding(true)
    setShowStressPaper(true)
    setPaperPhase('show')
    
    // 1.2秒后开始揉纸
    setTimeout(() => {
      setPaperPhase('crumple')
    }, 1200)
    
    // 2秒后进入碎纸口
    setTimeout(() => {
      setPaperPhase('drop')
    }, 2000)
    
    // 2.4秒后开始粉碎
    setTimeout(() => {
      setPaperPhase('shredding')
    }, 2400)
    
    // 3.8秒后完成
    setTimeout(() => {
      setPaperPhase('complete')
    }, 3800)
    
    // 5秒后关闭
    setTimeout(() => {
      setShreddedItems((prev) => [...prev, { id: Date.now(), text: stressInput }])
      setStressInput('')
      setShredding(false)
      setShowStressPaper(false)
      setPaperPhase('idle')
    }, 5000)
  }

  const drawFortune = () => {
    if (drawing) return
    setDrawing(true)
    setFortune(null)
    
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * fortuneCards.length)
      setFortune(fortuneCards[randomIndex])
      setDrawing(false)
      setShowFortuneModal(true)
      
      // 5秒后关闭
      setTimeout(() => {
        setShowFortuneModal(false)
      }, 5000)
    }, 800)
  }

  const resetMatchingGame = () => {
    setCards(shuffle([...cardSymbols, ...cardSymbols]))
    setOpenedCards([])
    setMatchedCards([])
    setGameLocked(false)
  }

  const onCardClick = (index) => {
    if (gameLocked || openedCards.includes(index) || matchedCards.includes(index)) return

    const nextOpened = [...openedCards, index]
    setOpenedCards(nextOpened)
    if (nextOpened.length < 2) return

    setGameLocked(true)
    const [firstIndex, secondIndex] = nextOpened
    const isMatched = cards[firstIndex] === cards[secondIndex]

    if (isMatched) {
      window.setTimeout(() => {
        setMatchedCards((previous) => [...previous, firstIndex, secondIndex])
        setOpenedCards([])
        setGameLocked(false)
      }, 280)
      return
    }

    window.setTimeout(() => {
      setOpenedCards([])
      setGameLocked(false)
    }, 850)
  }

  const handleMeritClick = () => {
    setMerits((prev) => prev + 1)
    const popupId = Date.now()
    setMeritPopups((prev) => [...prev, { id: popupId, x: Math.random() * 60 + 20 }])
    setTimeout(() => {
      setMeritPopups((prev) => prev.filter((p) => p.id !== popupId))
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-slate-50 to-blue-50">
      {/* 顶部装饰 */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-100/30 to-transparent pointer-events-none" />
      
      <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        {/* 头部 */}
        <section className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 mb-4">
            <Coffee className="w-4 h-4" />
            课间充电站
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            教师伴侣
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            忙里偷闲，给自己一点放松的小确幸。这里没有KPI，也没有待办，只有课间回血和下班前的那口气。
          </p>
        </section>

        {/* 三个主要功能卡片 */}
        <div className="mb-10 grid gap-6 lg:grid-cols-3">
          {/* 呼吸冥想 */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 flex-shrink-0">
                <Wind className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">呼吸冥想</h2>
                <p className="text-sm text-slate-500 mt-1">4-7-8 减压呼吸法</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6">
              <div className="flex flex-col items-center">
                <button
                  onClick={breathing.active ? stopBreathing : startBreathing}
                  className="relative w-32 h-32 flex items-center justify-center group"
                  style={{ transform: `scale(${breathing.scale})` }}
                >
                  {/* 呼吸动画圆环 */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 transition-all duration-1000 ease-in-out group-hover:shadow-lg" />
                  
                  {/* 波纹效果 */}
                  {breathing.active && (
                    <>
                      <div 
                        className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping"
                        style={{ animationDuration: '3s' }}
                      />
                      <div 
                        className="absolute inset-[-8px] rounded-full border border-blue-200 animate-ping"
                        style={{ animationDuration: '4s', animationDelay: '0.5s' }}
                      />
                    </>
                  )}
                  
                  {/* 中心图标 */}
                  <div className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm shadow-inner">
                    {breathing.active ? (
                      <Wind className="w-10 h-10 text-blue-600 animate-pulse" />
                    ) : (
                      <Play className="w-10 h-10 text-blue-600" />
                    )}
                  </div>
                </button>
                
                <div className="mt-6 text-center">
                  <div className="text-lg font-semibold text-slate-900">{breathing.text}</div>
                  <div className="text-sm text-slate-500 mt-2">
                    {breathing.active ? `进行中：第 ${Math.min(breathing.cycle + 1, 6)} / 6 轮` : '点击开始，安静地跟着节奏呼吸'}
                  </div>
                </div>

                <button
                  onClick={breathing.active ? stopBreathing : startBreathing}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  {breathing.active ? (
                    <>
                      <Pause className="w-4 h-4" />
                      暂停练习
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      开始练习
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* 幸运签筒 */}
          <section className="bg-white rounded-3xl border border-slate-100 p-8 shadow-lg shadow-purple-100/50">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">幸运签筒</h2>
              <p className="text-sm text-slate-500 mt-1">获取今日正能量</p>
            </div>

            <div className="flex flex-col items-center">
              {/* 签筒 */}
              <div className="relative mb-6">
                {/* 装饰星星 */}
                <div className="absolute -right-4 -top-2 text-purple-300">
                  <Stars className="w-4 h-4" />
                </div>
                <div className="absolute -right-6 top-4 text-purple-200">
                  <Sparkles className="w-3 h-3" />
                </div>
                <div className="absolute -left-4 top-2 text-pink-200">
                  <Flower2 className="w-3 h-3" />
                </div>
                
                {/* 椭圆形签筒 */}
                <div className="w-32 h-44 bg-gradient-to-b from-purple-100 to-purple-200 rounded-[40px] relative flex items-center justify-center">
                  {/* 签条 */}
                  <div className="absolute w-3 h-32 bg-gradient-to-b from-purple-600 to-purple-800 rounded-full left-10 rotate-[-5deg] shadow-md" />
                  <div className="absolute w-3 h-28 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full left-14 rotate-[3deg] shadow-md" />
                  <div className="absolute w-3 h-30 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full left-18 rotate-[-2deg] shadow-md opacity-70" />
                </div>
              </div>

              {/* 按钮 */}
              <button
                onClick={drawFortune}
                disabled={drawing}
                className="w-full py-3.5 px-8 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-full font-medium shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                点击抽签
              </button>

              {/* 底部英文 */}
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 tracking-wider">
                <RotateCcw className="w-3 h-3" />
              </div>
            </div>
          </section>

          {/* 每日治愈 */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 flex-shrink-0">
                <BookHeart className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">每日治愈</h2>
                <p className="text-sm text-slate-500 mt-1">温暖故事时刻</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <p className="text-sm leading-relaxed text-slate-700 italic">
                  "{currentStory.text}"
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">—— {currentStory.author}</p>
                </div>
              </div>
              
              <button
                onClick={() => setStoryIndex((prev) => (prev + 1) % stories.length)}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                换一篇故事
              </button>
            </div>
          </section>
        </div>

        {/* 小游戏区域 */}
        <section className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">摸鱼小栈</h2>
            <p className="text-sm text-slate-500">无排名、无压力，纯属放松</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* 电子木鱼 */}
            <section className="bg-white rounded-3xl border border-slate-100 p-8 shadow-lg shadow-amber-100/50">
              <div className="flex flex-col items-center">
                {/* 标签 */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 rounded-full mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">电子木鱼</span>
                </div>

                {/* 功德计数 */}
                <div className="text-6xl font-bold text-amber-800 tracking-tight mb-1">
                  {merits}
                </div>
                <div className="text-xs text-slate-400 tracking-widest mb-8">
                  MERIT COUNT
                </div>

                {/* 木鱼 */}
                <div className="relative">
                  <button
                    onClick={handleMeritClick}
                    className="relative w-36 h-36 transition-transform active:scale-95 group"
                  >
                    {/* 木鱼主体 - 仿真实木色 */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 shadow-2xl shadow-amber-900/30 group-hover:shadow-amber-900/40 transition-shadow">
                      {/* 木纹效果 */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-900/20 via-transparent to-amber-600/10" />
                      
                      {/* 顶部凹陷 - 鱼嘴 */}
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6">
                        <div className="w-full h-full bg-gradient-to-b from-amber-950/30 to-transparent rounded-full" />
                      </div>
                      
                      {/* 底部凹陷 */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-6">
                        <div className="w-full h-full bg-gradient-to-t from-amber-950/30 to-transparent rounded-full" />
                      </div>
                      
                      {/* 中间鱼腹 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600/30 to-amber-950/40 shadow-inner" />
                      </div>
                      
                      {/* 高光 */}
                      <div className="absolute top-6 left-6 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-transparent" />
                    </div>
                    
                    {/* 敲击涟漪动画 */}
                    <div className="absolute inset-0 rounded-full border-2 border-amber-400/50 opacity-0 group-active:animate-ping" />
                  </button>

                  {/* 功德提示 */}
                  {meritPopups.map((popup) => (
                    <div
                      key={popup.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${popup.x}%`,
                        top: '20px',
                        animation: 'floatUp 1.2s ease-out forwards',
                      }}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-sm font-bold text-amber-600 whitespace-nowrap">功德 +1</span>
                        <span className="text-xs font-medium text-amber-500 whitespace-nowrap">烦恼 -1</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 底部提示 */}
                <div className="mt-8 text-sm text-slate-500">
                  敲一下，烦恼 -1
                </div>
              </div>
            </section>

            {/* 压力粉碎机 */}
            <section className="bg-white rounded-3xl border border-slate-100 p-8 shadow-lg shadow-rose-100/50">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <div className="w-6 h-6 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">压力粉碎机</h3>
                  <p className="text-sm text-slate-500 mt-1">释放你的情绪，让心灵重获宁静</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* 标签 */}
                <div className="text-sm text-slate-600 font-medium">写下你的烦恼...</div>

                {/* 输入框 */}
                <textarea
                  value={stressInput}
                  onChange={(e) => setStressInput(e.target.value)}
                  placeholder="把负能量写在这里，然后让它消失..."
                  className="w-full h-28 px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-200 transition-all"
                  disabled={shredding}
                />

                {/* 按钮 */}
                <button
                  onClick={handleShredStress}
                  disabled={!stressInput.trim() || shredding}
                  className="w-full py-4 bg-gradient-to-r from-rose-500 to-orange-400 text-white rounded-full font-medium shadow-lg shadow-rose-200 hover:shadow-rose-300 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {shredding ? '粉碎中...' : '立即粉碎'}
                </button>

                {/* 统计 */}
                {shreddedItems.length > 0 && (
                  <div className="flex items-center justify-center gap-2 py-3 bg-slate-50 rounded-full">
                    <div className="w-2 h-2 bg-rose-400 rounded-full" />
                    <span className="text-sm text-slate-600">
                      已粉碎 <span className="font-semibold text-rose-500">{shreddedItems.length}</span> 个烦恼
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* 翻牌配对 */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-center gap-3 mb-5">
                <Puzzle className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-slate-900">翻牌配对</h3>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                {cards.map((card, index) => {
                  const matched = matchedCards.includes(index)
                  const opened = openedCards.includes(index)
                  const Icon = symbolIcons[card]
                  
                  return (
                    <button
                      key={`${card}-${index}`}
                      onClick={() => onCardClick(index)}
                      className={`h-[72px] rounded-lg flex items-center justify-center transition-all ${
                        matched
                          ? 'invisible opacity-0'
                          : opened
                          ? 'bg-purple-100 border-2 border-purple-300'
                          : 'bg-slate-100 border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      {opened || matched ? (
                        <Icon className={`w-6 h-6 ${matched ? 'text-purple-400' : 'text-purple-600'}`} />
                      ) : (
                        <span className="text-2xl text-slate-400">?</span>
                      )}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={resetMatchingGame}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                重新开始
              </button>
            </section>
          </div>
        </section>

        {/* 底部 */}
        <footer className="border-t border-slate-200 pt-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span>放松不是偷懒，是为了更好地出发</span>
          </div>
        </footer>
      </div>

      {/* 幸运签文全屏模态框 */}
      {showFortuneModal && fortune && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowFortuneModal(false)}
        >
          <div 
            className="relative animate-fortune-bloom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 光芒效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 rounded-full blur-3xl opacity-40 animate-pulse scale-150" />
            
            {/* 签文卡片 */}
            <div className="relative bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-4 border-2 border-purple-200">
              <div className="text-center">
                {/* 装饰 */}
                <div className="flex justify-center mb-6">
                  <div className="flex gap-2">
                    <Stars className="w-6 h-6 text-purple-400 animate-pulse" />
                    <Gift className="w-8 h-8 text-purple-600" />
                    <Stars className="w-6 h-6 text-purple-400 animate-pulse" />
                  </div>
                </div>
                
                <div className="text-lg font-bold text-purple-600 mb-6 tracking-wide">
                  {fortune.title}
                </div>
                
                <div className="text-xl text-slate-700 leading-relaxed font-medium">
                  {fortune.content}
                </div>
                
                <div className="mt-8 flex justify-center gap-4">
                  <Flower2 className="w-5 h-5 text-pink-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <Flower2 className="w-5 h-5 text-purple-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <Flower2 className="w-5 h-5 text-pink-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 压力粉碎动画模态框 */}
      {showStressPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden">
          <div className="relative w-full max-w-md mx-4">
            {/* 碎纸机 */}
            <div 
              className={`relative mx-auto ${paperPhase === 'shredding' || paperPhase === 'complete' ? 'animate-shredder-shake' : ''}`}
              style={{ width: '200px', height: '180px' }}
            >
              {/* 碎纸机主体 */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-500 via-slate-600 to-slate-700 rounded-2xl shadow-2xl">
                {/* 顶部区域 */}
                <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-slate-400 to-slate-500 rounded-t-2xl">
                  {/* 碎纸口 */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-36 h-8 bg-slate-800 rounded-lg border-2 border-slate-900 overflow-hidden flex items-center justify-center">
                    {/* 锯齿边缘 */}
                    <div className="flex gap-[3px]">
                      {[...Array(24)].map((_, i) => (
                        <div key={i} className="w-1 h-4 bg-slate-700 rounded-b-sm" style={{ transform: i % 2 === 0 ? 'rotate(10deg)' : 'rotate(-10deg)' }} />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* 指示灯 */}
                <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-lg ${
                  paperPhase === 'shredding' || paperPhase === 'complete' 
                    ? 'bg-green-400 animate-pulse shadow-green-400/50' 
                    : 'bg-red-400 shadow-red-400/50'
                }`} />
                
                {/* 品牌标识 */}
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-xs text-slate-400 font-medium tracking-wider">
                  SHREDDER
                </div>
              </div>
            </div>
            
            {/* 纸张 - 位置跟随阶段变化 */}
            <div 
              className={`absolute left-1/2 -translate-x-1/2 ${
                paperPhase === 'show' ? 'animate-paper-to-slot' : ''
              } ${paperPhase === 'crumple' ? 'animate-paper-crumple-simple' : ''} 
              ${paperPhase === 'drop' ? 'animate-paper-into-slot' : ''}`}
              style={{ width: '280px' }}
            >
              <div className="bg-white rounded-xl shadow-2xl p-6">
                <div className="text-center">
                  <div className="text-base text-slate-700 leading-relaxed font-medium">
                    {stressInput}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 碎纸屑 */}
            <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
              style={{ top: '140px', width: '144px' }}
            >
              {(paperPhase === 'shredding' || paperPhase === 'complete') && (
                <div className="relative overflow-visible">
                  {[...Array(18)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute shredded-${i}`}
                      style={{
                        width: Math.random() * 8 + 5 + 'px',
                        height: Math.random() * 4 + 2 + 'px',
                        background: ['#f43f5e', '#fb923c', '#fbbf24', '#ec4899', '#f472b6'][Math.floor(Math.random() * 5)],
                        borderRadius: '1px',
                        left: '50%',
                        top: '0',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* 状态提示 */}
            {paperPhase === 'shredding' && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 animate-pulse">
                <div className="px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  粉碎中...
                </div>
              </div>
            )}
            
            {paperPhase === 'complete' && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 animate-success-pop">
                <div className="px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  烦恼已粉碎！
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 自定义动画 */}
      <style jsx>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0px); }
          100% { opacity: 0; transform: translateY(-60px); }
        }
        
        @keyframes fortune-bloom {
          0% { opacity: 0; transform: scale(0.3) rotate(-10deg); }
          60% { opacity: 1; transform: scale(1.05) rotate(0deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        
        /* 纸张飘到碎纸口位置 */
        @keyframes paper-to-slot {
          0% { 
            opacity: 0; 
            transform: translate(-50%, -200px) rotate(-20deg) scale(0.6); 
          }
          50% { 
            opacity: 1; 
            transform: translate(-50%, -80px) rotate(10deg) scale(1); 
          }
          75% { 
            transform: translate(-50%, -70px) rotate(-5deg) scale(1); 
          }
          100% { 
            opacity: 1; 
            transform: translate(-50%, -65px) rotate(0deg) scale(1); 
          }
        }
        
        /* 揉纸 - 在碎纸口位置 */
        @keyframes paper-crumple-simple {
          0% { transform: translate(-50%, -65px) scale(1) rotate(0deg); }
          20% { transform: translate(-50%, -60px) scale(0.85) rotate(8deg); }
          40% { transform: translate(-50%, -55px) scale(0.7) rotate(-6deg); }
          60% { transform: translate(-50%, -50px) scale(0.55) rotate(5deg); }
          80% { transform: translate(-50%, -45px) scale(0.4) rotate(-3deg); }
          100% { transform: translate(-50%, -40px) scale(0.35) rotate(0deg); }
        }
        
        /* 进入碎纸口 */
        @keyframes paper-into-slot {
          0% { 
            opacity: 1; 
            transform: translate(-50%, -40px) scale(0.35); 
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -20px) scale(0.2); 
          }
          100% { 
            opacity: 0; 
            transform: translate(-50%, 0px) scale(0.05); 
          }
        }
        
        /* 碎纸机晃动 */
        @keyframes shredder-shake {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-6px) rotate(-1deg); }
          20% { transform: translateX(6px) rotate(1deg); }
          30% { transform: translateX(-6px) rotate(-1deg); }
          40% { transform: translateX(6px) rotate(1deg); }
          50% { transform: translateX(-5px) rotate(-0.5deg); }
          60% { transform: translateX(5px) rotate(0.5deg); }
          70% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          90% { transform: translateX(-2px); }
        }
        
        /* 碎纸屑飘落 */
        .shredded-0 { animation: shred-fall-0 1s ease-out forwards; animation-delay: 0ms; }
        .shredded-1 { animation: shred-fall-1 1s ease-out forwards; animation-delay: 40ms; }
        .shredded-2 { animation: shred-fall-2 1s ease-out forwards; animation-delay: 80ms; }
        .shredded-3 { animation: shred-fall-3 1s ease-out forwards; animation-delay: 20ms; }
        .shredded-4 { animation: shred-fall-4 1s ease-out forwards; animation-delay: 60ms; }
        .shredded-5 { animation: shred-fall-5 1s ease-out forwards; animation-delay: 100ms; }
        .shredded-6 { animation: shred-fall-6 1s ease-out forwards; animation-delay: 30ms; }
        .shredded-7 { animation: shred-fall-7 1s ease-out forwards; animation-delay: 70ms; }
        .shredded-8 { animation: shred-fall-8 1s ease-out forwards; animation-delay: 50ms; }
        .shredded-9 { animation: shred-fall-9 1s ease-out forwards; animation-delay: 90ms; }
        .shredded-10 { animation: shred-fall-10 1s ease-out forwards; animation-delay: 25ms; }
        .shredded-11 { animation: shred-fall-11 1s ease-out forwards; animation-delay: 65ms; }
        .shredded-12 { animation: shred-fall-12 1s ease-out forwards; animation-delay: 45ms; }
        .shredded-13 { animation: shred-fall-13 1s ease-out forwards; animation-delay: 85ms; }
        .shredded-14 { animation: shred-fall-14 1s ease-out forwards; animation-delay: 15ms; }
        .shredded-15 { animation: shred-fall-15 1s ease-out forwards; animation-delay: 55ms; }
        .shredded-16 { animation: shred-fall-16 1s ease-out forwards; animation-delay: 95ms; }
        .shredded-17 { animation: shred-fall-17 1s ease-out forwards; animation-delay: 35ms; }
        
        @keyframes shred-fall-0 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% + 60px), 100px) rotate(180deg); } }
        @keyframes shred-fall-1 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% - 50px), 120px) rotate(-200deg); } }
        @keyframes shred-fall-2 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% + 70px), 80px) rotate(150deg); } }
        @keyframes shred-fall-3 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% - 60px), 110px) rotate(-170deg); } }
        @keyframes shred-fall-4 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% + 40px), 130px) rotate(220deg); } }
        @keyframes shred-fall-5 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% - 70px), 90px) rotate(-140deg); } }
        @keyframes shred-fall-6 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% + 80px), 100px) rotate(190deg); } }
        @keyframes shred-fall-7 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% - 40px), 120px) rotate(-210deg); } }
        @keyframes shred-fall-8 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% + 50px), 110px) rotate(160deg); } }
        @keyframes shred-fall-9 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% - 80px), 100px) rotate(-180deg); } }
        @keyframes shred-fall-10 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% + 30px), 125px) rotate(200deg); } }
        @keyframes shred-fall-11 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% - 55px), 95px) rotate(-160deg); } }
        @keyframes shred-fall-12 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% + 65px), 115px) rotate(170deg); } }
        @keyframes shred-fall-13 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% - 45px), 105px) rotate(-190deg); } }
        @keyframes shred-fall-14 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% + 75px), 90px) rotate(230deg); } }
        @keyframes shred-fall-15 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% - 35px), 130px) rotate(-155deg); } }
        @keyframes shred-fall-16 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% + 55px), 85px) rotate(185deg); } }
        @keyframes shred-fall-17 { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(calc(-50% - 65px), 125px) rotate(-175deg); } }
        
        @keyframes success-pop {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          60% { transform: scale(1.1) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        .animate-fortune-bloom {
          animation: fortune-bloom 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-paper-to-slot {
          animation: paper-to-slot 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .animate-paper-crumple-simple {
          animation: paper-crumple-simple 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .animate-paper-into-slot {
          animation: paper-into-slot 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        
        .animate-shredder-shake {
          animation: shredder-shake 0.6s ease-in-out;
        }
        
        .animate-success-pop {
          animation: success-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  )
}

export default TeacherCompanionPage
