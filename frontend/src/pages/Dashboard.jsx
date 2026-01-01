/**
 * Dashboard Home Page Component - Enhanced Version
 */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

const Dashboard = () => {
  const [stats, setStats] = useState({
    projects: { total: 0, active: 0 },
    wbs: { total: 0, completed: 0, inProgress: 0, notStarted: 0, overdue: 0 },
    pending: { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 },
    issues: { total: 0, open: 0, inProgress: 0, resolved: 0, critical: 0 },
    dependencies: { total: 0, active: 0 },
  })
  const [overdueItems, setOverdueItems] = useState([])
  const [shouldStartItems, setShouldStartItems] = useState([])
  const [dueTodayItems, setDueTodayItems] = useState([])
  const [dueSoonItems, setDueSoonItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch all data in parallel
      const [projectsRes, wbsRes, pendingRes, issuesRes, depsRes] = await Promise.all([
        api.get('/projects/'),
        api.get('/wbs/', { params: { limit: 1000 } }),
        api.get('/pending/', { params: { limit: 1000 } }),
        api.get('/issues/', { params: { limit: 1000 } }),
        api.get('/dependencies/').catch(() => ({ items: [], total: 0 })),
      ])

      // Calculate project stats
      const activeProjects = projectsRes.items?.filter(
        (p) => p.status === 'Active' || p.status === '進行中'
      ).length || 0

      // Calculate WBS stats
      const wbsItems = wbsRes.items || []
      const completedWBS = wbsItems.filter((w) => w.status === '已完成').length
      const inProgressWBS = wbsItems.filter((w) => w.status === '進行中').length
      const notStartedWBS = wbsItems.filter((w) => w.status === '未開始').length
      const overdueWBS = wbsItems.filter((w) => w.is_overdue && w.status !== '已完成').length

      // Calculate pending stats
      const pendingItems = pendingRes.items || []
      const pendingPending = pendingItems.filter((p) => p.status === '待處理').length
      const inProgressPending = pendingItems.filter((p) => p.status === '處理中').length
      const completedPending = pendingItems.filter((p) => p.status === '已完成').length
      const overduePending = pendingItems.filter((p) => {
        if (!p.expected_reply_date || p.status === '已完成') return false
        const dueDate = new Date(p.expected_reply_date)
        return dueDate < new Date()
      }).length

      // Calculate issue stats
      const issueItems = issuesRes.items || []
      const openIssues = issueItems.filter((i) => i.status === 'Open').length
      const inProgressIssues = issueItems.filter((i) => i.status === 'In Progress').length
      const resolvedIssues = issueItems.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length
      const criticalIssues = issueItems.filter((i) =>
        (i.severity === 'Critical' || i.priority === 'Urgent') &&
        i.status !== 'Resolved' && i.status !== 'Closed'
      ).length

      // Calculate dependency stats
      const depsItems = depsRes.items || []
      const activeDeps = depsItems.filter((d) => d.is_active).length

      setStats({
        projects: {
          total: projectsRes.total || 0,
          active: activeProjects,
        },
        wbs: {
          total: wbsRes.total || 0,
          completed: completedWBS,
          inProgress: inProgressWBS,
          notStarted: notStartedWBS,
          overdue: overdueWBS,
        },
        pending: {
          total: pendingRes.total || 0,
          pending: pendingPending,
          inProgress: inProgressPending,
          completed: completedPending,
          overdue: overduePending,
        },
        issues: {
          total: issuesRes.total || 0,
          open: openIssues,
          inProgress: inProgressIssues,
          resolved: resolvedIssues,
          critical: criticalIssues,
        },
        dependencies: {
          total: depsRes.total || 0,
          active: activeDeps,
        },
      })

      // Collect overdue items
      const overdue = [
        ...wbsItems
          .filter((w) => w.is_overdue && w.status !== '已完成')
          .map((w) => ({
            type: 'WBS',
            id: w.wbs_id,
            code: w.wbs_id,
            name: w.task_name,
            dueDate: w.revised_planned_end || w.original_planned_end,
            status: w.status,
            projectId: w.project_id,
          })),
        ...pendingItems
          .filter((p) => {
            if (!p.expected_reply_date || p.status === '已完成') return false
            const dueDate = new Date(p.expected_reply_date)
            return dueDate < new Date()
          })
          .map((p) => ({
            type: 'Pending',
            id: p.pending_id,
            code: p.pending_id,
            name: p.description,
            dueDate: p.expected_reply_date,
            status: p.status,
            projectId: p.project_id,
          })),
        ...issueItems
          .filter((i) => {
            if (!i.target_resolution_date || i.status === 'Resolved' || i.status === 'Closed') return false
            const dueDate = new Date(i.target_resolution_date)
            return dueDate < new Date()
          })
          .map((i) => ({
            type: 'Issue',
            id: i.issue_id,
            code: i.issue_id,
            name: i.issue_title,
            dueDate: i.target_resolution_date,
            status: i.status,
            projectId: i.project_id,
          })),
      ]
      setOverdueItems(overdue.slice(0, 5))

      // Collect items that should have started but haven't
      const now = new Date()
      const shouldStart = [
        ...wbsItems
          .filter((w) => {
            // Skip completed items
            if (w.status === '已完成') return false

            // Get the planned start date (revised takes priority)
            const startDate = w.revised_planned_start || w.original_planned_start
            if (!startDate) return false

            const plannedStart = new Date(startDate)

            // Check if planned start date has passed
            if (plannedStart > now) return false

            // Check if not actually started (no actual start date OR status is still "未開始")
            return !w.actual_start_date || w.status === '未開始'
          })
          .map((w) => ({
            type: 'WBS',
            id: w.wbs_id,
            code: w.wbs_id,
            name: w.task_name,
            startDate: w.revised_planned_start || w.original_planned_start,
            status: w.status,
            projectId: w.project_id,
          })),
      ]
      setShouldStartItems(shouldStart.slice(0, 5))

      // Collect items due today
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const dueToday = [
        ...wbsItems
          .filter((w) => {
            if (w.status === '已完成') return false
            const dueDate = new Date(w.revised_planned_end || w.original_planned_end)
            dueDate.setHours(0, 0, 0, 0)
            return dueDate.getTime() === today.getTime()
          })
          .map((w) => ({
            type: 'WBS',
            id: w.wbs_id,
            code: w.wbs_id,
            name: w.task_name,
            dueDate: w.revised_planned_end || w.original_planned_end,
            status: w.status,
            projectId: w.project_id,
          })),
        ...pendingItems
          .filter((p) => {
            if (!p.expected_reply_date || p.status === '已完成') return false
            const dueDate = new Date(p.expected_reply_date)
            dueDate.setHours(0, 0, 0, 0)
            return dueDate.getTime() === today.getTime()
          })
          .map((p) => ({
            type: 'Pending',
            id: p.pending_id,
            code: p.pending_id,
            name: p.description,
            dueDate: p.expected_reply_date,
            status: p.status,
            projectId: p.project_id,
          })),
        ...issueItems
          .filter((i) => {
            if (!i.target_resolution_date || i.status === 'Resolved' || i.status === 'Closed') return false
            const dueDate = new Date(i.target_resolution_date)
            dueDate.setHours(0, 0, 0, 0)
            return dueDate.getTime() === today.getTime()
          })
          .map((i) => ({
            type: 'Issue',
            id: i.issue_id,
            code: i.issue_id,
            name: i.issue_title,
            dueDate: i.target_resolution_date,
            status: i.status,
            projectId: i.project_id,
          })),
      ]
      setDueTodayItems(dueToday.slice(0, 5))

      // Collect items due in 7 days
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const dueSoon = [
        ...wbsItems
          .filter((w) => {
            if (w.status === '已完成') return false
            const dueDate = new Date(w.revised_planned_end || w.original_planned_end)
            return dueDate > now && dueDate <= sevenDaysLater
          })
          .map((w) => ({
            type: 'WBS',
            id: w.wbs_id,
            code: w.wbs_id,
            name: w.task_name,
            dueDate: w.revised_planned_end || w.original_planned_end,
            daysUntilDue: Math.ceil((new Date(w.revised_planned_end || w.original_planned_end) - now) / (1000 * 60 * 60 * 24)),
            projectId: w.project_id,
          })),
        ...pendingItems
          .filter((p) => {
            if (!p.expected_reply_date || p.status === '已完成') return false
            const dueDate = new Date(p.expected_reply_date)
            return dueDate > now && dueDate <= sevenDaysLater
          })
          .map((p) => ({
            type: 'Pending',
            id: p.pending_id,
            code: p.pending_id,
            name: p.description,
            dueDate: p.expected_reply_date,
            daysUntilDue: Math.ceil((new Date(p.expected_reply_date) - now) / (1000 * 60 * 60 * 24)),
            projectId: p.project_id,
          })),
      ]
      setDueSoonItems(dueSoon.slice(0, 5))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, color, icon, link, alert }) => (
    <Link
      to={link}
      className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 ${
        alert ? 'ring-2 ring-red-500' : ''
      }`}
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate flex items-center gap-2">
              {icon && <span>{icon}</span>}
              {title}
              {alert && <span className="text-red-500">⚠️</span>}
            </dt>
            <dd className="mt-1">
              <div className={`text-3xl font-semibold ${color}`}>{value}</div>
              {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
            </dd>
          </div>
        </div>
      </div>
    </Link>
  )

  const getHealthStatus = () => {
    const totalOverdue = stats.wbs.overdue + stats.pending.overdue
    const totalItems = stats.wbs.total + stats.pending.total
    const overduePercentage = totalItems > 0 ? (totalOverdue / totalItems) * 100 : 0

    if (overduePercentage === 0) return { color: 'green', label: '健康', icon: '🟢' }
    if (overduePercentage < 10) return { color: 'yellow', label: '注意', icon: '🟡' }
    return { color: 'red', label: '警告', icon: '🔴' }
  }

  const healthStatus = getHealthStatus()

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">專案追蹤管理系統</h2>
              <p className="text-gray-600">整合式專案管理儀表板</p>
            </div>
            <div className="text-center">
              <div className={`text-5xl ${healthStatus.icon}`}>{healthStatus.icon}</div>
              <div className={`text-sm font-semibold mt-1 text-${healthStatus.color}-600`}>
                {healthStatus.label}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Due Items - Highest Priority */}
        {dueTodayItems.length > 0 && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded shadow-md">
            <div className="flex items-center mb-3">
              <span className="text-blue-700 font-bold text-xl">🎯 今日到期項目 ({dueTodayItems.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dueTodayItems.map((item, idx) => {
                const linkTo = item.type === 'WBS'
                  ? `/wbs?project=${item.projectId}`
                  : item.type === 'Pending'
                    ? `/pending?project=${item.projectId}`
                    : `/issues?project=${item.projectId}`
                return (
                  <Link
                    key={idx}
                    to={linkTo}
                    className="bg-white p-3 rounded border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="text-sm text-blue-900 flex justify-between items-center">
                      <span className="flex-1">
                        <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold mr-2">
                          {item.type}
                        </span>
                        <span className="text-blue-600 font-mono text-xs mr-2">[{item.code}]</span>
                        <span className="font-medium hover:text-blue-700">{item.name}</span>
                      </span>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded ml-2">
                        {item.status}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Alert Sections */}
        {(overdueItems.length > 0 || shouldStartItems.length > 0 || stats.issues.critical > 0) && (
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Overdue Items */}
            {overdueItems.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center mb-2">
                  <span className="text-red-600 font-semibold text-lg">⚠️ 逾期項目 ({overdueItems.length})</span>
                </div>
                <div className="space-y-2">
                  {overdueItems.map((item, idx) => {
                    const linkTo = item.type === 'WBS'
                      ? `/wbs?project=${item.projectId}`
                      : item.type === 'Pending'
                        ? `/pending?project=${item.projectId}`
                        : `/issues?project=${item.projectId}`
                    return (
                      <Link
                        key={idx}
                        to={linkTo}
                        className="flex justify-between items-center text-sm text-red-800 hover:text-red-900 hover:bg-red-100 p-2 rounded transition-colors"
                      >
                        <span>
                          <span className="font-semibold">[{item.type}]</span>
                          <span className="text-red-600 font-mono text-xs mx-2">[{item.code}]</span>
                          {item.name}
                        </span>
                        <span className="text-red-600 text-xs">{item.dueDate}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Should Start Items */}
            {shouldStartItems.length > 0 && (
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                <div className="flex items-center mb-2">
                  <span className="text-purple-600 font-semibold text-lg">🚀 應該開始而未開始 ({shouldStartItems.length})</span>
                </div>
                <div className="space-y-2">
                  {shouldStartItems.map((item, idx) => {
                    const linkTo = item.type === 'WBS'
                      ? `/wbs?project=${item.projectId}`
                      : item.type === 'Pending'
                        ? `/pending?project=${item.projectId}`
                        : `/issues?project=${item.projectId}`
                    return (
                      <Link
                        key={idx}
                        to={linkTo}
                        className="flex justify-between items-center text-sm text-purple-800 hover:text-purple-900 hover:bg-purple-100 p-2 rounded transition-colors"
                      >
                        <span>
                          <span className="font-semibold">[{item.type}]</span>
                          <span className="text-purple-600 font-mono text-xs mx-2">[{item.code}]</span>
                          {item.name}
                        </span>
                        <span className="text-purple-600 text-xs">{item.startDate}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Critical Issues */}
            {stats.issues.critical > 0 && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                <div className="flex items-center mb-2">
                  <span className="text-orange-600 font-semibold text-lg">🔥 緊急問題 ({stats.issues.critical})</span>
                </div>
                <p className="text-sm text-orange-800">
                  有 {stats.issues.critical} 個高優先級或關鍵問題需要立即處理
                </p>
                <Link to="/issues" className="text-sm text-orange-600 hover:text-orange-800 font-semibold mt-2 inline-block">
                  查看詳情 →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Due Soon Section */}
        {dueSoonItems.length > 0 && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <div className="flex items-center mb-2">
              <span className="text-yellow-700 font-semibold text-lg">📅 本週即將到期 ({dueSoonItems.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dueSoonItems.map((item, idx) => {
                const linkTo = item.type === 'WBS'
                  ? `/wbs?project=${item.projectId}`
                  : item.type === 'Pending'
                    ? `/pending?project=${item.projectId}`
                    : `/issues?project=${item.projectId}`
                return (
                  <Link
                    key={idx}
                    to={linkTo}
                    className="flex justify-between items-center text-sm text-yellow-800 hover:text-yellow-900 hover:bg-yellow-100 p-2 rounded transition-colors"
                  >
                    <span>
                      <span className="font-semibold">[{item.type}]</span>
                      <span className="text-yellow-700 font-mono text-xs mx-2">[{item.code}]</span>
                      {item.name}
                    </span>
                    <span className="text-yellow-600 text-xs">{item.daysUntilDue} 天後</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Projects */}
          <StatCard
            title="專案總數"
            value={stats.projects.total}
            subtitle={`${stats.projects.active} 個進行中`}
            color="text-blue-600"
            icon="📁"
            link="/projects"
          />

          {/* WBS */}
          <StatCard
            title="WBS 項目"
            value={stats.wbs.total}
            subtitle={`${stats.wbs.completed} 已完成 / ${stats.wbs.inProgress} 進行中`}
            color="text-green-600"
            icon="📊"
            link="/wbs"
            alert={stats.wbs.overdue > 0}
          />

          {/* Pending Items */}
          <StatCard
            title="待辦事項"
            value={stats.pending.total}
            subtitle={`${stats.pending.pending} 待處理 / ${stats.pending.inProgress} 處理中`}
            color="text-orange-600"
            icon="✅"
            link="/pending"
            alert={stats.pending.overdue > 0}
          />

          {/* Issues */}
          <StatCard
            title="問題追蹤"
            value={stats.issues.total}
            subtitle={`${stats.issues.open} 待解決 / ${stats.issues.inProgress} 處理中`}
            color="text-red-600"
            icon="🐛"
            link="/issues"
            alert={stats.issues.critical > 0}
          />
        </div>

        {/* Detailed Stats and Charts */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-8">
          {/* WBS Progress */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">WBS 進度分佈</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">已完成</span>
                    <span className="font-semibold text-green-600">
                      {stats.wbs.completed} ({stats.wbs.total > 0 ? Math.round((stats.wbs.completed / stats.wbs.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${stats.wbs.total > 0 ? (stats.wbs.completed / stats.wbs.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">進行中</span>
                    <span className="font-semibold text-blue-600">
                      {stats.wbs.inProgress} ({stats.wbs.total > 0 ? Math.round((stats.wbs.inProgress / stats.wbs.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${stats.wbs.total > 0 ? (stats.wbs.inProgress / stats.wbs.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">未開始</span>
                    <span className="font-semibold text-gray-600">
                      {stats.wbs.notStarted} ({stats.wbs.total > 0 ? Math.round((stats.wbs.notStarted / stats.wbs.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-400 h-2 rounded-full"
                      style={{
                        width: `${stats.wbs.total > 0 ? (stats.wbs.notStarted / stats.wbs.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                {stats.wbs.overdue > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">逾期</span>
                      <span className="font-semibold text-red-600">
                        {stats.wbs.overdue} ({stats.wbs.total > 0 ? Math.round((stats.wbs.overdue / stats.wbs.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{
                          width: `${stats.wbs.total > 0 ? (stats.wbs.overdue / stats.wbs.total) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Issue Distribution */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">問題狀態分佈</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">待解決</span>
                    <span className="font-semibold text-red-600">
                      {stats.issues.open} ({stats.issues.total > 0 ? Math.round((stats.issues.open / stats.issues.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width: `${stats.issues.total > 0 ? (stats.issues.open / stats.issues.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">處理中</span>
                    <span className="font-semibold text-blue-600">
                      {stats.issues.inProgress} ({stats.issues.total > 0 ? Math.round((stats.issues.inProgress / stats.issues.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${stats.issues.total > 0 ? (stats.issues.inProgress / stats.issues.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">已解決</span>
                    <span className="font-semibold text-green-600">
                      {stats.issues.resolved} ({stats.issues.total > 0 ? Math.round((stats.issues.resolved / stats.issues.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${stats.issues.total > 0 ? (stats.issues.resolved / stats.issues.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">其他統計</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">依賴關係總數</span>
                  <span className="text-2xl font-semibold text-purple-600">{stats.dependencies.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">啟用中的依賴</span>
                  <span className="text-lg font-semibold text-purple-500">{stats.dependencies.active}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">整體完成率</span>
                    <span className="text-lg font-semibold text-green-600">
                      {stats.wbs.total > 0 ? Math.round((stats.wbs.completed / stats.wbs.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <Link
                  to="/dependencies"
                  className="block text-center text-sm text-purple-600 hover:text-purple-800 font-semibold"
                >
                  查看依賴關係 →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">快速操作</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Link
                to="/projects"
                className="flex flex-col items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mb-1">📁</span>
                專案管理
              </Link>
              <Link
                to="/wbs"
                className="flex flex-col items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mb-1">📊</span>
                WBS 管理
              </Link>
              <Link
                to="/wbs/tree"
                className="flex flex-col items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mb-1">🌳</span>
                WBS 樹狀圖
              </Link>
              <Link
                to="/dependencies"
                className="flex flex-col items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mb-1">🔗</span>
                依賴關係
              </Link>
              <Link
                to="/pending"
                className="flex flex-col items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mb-1">✅</span>
                待辦清單
              </Link>
              <Link
                to="/issues"
                className="flex flex-col items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mb-1">🐛</span>
                問題追蹤
              </Link>
              <Link
                to="/gantt"
                className="flex flex-col items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                <span className="text-2xl mb-1">📅</span>
                甘特圖
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
