"use client"

import { motion } from "framer-motion"
import { 
  Wand2, 
  ImagePlus, 
  FileText, 
  QrCode, 
  Palette, 
  Scissors,
  ArrowRight,
  Star,
  Zap
} from "lucide-react"

const products = [
  {
    id: "ai-enhance",
    name: "AI 图片增强",
    description: "智能提升画质，让模糊图片焕然一新",
    icon: Wand2,
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-500/10",
    badge: "热门",
    badgeColor: "bg-rose-500",
  },
  {
    id: "bg-remove",
    name: "智能抠图",
    description: "一键去除背景，精准边缘识别",
    icon: Scissors,
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-500/10",
    badge: "新品",
    badgeColor: "bg-primary",
  },
  {
    id: "image-compress",
    name: "图片压缩",
    description: "无损压缩图片，减少文件大小",
    icon: ImagePlus,
    color: "from-sky-500 to-blue-500",
    bgColor: "bg-sky-500/10",
  },
  {
    id: "pdf-tools",
    name: "PDF 工具箱",
    description: "PDF 转换、合并、拆分一站式服务",
    icon: FileText,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "qr-generator",
    name: "二维码生成",
    description: "创建精美二维码，支持自定义样式",
    icon: QrCode,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "color-picker",
    name: "配色方案",
    description: "AI 推荐配色，设计灵感助手",
    icon: Palette,
    color: "from-indigo-500 to-violet-500",
    bgColor: "bg-indigo-500/10",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function MoreProducts() {
  return (
    <div className="px-4 pb-4">
      {/* 顶部标题 */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">更多产品</h1>
        <p className="text-sm text-muted-foreground">发现更多实用工具</p>
      </motion.div>

      {/* 推荐横幅 */}
      <motion.div
        className="relative overflow-hidden rounded-2xl gradient-bg p-5 mb-6 shadow-glow"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span className="text-xs font-medium text-white/80">限时特惠</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">会员尊享全部功能</h3>
          <p className="text-sm text-white/70 mb-3">解锁所有高级工具，无限次使用</p>
          <motion.button
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-primary text-sm font-semibold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            立即开通
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
        <motion.div 
          className="absolute bottom-2 right-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Star className="w-12 h-12 text-yellow-300/30" fill="currentColor" />
        </motion.div>
      </motion.div>

      {/* 产品列表 */}
      <motion.div
        className="grid grid-cols-1 gap-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {products.map((product) => {
          const Icon = product.icon
          return (
            <motion.div
              key={product.id}
              variants={item}
              className="glass rounded-2xl p-4 shadow-soft cursor-pointer group"
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-4">
                <motion.div 
                  className={`w-12 h-12 rounded-xl ${product.bgColor} flex items-center justify-center shrink-0`}
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <div className={`bg-gradient-to-br ${product.color} p-2 rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-base font-semibold text-foreground">{product.name}</h3>
                    {product.badge && (
                      <span className={`px-2 py-0.5 ${product.badgeColor} text-white text-[10px] font-medium rounded-full`}>
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{product.description}</p>
                </div>
                <motion.div
                  className="text-muted-foreground group-hover:text-primary transition-colors"
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* 底部提示 */}
      <motion.p 
        className="text-center text-xs text-muted-foreground mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        更多工具持续上线中...
      </motion.p>
    </div>
  )
}
