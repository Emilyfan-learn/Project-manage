/**
 * Custom React Hook for Issue Tracking operations
 */
import { useState, useCallback } from 'react'
import api from '../utils/api'

export const useIssues = () => {
  const [issuesList, setIssuesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)

  const fetchIssues = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = { ...filters }
      const response = await api.get('/issues/', { params })
      setIssuesList(response.items || [])
      setTotal(response.total || 0)
    } catch (err) {
      setError(err.message)
      setIssuesList([])
    } finally {
      setLoading(false)
    }
  }, [])

  const getIssue = useCallback(async (issueId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get(`/issues/${issueId}`)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getIssueHistory = useCallback(async (issueId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get(`/issues/${issueId}/history`)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createIssue = useCallback(async (issueData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/issues/', issueData)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateIssue = useCallback(async (issueId, updates, changedBy = 'User') => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.put(`/issues/${issueId}?changed_by=${changedBy}`, updates)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteIssue = useCallback(async (issueId) => {
    setLoading(true)
    setError(null)

    try {
      await api.delete(`/issues/${issueId}`)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const escalateIssue = useCallback(async (issueId, escalationData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.put(`/issues/${issueId}/escalate`, escalationData)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const resolveIssue = useCallback(async (issueId, resolveData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.put(`/issues/${issueId}/resolve`, resolveData)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const closeIssue = useCallback(async (issueId, changedBy = 'User') => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.put(`/issues/${issueId}/close?changed_by=${changedBy}`)
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
      const response = await api.get('/issues/stats', { params })
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    issuesList,
    loading,
    error,
    total,
    fetchIssues,
    getIssue,
    getIssueHistory,
    createIssue,
    updateIssue,
    deleteIssue,
    escalateIssue,
    resolveIssue,
    closeIssue,
    getStats,
  }
}
