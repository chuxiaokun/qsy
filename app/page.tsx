"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Droplets, Grid3X3, User } from "lucide-react"
import WatermarkRemover from "@/components/watermark-remover"
import MoreProducts from "@/components/more-products"
import ProfileCenter from "@/components/profile-center"

const tabs = [
  { id: "remove", label: "去水印", icon: Droplets },
  { id: "products", label: "更多产品", icon: Grid3X3 },
  { id: "profile", label: "个人中心", icon: User },
]

export default function MiniApp() {
  const [activeTab, setActiveTab] = useState("remove")

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-32 right-1/4 w-48 h-48 rounded-full bg-primary/5 blur-2xl" />
      </div>

      {/* 主内容区域 */}
      <main className="relative z-10 pb-24 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full"
          >
            {activeTab === "remove" && <WatermarkRemover />}
            {activeTab === "products" && <MoreProducts />}
            {activeTab === "profile" && <ProfileCenter />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 底部 Tab 栏 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-4 mb-4">
          <div className="glass-strong rounded-2xl shadow-soft px-2 py-2">
            <div className="flex items-center justify-around">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                const Icon = tab.icon
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary/10 rounded-xl"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <motion.div
                      animate={{ 
                        scale: isActive ? 1.1 : 1,
                        y: isActive ? -2 : 0
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <Icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
                    </motion.div>
                    <motion.span 
                      className="text-xs mt-1 font-medium relative z-10"
                      animate={{ 
                        opacity: isActive ? 1 : 0.7,
                        fontWeight: isActive ? 600 : 500
                      }}
                    >
                      {tab.label}
                    </motion.span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}
