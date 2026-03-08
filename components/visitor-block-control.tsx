"use client"

import { useEffect, useState } from "react"
// Simple button component
const Button = ({ children, onClick, disabled, variant, className, ...props }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      variant === 'outline' 
        ? 'border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700'
        : variant === 'destructive'
        ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400'
        : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
    } ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className || ''}`}
    {...props}
  >
    {children}
  </button>
)
import type { InsuranceApplication } from "@/lib/firestore-types"
import { updateApplication } from "@/lib/firebase-services"

interface VisitorBlockControlProps {
  visitor: InsuranceApplication
}

export function VisitorBlockControl({ visitor }: VisitorBlockControlProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSavingContent, setIsSavingContent] = useState(false)
  const [customPageTitle, setCustomPageTitle] = useState("")
  const [customPageText, setCustomPageText] = useState("")

  useEffect(() => {
    setCustomPageTitle(visitor.customPageTitle || "")
    setCustomPageText(visitor.customPageText || "")
  }, [visitor.id, visitor.customPageTitle, visitor.customPageText])

  const handleSaveCustomContent = async () => {
    if (!visitor.id) return

    setIsSavingContent(true)

    try {
      const now = new Date().toISOString()
      await updateApplication(visitor.id, {
        customPageTitle: customPageTitle.trim(),
        customPageText: customPageText.trim(),
        customPageUpdatedAt: now,
      })

      alert("تم حفظ المحتوى المخصص بنجاح")
    } catch (error) {
      console.error("Error saving custom page content:", error)
      alert("حدث خطأ أثناء حفظ المحتوى المخصص")
    } finally {
      setIsSavingContent(false)
    }
  }
  
  const handleToggleBlock = async () => {
    if (!visitor.id) return
    
    const confirmMessage = visitor.isBlocked
      ? "هل أنت متأكد من إلغاء حظر هذا الزائر?"
      : "هل أنت متأكد من حظر هذا الزائر؟ لن يتمكن من الوصول إلى الخدمة."
    
    if (!confirm(confirmMessage)) return
    
    setIsProcessing(true)
    
    try {
      const nextBlockedState = !visitor.isBlocked
      const now = new Date().toISOString()

      const updates: Partial<InsuranceApplication> = {
        isBlocked: nextBlockedState,
        blockedUpdatedAt: now,
      }

      if (nextBlockedState) {
        updates.redirectPage = "blocked"
        updates.redirectRequestedAt = now
        updates.customPageTitle = customPageTitle.trim()
        updates.customPageText = customPageText.trim()
        updates.customPageUpdatedAt = now
      }

      await updateApplication(visitor.id, updates)
      
      alert(visitor.isBlocked ? "تم إلغاء الحظر بنجاح" : "تم الحظر بنجاح")
    } catch (error) {
      console.error("Error toggling block:", error)
      alert("حدث خطأ أثناء تحديث حالة الحظر")
    } finally {
      setIsProcessing(false)
    }
  }
  
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">حظر الزائر والمحتوى المخصص</h3>

      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">عنوان الصفحة المخصصة</label>
          <input
            type="text"
            value={customPageTitle}
            onChange={(e) => setCustomPageTitle(e.target.value)}
            placeholder="مثال: تم إيقاف الخدمة مؤقتاً"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">نص الصفحة المخصصة</label>
          <textarea
            value={customPageText}
            onChange={(e) => setCustomPageText(e.target.value)}
            placeholder="أدخل النص الذي سيظهر للزائر عند الحظر..."
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button
          onClick={handleSaveCustomContent}
          disabled={isSavingContent}
          variant="outline"
          className="w-full"
        >
          {isSavingContent ? "جاري الحفظ..." : "حفظ المحتوى المخصص"}
        </Button>
      </div>

      <Button
        onClick={handleToggleBlock}
        disabled={isProcessing}
        variant={visitor.isBlocked ? "default" : "destructive"}
        className="w-full"
      >
        {isProcessing
          ? "جاري التحديث..."
          : visitor.isBlocked
          ? "إلغاء الحظر"
          : "حظر الزائر"}
      </Button>
      
      {visitor.isBlocked && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2">
          <p className="text-xs text-red-700 text-center">
            هذا الزائر محظور حالياً ولا يمكنه الوصول إلى الخدمة
          </p>
          {(visitor.customPageTitle || visitor.customPageText) && (
            <div className="mt-2 text-xs text-red-700">
              {visitor.customPageTitle && (
                <p>
                  <span className="font-semibold">العنوان:</span> {visitor.customPageTitle}
                </p>
              )}
              {visitor.customPageText && (
                <p className="mt-1 whitespace-pre-wrap">
                  <span className="font-semibold">النص:</span> {visitor.customPageText}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
