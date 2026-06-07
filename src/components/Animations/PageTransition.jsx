import { motion } from 'framer-motion'

/**
 * PageTransition — Wrapper d'entrée/sortie pour chaque page.
 * Utilise Framer Motion pour des transitions fluides "hors norme".
 *
 * Variants disponibles :
 *   - fadeSlide  : fondu + glissement vertical (défaut)
 *   - scale      : zoom + fondu
 *   - tilt       : perspective 3D
 *   - elastic    : rebond élastique
 */
const variants = {
  fadeSlide: {
    initial: { opacity: 0, y: 24 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1], // ease-out personnalisé
        staggerChildren: 0.06,
      },
    },
    exit: {
      opacity: 0,
      y: -12,
      transition: { duration: 0.25, ease: 'easeIn' },
    },
  },
  scale: {
    initial: { opacity: 0, scale: 0.94 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.25, ease: 'easeIn' },
    },
  },
  tilt: {
    initial: { opacity: 0, rotateX: -8, y: 30, perspective: 800 },
    animate: {
      opacity: 1,
      rotateX: 0,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      rotateX: 5,
      y: -15,
      transition: { duration: 0.25, ease: 'easeIn' },
    },
  },
  elastic: {
    initial: { opacity: 0, y: 50, scale: 0.95 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1], // bounce out
      },
    },
    exit: {
      opacity: 0,
      scale: 0.93,
      y: -20,
      transition: { duration: 0.2, ease: 'easeIn' },
    },
  },
}

const defaultVariants = 'fadeSlide'

export default function PageTransition({ children, variant, className, style, ...props }) {
  const selectedVariant = variants[variant] || variants[defaultVariants]

  return (
    <motion.div
      variants={selectedVariant}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      style={{ transformOrigin: 'center center', ...style }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
