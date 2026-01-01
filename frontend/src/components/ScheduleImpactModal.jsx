/**
 * Schedule Impact Modal Component
 * Displays schedule adjustment suggestions based on dependency analysis
 */
import React from 'react'

const ScheduleImpactModal = ({ analysis, onClose }) => {
  if (!analysis) return null

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return dateStr
  }

  const getDelayColor = (days) => {
    if (days === 0) return 'text-gray-700'
    if (days > 0) return 'text-red-600'
    return 'text-green-600'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">時程影響分析</h2>
              <p className="text-sm text-gray-600 mt-1">
                變更來源: <span className="font-semibold">{analysis.source_wbs_id}</span> - {analysis.source_task_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Change Summary */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">時程變更摘要</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">變更欄位: </span>
                <span className="font-semibold">{analysis.date_change.field}</span>
              </div>
              <div>
                <span className="text-gray-600">原始日期: </span>
                <span className="font-semibold">{formatDate(analysis.date_change.old_value)}</span>
              </div>
              <div>
                <span className="text-gray-600">新日期: </span>
                <span className="font-semibold text-blue-600">{formatDate(analysis.date_change.new_value)}</span>
              </div>
            </div>
          </div>

          {/* Impact Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-gray-900">{analysis.total_affected}</div>
              <div className="text-sm text-gray-600 mt-1">受影響項目數</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-orange-600">
                {analysis.affected_items.filter(item => item.delay_days > 0).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">需要延後</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className={`text-3xl font-bold ${analysis.critical_path_affected ? 'text-red-600' : 'text-green-600'}`}>
                {analysis.critical_path_affected ? '是' : '否'}
              </div>
              <div className="text-sm text-gray-600 mt-1">影響關鍵路徑</div>
            </div>
          </div>

          {/* Affected Items List */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">
              建議調整計畫 ({analysis.affected_items.length} 項)
            </h3>

            {analysis.affected_items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                沒有項目受到影響
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">WBS ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">任務名稱</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">目前開始</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">建議開始</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">目前結束</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">建議結束</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">延遲天數</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">原因</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analysis.affected_items.map((item, index) => (
                      <tr key={index} className={item.delay_days > 5 ? 'bg-red-50' : item.delay_days > 0 ? 'bg-yellow-50' : ''}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.wbs_id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                          {item.task_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {formatDate(item.current_start)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {item.suggested_start ? (
                            <span className="font-semibold text-blue-600">
                              {formatDate(item.suggested_start)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {formatDate(item.current_end)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {item.suggested_end ? (
                            <span className="font-semibold text-blue-600">
                              {formatDate(item.suggested_end)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`font-semibold ${getDelayColor(item.delay_days)}`}>
                            {item.delay_days > 0 ? `+${item.delay_days}` : item.delay_days} 天
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                          {item.reason}
                          {item.dependency_chain.length > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                              鏈: {item.dependency_chain.join(' → ')}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button onClick={onClose} className="btn-secondary">
              關閉
            </button>
            <button
              onClick={() => {
                // TODO: Implement apply adjustments
                alert('套用調整功能開發中...')
              }}
              className="btn-primary"
              disabled={analysis.affected_items.length === 0}
            >
              套用建議調整
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScheduleImpactModal
