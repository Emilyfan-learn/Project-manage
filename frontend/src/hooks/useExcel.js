/**
 * Custom React Hook for CSV/Excel import/export operations
 * Uses CSV format by default (no external dependencies on server)
 * CSV files can be opened directly in Excel
 */
import { useState, useCallback } from 'react'
import api from '../utils/api'

export const useExcel = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Import WBS from CSV file
  const importWBSFromExcel = useCallback(async (file, projectId) => {
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Use CSV endpoint
      const response = await api.post(`/csv/import/wbs?project_id=${projectId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Export WBS to CSV file
  const exportWBSToExcel = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/csv/export/wbs/${projectId}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `WBS_${projectId}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { success: true }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Download WBS template
  const downloadWBSTemplate = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/csv/template/wbs', {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Template download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'WBS_Template.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { success: true }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Export Pending items to CSV
  const exportPendingToExcel = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/csv/export/pending/${projectId}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Pending_${projectId}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { success: true }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Export Issues to CSV
  const exportIssuesToExcel = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/csv/export/issues/${projectId}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Issues_${projectId}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { success: true }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    importWBSFromExcel,
    exportWBSToExcel,
    downloadWBSTemplate,
    exportPendingToExcel,
    exportIssuesToExcel,
  }
}
