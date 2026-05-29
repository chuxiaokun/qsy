"use client"

import { motion } from "framer-motion"
import { 
  Crown, 
  Settings, 
  Bell, 
  HelpCircle, 
  MessageSquare, 
  Shield, 
  FileText,
  ChevronRight,
  History,
  Star,
  Gift
} from "lucide-react"

const menuItems = [
  {
    id: "history",
    name: "处理记录",
    icon: History,
    description: "查看历史记录",
  },
  {
    id: "favorites",
    name: "我的收藏",
    icon: Star,
    description: "收藏的内容",
    badge: "3",
  },
  {
    id: "notifications",
    name: "消息通知",
    icon: Bell,
    description: "系统消息",
    badge: "2",
    badgeColor: "bg-rose-500",
  },
  {
    id: "invite",
    name: "邀请好友",
    icon: Gift,
    description: "邀请得会员",
  },
]

const settingsItems = [
  {
    id: "settings",
    name: "设置",
    icon: Settings,
  },
  {
    id: "help",
    name: "帮助中心",
    icon: HelpCircle,
  },
  {
    id: "feedback",
    name: "意见反馈",
    icon: MessageSquare,
  },
  {
    id: "privacy",
    name: "隐私政策",
    icon: Shield,
  },
  {
    id: "terms",
    name: "用户协议",
    icon: FileText,
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
}

export default function ProfileCenter() {
  return (
    <div className="px-4 pt-12 pb-4">
      {/* 用户信息卡片 */}
      <motion.div
        className="glass rounded-3xl p-5 mb-6 shadow-soft"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          {/* 头像 */}
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white text-xl font-bold shadow-glow">
              U
            </div>
            <motion.div 
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-3 h-3 text-white" />
            </motion.div>
          </motion.div>
          
          {/* 用户信息 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">用户昵称</h2>
              <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-white text-[10px] font-medium rounded-full">
                VIP
              </span>
            </div>
            <p className="text-sm text-muted-foreground">ID: 88888888</p>
          </div>
          
          {/* 编辑按钮 */}
          <motion.button
            className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>

        {/* 会员信息 */}
        <motion.div 
          className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200/50 dark:border-amber-700/30"
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">年度会员</span>
              </div>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70">有效期至 2025年12月31日</p>
            </div>
            <motion.button
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-white text-sm font-medium rounded-xl shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              续费
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* 使用统计 */}
      <motion.div
        className="glass rounded-2xl p-4 mb-6 shadow-soft"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "处理次数", value: "1,286" },
            { label: "节省时间", value: "42h" },
            { label: "连续使用", value: "15天" },
          ].map((stat, index) => (
            <motion.div 
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 功能菜单 */}
      <motion.div
        className="glass rounded-2xl overflow-hidden shadow-soft mb-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {menuItems.map((menuItem, index) => {
          const Icon = menuItem.icon
          return (
            <motion.div
              key={menuItem.id}
              variants={item}
              className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-secondary/30 transition-colors ${
                index !== menuItems.length - 1 ? "border-b border-border" : ""
              }`}
              whileTap={{ scale: 0.99 }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground">{menuItem.name}</h3>
                {menuItem.description && (
                  <p className="text-xs text-muted-foreground">{menuItem.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {menuItem.badge && (
                  <span className={`px-2 py-0.5 ${menuItem.badgeColor || "bg-primary"} text-white text-[10px] font-medium rounded-full`}>
                    {menuItem.badge}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* 设置菜单 */}
      <motion.div
        className="glass rounded-2xl overflow-hidden shadow-soft"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {settingsItems.map((settingsItem, index) => {
          const Icon = settingsItem.icon
          return (
            <motion.div
              key={settingsItem.id}
              variants={item}
              className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-secondary/30 transition-colors ${
                index !== settingsItems.length - 1 ? "border-b border-border" : ""
              }`}
              whileTap={{ scale: 0.99 }}
            >
              <Icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-sm text-foreground">{settingsItem.name}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          )
        })}
      </motion.div>

      {/* 版本信息 */}
      <motion.p 
        className="text-center text-xs text-muted-foreground mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        版本 1.0.0
      </motion.p>
    </div>
  )
}
