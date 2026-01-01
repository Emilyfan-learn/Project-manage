/**
 * Backup Management Page
 * Create, download, restore and manage database backups
 */
import React, { useState, useEffect } from 'react'
import api from '../utils/api'

const BackupManagement = () => {
  const [backups, setBackups] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchBackups()
    fetchStats()
  }, [])

  const fetchBackups = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/backup/list')
      setBackups(response.backups || [])
    } catch (err) {
      setError(err.message || '載入備份列表失敗')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/backup/stats')
      setStats(response.stats)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const handleCreateBackup = async () => {
    if (!window.confirm('確定要建立新的資料庫備份嗎？')) {
      return
    }

    try {
      setLoading(true)
      await api.post('/backup/create', { description })
      alert('備份建立成功！')
      setDescription('')
      fetchBackups()
      fetchStats()
    } catch (err) {
      alert(`建立備份失敗: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBackup = async (filename) => {
    try {
      // Create a temporary link to download
      const url = `${api.defaults.baseURL}/backup/download/${filename}`
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      alert(`下載備份失敗: ${err.message}`)
    }
  }

  const handleRestoreBackup = async (filename) => {
    if (!window.confirm(
      '警告：還原備份將會覆蓋目前的資料庫！\n\n' +
      '系統會在還原前自動建立目前資料庫的備份。\n\n' +
      '確定要繼續嗎？'
    )) {
      return
    }

    try {
      setLoading(true)
      await api.post('/backup/restore', { filename })
      alert('資料庫已成功還原！\n\n頁面將重新載入以反映變更。')
      window.location.reload()
    } catch (err) {
      alert(`還原備份失敗: ${err.message}`)
      setLoading(false)
    }
  }

  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`確定要刪除備份 "${filename}" 嗎？\n\n此操作無法復原！`)) {
      return
    }

    try {
      setLoading(true)
      await api.delete(`/backup/delete/${filename}`)
      alert('備份已刪除')
      fetchBackups()
    } catch (err) {
      alert(`刪除備份失敗: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCleanup = async () => {
    const keepCount = prompt('請輸入要保留的備份數量（其餘將被刪除）：', '10')

    if (!keepCount || isNaN(keepCount) || parseInt(keepCount) < 1) {
      return
    }

    if (!window.confirm(`確定要清理舊備份，只保留最近的 ${keepCount} 個備份嗎？`)) {
      return
    }

    try {
      setLoading(true)
      const response = await api.post(`/backup/cleanup?keep_count=${keepCount}`)
      alert(response.message)
      fetchBackups()
    } catch (err) {
      alert(`清理備份失敗: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatDateTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">資料庫備份管理</h1>
        <p className="text-gray-600">建立、下載、還原和管理資料庫備份</p>
      </div>

      {/* Database Stats */}
      {stats && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <h3 className="font-semibold text-blue-900 mb-2">目前資料庫資訊</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-800">
            <div>
              <span className="font-semibold">資料庫大小：</span>
              {formatFileSize(stats.size)}
            </div>
            <div>
              <span className="font-semibold">專案數：</span>
              {stats.tables.projects || 0}
            </div>
            <div>
              <span className="font-semibold">WBS 項目：</span>
              {stats.tables.tracking_items || 0}
            </div>
            <div>
              <span className="font-semibold">待辦事項：</span>
              {stats.tables.pending_items || 0}
            </div>
          </div>
        </div>
      )}

      {/* Create Backup Section */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">建立新備份</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="備份說明（選填）"
            className="input-field flex-1"
          />
          <button
            onClick={handleCreateBackup}
            disabled={loading}
            className="btn-primary whitespace-nowrap"
          >
            💾 建立備份
          </button>
          <button
            onClick={handleCleanup}
            disabled={loading}
            className="btn-secondary whitespace-nowrap"
          >
            🧹 清理舊備份
          </button>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            備份列表 ({backups.length})
          </h3>
        </div>

        {loading && backups.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">載入中...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            {error}
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            目前沒有備份
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">檔案名稱</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">說明</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">大小</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">建立時間</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.filename} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      {backup.filename}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {backup.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-600">
                      {formatFileSize(backup.size)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-600">
                      {formatDateTime(backup.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleDownloadBackup(backup.filename)}
                          className="text-blue-600 hover:text-blue-900"
                          title="下載備份"
                        >
                          📥 下載
                        </button>
                        <button
                          onClick={() => handleRestoreBackup(backup.filename)}
                          className="text-green-600 hover:text-green-900"
                          title="還原備份"
                          disabled={loading}
                        >
                          ↩️ 還原
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.filename)}
                          className="text-red-600 hover:text-red-900"
                          title="刪除備份"
                          disabled={loading}
                        >
                          🗑️ 刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warning Notice */}
      <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-yellow-800">重要提醒</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>備份檔案儲存在伺服器的 data/backups 目錄中</li>
                <li>建議定期建立備份，並下載到本機保存</li>
                <li>還原備份前，系統會自動建立目前資料庫的備份</li>
                <li>刪除備份後無法復原，請謹慎操作</li>
                <li>建議保留最近 10-20 個備份，定期清理舊備份節省空間</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BackupManagement
