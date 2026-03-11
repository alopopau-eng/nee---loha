"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User, onAuthStateChanged } from "firebase/auth"
import { auth } from "./firebase"
import { useRouter, usePathname } from "next/navigation"
import { invalidateAllSessions, createSession } from "./firebase-services"

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  logoutAllDevices: () => Promise<void>
  sessionId: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  logoutAllDevices: async () => {},
  sessionId: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user && user.uid) {
        try {
          // Create a new session when user logs in
          const newSessionId = await createSession(user.uid, user.email || "")
          setSessionId(newSessionId)
        } catch (error) {
          console.error("Error creating session:", error)
        }
      } else {
        setSessionId(null)
      }

      setLoading(false)

      // Redirect logic
      if (!user && pathname !== "/login") {
        router.push("/login")
      } else if (user && pathname === "/login") {
        router.push("/")
      }
    })

    return () => unsubscribe()
  }, [router, pathname])

  const logout = async () => {
    try {
      await auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const logoutAllDevices = async () => {
    try {
      if (!user?.uid) throw new Error("User not found")
      
      // Invalidate all sessions for this user
      await invalidateAllSessions(user.uid)
      
      // Sign out current session
      await auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Logout all devices error:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, logoutAllDevices, sessionId }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
