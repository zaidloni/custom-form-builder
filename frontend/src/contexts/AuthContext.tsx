import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface AuthContextValue {
  userEmail: string | null
  login: (email: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'formforge_user_email'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY)
  })

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(STORAGE_KEY, userEmail)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [userEmail])

  const login = (email: string) => {
    setUserEmail(email)
  }

  const logout = () => {
    setUserEmail(null)
  }

  return (
    <AuthContext.Provider
      value={{
        userEmail,
        login,
        logout,
        isAuthenticated: !!userEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

