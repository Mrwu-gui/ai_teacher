import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Grid, Clock, User, GitBranch, HeartHandshake } from 'lucide-react'

const Layout = ({ children }) => {
  const navItems = [
    { to: '/', icon: Home, label: '首页', end: true },
    { to: '/tools', icon: Grid, label: '工具库' },
    { to: '/workflows', icon: GitBranch, label: '工作流' },
    { to: '/history', icon: Clock, label: '历史' },
    { to: '/companion', icon: HeartHandshake, label: '教师伴侣' },
    { to: '/profile', icon: User, label: '我的' }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="hidden md:block border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Grid size={20} />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">AI备课工作台</div>
              <div className="text-sm text-slate-500">教学工作台</div>
            </div>
          </NavLink>

          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>
      </header>

      {/* 移动端底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white px-2 py-1.5 safe-bottom md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                    {isActive && (
                      <div className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <span className="text-xs">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* 主内容区 */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}

export default Layout
