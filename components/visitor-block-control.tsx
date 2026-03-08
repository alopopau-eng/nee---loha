"use client"

import { useEffect, useState } from "react"

const Button = ({ children, onClick, disabled, variant, className, ...props }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      variant === "outline"
        ? "border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700"
        : variant === "destructive"
        ? "bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400"
        : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
    } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className || ""}`}
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
  const [isRedirecting, setIsRedirecting] = useState(false)

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [customPageTitle, setCustomPageTitle] = useState("")
  const [customPageText, setCustomPageText] = useState("")

  const [draftCustomPageTitle, setDraftCustomPageTitle] = useState("")
  const [draftCustomPageText, setDraftCustomPageText] = useState("")

  useEffect(() => {
    setCustomPageTitle(visitor.customPageTitle || "")
    setCustomPageText(visitor.customPageText || "")
  }, [visitor.id, visitor.customPageTitle, visitor.customPageText])

  const handleOpenDialog = () => {
    setDraftCustomPageTitle(customPageTitle)
    setDraftCustomPageText(customPageText)
    setIsDialogOpen(true)
  }

  const handleSaveCustomContent = async () => {
    if (!visitor.id) return

    setIsSavingContent(true)

    try {
      const now = new Date().toISOString()
      const nextTitle = draftCustomPageTitle.trim()
      const nextText = draftCustomPageText.trim()

      await updateApplication(visitor.id, {
        customPageTitle: nextTitle,
        customPageText: nextText,
        customPageUpdatedAt: now,
      })

      setCustomPageTitle(nextTitle)
      setCustomPageText(nextText)
      setIsDialogOpen(false)

      alert("تم حفظ المحتوى المخصص بنجاح")
    } catch (error) {
      console.error(error)
      alert("حدث خطأ أثناء حفظ المحتوى")
    } finally {
      setIsSavingContent(false)
    }
  }

  const handleRedirectToCustomPage = async () => {
    if (!visitor.id) return

    setIsRedirecting(true)

    try {
      const now = new Date().toISOString()

      await updateApplication(visitor.id, {
        redirectPage: "blocked",
        redirectRequestedAt: now,
        customPageTitle: customPageTitle.trim(),
        customPageText: customPageText.trim(),
        customPageUpdatedAt: now,
      })

      alert("تم توجيه الزائر للصفحة المخصصة")
    } catch (error) {
      console.error(error)
      alert("حدث خطأ أثناء التوجيه")
    } finally {
      setIsRedirecting(false)
    }
  }

  const handleToggleBlock = async () => {
    if (!visitor.id) return

    const confirmMessage = visitor.isBlocked
      ? "هل أنت متأكد من إلغاء الحظر؟"
      : "هل أنت متأكد من حظر هذا الزائر؟"

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

      alert(visitor.isBlocked ? "تم إلغاء الحظر" : "تم حظر الزائر")
    } catch (error) {
      console.error(error)
      alert("حدث خطأ أثناء التحديث")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        حظر الزائر والمحتوى المخصص
      </h3>

      <div className="grid grid-cols-1 gap-2 mb-4 md:grid-cols-2">
        <Button onClick={handleOpenDialog} variant="outline" className="w-full">
          تخصيص محتوى الصفحة
        </Button>

        <Button
          onClick={handleRedirectToCustomPage}
          disabled={isRedirecting}
          variant="outline"
          className="w-full border-blue-300 text-blue-700 hover:border-blue-400"
        >
          {isRedirecting ? "جاري التوجيه..." : "توجيه للصفحة المخصصة"}
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
            هذا الزائر محظور حالياً
          </p>
        </div>
      )}

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="border-b px-4 py-3">
              <h4 className="text-sm font-semibold">
                تعديل المحتوى المخصص
              </h4>
            </div>

            <div className="space-y-3 p-4">
              <input
                value={draftCustomPageTitle}
                onChange={(e) => setDraftCustomPageTitle(e.target.value)}
                placeholder="عنوان الصفحة"
                className="w-full border rounded-lg px-3 py-2"
              />

              <textarea
                value={draftCustomPageText}
                onChange={(e) => setDraftCustomPageText(e.target.value)}
                rows={5}
                placeholder="نص الصفحة"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex gap-2 border-t px-4 py-3">
              <Button
                onClick={handleSaveCustomContent}
                disabled={isSavingContent}
                className="flex-1"
              >
                {isSavingContent ? "جاري الحفظ..." : "حفظ"}
              </Button>

              <Button
                onClick={() => setIsDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}