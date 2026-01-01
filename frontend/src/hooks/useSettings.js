/**
 * Custom hook for managing system and project settings
 */
import { useState, useCallback } from 'react'
import api from '../utils/api'

export const useSettings = () => {
  const [systemSettings, setSystemSettings] = useState([])
  const [projectSettings, setProjectSettings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch all system settings
  const fetchSystemSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/settings/system')
      setSystemSettings(response)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Update a system setting
  const updateSystemSetting = useCallback(async (settingKey, value) => {
    try {
      const response = await api.put(`/settings/system/${settingKey}`, {
        setting_value: value
      })
      // Update local state
      setSystemSettings(prev =>
        prev.map(s => s.setting_key === settingKey ? response : s)
      )
      return response
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Get a specific system setting value
  const getSystemSetting = useCallback((settingKey, defaultValue = null) => {
    const setting = systemSettings.find(s => s.setting_key === settingKey)
    if (!setting) return defaultValue

    // Type conversion
    if (setting.setting_type === 'number') {
      return parseFloat(setting.setting_value)
    } else if (setting.setting_type === 'boolean') {
      return setting.setting_value.toLowerCase() === 'true'
    }
    return setting.setting_value
  }, [systemSettings])

  // Fetch project settings
  const fetchProjectSettings = useCallback(async (projectId, settingKey = null) => {
    setLoading(true)
    setError(null)
    try {
      const url = `/settings/project/${projectId}${settingKey ? `?setting_key=${settingKey}` : ''}`
      const response = await api.get(url)
      setProjectSettings(response)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Create project setting
  const createProjectSetting = useCallback(async (data) => {
    try {
      const response = await api.post('/settings/project', data)
      setProjectSettings(prev => [...prev, response])
      return response
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Update project setting
  const updateProjectSetting = useCallback(async (settingId, data) => {
    try {
      const response = await api.put(`/settings/project/${settingId}`, data)
      setProjectSettings(prev =>
        prev.map(s => s.setting_id === settingId ? response : s)
      )
      return response
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Delete project setting
  const deleteProjectSetting = useCallback(async (settingId) => {
    try {
      await api.delete(`/settings/project/${settingId}`)
      setProjectSettings(prev => prev.filter(s => s.setting_id !== settingId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Fetch owner units for a project
  const fetchOwnerUnits = useCallback(async (projectId) => {
    try {
      const response = await api.get(`/settings/owner-units/${projectId}`)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Add owner unit
  const addOwnerUnit = useCallback(async (projectId, unitName, displayOrder = 0) => {
    try {
      const response = await api.post('/settings/owner-units', {
        project_id: projectId,
        unit_name: unitName,
        display_order: displayOrder
      })
      return response
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  return {
    systemSettings,
    projectSettings,
    loading,
    error,
    fetchSystemSettings,
    updateSystemSetting,
    getSystemSetting,
    fetchProjectSettings,
    createProjectSetting,
    updateProjectSetting,
    deleteProjectSetting,
    fetchOwnerUnits,
    addOwnerUnit
  }
}
