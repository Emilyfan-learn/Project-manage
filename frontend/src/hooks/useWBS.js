/**
 * Custom React Hook for WBS operations
 */
import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

export const useWBS = (projectId = null) => {
  const [wbsList, setWbsList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)

  // Fetch WBS list
  const fetchWBS = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = {
        ...filters,
        project_id: projectId || filters.project_id,
      }

      const response = await api.get('/wbs/', { params })
      setWbsList(response.items || [])
      setTotal(response.total || 0)
    } catch (err) {
      setError(err.message)
      setWbsList([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Fetch WBS tree structure
  const fetchWBSTree = useCallback(async (pid) => {
    const targetProjectId = pid || projectId
    if (!targetProjectId) {
      setError('Project ID is required for tree view')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.get(`/wbs/tree/${targetProjectId}`)
      return response.tree || []
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Get single WBS item
  const getWBS = useCallback(async (itemId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get(`/wbs/${itemId}`)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Create new WBS item
  const createWBS = useCallback(async (wbsData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/wbs/', wbsData)
      await fetchWBS() // Refresh list
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchWBS])

  // Update WBS item
  const updateWBS = useCallback(async (itemId, updates) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.put(`/wbs/${itemId}`, updates)
      await fetchWBS() // Refresh list
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchWBS])

  // Delete WBS item
  const deleteWBS = useCallback(async (itemId) => {
    setLoading(true)
    setError(null)

    try {
      await api.delete(`/wbs/${itemId}`)
      await fetchWBS() // Refresh list
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchWBS])

  // Batch create WBS items
  const createWBSBatch = useCallback(async (wbsItems) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/wbs/batch', wbsItems)
      await fetchWBS() // Refresh list
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchWBS])

  // Auto-fetch on mount if projectId is provided
  useEffect(() => {
    if (projectId) {
      fetchWBS()
    }
  }, [projectId, fetchWBS])

  return {
    wbsList,
    loading,
    error,
    total,
    fetchWBS,
    fetchWBSTree,
    getWBS,
    createWBS,
    updateWBS,
    deleteWBS,
    createWBSBatch,
  }
}
