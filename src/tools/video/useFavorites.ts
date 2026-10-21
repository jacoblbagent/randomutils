import { useCallback, useState } from 'react'

// Favorites are remembered by name + size, so re-adding the same file after a reload keeps its star.
// The namespace is the tool id, so each converter keeps its own list; for ts-to-mp4 the key is
// deliberately unchanged from the standalone TS → MP4 app, whose deploy shared this origin — stars
// saved there still apply here.
export const favoriteKey = (file: File) => `${file.name}|${file.size}`

function load(namespace: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${namespace}:favorites`)
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set() // private window / blocked storage: favorites just won't persist
  }
}

function persist(namespace: string, set: Set<string>) {
  try {
    localStorage.setItem(`${namespace}:favorites`, JSON.stringify([...set]))
  } catch {
    /* ignore */
  }
}

export function useFavorites(namespace: string) {
  const [favorites, setFavorites] = useState<Set<string>>(() => load(namespace))

  const isFavorite = useCallback((file: File) => favorites.has(favoriteKey(file)), [favorites])

  const toggleFavorite = useCallback(
    (file: File) => {
      setFavorites((prev) => {
        const next = new Set(prev)
        const key = favoriteKey(file)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        persist(namespace, next)
        return next
      })
    },
    [namespace],
  )

  return { isFavorite, toggleFavorite }
}