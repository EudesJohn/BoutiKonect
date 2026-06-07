import { useEffect, useRef, useState } from 'react'

/**
 * RevealOnScroll — Déclenche l'apparition d'un élément
 * lorsqu'il entre dans le viewport (IntersectionObserver).
 *
 * Utilisation :
 *   <RevealOnScroll>
 *     <div>Mon contenu qui apparaît au scroll</div>
 *   </RevealOnScroll>
 *   <RevealOnScroll className="reveal-left" threshold={0.2}>
 *     ...
 *   </RevealOnScroll>
 */
export default function RevealOnScroll({
  children,
  className = 'reveal',
  threshold = 0.15,
  rootMargin = '0px 0px -40px 0px',
  as: Tag = 'div',
  ...props
}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Supporting prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return (
    <Tag
      ref={ref}
      className={`${className}${isVisible ? ' visible' : ''}`}
      {...props}
    >
      {children}
    </Tag>
  )
}
