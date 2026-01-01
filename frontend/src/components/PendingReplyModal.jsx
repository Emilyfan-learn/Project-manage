/**
 * Pending Reply Modal Component
 * Shows reply history and allows adding new replies
 */
import React, { useState, useEffect } from 'react'
import api from '../utils/api'

const PendingReplyModal = ({ pendingItem, onClose, onReplyAdded }) => {
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newReply, setNewReply] = useState({
    replied_by: '',
    reply_content: '',
    reply_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchReplies()
  }, [pendingItem.pending_id])

  const fetchReplies = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/pending/${pendingItem.pending_id}/replies`)
      setReplies(response)
    } catch (error) {
      console.error('Failed to fetch replies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddReply = async (e) => {
    e.preventDefault()

    if (!newReply.replied_by.trim()) {
      alert('請輸入回覆人')
      return
    }

    try {
      await api.post(`/pending/${pendingItem.pending_id}/replies`, newReply)
      alert('回覆已添加')
      setNewReply({
        replied_by: '',
        reply_content: '',
        reply_date: new Date().toISOString().split('T')[0],
      })
      setShowAddForm(false)
      fetchReplies()
      if (onReplyAdded) {
        onReplyAdded()
      }
    } catch (error) {
      alert(`添加回覆失敗: ${error.message}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">回覆歷史</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Pending Item Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">待辦事項</h3>
            <p className="text-gray-900">{pendingItem.description}</p>
            <div className="mt-2 text-sm text-gray-600">
              <span>來源: {pendingItem.source_type}</span>
              {pendingItem.expected_reply_date && (
                <span className="ml-4">預計回覆: {pendingItem.expected_reply_date}</span>
              )}
            </div>
          </div>

          {/* Add Reply Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary mb-4"
            >
              + 新增回覆
            </button>
          )}

          {/* Add Reply Form */}
          {showAddForm && (
            <form onSubmit={handleAddReply} className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-700 mb-3">新增回覆</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label">回覆人 *</label>
                  <input
                    type="text"
                    value={newReply.replied_by}
                    onChange={(e) => setNewReply({ ...newReply, replied_by: e.target.value })}
                    className="input-field"
                    placeholder="輸入回覆人姓名"
                  />
                </div>
                <div>
                  <label className="label">回覆日期</label>
                  <input
                    type="date"
                    value={newReply.reply_date}
                    onChange={(e) => setNewReply({ ...newReply, reply_date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="label">回覆內容</label>
                <textarea
                  value={newReply.reply_content}
                  onChange={(e) => setNewReply({ ...newReply, reply_content: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="輸入回覆內容（選填）"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  送出
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
              </div>
            </form>
          )}

          {/* Reply List */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">
              回覆記錄 ({replies.length})
            </h4>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-600">載入中...</p>
              </div>
            ) : replies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                尚無回覆記錄
              </div>
            ) : (
              <div className="space-y-3">
                {replies.map((reply, index) => (
                  <div
                    key={reply.reply_id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-gray-900">
                          {reply.replied_by}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          #{replies.length - index}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {reply.reply_date}
                      </span>
                    </div>
                    {reply.reply_content && (
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {reply.reply_content}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-gray-400">
                      建立時間: {new Date(reply.created_at).toLocaleString('zh-TW')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="btn-secondary">
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PendingReplyModal
