/**
 * Gantt Chart View Page
 */
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useWBS } from '../hooks/useWBS'
import { useProjects } from '../hooks/useProjects'
import { useSettings } from '../hooks/useSettings'
import GanttChart from '../components/GanttChart'

const GanttView = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [projectId, setProjectId] = useState(searchParams.get('project') || '')
  const [viewMode, setViewMode] = useState('Day')
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [parentFilter, setParentFilter] = useState('all') // 'all', 'parents', 'children'
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })

  const { wbsList, loading, error, fetchWBS } = useWBS()
  const { projectsList, fetchProjects } = useProjects()
  const { systemSettings, fetchSystemSettings, getSystemSetting } = useSettings()

  useEffect(() => {
    fetchProjects()
    fetchSystemSettings()
  }, [fetchProjects, fetchSystemSettings])

  // Auto-select first project if none selected
  useEffect(() => {
    if (!projectId && projectsList.length > 0) {
      setProjectId(projectsList[0].project_id)
    }
  }, [projectId, projectsList])

  // Apply default view mode from system settings
  useEffect(() => {
    if (systemSettings.length > 0) {
      const defaultViewMode = getSystemSetting('default_view_mode', 'Day')
      setViewMode(defaultViewMode)
    }
  }, [systemSettings, getSystemSetting])

  useEffect(() => {
    if (projectId) {
      console.log('Fetching WBS for project:', projectId)
      const itemsPerPage = getSystemSetting('items_per_page', 1000)
      fetchWBS({ project_id: projectId, limit: itemsPerPage })
    }
  }, [projectId, fetchWBS, systemSettings, getSystemSetting])

  // Update URL when projectId changes
  useEffect(() => {
    if (projectId) {
      setSearchParams({ project: projectId })
    }
  }, [projectId, setSearchParams])

  // Log wbsList changes for debugging
  useEffect(() => {
    console.log('WBS List updated:', wbsList.length, 'items', wbsList)
  }, [wbsList])

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setShowTaskDetail(true)
  }

  const handleDateChange = async (taskId, start, end) => {
    console.log('Date changed:', taskId, start, end)
    // TODO: Implement date change API call
    alert(`任務 ${taskId} 日期已更改:\n開始: ${start.toLocaleDateString('zh-TW')}\n結束: ${end.toLocaleDateString('zh-TW')}`)
  }

  // Filter WBS list by date range and parent filter
  const filteredWbsList = wbsList.filter(item => {
    // Apply parent filter
    if (parentFilter === 'parents') {
      // Only show items with no parent (top-level)
      if (item.parent_id) return false
    } else if (parentFilter === 'children') {
      // Only show items with a parent
      if (!item.parent_id) return false
    }

    // Apply date filter
    if (!dateFilter.startDate && !dateFilter.endDate) {
      return true // No date filter applied
    }

    // Get the relevant date (use revised if available, otherwise original)
    const itemStartDate = item.revised_planned_start || item.original_planned_start
    const itemEndDate = item.revised_planned_end || item.original_planned_end

    // Check if item falls within the date range
    if (dateFilter.startDate && itemEndDate) {
      if (itemEndDate < dateFilter.startDate) return false
    }
    if (dateFilter.endDate && itemStartDate) {
      if (itemStartDate > dateFilter.endDate) return false
    }

    return true
  })

  const handleDateFilterChange = (e) => {
    const { name, value } = e.target
    setDateFilter(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const clearFilters = () => {
    setDateFilter({
      startDate: '',
      endDate: ''
    })
    setParentFilter('all')
  }

  const viewModes = [
    { value: 'Quarter Day', label: '6小時' },
    { value: 'Half Day', label: '半日' },
    { value: 'Day', label: '日' },
    { value: 'Week', label: '週' },
    { value: 'Month', label: '月' },
    { value: 'Year', label: '年' },
  ]

  const parentFilterOptions = [
    { value: 'all', label: '全部' },
    { value: 'parents', label: '僅父項目' },
    { value: 'children', label: '僅子項目' },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">甘特圖視圖</h1>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow">
          {/* Project Selection */}
          <div>
            <label htmlFor="project-select" className="label">
              專案
            </label>
            <select
              id="project-select"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
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
          </div>

          {/* View Mode Selection */}
          <div>
            <label htmlFor="view-mode" className="label">
              縮放
            </label>
            <select
              id="view-mode"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="input-field"
            >
              {viewModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>

          {/* Parent Filter */}
          <div>
            <label htmlFor="parent-filter" className="label">
              層級篩選
            </label>
            <select
              id="parent-filter"
              value={parentFilter}
              onChange={(e) => setParentFilter(e.target.value)}
              className="input-field"
            >
              {parentFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label htmlFor="start-date" className="label">
              開始日期
            </label>
            <input
              type="date"
              id="start-date"
              name="startDate"
              value={dateFilter.startDate}
              onChange={handleDateFilterChange}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="end-date" className="label">
              結束日期
            </label>
            <input
              type="date"
              id="end-date"
              name="endDate"
              value={dateFilter.endDate}
              onChange={handleDateFilterChange}
              className="input-field"
            />
          </div>

          {/* Clear Filter Button */}
          {(dateFilter.startDate || dateFilter.endDate || parentFilter !== 'all') && (
            <div className="mt-6">
              <button
                onClick={clearFilters}
                className="btn-secondary"
              >
                清除篩選
              </button>
            </div>
          )}

          {/* Reload Button */}
          <div className="mt-6">
            <button
              onClick={() => {
                const itemsPerPage = getSystemSetting('items_per_page', 1000)
                fetchWBS({ project_id: projectId, limit: itemsPerPage })
              }}
              className="btn-secondary"
              disabled={loading}
            >
              {loading ? '載入中...' : '重新載入'}
            </button>
          </div>

          {/* Stats */}
          <div className="ml-auto text-sm text-gray-600">
            {dateFilter.startDate || dateFilter.endDate || parentFilter !== 'all' ? (
              <>顯示 {filteredWbsList.length} / {wbsList.length} 個任務</>
            ) : (
              <>共 {wbsList.length} 個任務</>
            )}
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

      {/* Gantt Chart */}
      {!loading && filteredWbsList.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <GanttChart
            tasks={filteredWbsList}
            viewMode={viewMode}
            onTaskClick={handleTaskClick}
            onDateChange={handleDateChange}
          />
        </div>
      )}

      {/* No Data */}
      {!loading && wbsList.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          <p className="text-lg">暫無 WBS 資料</p>
          <p className="mt-2 text-sm">請先建立 WBS 項目或選擇其他專案</p>
        </div>
      )}

      {/* No Data After Filter */}
      {!loading && wbsList.length > 0 && filteredWbsList.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          <p className="text-lg">無符合條件的 WBS 資料</p>
          <p className="mt-2 text-sm">請調整日期篩選條件</p>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskDetail && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">任務詳情</h2>
                <button
                  onClick={() => setShowTaskDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">WBS ID</label>
                    <p className="text-gray-900">{selectedTask.wbs_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">任務名稱</label>
                    <p className="text-gray-900">{selectedTask.task_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">負責人</label>
                    <p className="text-gray-900">{selectedTask.primary_owner || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">狀態</label>
                    <p className="text-gray-900">
                      {selectedTask.status || '-'}
                      {selectedTask.is_overdue && (
                        <span className="ml-2 text-red-600 font-semibold">逾期</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">預計開始</label>
                    <p className="text-gray-900">{selectedTask.original_planned_start || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">預計結束</label>
                    <p className="text-gray-900">{selectedTask.original_planned_end || '-'}</p>
                  </div>
                  {selectedTask.revised_planned_start && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">調整後開始</label>
                      <p className="text-blue-600">{selectedTask.revised_planned_start}</p>
                    </div>
                  )}
                  {selectedTask.revised_planned_end && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">調整後結束</label>
                      <p className="text-blue-600">{selectedTask.revised_planned_end}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">實際進度</label>
                    <p className="text-gray-900">{selectedTask.actual_progress || 0}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">預估進度</label>
                    <p className="text-gray-900">{selectedTask.estimated_progress || 0}%</p>
                  </div>
                  {selectedTask.progress_variance !== null && selectedTask.progress_variance !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">進度差異</label>
                      <p className={selectedTask.progress_variance < 0 ? 'text-red-600' : 'text-green-600'}>
                        {selectedTask.progress_variance > 0 ? '+' : ''}{selectedTask.progress_variance}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTaskDetail(false)}
                  className="btn-secondary"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GanttView
