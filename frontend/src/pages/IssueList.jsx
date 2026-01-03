/**
 * Issue List Page Component
 */
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useIssues } from '../hooks/useIssues'
import { useProjects } from '../hooks/useProjects'
import { useExcel } from '../hooks/useExcel'
import { useSettings } from '../hooks/useSettings'
import { formatDate } from '../utils/dateFormat'
import IssueForm from '../components/IssueForm'

const IssueList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [projectId, setProjectId] = useState(searchParams.get('project') || '')
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    priority: '',
  })
  const [smartFilters, setSmartFilters] = useState({
    myResponsibility: false,
    clientOwner: false,
    overdueOnly: false,
    notCompleted: false, // 未完成（排除 Closed/Cancelled/Resolved）
    targetDateRange: '', // 目標解決日期區間
  })
  const [myUsername, setMyUsername] = useState('') // For "my responsibility" filter

  const {
    issuesList,
    loading,
    error,
    total,
    fetchIssues,
    createIssue,
    updateIssue,
    deleteIssue,
    escalateIssue,
    resolveIssue,
    closeIssue,
  } = useIssues()

  const {
    projectsList,
    fetchProjects,
  } = useProjects()

  const {
    loading: excelLoading,
    exportIssuesToExcel,
  } = useExcel()

  const {
    systemSettings,
    fetchSystemSettings,
    getSystemSetting,
  } = useSettings()

  useEffect(() => {
    fetchProjects()
    fetchSystemSettings()
  }, [fetchProjects, fetchSystemSettings])

  // Auto-select default project or first project if none selected
  useEffect(() => {
    // Wait for both projectsList and systemSettings to be loaded
    if (!projectId && projectsList.length > 0 && systemSettings.length > 0) {
      const defaultProject = getSystemSetting('default_project_id', '')
      const projectExists = projectsList.some(p => p.project_id === defaultProject)
      setProjectId(projectExists ? defaultProject : projectsList[0].project_id)
    }
  }, [projectId, projectsList, systemSettings, getSystemSetting])

  useEffect(() => {
    if (projectId) {
      fetchIssues({ project_id: projectId, ...filters })
    }
  }, [fetchIssues, projectId, filters])

  // Update URL when projectId changes
  useEffect(() => {
    if (projectId) {
      setSearchParams({ project: projectId })
    }
  }, [projectId, setSearchParams])

  const handleCreate = () => {
    setEditingItem(null)
    setShowForm(true)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleDelete = async (item) => {
    if (window.confirm(`確定要刪除問題「${item.issue_title}」嗎？`)) {
      try {
        await deleteIssue(item.issue_id)
        alert('刪除成功')
        // Refresh the issue list
        fetchIssues({ project_id: projectId, ...filters })
      } catch (err) {
        alert(`刪除失敗: ${err.message}`)
      }
    }
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingItem) {
        await updateIssue(editingItem.issue_id, formData)
        alert('更新成功')
      } else {
        await createIssue(formData)
        alert('新增成功')
      }
      setShowForm(false)
      setEditingItem(null)
      // Refresh the issue list to show the new/updated item
      fetchIssues({ project_id: projectId, ...filters })
    } catch (err) {
      alert(`操作失敗: ${err.message}`)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingItem(null)
  }

  const handleEscalate = async (issueId) => {
    const level = prompt('請輸入升級層級 (PM/Senior Manager/Executive):')
    const reason = prompt('請輸入升級原因:')
    const changedBy = prompt('請輸入您的姓名:')

    if (level && reason && changedBy) {
      try {
        await escalateIssue(issueId, { escalation_level: level, escalation_reason: reason, changed_by: changedBy })
        alert('升級成功')
        // Refresh the issue list
        fetchIssues({ project_id: projectId, ...filters })
      } catch (err) {
        alert(`升級失敗: ${err.message}`)
      }
    }
  }

  const handleResolve = async (issueId) => {
    const resolution = prompt('請輸入解決方案:')
    const resolvedBy = prompt('請輸入您的姓名:')

    if (resolution && resolvedBy) {
      try {
        await resolveIssue(issueId, { resolution, resolved_by: resolvedBy })
        alert('已標記為已解決')
        // Refresh the issue list
        fetchIssues({ project_id: projectId, ...filters })
      } catch (err) {
        alert(`標記失敗: ${err.message}`)
      }
    }
  }

  const handleClose = async (issueId) => {
    const closedBy = prompt('請輸入您的姓名:')

    if (closedBy) {
      try {
        await closeIssue(issueId, { closed_by: closedBy })
        alert('已關閉問題')
        // Refresh the issue list
        fetchIssues({ project_id: projectId, ...filters })
      } catch (err) {
        alert(`關閉失敗: ${err.message}`)
      }
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800'
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'Pending':
        return 'bg-orange-100 text-orange-800'
      case 'Resolved':
        return 'bg-green-100 text-green-800'
      case 'Closed':
        return 'bg-gray-100 text-gray-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-600 text-white'
      case 'High':
        return 'bg-red-100 text-red-800'
      case 'Medium':
        return 'bg-orange-100 text-orange-800'
      case 'Low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-600 text-white'
      case 'High':
        return 'bg-red-100 text-red-800'
      case 'Medium':
        return 'bg-orange-100 text-orange-800'
      case 'Low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Apply smart filters to issues list
  const getFilteredIssuesList = () => {
    let filtered = [...issuesList]

    // Filter: Only my responsibility
    if (smartFilters.myResponsibility && myUsername) {
      filtered = filtered.filter((item) => item.assigned_to === myUsername)
    }

    // Filter: Only client owner
    if (smartFilters.clientOwner) {
      filtered = filtered.filter((item) => item.owner_type === '客戶')
    }

    // Filter: Only overdue items
    if (smartFilters.overdueOnly) {
      filtered = filtered.filter((item) => item.is_overdue === true)
    }

    // Filter: Not completed (exclude Closed, Cancelled, Resolved)
    if (smartFilters.notCompleted) {
      const completedStatuses = ['Closed', 'Cancelled', 'Resolved']
      filtered = filtered.filter((item) => !completedStatuses.includes(item.status))
    }

    // Filter: Status dropdown with special "not_completed" option
    if (filters.status === 'not_completed') {
      const completedStatuses = ['Closed', 'Cancelled', 'Resolved']
      filtered = filtered.filter((item) => !completedStatuses.includes(item.status))
    }

    // Filter: Target resolution date range
    if (smartFilters.targetDateRange) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      filtered = filtered.filter((item) => {
        if (!item.target_resolution_date) return false
        const targetDate = new Date(item.target_resolution_date)
        targetDate.setHours(0, 0, 0, 0)

        switch (smartFilters.targetDateRange) {
          case 'today':
            return targetDate.getTime() === today.getTime()
          case 'yesterday':
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            return targetDate.getTime() === yesterday.getTime()
          case 'last7days':
            const last7days = new Date(today)
            last7days.setDate(last7days.getDate() - 7)
            return targetDate >= last7days && targetDate <= today
          case 'last30days':
            const last30days = new Date(today)
            last30days.setDate(last30days.getDate() - 30)
            return targetDate >= last30days && targetDate <= today
          case 'thisMonth':
            return targetDate.getMonth() === today.getMonth() && targetDate.getFullYear() === today.getFullYear()
          case 'lastMonth':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
            return targetDate >= lastMonth && targetDate <= lastMonthEnd
          case 'next7days':
            const next7days = new Date(today)
            next7days.setDate(next7days.getDate() + 7)
            return targetDate >= today && targetDate <= next7days
          case 'next30days':
            const next30days = new Date(today)
            next30days.setDate(next30days.getDate() + 30)
            return targetDate >= today && targetDate <= next30days
          default:
            return true
        }
      })
    }

    return filtered
  }

  const filteredIssuesList = getFilteredIssuesList()
  const dateFormat = getSystemSetting('date_format', 'yyyy/MM/dd')

  if (showForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <IssueForm
          initialData={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          projectId={projectId}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">問題追蹤管理</h1>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!projectId) {
                  alert('請先選擇專案')
                  return
                }
                try {
                  await exportIssuesToExcel(projectId)
                  alert('匯出成功')
                } catch (err) {
                  alert(`匯出失敗: ${err.message}`)
                }
              }}
              disabled={excelLoading}
              className="btn-secondary"
            >
              {excelLoading ? '匯出中...' : '📥 匯出 Excel'}
            </button>
            <button onClick={handleCreate} className="btn-primary">
              + 新增問題
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center flex-wrap">
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

          <div>
            <label htmlFor="status-filter" className="label">
              狀態
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="">全部</option>
              <option value="not_completed">未完成</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="severity-filter" className="label">
              嚴重性
            </label>
            <select
              id="severity-filter"
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="input-field"
            >
              <option value="">全部</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority-filter" className="label">
              優先級
            </label>
            <select
              id="priority-filter"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="input-field"
            >
              <option value="">全部</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="mt-6">
            <button
              onClick={() => fetchIssues({ project_id: projectId, ...filters })}
              className="btn-secondary"
            >
              搜尋
            </button>
          </div>
        </div>

        {/* Smart Filters */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">智慧篩選</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* My Responsibility Filter */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={smartFilters.myResponsibility}
                  onChange={(e) =>
                    setSmartFilters({ ...smartFilters, myResponsibility: e.target.checked })
                  }
                  className="mr-2 rounded"
                />
                <span className="text-gray-700">只看我負責的</span>
              </label>
              {smartFilters.myResponsibility && (
                <input
                  type="text"
                  value={myUsername}
                  onChange={(e) => setMyUsername(e.target.value)}
                  placeholder="輸入您的姓名"
                  className="input-field text-sm ml-6"
                />
              )}
            </div>

            {/* Client Owner Filter */}
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={smartFilters.clientOwner}
                onChange={(e) =>
                  setSmartFilters({ ...smartFilters, clientOwner: e.target.checked })
                }
                className="mr-2 rounded"
              />
              <span className="text-gray-700">只看客戶責任</span>
            </label>

            {/* Internal Only Filter */}
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={smartFilters.internalOnly}
                onChange={(e) =>
                  setSmartFilters({ ...smartFilters, internalOnly: e.target.checked })
                }
                className="mr-2 rounded"
              />
              <span className="text-gray-700">只看內部項目</span>
            </label>

            {/* Overdue Only Filter */}
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={smartFilters.overdueOnly}
                onChange={(e) =>
                  setSmartFilters({ ...smartFilters, overdueOnly: e.target.checked })
                }
                className="mr-2 rounded"
              />
              <span className="text-gray-700 flex items-center">
                只看逾期項目
                <span className="ml-1 text-red-500">⚠️</span>
              </span>
            </label>

            {/* Not Completed Filter */}
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={smartFilters.notCompleted}
                onChange={(e) =>
                  setSmartFilters({ ...smartFilters, notCompleted: e.target.checked })
                }
                className="mr-2 rounded"
              />
              <span className="text-gray-700">
                未完成
              </span>
            </label>

            {/* Target Resolution Date Range Filter */}
            <div className="md:col-span-2 lg:col-span-1">
              <label htmlFor="target-date-range-filter" className="block text-sm font-medium text-gray-700 mb-1">
                目標解決日期區間
              </label>
              <select
                id="target-date-range-filter"
                value={smartFilters.targetDateRange}
                onChange={(e) =>
                  setSmartFilters({ ...smartFilters, targetDateRange: e.target.value })
                }
                className="input-field text-sm w-full"
              >
                <option value="">全部日期</option>
                <option value="today">今天</option>
                <option value="yesterday">昨天</option>
                <option value="last7days">過去 7 天</option>
                <option value="last30days">過去 30 天</option>
                <option value="next7days">未來 7 天</option>
                <option value="next30days">未來 30 天</option>
                <option value="thisMonth">本月</option>
                <option value="lastMonth">上個月</option>
              </select>
            </div>

            {/* Clear All Filters Button */}
            {Object.values(smartFilters).some((v) => v) && (
              <button
                onClick={() =>
                  setSmartFilters({
                    myResponsibility: false,
                    clientOwner: false,
                    internalOnly: false,
                    overdueOnly: false,
                    escalatedOnly: false,
                    reportedDateRange: '',
                    targetDateRange: '',
                  })
                }
                className="text-sm text-primary-600 hover:text-primary-800 underline"
              >
                清除所有篩選
              </button>
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

      {/* Issue List */}
      {!loading && (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    編號
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    問題標題
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    類型
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    優先級
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    回報日期
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    目標解決日期
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    實際解決日期
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIssuesList.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                      {issuesList.length === 0 ? '暫無資料' : '無符合篩選條件的資料'}
                    </td>
                  </tr>
                ) : (
                  filteredIssuesList.map((item) => (
                    <tr key={item.issue_id} className={item.is_overdue ? 'bg-red-50' : ''}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.issue_number}
                        {item.is_escalated && (
                          <span className="ml-2 text-orange-500">⬆️</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate">
                          {item.issue_title}
                          {item.is_overdue && (
                            <span className="ml-2 text-red-500">⚠️</span>
                          )}
                        </div>
                        {item.affected_wbs && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <span className="font-semibold">影響:</span>
                            <span className="truncate">{item.affected_wbs}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.issue_type}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(item.reported_date, dateFormat)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(item.target_resolution_date, dateFormat)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(item.actual_resolution_date, dateFormat)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-primary-600 hover:text-primary-900"
                            title="編輯"
                          >
                            編輯
                          </button>
                          {item.status !== 'Resolved' && item.status !== 'Closed' && (
                            <>
                              <button
                                onClick={() => handleEscalate(item.issue_id)}
                                className="text-orange-600 hover:text-orange-900"
                                title="升級"
                              >
                                升級
                              </button>
                              <button
                                onClick={() => handleResolve(item.issue_id)}
                                className="text-green-600 hover:text-green-900"
                                title="解決"
                              >
                                解決
                              </button>
                            </>
                          )}
                          {item.status === 'Resolved' && item.status !== 'Closed' && (
                            <button
                              onClick={() => handleClose(item.issue_id)}
                              className="text-gray-600 hover:text-gray-900"
                              title="關閉"
                            >
                              關閉
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-900"
                            title="刪除"
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4 text-sm text-gray-600">
            {filteredIssuesList.length !== issuesList.length ? (
              <>
                顯示 {filteredIssuesList.length} 筆（共 {total} 筆資料）
              </>
            ) : (
              <>共 {total} 筆資料</>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default IssueList
