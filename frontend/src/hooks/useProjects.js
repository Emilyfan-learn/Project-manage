/**
 * Custom React Hook for Project operations
 */
import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

export const useProjects = () => {
  const [projectsList, setProjectsList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)

  // Fetch projects list
  const fetchProjects = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = { ...filters }
      const response = await api.get('/projects/', { params })
      setProjectsList(response.items || [])
      setTotal(response.total || 0)
    } catch (err) {
      setError(err.message)
      setProjectsList([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Get single project
  const getProject = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get(`/projects/${projectId}`)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Get project statistics
  const getProjectStats = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get(`/projects/${projectId}/stats`)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Create new project
  const createProject = useCallback(async (projectData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/projects/', projectData)
      await fetchProjects() // Refresh list
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchProjects])

  // Update project
  const updateProject = useCallback(async (projectId, updates) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.put(`/projects/${projectId}`, updates)
      await fetchProjects() // Refresh list
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchProjects])

  // Delete project
  const deleteProject = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)

    try {
      await api.delete(`/projects/${projectId}`)
      await fetchProjects() // Refresh list
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchProjects])

  // Auto-fetch on mount
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projectsList,
    loading,
    error,
    total,
    fetchProjects,
    getProject,
    getProjectStats,
    createProject,
    updateProject,
    deleteProject,
  }
}
