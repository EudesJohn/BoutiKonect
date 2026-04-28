import { createContext } from 'react'

/**
 * Objet Contexte BoutiKonect partagé
 * Isolé dans ce fichier pour éviter les erreurs de Zone Morte Temporaire (TDZ)
 * lors des imports circulaires entre AppContext.jsx et les composants.
 */
export const AppContext = createContext(null)

export default AppContext
