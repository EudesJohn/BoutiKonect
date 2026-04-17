import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './TopBarLoader.css'

export default function TopBarLoader() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const location = useLocation()

  useEffect(() => {
    // Déclencher le chargement au changement de route
    setLoading(true)
    setProgress(30)

    const timer = setTimeout(() => {
      setProgress(100)
    }, 200)

    const finishTimer = setTimeout(() => {
      setLoading(false)
      setTimeout(() => setProgress(0), 200)
    }, 600)

    return () => {
      clearTimeout(timer)
      clearTimeout(finishTimer)
    }
  }, [location.pathname, location.search])

  if (!loading && progress === 0) return null

  return (
    <div className="top-bar-loader">
      <div 
        className="loader-progress" 
        style={{ 
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1
        }} 
      />
    </div>
  )
}
