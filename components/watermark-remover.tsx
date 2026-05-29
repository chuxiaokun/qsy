"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Image, 
  Video, 
  Link2, 
  Upload, 
  Sparkles, 
  CheckCircle2,
  ArrowRight,
  Camera,
  FileVideo,
  X
} from "lucide-react"

const platforms = [
  { id: "douyin", name: "抖音", color: "from-pink-500 to-rose-500" },
  { id: "kuaishou", name: "快手", color: "from-orange-500 to-amber-500" },
  { id: "xiaohongshu", name: "小红书", color: "from-red-500 to-pink-500" },
  { id: "weibo", name: "微博", color: "from-amber-500 to-yellow-500" },
  { id: "bilibili", name: "B站", color: "from-sky-500 to-cyan-500" },
  { id: "weishi", name: "微视", color: "from-emerald-500 to-teal-500" },
]

export default function WatermarkRemover() {
  const [activeMode, setActiveMode] = useState<"link" | "image" | "video">("link")
  const [linkInput, setLinkInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleProcess = useCallback(() => {
    if (!linkInput.trim()) return
    setIsProcessing(true)
    setTimeout(() => setIsProcessing(false), 2000)
  }, [linkInput])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // 处理文件上传逻辑
  }, [])

  return (
    <div className="px-4 pt-12 pb-4">
      {/* 顶部标题 */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <motion.div 
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-bg shadow-glow mb-4"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground mb-2">去水印</h1>
        <p className="text-sm text-muted-foreground">一键去除图片和视频水印</p>
      </motion.div>

      {/* 模式切换 */}
      <motion.div 
        className="glass rounded-2xl p-1.5 mb-6 shadow-soft"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex">
          {[
            { id: "link", label: "链接解析", icon: Link2 },
            { id: "image", label: "图片", icon: Image },
            { id: "video", label: "视频", icon: Video },
          ].map((mode) => {
            const Icon = mode.icon
            const isActive = activeMode === mode.id
            return (
              <motion.button
                key={mode.id}
                onClick={() => setActiveMode(mode.id as typeof activeMode)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="modeIndicator"
                    className="absolute inset-0 gradient-bg rounded-xl shadow-soft"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{mode.label}</span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* 内容区域 */}
      <AnimatePresence mode="wait">
        {activeMode === "link" && (
          <motion.div
            key="link"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            {/* 链接输入框 */}
            <div className="glass rounded-2xl p-4 mb-4 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="粘贴视频/图片链接..."
                    className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  {linkInput && (
                    <button 
                      onClick={() => setLinkInput("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <motion.button
                  onClick={handleProcess}
                  disabled={!linkInput.trim() || isProcessing}
                  className="flex items-center justify-center w-12 h-12 rounded-xl gradient-bg text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                >
                  {isProcessing ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* 支持的平台 */}
            <motion.div 
              className="glass rounded-2xl p-4 shadow-soft"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-sm font-medium text-muted-foreground mb-3">支持的平台</h3>
              <div className="grid grid-cols-3 gap-2">
                {platforms.map((platform, index) => (
                  <motion.div
                    key={platform.id}
                    className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${platform.color}`} />
                    <span className="text-xs font-medium text-foreground">{platform.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {(activeMode === "image" || activeMode === "video") && (
          <motion.div
            key={activeMode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* 上传区域 */}
            <motion.div
              className={`glass rounded-2xl p-8 shadow-soft border-2 border-dashed transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex flex-col items-center text-center">
                <motion.div 
                  className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {activeMode === "image" ? (
                    <Camera className="w-8 h-8 text-primary" />
                  ) : (
                    <FileVideo className="w-8 h-8 text-primary" />
                  )}
                </motion.div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {activeMode === "image" ? "上传图片" : "上传视频"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  拖拽文件到这里，或点击选择
                </p>
                <motion.button
                  className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-bg text-white text-sm font-medium shadow-soft"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Upload className="w-4 h-4" />
                  选择文件
                </motion.button>
              </div>
            </motion.div>

            {/* 提示信息 */}
            <motion.div 
              className="mt-4 p-4 glass rounded-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground font-medium">智能识别水印</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    支持 {activeMode === "image" ? "JPG、PNG、WebP" : "MP4、MOV、AVI"} 格式，最大 {activeMode === "image" ? "20MB" : "200MB"}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 使用统计 */}
      <motion.div 
        className="mt-6 flex items-center justify-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">128.5K</p>
          <p className="text-xs text-muted-foreground">今日处理</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">99.8%</p>
          <p className="text-xs text-muted-foreground">成功率</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{"<"}3s</p>
          <p className="text-xs text-muted-foreground">平均耗时</p>
        </div>
      </motion.div>
    </div>
  )
}
