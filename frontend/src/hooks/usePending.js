/**
 * Custom React Hook for Pending Items operations
 */
import { useState, useCallback } from 'react'
import api from '../utils/api'

export const usePending = () => {
  const [pendingList, setPendingList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)

  const fetchPending = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = { ...filters }
      const response = await api.get('/pending/', { params })
      setPendingList(response.items || [])
      setTotal(response.total || 0)
    } catch (err) {
      setError(err.message)
      setPendingList([])
    } finally {
      setLoading(false)
    }
  }, [])

  const getPending = useCallback(async (pendingId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get(`/pending/${pendingId}`)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createPending = useCallback(async (pendingData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/pending/', pendingData)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePending = useCallback(async (pendingId, updates) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.put(`/pending/${pendingId}`, updates)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deletePending = useCallback(async (pendingId) => {
    setLoading(true)
    setError(null)

    try {
      await api.delete(`/pending/${pendingId}`)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsReplied = useCallback(async (pendingId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.put(`/pending/${pendingId}/reply`)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getOverdueItems = useCallback(async (projectId = null) => {
    setLoading(true)
    setError(null)

    try {
      const params = projectId ? { project_id: projectId } : {}
      const response = await api.get('/pending/overdue', { params })
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getStats = useCallback(async (projectId = null) => {
    setLoading(true)
    setError(null)

    try {
      const params = projectId ? { project_id: projectId } : {}
      const response = await api.get('/pending/stats', { params })
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    pendingList,
    loading,
    error,
    total,
    fetchPending,
    getPending,
    createPending,
    updatePending,
    deletePending,
    markAsReplied,
    getOverdueItems,
    getStats,
  }
}
