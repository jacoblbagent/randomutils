import { useCallback, useState } from 'react'

// Favorites are remembered by name + size, so re-adding the same file after a reload keeps its star.
// The key is deliberately unchanged from the standalone TS → MP4 app: the GitHub Pages deploy
// shares this origin, so stars saved there still apply here.
const STORAGE_KEY = 'ts-to-mp4:favorites'

export const favoriteKey = (file: File) => `${file.name}|${file.size}`

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set() // private window / blocked storage: favorites just won't persist
  }
}

function persist(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  } catch {
    /* ignore */
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(load)

  const isFavorite = useCallback((file: File) => favorites.has(favoriteKey(file)), [favorites])

  const toggleFavorite = useCallback((file: File) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      const key = favoriteKey(file)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      persist(next)
      return next
    })
  }, [])

  return { isFavorite, toggleFavorite }
}
