import { useState, useEffect, useCallback } from 'react'

import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Category } from '../types'

export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (): Promise<void> => {
    if (!user) return
    setError(null)

    const { data, error: e } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')

    if (e) { setError('Greška pri učitavanju kategorija.'); setLoading(false); return }
    setCategories((data ?? []) as Category[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { categories, loading, error, refetch: fetch }
}
