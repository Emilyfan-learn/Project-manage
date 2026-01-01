/**
 * Project Form Component for creating and editing projects
 */
import React, { useState, useEffect } from 'react'

const ProjectForm = ({ initialData = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    project_id: '',
    project_name: '',
    description: '',
    status: 'Active',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initialData) {
      setFormData({
        project_id: initialData.project_id || '',
        project_name: initialData.project_name || '',
        description: initialData.description || '',
        status: initialData.status || 'Active',
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
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.project_id)) {
      newErrors.project_id = '專案 ID 只能包含英文、數字、底線和連字號'
    }

    if (!formData.project_name) {
      newErrors.project_name = '請輸入專案名稱'
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
      description: formData.description || null,
    }

    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-900">
        {initialData ? '編輯專案' : '新增專案'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Project ID */}
        <div>
          <label htmlFor="project_id" className="label">
            專案 ID *
          </label>
          <input
            type="text"
            id="project_id"
            name="project_id"
            value={formData.project_id}
            onChange={handleChange}
            disabled={!!initialData}
            placeholder="例如: PRJ001, PROJECT_2024"
            className="input-field"
          />
          {errors.project_id && (
            <p className="text-red-500 text-sm mt-1">{errors.project_id}</p>
          )}
          {!initialData && (
            <p className="text-gray-500 text-xs mt-1">
              專案 ID 創建後無法修改
            </p>
          )}
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
            <option value="Active">進行中 (Active)</option>
            <option value="Completed">已完成 (Completed)</option>
            <option value="On Hold">暫停 (On Hold)</option>
            <option value="Cancelled">已取消 (Cancelled)</option>
          </select>
        </div>

        {/* Project Name */}
        <div className="md:col-span-2">
          <label htmlFor="project_name" className="label">
            專案名稱 *
          </label>
          <input
            type="text"
            id="project_name"
            name="project_name"
            value={formData.project_name}
            onChange={handleChange}
            placeholder="請輸入專案名稱"
            className="input-field"
          />
          {errors.project_name && (
            <p className="text-red-500 text-sm mt-1">{errors.project_name}</p>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="label">
            專案描述
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="請輸入專案描述..."
            className="input-field"
          />
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

export default ProjectForm
