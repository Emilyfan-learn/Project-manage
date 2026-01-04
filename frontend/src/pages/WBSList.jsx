/**
 * WBS List Page Component
 */
import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useWBS } from '../hooks/useWBS'
import { useExcel } from '../hooks/useExcel'
import { useProjects } from '../hooks/useProjects'
import { useIssues } from '../hooks/useIssues'
import { useSettings } from '../hooks/useSettings'
import { formatDateShort } from '../utils/dateFormat'
import WBSForm from '../components/WBSForm'

const WBSList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [projectId, setProjectId] = useState(searchParams.get('project') || '')
  const [highlightItemId, setHighlightItemId] = useState(searchParams.get('highlight') || '')
  const [filters, setFilters] = useState({
    status: '',
    parent_wbs_id: '', // 新增父WBS ID篩選
  })
  const [smartFilters, setSmartFilters] = useState({
    overdueOnly: false,
    behindScheduleOnly: false,
    dueThisWeek: false,
    notCompleted: false,
    internalOnly: false,
    ownerUnit: '',
    wbsCode: '',
  })
  const [successMessage, setSuccessMessage] = useState('')
  const [continueAdding, setContinueAdding] = useState(false) // 用於連續新增
  const [expandedItems, setExpandedItems] = useState(new Set()) // 追蹤展開的項目
  const [initialExpand, setInitialExpand] = useState(false) // 追蹤是否已初始展開
  const [currentPage, setCurrentPage] = useState(1) // 當前頁碼
  const fileInputRef = useRef(null)
  const highlightRef = useRef(null)

  const {
    wbsList,
    loading,
    error,
    total,
    fetchWBS,
    createWBS,
    updateWBS,
    deleteWBS,
  } = useWBS()

  const {
    loading: excelLoading,
    error: excelError,
    importWBSFromExcel,
    exportWBSToExcel,
    downloadWBSTemplate,
  } = useExcel()

  const {
    projectsList,
    fetchProjects,
  } = useProjects()

  const {
    issuesList,
    fetchIssues,
  } = useIssues()

  const { systemSettings, fetchSystemSettings, getSystemSetting } = useSettings()

  useEffect(() => {
    fetchProjects()
    fetchSystemSettings()
  }, [fetchProjects, fetchSystemSettings])

  // Auto-select default project or first project if none selected
  useEffect(() => {
    // Wait for both projectsList and systemSettings to be loaded
    if (!projectId && projectsList.length > 0 && systemSettings.length > 0) {
      const defaultProject = getSystemSetting('default_project_id', '')
      // Use default project if it exists in the list, otherwise use first project
      const projectExists = projectsList.some(p => p.project_id === defaultProject)
      setProjectId(projectExists ? defaultProject : projectsList[0].project_id)
    }
  }, [projectId, projectsList, systemSettings, getSystemSetting])

  useEffect(() => {
    if (projectId) {
      const itemsPerPage = getSystemSetting('items_per_page', 1000)
      fetchIssues({ project_id: projectId, limit: itemsPerPage })
    }
  }, [fetchIssues, projectId, systemSettings, getSystemSetting])

  // Check if any frontend-only filters are active
  const hasFrontendFilters = filters.parent_wbs_id ||
    smartFilters.overdueOnly ||
    smartFilters.behindScheduleOnly ||
    smartFilters.dueThisWeek ||
    smartFilters.notCompleted ||
    smartFilters.internalOnly ||
    smartFilters.ownerUnit ||
    smartFilters.wbsCode ||
    filters.status === 'not_completed'

  useEffect(() => {
    if (projectId) {
      // When frontend filters are active, fetch all data to filter/paginate on client
      if (hasFrontendFilters) {
        fetchWBS({ project_id: projectId, limit: 10000, skip: 0 })
      } else {
        const itemsPerPage = getSystemSetting('items_per_page', 1000)
        const skip = (currentPage - 1) * itemsPerPage
        // Only pass backend-supported filters (status), not frontend-only filters (parent_wbs_id)
        const backendFilters = {}
        if (filters.status && filters.status !== 'not_completed') {
          backendFilters.status = filters.status
        }
        fetchWBS({ project_id: projectId, ...backendFilters, limit: itemsPerPage, skip })
      }
    }
  }, [fetchWBS, projectId, filters, currentPage, systemSettings, getSystemSetting, hasFrontendFilters])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [projectId, filters, smartFilters])

  // Update URL when projectId changes (preserve other params like highlight)
  useEffect(() => {
    if (projectId) {
      const newParams = new URLSearchParams(searchParams)
      newParams.set('project', projectId)
      setSearchParams(newParams)
    }
  }, [projectId])

  // Sync highlightItemId with URL parameter when navigating from Dashboard
  useEffect(() => {
    const highlightFromUrl = searchParams.get('highlight') || ''
    console.log('[WBSList] URL highlight param changed:', highlightFromUrl, 'current state:', highlightItemId)
    if (highlightFromUrl && highlightFromUrl !== highlightItemId) {
      setHighlightItemId(highlightFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Scroll to highlighted item when list loads
  useEffect(() => {
    console.log('[WBSList] Highlight check:', { highlightItemId, wbsListLength: wbsList.length, loading, showForm })
    if (highlightItemId && wbsList.length > 0 && !loading && !showForm) {
      console.log('[WBSList] Highlight effect triggered:', highlightItemId)
      console.log('[WBSList] Available item_ids:', wbsList.map(w => w.item_id))
      // Check if there's a matching item
      const matchingItem = wbsList.find(w => w.item_id === highlightItemId)
      console.log('[WBSList] Matching item found:', matchingItem ? matchingItem.item_id : 'NOT FOUND')
      // Wait for DOM to render after form closes
      const timer = setTimeout(() => {
        console.log('[WBSList] Looking for ref:', highlightRef.current)
        if (highlightRef.current) {
          highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          console.log('[WBSList] Scrolled to item')
        } else {
          console.log('[WBSList] Ref not found - item might not be in current view/page')
        }
      }, 500)

      // Clear highlight after 5 seconds
      const clearTimer = setTimeout(() => {
        setHighlightItemId('')
      }, 5000)

      return () => {
        clearTimeout(timer)
        clearTimeout(clearTimer)
      }
    }
  }, [highlightItemId, wbsList, loading, showForm])

  // Auto-expand all items on initial load
  useEffect(() => {
    if (wbsList.length > 0 && !initialExpand) {
      // Collect all WBS IDs that have children
      const allWbsIds = new Set()
      const tree = buildHierarchyTree(wbsList)
      const collectIds = (items) => {
        items.forEach(item => {
          if (item.children && item.children.length > 0) {
            allWbsIds.add(item.wbs_id)
            collectIds(item.children)
          }
        })
      }
      collectIds(tree)
      setExpandedItems(allWbsIds)
      setInitialExpand(true)
    }
  }, [wbsList, initialExpand])

  const handleCreate = () => {
    setEditingItem(null)
    setShowForm(true)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleDelete = async (item) => {
    if (window.confirm(`確定要刪除 WBS 項目「${item.task_name}」嗎？`)) {
      try {
        await deleteWBS(item.item_id)
        alert('刪除成功')
        // Refresh the WBS list
        const itemsPerPage = getSystemSetting('items_per_page', 1000)
        fetchWBS({ project_id: projectId, ...filters, limit: itemsPerPage })
      } catch (err) {
        alert(`刪除失敗: ${err.message}`)
      }
    }
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingItem) {
        const editedItemId = editingItem.item_id
        await updateWBS(editedItemId, formData)
        setSuccessMessage('更新成功')
        setShowForm(false)
        setEditingItem(null)
        setContinueAdding(false)
        // Highlight the edited item after returning to list
        setHighlightItemId(editedItemId)
      } else {
        const newItem = await createWBS(formData)
        setSuccessMessage('新增成功')
        // 如果是新增，保持在表單頁面以繼續新增
        setEditingItem(null)
        setContinueAdding(true)
        // Highlight the newly created item
        if (newItem && newItem.item_id) {
          setHighlightItemId(newItem.item_id)
        }
        // 不關閉表單，讓用戶可以繼續新增
      }
      // Refresh the WBS list to show the new/updated item
      const itemsPerPage = getSystemSetting('items_per_page', 1000)
      fetchWBS({ project_id: projectId, ...filters, limit: itemsPerPage })
    } catch (err) {
      alert(`操作失敗: ${err.message}`)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingItem(null)
    setContinueAdding(false)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!projectId) {
      alert('請先選擇專案')
      return
    }

    try {
      const result = await importWBSFromExcel(file, projectId)

      // 構建訊息
      let message = `成功匯入 ${result.imported} 筆，失敗 ${result.failed} 筆`

      // 如果有失敗項目，顯示詳細錯誤
      if (result.failed > 0 && result.failed_items) {
        message += '\n\n失敗項目詳情：'
        result.failed_items.forEach(item => {
          message += `\n第 ${item.row} 行 (${item.wbs_id}): ${item.error}`
        })
      }

      if (result.imported > 0) {
        setSuccessMessage(message)
      } else {
        alert('匯入失敗\n' + message)
      }

      // Refresh WBS list if any items were imported
      if (result.imported > 0) {
        const itemsPerPage = getSystemSetting('items_per_page', 1000)
        await fetchWBS({ project_id: projectId, ...filters, limit: itemsPerPage })
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      alert(`匯入失敗: ${err.message}`)
    }
  }

  const handleExport = async () => {
    if (!projectId) {
      alert('請先選擇專案')
      return
    }

    try {
      await exportWBSToExcel(projectId)
      setSuccessMessage('匯出成功！')
    } catch (err) {
      alert(`匯出失敗: ${err.message}`)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      await downloadWBSTemplate()
      setSuccessMessage('範本下載成功！')
    } catch (err) {
      alert(`下載範本失敗: ${err.message}`)
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case '已完成':
        return 'bg-green-100 text-green-800'
      case '進行中':
        return 'bg-blue-100 text-blue-800'
      case '未開始':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressColor = (variance) => {
    if (variance > 0) return 'text-green-600'
    if (variance < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  // Toggle expand/collapse for an item
  const toggleExpand = (wbsId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(wbsId)) {
        newSet.delete(wbsId)
      } else {
        newSet.add(wbsId)
      }
      return newSet
    })
  }

  // Expand all items
  const expandAll = () => {
    const allWbsIds = new Set()
    const collectIds = (items) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          allWbsIds.add(item.wbs_id)
          collectIds(item.children)
        }
      })
    }
    const tree = buildHierarchyTree(wbsList)
    collectIds(tree)
    setExpandedItems(allWbsIds)
  }

  // Collapse all items
  const collapseAll = () => {
    setExpandedItems(new Set())
  }

  // Build hierarchy tree structure
  const buildHierarchyTree = (items) => {
    // Create a map for quick lookup
    const itemMap = new Map()
    items.forEach(item => {
      itemMap.set(item.wbs_id, { ...item, children: [] })
    })

    // Build parent-child relationships
    const topLevel = []
    items.forEach(item => {
      const node = itemMap.get(item.wbs_id)
      if (!item.parent_id) {
        // Top-level item
        topLevel.push(node)
      } else {
        // Find parent and add as child
        const parentWbsId = item.parent_id.includes('_')
          ? item.parent_id.split('_')[1]
          : item.parent_id
        const parent = itemMap.get(parentWbsId)
        if (parent) {
          parent.children.push(node)
        } else {
          // Parent not found, treat as top-level
          topLevel.push(node)
        }
      }
    })

    // Sort children recursively
    const sortChildren = (node) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => {
          const aParts = a.wbs_id.split('.').map(Number)
          const bParts = b.wbs_id.split('.').map(Number)
          for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aNum = aParts[i] || 0
            const bNum = bParts[i] || 0
            if (aNum !== bNum) return aNum - bNum
          }
          return 0
        })
        node.children.forEach(child => sortChildren(child))
      }
    }

    // Sort top-level items
    topLevel.sort((a, b) => {
      const aParts = a.wbs_id.split('.').map(Number)
      const bParts = b.wbs_id.split('.').map(Number)
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aNum = aParts[i] || 0
        const bNum = bParts[i] || 0
        if (aNum !== bNum) return aNum - bNum
      }
      return 0
    })

    topLevel.forEach(node => sortChildren(node))

    // Debug: Log tree structure
    if (topLevel.length > 0) {
      console.log('WBS Tree Structure:', topLevel.map(node => ({
        wbs_id: node.wbs_id,
        task_name: node.task_name,
        children_count: node.children?.length || 0,
        children: node.children?.map(child => child.wbs_id)
      })))
    }

    return topLevel
  }

  // Flatten hierarchy tree for display (considering expand/collapse state)
  const flattenHierarchy = (tree, level = 0) => {
    const result = []
    tree.forEach(node => {
      result.push({ ...node, level })
      // Only show children if this node is expanded
      if (node.children && node.children.length > 0 && expandedItems.has(node.wbs_id)) {
        result.push(...flattenHierarchy(node.children, level + 1))
      }
    })
    return result
  }

  // Apply smart filters to WBS list
  const getFilteredWBSList = () => {
    let filtered = [...wbsList]

    // Filter: Parent WBS ID (show parent and its children)
    if (filters.parent_wbs_id) {
      filtered = filtered.filter((item) => {
        // Show the parent item itself
        if (item.wbs_id === filters.parent_wbs_id) return true

        // Show children of this parent
        if (item.parent_id) {
          const parentWbsId = item.parent_id.includes('_')
            ? item.parent_id.split('_')[1]
            : item.parent_id
          return parentWbsId === filters.parent_wbs_id
        }

        return false
      })
    }

    // Filter: Owner Unit
    if (smartFilters.ownerUnit && smartFilters.ownerUnit.trim()) {
      filtered = filtered.filter((item) =>
        item.owner_unit?.toLowerCase().includes(smartFilters.ownerUnit.toLowerCase())
      )
    }

    // Filter: WBS Code
    if (smartFilters.wbsCode && smartFilters.wbsCode.trim()) {
      filtered = filtered.filter((item) =>
        item.wbs_id?.toLowerCase().includes(smartFilters.wbsCode.toLowerCase())
      )
    }

    // Filter: Only overdue items
    if (smartFilters.overdueOnly) {
      filtered = filtered.filter((item) => item.is_overdue === true)
    }

    // Filter: Only behind schedule items (progress lag threshold exceeded)
    if (smartFilters.behindScheduleOnly) {
      filtered = filtered.filter((item) => item.is_behind_schedule === true)
    }

    // Filter: Due this week
    if (smartFilters.dueThisWeek) {
      const today = new Date()
      const weekFromNow = new Date(today)
      weekFromNow.setDate(today.getDate() + 7)

      filtered = filtered.filter((item) => {
        const endDate =
          item.revised_planned_end || item.original_planned_end
        if (!endDate) return false

        const end = new Date(endDate)
        return end >= today && end <= weekFromNow
      })
    }

    // Filter: Not completed (exclude 已完成)
    if (smartFilters.notCompleted) {
      filtered = filtered.filter((item) => item.status !== '已完成')
    }

    // Filter: Status dropdown with special "not_completed" option
    if (filters.status === 'not_completed') {
      filtered = filtered.filter((item) => item.status !== '已完成')
    }

    // Filter: Internal only (is_internal = true)
    if (smartFilters.internalOnly) {
      filtered = filtered.filter((item) => item.is_internal === true)
    }

    // Build hierarchy tree
    const tree = buildHierarchyTree(filtered)
    // Flatten for display based on expand/collapse state
    return flattenHierarchy(tree)
  }

  const allFilteredWBSList = getFilteredWBSList()

  // Calculate pagination values
  const itemsPerPage = getSystemSetting('items_per_page', 100)
  const dateFormat = getSystemSetting('date_format', 'yyyy/MM/dd')
  const filteredTotal = hasFrontendFilters ? allFilteredWBSList.length : total
  const totalPages = Math.ceil(filteredTotal / itemsPerPage)

  // Apply client-side pagination when frontend filters are active
  const filteredWBSList = hasFrontendFilters
    ? allFilteredWBSList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : allFilteredWBSList

  // Get count of related issues for a WBS ID
  const getRelatedIssuesCount = (wbsId) => {
    if (!issuesList || issuesList.length === 0) return 0

    return issuesList.filter((issue) => {
      if (!issue.affected_wbs) return false
      // affected_wbs is a comma-separated string
      const affectedWBSIds = issue.affected_wbs.split(',').map((id) => id.trim())
      return affectedWBSIds.includes(wbsId)
    }).length
  }

  if (showForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <WBSForm
          initialData={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          projectId={projectId}
          availableWBSList={wbsList}
        />
        {/* 新增成功後顯示回到列表按鈕 */}
        {continueAdding && !editingItem && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleCancel}
              className="btn-secondary"
            >
              ← 回到列表
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">WBS 項目管理</h1>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="btn-secondary"
              disabled={excelLoading}
            >
              📥 下載範本
            </button>
            <button
              onClick={handleImportClick}
              className="btn-secondary"
              disabled={excelLoading || !projectId}
            >
              📤 匯入 Excel
            </button>
            <button
              onClick={handleExport}
              className="btn-secondary"
              disabled={excelLoading || !projectId}
            >
              📊 匯出 Excel
            </button>
            <button onClick={handleCreate} className="btn-primary">
              + 新增 WBS
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls"
          className="hidden"
        />

        {/* Filters */}
        <div className="flex gap-4 items-center">
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
            <label htmlFor="parent-wbs-filter" className="label">
              父 WBS ID
            </label>
            <select
              id="parent-wbs-filter"
              value={filters.parent_wbs_id}
              onChange={(e) => setFilters({ ...filters, parent_wbs_id: e.target.value })}
              className="input-field"
            >
              <option value="">全部</option>
              {(() => {
                // Only show top-level WBS items (those without parent_id)
                const topLevelItems = wbsList.filter(item => !item.parent_id)
                return topLevelItems.sort((a, b) => {
                  const aParts = a.wbs_id.split('.').map(Number)
                  const bParts = b.wbs_id.split('.').map(Number)
                  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                    const aNum = aParts[i] || 0
                    const bNum = bParts[i] || 0
                    if (aNum !== bNum) return aNum - bNum
                  }
                  return 0
                }).map(item => (
                  <option key={item.item_id} value={item.wbs_id}>
                    {item.wbs_id} - {item.task_name}
                  </option>
                ))
              })()}
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
              <option value="未開始">未開始</option>
              <option value="進行中">進行中</option>
              <option value="已完成">已完成</option>
            </select>
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                // Trigger re-fetch by resetting page (useEffect will handle the fetch)
                setCurrentPage(1)
              }}
              className="btn-secondary"
            >
              搜尋
            </button>
          </div>
        </div>

        {/* Smart Filters */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">智慧篩選</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Owner Unit Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700 font-medium">負責單位</label>
              <input
                type="text"
                value={smartFilters.ownerUnit}
                onChange={(e) =>
                  setSmartFilters({ ...smartFilters, ownerUnit: e.target.value })
                }
                placeholder="輸入負責單位"
                className="input-field text-sm"
              />
            </div>

            {/* WBS Code Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700 font-medium">WBS Code</label>
              <input
                type="text"
                value={smartFilters.wbsCode}
                onChange={(e) =>
                  setSmartFilters({ ...smartFilters, wbsCode: e.target.value })
                }
                placeholder="輸入 WBS 編號"
                className="input-field text-sm"
              />
            </div>

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

            {/* Behind Schedule Only Filter */}
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={smartFilters.behindScheduleOnly}
                onChange={(e) =>
                  setSmartFilters({ ...smartFilters, behindScheduleOnly: e.target.checked })
                }
                className="mr-2 rounded"
              />
              <span className="text-gray-700 flex items-center">
                只看進度落後
                <span className="ml-1 text-yellow-500">📉</span>
              </span>
            </label>

            {/* Due This Week Filter */}
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={smartFilters.dueThisWeek}
                onChange={(e) =>
                  setSmartFilters({ ...smartFilters, dueThisWeek: e.target.checked })
                }
                className="mr-2 rounded"
              />
              <span className="text-gray-700">只看本週到期</span>
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
              <span className="text-gray-700">未完成</span>
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
              <span className="text-gray-700">內部安排</span>
            </label>

            {/* Clear All Filters Button */}
            {(smartFilters.ownerUnit || smartFilters.wbsCode || smartFilters.overdueOnly || smartFilters.behindScheduleOnly || smartFilters.dueThisWeek || smartFilters.notCompleted || smartFilters.internalOnly) && (
              <button
                onClick={() =>
                  setSmartFilters({
                    overdueOnly: false,
                    behindScheduleOnly: false,
                    dueThisWeek: false,
                    notCompleted: false,
                    internalOnly: false,
                    ownerUnit: '',
                    wbsCode: '',
                  })
                }
                className="text-sm text-primary-600 hover:text-primary-800 underline self-end"
              >
                清除所有篩選
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {(error || excelError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || excelError}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">載入中...</p>
        </div>
      )}

      {/* WBS List */}
      {!loading && (
        <>
          {/* Top Pagination Controls */}
          {totalPages > 1 && (
            <div className="mb-3 flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-sm text-gray-600">
                共 {filteredTotal} 筆，第 {currentPage} / {totalPages} 頁
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← 上一頁
                </button>
                <select
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <option key={page} value={page}>第 {page} 頁</option>
                  ))}
                </select>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一頁 →
                </button>
              </div>
            </div>
          )}

          {/* Hierarchy Controls */}
          <div className="mb-3 flex justify-end gap-2">
            <button
              onClick={expandAll}
              className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
            >
              ➕ 全部展開
            </button>
            <button
              onClick={collapseAll}
              className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
            >
              ➖ 全部收起
            </button>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '120px' }}>
                    WBS ID
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '150px' }}>
                    任務名稱
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '100px' }}>
                    負責單位
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '85px' }}>
                    預計開始
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '85px' }}>
                    預計結束
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '85px' }}>
                    調整開始
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '85px' }}>
                    調整結束
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '100px' }}>
                    進度
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '70px' }}>
                    狀態
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '100px' }}>
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWBSList.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                      {wbsList.length === 0 ? '暫無資料' : '無符合篩選條件的資料'}
                    </td>
                  </tr>
                ) : (
                  filteredWBSList.map((item) => {
                    const isHighlighted = item.item_id === highlightItemId
                    return (
                    <tr
                      key={item.item_id}
                      ref={isHighlighted ? highlightRef : null}
                      className={`${item.is_overdue ? 'bg-red-50' : ''} ${isHighlighted ? 'bg-yellow-200 animate-pulse ring-2 ring-yellow-400' : ''}`}
                    >
                      {/* WBS ID 欄位 */}
                      <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        <div className="flex items-center gap-1">
                          {/* Indentation based on level */}
                          <span style={{ width: `${item.level * 20}px` }} className="inline-block"></span>

                          {/* Expand/Collapse button */}
                          {item.children && item.children.length > 0 ? (
                            <button
                              onClick={() => toggleExpand(item.wbs_id)}
                              className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                              title={expandedItems.has(item.wbs_id) ? '收起' : '展開'}
                            >
                              {expandedItems.has(item.wbs_id) ? '▼' : '▶'}
                            </button>
                          ) : (
                            <span className="w-5 h-5 inline-block"></span>
                          )}

                          {/* WBS ID */}
                          <span className={item.level > 0 ? 'text-blue-600' : 'text-gray-900 font-bold'}>
                            {item.wbs_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-900">
                        <div className="flex items-center gap-1">
                          <span className={item.level > 0 ? 'font-normal' : 'font-semibold'}>
                            {item.task_name}
                          </span>
                          {item.is_overdue && (
                            <span className="text-red-500" title="逾期">⚠️</span>
                          )}
                          {item.is_behind_schedule && !item.is_overdue && (
                            <span className="text-yellow-500" title="進度落後">📉</span>
                          )}
                          {(() => {
                            const issueCount = getRelatedIssuesCount(item.wbs_id)
                            return issueCount > 0 ? (
                              <span
                                className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full font-semibold"
                                title={`${issueCount} 個相關問題`}
                              >
                                {issueCount} 問題
                              </span>
                            ) : null
                          })()}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                        {item.owner_unit || '-'}
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">
                        {formatDateShort(item.original_planned_start, dateFormat)}
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">
                        {formatDateShort(item.original_planned_end, dateFormat)}
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">
                        {item.revised_planned_start ? (
                          <span className="text-blue-600">{formatDateShort(item.revised_planned_start, dateFormat)}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">
                        {item.revised_planned_end ? (
                          <span className="text-blue-600">{formatDateShort(item.revised_planned_end, dateFormat)}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${item.actual_progress}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-900 font-semibold">{item.actual_progress}%</span>
                            {item.progress_variance !== undefined && item.progress_variance !== 0 && (
                              <span className={`ml-2 text-xs ${getProgressColor(item.progress_variance)}`}>
                                ({item.progress_variance > 0 ? '+' : ''}{item.progress_variance})
                              </span>
                            )}
                          </div>
                          {item.estimated_progress !== undefined && (
                            <div className="text-xs text-gray-500 mt-1">
                              預估: {item.estimated_progress}%
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 inline-flex text-xs leading-tight font-semibold rounded ${getStatusBadgeColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs font-medium">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-primary-600 hover:text-primary-900 mr-2"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900"
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>

          {/* Summary and Pagination */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {hasFrontendFilters ? (
                <>
                  篩選結果 {filteredTotal} 筆
                  {totalPages > 1 && ` | 顯示第 ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredTotal)} 筆`}
                </>
              ) : (
                <>
                  共 {total} 筆資料
                  {totalPages > 1 && ` | 顯示第 ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, total)} 筆`}
                </>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← 上一頁
                </button>

                <span className="text-sm text-gray-600">
                  第 {currentPage} / {totalPages} 頁
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一頁 →
                </button>

                {/* Quick page jump */}
                <select
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <option key={page} value={page}>第 {page} 頁</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default WBSList
