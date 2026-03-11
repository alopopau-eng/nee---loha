"use client"

import { useEffect, useState } from "react"
import { Smartphone, Monitor, Tablet, Trash2, LogOut } from "lucide-react"
import { getUserSessions, logoutFromDevice } from "@/lib/firebase-services"
import { toast } from "sonner"

interface Session {
  id: string
  sessionId: string
  email: string
  createdAt: any
  isActive: boolean
  userId: string
}

interface ConnectedDevicesProps {
  userId: string
  currentSessionId: string | null
}

export function ConnectedDevices({ userId, currentSessionId }: ConnectedDevicesProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadSessions()
    // Refresh every 30 seconds
    const interval = setInterval(loadSessions, 30000)
    return () => clearInterval(interval)
  }, [userId])

  const loadSessions = async () => {
    try {
      const data = await getUserSessions(userId)
      setSessions(data)
    } catch (error) {
      console.error("Error loading sessions:", error)
      toast.error("فشل تحميل الأجهزة المتصلة")
    } finally {
      setLoading(false)
    }
  }

  const handleLogoutDevice = async (sessionId: string) => {
    if (sessionId === currentSessionId) {
      toast.error("لا يمكنك تسجيل الخروج من الجهاز الحالي من هنا")
      return
    }

    if (!confirm("هل أنت متأكد من رغبتك في تسجيل الخروج من هذا الجهاز؟")) {
      return
    }

    setDeletingId(sessionId)
    try {
      await logoutFromDevice(sessionId)
      await loadSessions()
      toast.success("تم تسجيل الخروج من الجهاز")
    } catch (error) {
      console.error("Error logging out device:", error)
      toast.error("فشل تسجيل الخروج من الجهاز")
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "توقيت غير معروف"
    const date = timestamp.toDate?.() || new Date(timestamp)
    return date.toLocaleString("ar-SA")
  }

  const getDeviceIcon = (index: number) => {
    const icons = [Monitor, Smartphone, Tablet]
    const Icon = icons[index % icons.length]
    return <Icon className="w-5 h-5" />
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">جاري تحميل الأجهزة...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Monitor className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>لا توجد أجهزة متصلة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, index) => (
            <div
              key={session.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-blue-600">
                  {getDeviceIcon(index)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">جهاز {index + 1}</p>
                    {session.sessionId === currentSessionId && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        الجهاز الحالي
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDate(session.createdAt)}
                  </p>
                </div>
              </div>
              {session.sessionId !== currentSessionId && (
                <button
                  onClick={() => handleLogoutDevice(session.sessionId)}
                  disabled={deletingId === session.sessionId}
                  className="ml-2 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500 text-center mt-4 pt-4 border-t border-gray-200">
        <p>إجمالي الأجهزة المتصلة: {sessions.length}</p>
      </div>
    </div>
  )
}
