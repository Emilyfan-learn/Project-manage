/**
 * Pending Item Form Component
 */
import React, { useState, useEffect } from 'react'
import { useWBS } from '../hooks/useWBS'
import { useIssues } from '../hooks/useIssues'
import { useProjects } from '../hooks/useProjects'

const PendingForm = ({ initialData = null, onSubmit, onCancel, projectId }) => {
  // 獲取今天日期 (YYYY-MM-DD 格式)
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [formData, setFormData] = useState({
    project_id: projectId || '',
    task_date: getTodayDate(), // 預設為今天
    source_type: '客戶',
    contact_info: '',
    description: '',
    planned_start_date: '',
    expected_completion_date: '',
    handling_notes: '',
    related_wbs: '',
    related_action_item: '',
    related_issue_id: '',
    status: '待處理',
    priority: 'Medium',
  })

  const [errors, setErrors] = useState({})

  // Fetch WBS and Issues for dropdown options
  const { wbsList, fetchWBS } = useWBS()
  const { issuesList, fetchIssues } = useIssues()
  const { projectsList, fetchProjects } = useProjects()

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (formData.project_id) {
      // Fetch WBS and Issues when project_id changes
      fetchWBS({ project_id: formData.project_id, limit: 1000 })
      fetchIssues({ project_id: formData.project_id, limit: 1000 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.project_id])

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        task_date: initialData.task_date || '',
        planned_start_date: initialData.planned_start_date || '',
        expected_completion_date: initialData.expected_completion_date || '',
        related_issue_id: initialData.related_issue_id || '',
      })
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.project_id) {
      newErrors.project_id = '請輸入專案 ID'
    }

    if (!formData.task_date) {
      newErrors.task_date = '請選擇任務日期'
    }

    if (!formData.source_type) {
      newErrors.source_type = '請選擇來源類型'
    }

    if (!formData.description) {
      newErrors.description = '請輸入任務說明'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      related_issue_id: formData.related_issue_id ? parseInt(formData.related_issue_id) : null,
    }

    // Remove empty strings and convert to null
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
        {initialData ? '編輯待辦項目' : '新增待辦項目'}
      </h2>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Project ID */}
        <div>
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

        {/* Task Date */}
        <div>
          <label htmlFor="task_date" className="label">
            任務日期 *
          </label>
          <input
            type="date"
            id="task_date"
            name="task_date"
            value={formData.task_date}
            onChange={handleChange}
            className="input-field"
          />
          {errors.task_date && (
            <p className="text-red-500 text-sm mt-1">{errors.task_date}</p>
          )}
        </div>

        {/* Source Type */}
        <div>
          <label htmlFor="source_type" className="label">
            來源類型 *
          </label>
          <select
            id="source_type"
            name="source_type"
            value={formData.source_type}
            onChange={handleChange}
            className="input-field"
          >
            <option value="客戶">客戶</option>
            <option value="自己">自己</option>
            <option value="內部">內部</option>
          </select>
          {errors.source_type && (
            <p className="text-red-500 text-sm mt-1">{errors.source_type}</p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="label">
            優先級
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="input-field"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Contact Info */}
        <div className="md:col-span-2">
          <label htmlFor="contact_info" className="label">
            聯絡人資訊
          </label>
          <input
            type="text"
            id="contact_info"
            name="contact_info"
            value={formData.contact_info}
            onChange={handleChange}
            placeholder="例如: 王小明 (客戶窗口)"
            className="input-field"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="label">
            任務說明 *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="input-field"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Planned Start Date */}
        <div>
          <label htmlFor="planned_start_date" className="label">
            預計開始日期
          </label>
          <input
            type="date"
            id="planned_start_date"
            name="planned_start_date"
            value={formData.planned_start_date}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {/* Expected Completion Date */}
        <div>
          <label htmlFor="expected_completion_date" className="label">
            預計完成日期
          </label>
          <input
            type="date"
            id="expected_completion_date"
            name="expected_completion_date"
            value={formData.expected_completion_date}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {/* Status */}
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
            <option value="待處理">待處理</option>
            <option value="處理中">處理中</option>
            <option value="已完成">已完成</option>
            <option value="已取消">已取消</option>
          </select>
        </div>

        {/* Handling Notes */}
        <div className="md:col-span-2">
          <label htmlFor="handling_notes" className="label">
            處理備註
          </label>
          <textarea
            id="handling_notes"
            name="handling_notes"
            value={formData.handling_notes}
            onChange={handleChange}
            rows="2"
            placeholder="記錄處理過程或備註"
            className="input-field"
          />
        </div>
      </div>

      {/* Related Items */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          關聯項目
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Related WBS */}
          <div>
            <label htmlFor="related_wbs" className="label">
              關聯 WBS
            </label>
            <select
              id="related_wbs"
              name="related_wbs"
              value={formData.related_wbs}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">-- 請選擇 WBS --</option>
              {wbsList && wbsList.length > 0 ? (
                wbsList.map((wbs) => (
                  <option key={wbs.item_id} value={wbs.wbs_id}>
                    {wbs.wbs_id} - {wbs.task_name}
                  </option>
                ))
              ) : (
                <option value="" disabled>載入中...</option>
              )}
            </select>
          </div>

          {/* Related Action Item */}
          <div>
            <label htmlFor="related_action_item" className="label">
              關聯 Action Item
            </label>
            <input
              type="text"
              id="related_action_item"
              name="related_action_item"
              value={formData.related_action_item}
              onChange={handleChange}
              placeholder="手動輸入 Action Item"
              className="input-field"
            />
          </div>

          {/* Related Issue */}
          <div>
            <label htmlFor="related_issue_id" className="label">
              關聯 Issue
            </label>
            <select
              id="related_issue_id"
              name="related_issue_id"
              value={formData.related_issue_id}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">-- 請選擇 Issue --</option>
              {issuesList && issuesList.length > 0 ? (
                issuesList.map((issue) => (
                  <option key={issue.issue_id} value={issue.issue_id}>
                    {issue.issue_number} - {issue.issue_title}
                  </option>
                ))
              ) : (
                <option value="" disabled>載入中...</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          取消
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          {initialData ? '更新' : '新增'}
        </button>
      </div>
    </form>
  )
}

export default PendingForm
