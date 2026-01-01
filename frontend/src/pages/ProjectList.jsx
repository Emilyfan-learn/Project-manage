/**
 * Project List Page Component
 */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import ProjectForm from '../components/ProjectForm'

const ProjectList = () => {
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
  })
  const [projectStats, setProjectStats] = useState({})

  const {
    projectsList,
    loading,
    error,
    total,
    fetchProjects,
    getProjectStats,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects()

  useEffect(() => {
    fetchProjects(filters)
  }, [fetchProjects, filters])

  // Load stats for all projects
  useEffect(() => {
    const loadStats = async () => {
      const stats = {}
      for (const project of projectsList) {
        try {
          const projectStat = await getProjectStats(project.project_id)
          stats[project.project_id] = projectStat
        } catch (err) {
          console.error(`Failed to load stats for ${project.project_id}`, err)
        }
      }
      setProjectStats(stats)
    }

    if (projectsList.length > 0) {
      loadStats()
    }
  }, [projectsList, getProjectStats])

  const handleCreate = () => {
    setEditingProject(null)
    setShowForm(true)
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setShowForm(true)
  }

  const handleDelete = async (project) => {
    if (
      window.confirm(
        `確定要刪除專案「${project.project_name}」嗎？\n\n⚠️ 警告：這將刪除所有相關的 WBS 項目、問題和待辦事項，此操作無法復原！`
      )
    ) {
      try {
        await deleteProject(project.project_id)
        alert('刪除成功')
      } catch (err) {
        alert(`刪除失敗: ${err.message}`)
      }
    }
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingProject) {
        await updateProject(editingProject.project_id, formData)
        alert('更新成功')
      } else {
        await createProject(formData)
        alert('新增成功')
      }
      setShowForm(false)
      setEditingProject(null)
    } catch (err) {
      alert(`操作失敗: ${err.message}`)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProject(null)
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Completed':
        return 'bg-blue-100 text-blue-800'
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthBadgeColor = (health) => {
    switch (health) {
      case 'Healthy':
        return 'bg-green-100 text-green-800'
      case 'Warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'Critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (showForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProjectForm
          initialData={editingProject}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">專案管理</h1>
          <button onClick={handleCreate} className="btn-primary">
            + 新增專案
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div>
            <label htmlFor="status-filter" className="label">
              狀態篩選
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="">全部</option>
              <option value="Active">進行中</option>
              <option value="Completed">已完成</option>
              <option value="On Hold">暫停</option>
              <option value="Cancelled">已取消</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">載入中...</p>
        </div>
      )}

      {/* Project Cards */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsList.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p className="text-lg">暫無專案</p>
                <button onClick={handleCreate} className="mt-4 btn-primary">
                  建立第一個專案
                </button>
              </div>
            ) : (
              projectsList.map((project) => {
                const stats = projectStats[project.project_id]
                return (
                  <div
                    key={project.project_id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    {/* Project Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {project.project_name}
                        </h3>
                        <p className="text-sm text-gray-500">{project.project_id}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-t border-b border-gray-200">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {project.total_wbs}
                        </p>
                        <p className="text-xs text-gray-500">WBS 項目</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">
                          {project.total_issues}
                        </p>
                        <p className="text-xs text-gray-500">問題</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {project.total_pending}
                        </p>
                        <p className="text-xs text-gray-500">待辦</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {stats && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">整體進度</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {stats.overall_progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${stats.overall_progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getHealthBadgeColor(
                              stats.health_status
                            )}`}
                          >
                            {stats.health_status}
                          </span>
                          {stats.overdue_wbs > 0 && (
                            <span className="text-xs text-red-600">
                              ⚠️ {stats.overdue_wbs} 項逾期
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link
                        to={`/wbs?project=${project.project_id}`}
                        className="flex-1 text-center btn-primary text-sm py-2"
                      >
                        查看 WBS
                      </Link>
                      <button
                        onClick={() => handleEdit(project)}
                        className="flex-1 btn-secondary text-sm py-2"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(project)}
                        className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition-colors"
                        title="刪除專案"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Summary */}
          <div className="mt-6 text-sm text-gray-600">
            共 {total} 個專案
          </div>
        </>
      )}
    </div>
  )
}

export default ProjectList
