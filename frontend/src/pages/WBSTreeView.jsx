/**
 * WBS Tree View Component
 * Displays WBS items in hierarchical tree structure
 */
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import { useProjects } from '../hooks/useProjects'

const WBSTreeView = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const projectId = searchParams.get('project_id') || ''

  const [treeData, setTreeData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedNodes, setExpandedNodes] = useState(new Set())

  const { projectsList, fetchProjects } = useProjects()

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (projectId) {
      fetchTreeData()
    } else {
      setTreeData([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const fetchTreeData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/wbs/tree/${projectId}`)
      setTreeData(response.tree || [])
      // Auto-expand all nodes by default
      const allNodeIds = new Set()
      const collectNodeIds = (nodes) => {
        nodes.forEach(node => {
          allNodeIds.add(node.item_id)
          if (node.children && node.children.length > 0) {
            collectNodeIds(node.children)
          }
        })
      }
      collectNodeIds(response.tree || [])
      setExpandedNodes(allNodeIds)
    } catch (err) {
      setError(err.message || '載入樹狀結構失敗')
      setTreeData([])
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

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const expandAll = () => {
    const allNodeIds = new Set()
    const collectNodeIds = (nodes) => {
      nodes.forEach(node => {
        allNodeIds.add(node.item_id)
        if (node.children && node.children.length > 0) {
          collectNodeIds(node.children)
        }
      })
    }
    collectNodeIds(treeData)
    setExpandedNodes(new Set(allNodeIds))
  }

  const collapseAll = () => {
    // Force a complete state update by creating a new empty Set
    setExpandedNodes(() => new Set())
  }

  const getStatusColor = (status) => {
    switch (status) {
      case '已完成':
        return 'text-green-600 bg-green-50'
      case '進行中':
        return 'text-blue-600 bg-blue-50'
      case '未開始':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getProgressColor = (progress, variance) => {
    if (variance < -10) return 'text-red-600'
    if (variance < 0) return 'text-orange-600'
    if (variance > 10) return 'text-green-600'
    return 'text-gray-700'
  }

  const TreeNode = ({ node, level = 0 }) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.item_id)

    return (
      <div className="tree-node">
        <div
          className="flex items-center py-2 px-3 hover:bg-gray-50 border-b border-gray-100"
          style={{ paddingLeft: `${level * 2 + 0.75}rem` }}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-6 flex-shrink-0">
            {hasChildren && (
              <button
                onClick={() => toggleNode(node.item_id)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                {isExpanded ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* WBS ID */}
          <div className="w-24 flex-shrink-0 font-mono text-sm font-semibold text-gray-700">
            {node.wbs_id}
          </div>

          {/* Task Name */}
          <div className="flex-1 min-w-0 px-2">
            <span className="text-sm text-gray-900">{node.task_name}</span>
          </div>

          {/* Category */}
          <div className="w-20 flex-shrink-0 text-center">
            <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700">
              {node.category}
            </span>
          </div>

          {/* Owner */}
          <div className="w-32 flex-shrink-0 text-sm text-gray-600 truncate">
            {node.owner_unit}
          </div>

          {/* Status */}
          <div className="w-24 flex-shrink-0 text-center">
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(node.status)}`}>
              {node.status}
            </span>
          </div>

          {/* Progress */}
          <div className="w-32 flex-shrink-0 text-sm text-center">
            <span className={getProgressColor(node.actual_progress, node.progress_variance)}>
              {node.actual_progress}%
            </span>
            {node.progress_variance !== 0 && (
              <span className="text-xs ml-1">
                ({node.progress_variance > 0 ? '+' : ''}{node.progress_variance})
              </span>
            )}
          </div>

          {/* Dates */}
          <div className="w-64 flex-shrink-0 text-xs">
            {node.revised_planned_start || node.revised_planned_end ? (
              // Has revised schedule
              <div className="space-y-1">
                <div className="text-gray-400 line-through">
                  原: {node.original_planned_start} ~ {node.original_planned_end}
                </div>
                <div className="text-blue-600 font-semibold">
                  調: {node.revised_planned_start || node.original_planned_start} ~ {node.revised_planned_end || node.original_planned_end}
                </div>
              </div>
            ) : (
              // Only original schedule
              <div className="text-gray-600">
                {node.original_planned_start} ~ {node.original_planned_end}
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="tree-children">
            {node.children.map((child) => (
              <TreeNode key={child.item_id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">WBS 樹狀階層視圖</h1>
        <p className="text-gray-600">以階層結構查看專案 WBS 項目</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="flex items-end gap-2">
            <button
              onClick={expandAll}
              disabled={!projectId || loading}
              className="btn-secondary"
            >
              全部展開
            </button>
            <button
              onClick={collapseAll}
              disabled={!projectId || loading}
              className="btn-secondary"
            >
              全部折疊
            </button>
          </div>
        </div>
      </div>

      {/* Tree View */}
      {!projectId ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">請選擇專案以查看 WBS 樹狀結構</p>
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
      ) : treeData.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">此專案目前沒有 WBS 項目</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-3 py-3 flex items-center font-semibold text-sm text-gray-700">
            <div className="w-6 flex-shrink-0"></div>
            <div className="w-24 flex-shrink-0">WBS ID</div>
            <div className="flex-1 min-w-0 px-2">任務名稱</div>
            <div className="w-20 flex-shrink-0 text-center">類別</div>
            <div className="w-32 flex-shrink-0">負責單位</div>
            <div className="w-24 flex-shrink-0 text-center">狀態</div>
            <div className="w-32 flex-shrink-0 text-center">進度</div>
            <div className="w-64 flex-shrink-0">計畫期間 (原始/調整)</div>
          </div>

          {/* Tree Nodes */}
          <div className="tree-root">
            {treeData.map((node) => (
              <TreeNode key={node.item_id} node={node} level={0} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default WBSTreeView
