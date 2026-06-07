import { useState, useCallback, useEffect } from 'react'

/**
 * Custom hook for authentication with brute force protection
 * Manages login attempts and rate limiting
 */
export const useAuth = () => {
  // Track login attempts per IP/identifier
  const [loginAttempts, setLoginAttempts] = useState(() => {
    const saved = localStorage.getItem('BoutiKonect_login_attempts')
    return saved ? JSON.parse(saved) : []
  })
  
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutEndTime, setLockoutEndTime] = useState(null)
  
  // Constants for rate limiting
  const MAX_ATTEMPTS = 5
  const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds
  
  // Save attempts to localStorage
  useEffect(() => {
    localStorage.setItem('BoutiKonect_login_attempts', JSON.stringify(loginAttempts))
  }, [loginAttempts])
  
  // Check if user is currently locked out
  useEffect(() => {
    const now = Date.now()
    const validAttempts = loginAttempts.filter(
      attempt => now - attempt.timestamp < LOCKOUT_DURATION
    )
    
    if (validAttempts.length >= MAX_ATTEMPTS) {
      setIsLocked(true)
      // Find the oldest attempt to calculate when lockout ends
      const oldestAttempt = validAttempts[0]
      setLockoutEndTime(oldestAttempt.timestamp + LOCKOUT_DURATION)
    } else {
      setIsLocked(false)
      setLockoutEndTime(null)
    }
    
    // Clean up old attempts
    if (validAttempts.length !== loginAttempts.length) {
      setLoginAttempts(validAttempts)
    }
  }, [loginAttempts])
  
  /**
   * Record a failed login attempt
   */
  const recordFailedAttempt = useCallback((identifier) => {
    const attempt = {
      identifier, // Could be email or IP
      timestamp: Date.now()
    }
    setLoginAttempts(prev => [...prev, attempt])
  }, [])
  
  /**
   * Clear all login attempts (on successful login)
   */
  const clearAttempts = useCallback(() => {
    setLoginAttempts([])
    setIsLocked(false)
    setLockoutEndTime(null)
  }, [])
  
  /**
   * Check if user is currently locked out
   * @returns {object} - Object with isLocked boolean and remaining time in seconds
   */
  const checkLockoutStatus = useCallback(() => {
    if (!isLocked || !lockoutEndTime) {
      return { isLocked: false, remainingSeconds: 0 }
    }
    
    const remaining = Math.max(0, Math.ceil((lockoutEndTime - Date.now()) / 1000))
    return { 
      isLocked: remaining > 0, 
      remainingSeconds: remaining 
    }
  }, [isLocked, lockoutEndTime])
  
  /**
   * Get remaining attempts before lockout
   */
  const getRemainingAttempts = useCallback(() => {
    const now = Date.now()
    const validAttempts = loginAttempts.filter(
      attempt => now - attempt.timestamp < LOCKOUT_DURATION
    )
    return Math.max(0, MAX_ATTEMPTS - validAttempts.length)
  }, [loginAttempts, LOCKOUT_DURATION])
  
  return {
    isLocked,
    lockoutEndTime,
    loginAttempts,
    recordFailedAttempt,
    clearAttempts,
    checkLockoutStatus,
    getRemainingAttempts,
    maxAttempts: MAX_ATTEMPTS
  }
}

export default useAuth
