/**
 * Dependency Management Page
 * Manage dependencies between WBS items and analyze schedule impact
 */
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import { useProjects } from '../hooks/useProjects'
import { useWBS } from '../hooks/useWBS'
import ScheduleImpactModal from '../components/ScheduleImpactModal'

const DependencyManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const projectId = searchParams.get('project_id') || ''

  const [dependencies, setDependencies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [impactAnalysis, setImpactAnalysis] = useState(null)
  const [showImpactModal, setShowImpactModal] = useState(false)

  const { projectsList, fetchProjects } = useProjects()
  const { wbsList, fetchWBS } = useWBS()

  const [formData, setFormData] = useState({
    predecessor_id: '',
    successor_id: '',
    dependency_type: 'FS',
    lag_days: 0,
    impact_level: 'Medium',
    impact_description: '',
    is_active: true
  })

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (projectId) {
      fetchWBS({ project_id: projectId, limit: 1000 })
      fetchDependencies()
    } else {
      setDependencies([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const fetchDependencies = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/dependencies/', {
        params: { project_id: projectId, limit: 1000 }
      })
      setDependencies(response.items || [])
    } catch (err) {
      setError(err.message || '載入依賴關係失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleProjectChange = (e) => {
    const newProjectId = e.target.value
    if (newProjectId) {
      setSearchParams({ project_id: newProjectId })
    } else {
      setSearchParams({})
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.predecessor_id || !formData.successor_id) {
      alert('請選擇前置項目和後續項目')
      return
    }

    if (formData.predecessor_id === formData.successor_id) {
      alert('前置項目和後續項目不能相同')
      return
    }

    try {
      if (editingId) {
        await api.put(`/dependencies/${editingId}`, formData)
        alert('依賴關係已更新')
      } else {
        await api.post('/dependencies/', formData)
        alert('依賴關係已新增')
      }

      resetForm()
      fetchDependencies()
    } catch (err) {
      alert(`操作失敗: ${err.message}`)
    }
  }

  const handleEdit = (dep) => {
    setFormData({
      predecessor_id: dep.predecessor_id,
      successor_id: dep.successor_id,
      dependency_type: dep.dependency_type,
      lag_days: dep.lag_days,
      impact_level: dep.impact_level,
      impact_description: dep.impact_description || '',
      is_active: dep.is_active
    })
    setEditingId(dep.dependency_id)
    setShowAddForm(true)
  }

  const handleDelete = async (depId) => {
    if (!window.confirm('確定要刪除此依賴關係嗎？')) {
      return
    }

    try {
      await api.delete(`/dependencies/${depId}`)
      alert('依賴關係已刪除')
      fetchDependencies()
    } catch (err) {
      alert(`刪除失敗: ${err.message}`)
    }
  }

  const handleAnalyzeImpact = async (dep) => {
    try {
      setLoading(true)
      // Simulate a date change to analyze impact
      const response = await api.post(`/dependencies/item/${dep.predecessor_id}/analyze-impact`, {
        field: 'revised_planned_end',
        old_value: '2024-01-01',
        new_value: '2024-01-15'
      })
      setImpactAnalysis(response)
      setShowImpactModal(true)
    } catch (err) {
      alert(`分析失敗: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      predecessor_id: '',
      successor_id: '',
      dependency_type: 'FS',
      lag_days: 0,
      impact_level: 'Medium',
      impact_description: '',
      is_active: true
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const getDependencyTypeLabel = (type) => {
    const labels = {
      'FS': 'FS (完成→開始)',
      'SS': 'SS (開始→開始)',
      'FF': 'FF (完成→完成)',
      'SF': 'SF (開始→完成)'
    }
    return labels[type] || type
  }

  const getImpactLevelColor = (level) => {
    const colors = {
      'Critical': 'text-red-600 bg-red-50',
      'High': 'text-orange-600 bg-orange-50',
      'Medium': 'text-yellow-600 bg-yellow-50',
      'Low': 'text-green-600 bg-green-50'
    }
    return colors[level] || 'text-gray-600 bg-gray-50'
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">依賴關係管理</h1>
        <p className="text-gray-600">管理 WBS 項目之間的依賴關係，分析時程影響</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="project_id" className="label">
              選擇專案 *
            </label>
            <select
              id="project_id"
              value={projectId}
              onChange={handleProjectChange}
              className="input-field"
            >
              <option value="">-- 請選擇專案 --</option>
              {projectsList.map((project) => (
                <option key={project.project_id} value={project.project_id}>
                  {project.project_id} - {project.project_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={!projectId}
              className="btn-primary"
            >
              {showAddForm ? '取消新增' : '+ 新增依賴關係'}
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && projectId && (
        <div className="bg-blue-50 rounded-lg shadow mb-6 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? '編輯依賴關係' : '新增依賴關係'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">前置項目 (被依賴的) *</label>
                <select
                  name="predecessor_id"
                  value={formData.predecessor_id}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">-- 選擇前置項目 --</option>
                  {wbsList.map((wbs) => (
                    <option key={wbs.item_id} value={wbs.item_id}>
                      {wbs.wbs_id} - {wbs.task_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">後續項目 (依賴別人的) *</label>
                <select
                  name="successor_id"
                  value={formData.successor_id}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">-- 選擇後續項目 --</option>
                  {wbsList.map((wbs) => (
                    <option key={wbs.item_id} value={wbs.item_id}>
                      {wbs.wbs_id} - {wbs.task_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">依賴類型 *</label>
                <select
                  name="dependency_type"
                  value={formData.dependency_type}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="FS">FS (Finish-to-Start) - 完成後才能開始</option>
                  <option value="SS">SS (Start-to-Start) - 開始後才能開始</option>
                  <option value="FF">FF (Finish-to-Finish) - 完成後才能完成</option>
                  <option value="SF">SF (Start-to-Finish) - 開始後才能完成</option>
                </select>
              </div>

              <div>
                <label className="label">延遲天數 (Lag/Lead)</label>
                <input
                  type="number"
                  name="lag_days"
                  value={formData.lag_days}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="正數=延遲，負數=提前"
                />
              </div>

              <div>
                <label className="label">影響程度</label>
                <select
                  name="impact_level"
                  value={formData.impact_level}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="label flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  啟用此依賴關係
                </label>
              </div>
            </div>

            <div>
              <label className="label">影響說明</label>
              <textarea
                name="impact_description"
                value={formData.impact_description}
                onChange={handleChange}
                className="input-field"
                rows="2"
                placeholder="描述此依賴關係的影響範圍..."
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingId ? '更新' : '新增'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dependencies List */}
      {!projectId ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">請選擇專案以查看依賴關係</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">載入中...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : dependencies.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">此專案目前沒有依賴關係</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">前置項目</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">類型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">後續項目</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">延遲</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">影響</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">狀態</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dependencies.map((dep) => (
                <tr key={dep.dependency_id} className={!dep.is_active ? 'opacity-50' : ''}>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{dep.predecessor_wbs_id}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{dep.predecessor_task_name}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-700 rounded">
                      {dep.dependency_type}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{dep.successor_wbs_id}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{dep.successor_task_name}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm text-gray-700">
                      {dep.lag_days > 0 ? `+${dep.lag_days}` : dep.lag_days} 天
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${getImpactLevelColor(dep.impact_level)}`}>
                      {dep.impact_level}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${dep.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {dep.is_active ? '啟用' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(dep)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(dep.dependency_id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        刪除
                      </button>
                      <button
                        onClick={() => handleAnalyzeImpact(dep)}
                        className="text-green-600 hover:text-green-900 text-sm"
                      >
                        分析影響
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Impact Analysis Modal */}
      {showImpactModal && impactAnalysis && (
        <ScheduleImpactModal
          analysis={impactAnalysis}
          onClose={() => {
            setShowImpactModal(false)
            setImpactAnalysis(null)
          }}
        />
      )}
    </div>
  )
}

export default DependencyManagement
