/**
 * Hook personnalisé pour optimiser la recherche de produits
 * - Debounce pour éviter les recherches excessives
 * - Cache des résultats
 * - Index de recherche optimisé
 */

import { useState, useMemo, useCallback, useEffect } from 'react'

// Debounce hook
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Cache pour les résultats de recherche
const searchCache = new Map()
const CACHE_MAX_SIZE = 100
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCacheKey(filters, productsLength) {
  return `${filters.city}-${filters.neighborhood}-${filters.category}-${filters.priceMin}-${filters.priceMax}-${filters.search}-${productsLength}`
}

function getCachedResults(cacheKey) {
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.results
  }
  return null
}

function setCachedResults(cacheKey, results) {
  // Nettoyer le cache si trop grand
  if (searchCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = searchCache.keys().next().value
    searchCache.delete(oldestKey)
  }
  searchCache.set(cacheKey, { results, timestamp: Date.now() })
}

// Index de recherche pour optimisation
function buildSearchIndex(products) {
  const index = new Map()
  
  products.forEach((product, idx) => {
    const searchableText = [
      product.title,
      product.description,
      product.sellerName,
      product.sellerCity,
      product.sellerNeighborhood,
      product.category
    ].filter(Boolean).join(' ').toLowerCase()
    
    index.set(product.id, {
      product,
      searchableText,
      titleWords: new Set(product.title?.toLowerCase().split(/\s+/) || [])
    })
  })
  
  return index
}

// Hook principal pour la recherche optimisée
export function useProductSearch(products, filters) {
  const [searchIndex, setSearchIndex] = useState(() => buildSearchIndex(products))
  
  // Rebuild index when products change
  useEffect(() => {
    setSearchIndex(buildSearchIndex(products))
  }, [products])
  
  // Debounce the search filter
  const debouncedSearch = useDebounce(filters.search, 300)
  const debouncedFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch
  }), [filters, debouncedSearch])

  const getFilteredProducts = useCallback(() => {
    const cacheKey = getCacheKey(debouncedFilters, products.length)
    
    // Check cache first
    const cachedResults = getCachedResults(cacheKey)
    if (cachedResults) {
      return cachedResults
    }

    // Build index if not exists
    if (searchIndex.size !== products.length) {
      setSearchIndex(buildSearchIndex(products))
    }

    // Filter products using index for faster search
    let results = products

    // Apply city filter
    if (debouncedFilters.city) {
      results = results.filter(p => p.sellerCity === debouncedFilters.city)
    }

    // Apply neighborhood filter
    if (debouncedFilters.neighborhood) {
      results = results.filter(p => p.sellerNeighborhood === debouncedFilters.neighborhood)
    }

    // Apply category filter
    if (debouncedFilters.category) {
      results = results.filter(p => p.category === debouncedFilters.category)
    }

    // Apply price filters
    if (debouncedFilters.priceMin) {
      const minPrice = parseInt(debouncedFilters.priceMin)
      results = results.filter(p => p.price >= minPrice)
    }

    if (debouncedFilters.priceMax) {
      const maxPrice = parseInt(debouncedFilters.priceMax)
      results = results.filter(p => p.price <= maxPrice)
    }

    // Apply search filter using index for large datasets
    if (debouncedFilters.search && debouncedFilters.search.trim()) {
      const searchTerm = debouncedFilters.search.toLowerCase().trim()
      
      if (products.length > 100) {
        // Use index for large datasets
        results = results.filter(p => {
          const idx = searchIndex.get(p.id)
          return idx && idx.searchableText.includes(searchTerm)
        })
      } else {
        // Direct search for smaller datasets
        results = results.filter(p => {
          return p.title?.toLowerCase().includes(searchTerm) || 
                 p.description?.toLowerCase().includes(searchTerm) ||
                 (p.sellerName && p.sellerName.toLowerCase().includes(searchTerm)) ||
                 (p.sellerCity && p.sellerCity.toLowerCase().includes(searchTerm)) ||
                 (p.sellerNeighborhood && p.sellerNeighborhood.toLowerCase().includes(searchTerm))
        })
      }
    }

    // Cache the results
    setCachedResults(cacheKey, results)

    return results
  }, [products, debouncedFilters, searchIndex])

  // Clear cache function
  const clearSearchCache = useCallback(() => {
    searchCache.clear()
  }, [])

  return {
    getFilteredProducts,
    clearSearchCache
  }
}

export default useProductSearch
