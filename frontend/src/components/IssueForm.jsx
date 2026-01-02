/**
 * Issue Form Component
 */
import React, { useState, useEffect } from 'react'
import { useWBS } from '../hooks/useWBS'
import { useProjects } from '../hooks/useProjects'

const IssueForm = ({ initialData = null, onSubmit, onCancel, projectId }) => {
  const [formData, setFormData] = useState({
    project_id: projectId || '',
    issue_title: '',
    issue_description: '',
    issue_type: '技術問題',
    issue_category: '阻礙者',
    severity: 'Medium',
    priority: 'Medium',
    reported_by: '',
    assigned_to: '',
    owner_type: '內部',
    affected_wbs: '',
    impact_description: '',
    estimated_impact_days: '',
    status: 'Open',
    resolution: '',
    root_cause: '',
    target_resolution_date: '',
    actual_resolution_date: '',
    closed_date: '',
    reported_date: new Date().toISOString().split('T')[0],
    source: 'Manual',
  })

  const [errors, setErrors] = useState({})
  const [selectedWBSIds, setSelectedWBSIds] = useState([])

  // Fetch WBS for dropdown options
  const { wbsList, fetchWBS } = useWBS()
  const { projectsList, fetchProjects } = useProjects()

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (formData.project_id) {
      // Fetch WBS when project_id changes
      fetchWBS({ project_id: formData.project_id, limit: 1000 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.project_id])

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        target_resolution_date: initialData.target_resolution_date || '',
        actual_resolution_date: initialData.actual_resolution_date || '',
        closed_date: initialData.closed_date || '',
        reported_date: initialData.reported_date || '',
        estimated_impact_days: initialData.estimated_impact_days || '',
      })
      // Parse affected_wbs if it exists (comma-separated string)
      if (initialData.affected_wbs) {
        const wbsIds = initialData.affected_wbs.split(',').map(id => id.trim()).filter(Boolean)
        setSelectedWBSIds(wbsIds)
      }
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleWBSToggle = (wbsId) => {
    setSelectedWBSIds((prev) => {
      if (prev.includes(wbsId)) {
        // Remove WBS ID
        return prev.filter((id) => id !== wbsId)
      } else {
        // Add WBS ID
        return [...prev, wbsId]
      }
    })
  }

  const handleRemoveWBS = (wbsId) => {
    setSelectedWBSIds((prev) => prev.filter((id) => id !== wbsId))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.project_id) {
      newErrors.project_id = '請輸入專案 ID'
    }
    if (!formData.issue_title) {
      newErrors.issue_title = '請輸入問題標題'
    }
    if (!formData.issue_type) {
      newErrors.issue_type = '請選擇問題類型'
    }
    if (!formData.issue_category) {
      newErrors.issue_category = '請選擇問題分類'
    }
    if (!formData.severity) {
      newErrors.severity = '請選擇嚴重性'
    }
    if (!formData.priority) {
      newErrors.priority = '請選擇優先級'
    }
    if (!formData.reported_by) {
      newErrors.reported_by = '請輸入回報人'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const submitData = {
      ...formData,
      estimated_impact_days: formData.estimated_impact_days ? parseInt(formData.estimated_impact_days) : null,
      affected_wbs: selectedWBSIds.length > 0 ? selectedWBSIds.join(', ') : null,
    }

    Object.keys(submitData).forEach((key) => {
      if (submitData[key] === '') {
        submitData[key] = null
      }
    })

    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-900">
        {initialData ? '編輯問題' : '新增問題'}
      </h2>

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">基本資訊</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="project_id" className="label">
              專案 *
            </label>
            <select
              id="project_id"
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              disabled={!!initialData}
              className="input-field"
            >
              {projectsList.length === 0 ? (
                <option value="">請先建立專案</option>
              ) : (
                <>
                  <option value="">請選擇專案</option>
                  {projectsList.map((project) => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.project_id} - {project.project_name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.project_id && (
              <p className="text-red-500 text-sm mt-1">{errors.project_id}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="issue_title" className="label">
              問題標題 *
            </label>
            <input
              type="text"
              id="issue_title"
              name="issue_title"
              value={formData.issue_title}
              onChange={handleChange}
              className="input-field"
            />
            {errors.issue_title && (
              <p className="text-red-500 text-sm mt-1">{errors.issue_title}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="issue_description" className="label">
              問題說明
            </label>
            <textarea
              id="issue_description"
              name="issue_description"
              value={formData.issue_description}
              onChange={handleChange}
              rows="3"
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Classification */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">分類</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="issue_type" className="label">
              問題類型 *
            </label>
            <select
              id="issue_type"
              name="issue_type"
              value={formData.issue_type}
              onChange={handleChange}
              className="input-field"
            >
              <option value="技術問題">技術問題</option>
              <option value="需求問題">需求問題</option>
              <option value="資源問題">資源問題</option>
              <option value="時程問題">時程問題</option>
              <option value="其他">其他</option>
            </select>
            {errors.issue_type && (
              <p className="text-red-500 text-sm mt-1">{errors.issue_type}</p>
            )}
          </div>

          <div>
            <label htmlFor="issue_category" className="label">
              問題分類 *
            </label>
            <select
              id="issue_category"
              name="issue_category"
              value={formData.issue_category}
              onChange={handleChange}
              className="input-field"
            >
              <option value="阻礙者">阻礙者</option>
              <option value="風險">風險</option>
              <option value="變更請求">變更請求</option>
              <option value="缺陷">缺陷</option>
            </select>
            {errors.issue_category && (
              <p className="text-red-500 text-sm mt-1">{errors.issue_category}</p>
            )}
          </div>

          <div>
            <label htmlFor="severity" className="label">
              嚴重性 *
            </label>
            <select
              id="severity"
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="input-field"
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            {errors.severity && (
              <p className="text-red-500 text-sm mt-1">{errors.severity}</p>
            )}
          </div>

          <div>
            <label htmlFor="priority" className="label">
              優先級 *
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="input-field"
            >
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            {errors.priority && (
              <p className="text-red-500 text-sm mt-1">{errors.priority}</p>
            )}
          </div>
        </div>
      </div>

      {/* Responsibility */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">負責人</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="reported_by" className="label">
              回報人 *
            </label>
            <input
              type="text"
              id="reported_by"
              name="reported_by"
              value={formData.reported_by}
              onChange={handleChange}
              className="input-field"
            />
            {errors.reported_by && (
              <p className="text-red-500 text-sm mt-1">{errors.reported_by}</p>
            )}
          </div>

          <div>
            <label htmlFor="assigned_to" className="label">
              指派給
            </label>
            <input
              type="text"
              id="assigned_to"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="owner_type" className="label">
              負責類型
            </label>
            <select
              id="owner_type"
              name="owner_type"
              value={formData.owner_type}
              onChange={handleChange}
              className="input-field"
            >
              <option value="客戶">客戶</option>
              <option value="內部">內部</option>
              <option value="廠商">廠商</option>
            </select>
          </div>
        </div>
      </div>

      {/* Impact */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">影響範圍</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="affected_wbs_selector" className="label">
              受影響的 WBS
            </label>
            <select
              id="affected_wbs_selector"
              onChange={(e) => {
                if (e.target.value) {
                  handleWBSToggle(e.target.value)
                  e.target.value = '' // Reset dropdown
                }
              }}
              className="input-field"
            >
              <option value="">-- 點擊選擇 WBS --</option>
              {wbsList && wbsList.length > 0 ? (
                wbsList
                  .filter((wbs) => !selectedWBSIds.includes(wbs.wbs_id))
                  .map((wbs) => (
                    <option key={wbs.item_id} value={wbs.wbs_id}>
                      {wbs.wbs_id} - {wbs.task_name}
                    </option>
                  ))
              ) : (
                <option value="" disabled>
                  {wbsList ? '無可用的 WBS 項目' : '載入中...'}
                </option>
              )}
            </select>

            {/* Selected WBS Tags */}
            {selectedWBSIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedWBSIds.map((wbsId) => {
                  const wbsItem = wbsList.find((w) => w.wbs_id === wbsId)
                  return (
                    <div
                      key={wbsId}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <span>
                        {wbsId}
                        {wbsItem && ` - ${wbsItem.task_name}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWBS(wbsId)}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                        title="移除"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimated_impact_days" className="label">
                預估影響天數
              </label>
              <input
                type="number"
                id="estimated_impact_days"
                name="estimated_impact_days"
                value={formData.estimated_impact_days}
                onChange={handleChange}
                min="0"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="impact_description" className="label">
              影響說明
            </label>
            <textarea
              id="impact_description"
              name="impact_description"
              value={formData.impact_description}
              onChange={handleChange}
              rows="2"
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Status and Dates */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">狀態與時程</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status" className="label">
              狀態
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input-field"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="reported_date" className="label">
              回報日期
            </label>
            <input
              type="date"
              id="reported_date"
              name="reported_date"
              value={formData.reported_date}
              onChange={handleChange}
              disabled={!!initialData}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="target_resolution_date" className="label">
              目標解決日期
            </label>
            <input
              type="date"
              id="target_resolution_date"
              name="target_resolution_date"
              value={formData.target_resolution_date}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="actual_resolution_date" className="label">
              實際解決日期
            </label>
            <input
              type="date"
              id="actual_resolution_date"
              name="actual_resolution_date"
              value={formData.actual_resolution_date}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="closed_date" className="label">
              結案日期
            </label>
            <input
              type="date"
              id="closed_date"
              name="closed_date"
              value={formData.closed_date}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Resolution */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">解決方案</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="resolution" className="label">
              解決方案
            </label>
            <textarea
              id="resolution"
              name="resolution"
              value={formData.resolution}
              onChange={handleChange}
              rows="2"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="root_cause" className="label">
              根本原因分析
            </label>
            <textarea
              id="root_cause"
              name="root_cause"
              value={formData.root_cause}
              onChange={handleChange}
              rows="2"
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          取消
        </button>
        <button type="submit" className="btn-primary">
          {initialData ? '更新' : '新增'}
        </button>
      </div>
    </form>
  )
}

export default IssueForm
