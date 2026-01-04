/**
 * System Settings Page
 */
import React, { useState, useEffect } from 'react'
import { useSettings } from '../hooks/useSettings'

const SystemSettings = () => {
  const {
    systemSettings,
    holidays,
    loading,
    error,
    fetchSystemSettings,
    updateSystemSetting,
    fetchHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday
  } = useSettings()

  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState({})
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showHolidayForm, setShowHolidayForm] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState(null)
  const [holidayForm, setHolidayForm] = useState({
    holiday_date: '',
    holiday_name: ''
  })

  useEffect(() => {
    fetchSystemSettings()
    fetchHolidays(selectedYear)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchHolidays(selectedYear)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear])

  useEffect(() => {
    // Initialize form data from settings
    const data = {}
    systemSettings.forEach(setting => {
      data[setting.setting_key] = setting.setting_value
    })
    setFormData(data)
  }, [systemSettings])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 'true' : 'false') : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccessMessage('')

    try {
      // Update each setting (both existing and new)
      const promises = Object.keys(formData).map(key => {
        const setting = systemSettings.find(s => s.setting_key === key)
        // Update if setting doesn't exist OR value has changed
        if (!setting || setting.setting_value !== formData[key]) {
          return updateSystemSetting(key, formData[key])
        }
        return null
      })

      await Promise.all(promises.filter(p => p !== null))

      // Refresh settings from server
      await fetchSystemSettings()

      setSuccessMessage('設定已成功儲存！')

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      alert('儲存設定時發生錯誤：' + err.message)
    }
  }

  // Holiday form handlers
  const handleHolidayFormChange = (e) => {
    const { name, value } = e.target
    setHolidayForm(prev => ({ ...prev, [name]: value }))
  }

  const handleAddHoliday = () => {
    setEditingHoliday(null)
    setHolidayForm({
      holiday_date: `${selectedYear}-01-01`,
      holiday_name: ''
    })
    setShowHolidayForm(true)
  }

  const handleEditHoliday = (holiday) => {
    setEditingHoliday(holiday)
    setHolidayForm({
      holiday_date: holiday.holiday_date,
      holiday_name: holiday.holiday_name
    })
    setShowHolidayForm(true)
  }

  const handleHolidaySubmit = async (e) => {
    e.preventDefault()
    try {
      const dateObj = new Date(holidayForm.holiday_date)
      const year = dateObj.getFullYear()

      if (editingHoliday) {
        await updateHoliday(editingHoliday.holiday_id, {
          year,
          holiday_date: holidayForm.holiday_date,
          holiday_name: holidayForm.holiday_name
        })
        setSuccessMessage('假日已更新！')
      } else {
        await createHoliday({
          year,
          holiday_date: holidayForm.holiday_date,
          holiday_name: holidayForm.holiday_name
        })
        setSuccessMessage('假日已新增！')
      }

      setShowHolidayForm(false)
      setEditingHoliday(null)
      fetchHolidays(selectedYear)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      alert('操作失敗：' + err.message)
    }
  }

  const handleDeleteHoliday = async (holiday) => {
    if (window.confirm(`確定要刪除「${holiday.holiday_name}」嗎？`)) {
      try {
        await deleteHoliday(holiday.holiday_id)
        setSuccessMessage('假日已刪除！')
        setTimeout(() => setSuccessMessage(''), 3000)
      } catch (err) {
        alert('刪除失敗：' + err.message)
      }
    }
  }

  const handleCancelHolidayForm = () => {
    setShowHolidayForm(false)
    setEditingHoliday(null)
    setHolidayForm({ holiday_date: '', holiday_name: '' })
  }

  // Generate year options
  const currentYear = new Date().getFullYear()
  const yearOptions = []
  for (let y = currentYear - 2; y <= currentYear + 5; y++) {
    yearOptions.push(y)
  }

  if (loading && systemSettings.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">載入設定中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">系統設定</h1>
        <p className="mt-2 text-gray-600">管理系統的全域設定參數</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Display Settings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">顯示設定</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Format */}
            <div>
              <label htmlFor="date_format" className="label">
                日期格式
              </label>
              <select
                id="date_format"
                name="date_format"
                value={formData.date_format || 'yyyy/MM/dd'}
                onChange={handleChange}
                className="input-field"
              >
                <option value="yyyy/MM/dd">yyyy/MM/dd (2024/01/15)</option>
                <option value="yyyy-MM-dd">yyyy-MM-dd (2024-01-15)</option>
                <option value="MM/dd/yyyy">MM/dd/yyyy (01/15/2024)</option>
                <option value="dd/MM/yyyy">dd/MM/yyyy (15/01/2024)</option>
              </select>
            </div>

            {/* Default View Mode */}
            <div>
              <label htmlFor="default_view_mode" className="label">
                預設視圖模式（甘特圖）
              </label>
              <select
                id="default_view_mode"
                name="default_view_mode"
                value={formData.default_view_mode || 'Day'}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Quarter Day">季日</option>
                <option value="Half Day">半日</option>
                <option value="Day">日</option>
                <option value="Week">週</option>
                <option value="Month">月</option>
              </select>
            </div>

            {/* Items Per Page */}
            <div>
              <label htmlFor="items_per_page" className="label">
                每頁顯示筆數
              </label>
              <select
                id="items_per_page"
                name="items_per_page"
                value={formData.items_per_page || '50'}
                onChange={handleChange}
                className="input-field"
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calculation Rules */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">計算規則</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Progress Calculation */}
            <div>
              <label htmlFor="progress_calculation" className="label">
                進度計算方式
              </label>
              <select
                id="progress_calculation"
                name="progress_calculation"
                value={formData.progress_calculation || 'date_based'}
                onChange={handleChange}
                className="input-field"
              >
                <option value="date_based">基於日期自動計算</option>
                <option value="manual">手動輸入</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                基於日期：根據開始/結束日期自動計算預估進度
              </p>
            </div>

            {/* Include Weekends */}
            <div>
              <label className="label">
                工作天數計算
              </label>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="include_weekends"
                  name="include_weekends"
                  checked={formData.include_weekends === 'true'}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="include_weekends" className="ml-2 block text-sm text-gray-700">
                  包含週末（週六、週日）
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                取消勾選則工作天數只計算週一至週五
              </p>
            </div>

            {/* Overdue Warning Days */}
            <div>
              <label htmlFor="overdue_warning_days" className="label">
                逾期警示天數
              </label>
              <input
                type="number"
                id="overdue_warning_days"
                name="overdue_warning_days"
                value={formData.overdue_warning_days || '3'}
                onChange={handleChange}
                min="0"
                max="30"
                className="input-field"
              />
              <p className="mt-1 text-sm text-gray-500">
                提前幾天開始顯示逾期警示
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">通知設定</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Enable Overdue Alert */}
            <div>
              <label className="label text-gray-400">
                逾期提醒
              </label>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="enable_overdue_alert"
                  name="enable_overdue_alert"
                  checked={formData.enable_overdue_alert === 'true'}
                  disabled
                  className="h-4 w-4 text-gray-300 border-gray-300 rounded cursor-not-allowed"
                />
                <label htmlFor="enable_overdue_alert" className="ml-2 block text-sm text-gray-400">
                  啟用逾期提醒
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-1">（此功能尚未實作，目前永遠啟用）</p>
            </div>

            {/* Progress Lag Threshold */}
            <div>
              <label htmlFor="progress_lag_threshold" className="label">
                進度落後警示閾值（%）
              </label>
              <input
                type="number"
                id="progress_lag_threshold"
                name="progress_lag_threshold"
                value={formData.progress_lag_threshold || '10'}
                onChange={handleChange}
                min="0"
                max="100"
                className="input-field"
              />
              <p className="mt-1 text-sm text-gray-500">
                實際進度落後預估進度達此百分比時顯示警示
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => fetchSystemSettings()}
            className="btn-secondary"
          >
            重新載入
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? '儲存中...' : '儲存設定'}
          </button>
        </div>
      </form>

      {/* Holiday Management Section */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">假日設定</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="year-select" className="text-sm text-gray-600">年度：</label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="input-field py-1 px-2"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button onClick={handleAddHoliday} className="btn-primary text-sm">
              + 新增假日
            </button>
          </div>
        </div>

        {/* Holiday Form Modal */}
        {showHolidayForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-medium mb-3">
              {editingHoliday ? '編輯假日' : '新增假日'}
            </h3>
            <form onSubmit={handleHolidaySubmit} className="flex flex-wrap gap-4 items-end">
              <div>
                <label htmlFor="holiday_date" className="label">日期</label>
                <input
                  type="date"
                  id="holiday_date"
                  name="holiday_date"
                  value={holidayForm.holiday_date}
                  onChange={handleHolidayFormChange}
                  required
                  className="input-field"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="holiday_name" className="label">假日名稱</label>
                <input
                  type="text"
                  id="holiday_name"
                  name="holiday_name"
                  value={holidayForm.holiday_name}
                  onChange={handleHolidayFormChange}
                  required
                  placeholder="例如：元旦"
                  className="input-field"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  {editingHoliday ? '更新' : '新增'}
                </button>
                <button type="button" onClick={handleCancelHolidayForm} className="btn-secondary">
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Holiday List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">日期</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">假日名稱</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                    {selectedYear} 年尚未設定假日
                  </td>
                </tr>
              ) : (
                holidays.map(holiday => (
                  <tr key={holiday.holiday_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{holiday.holiday_date}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{holiday.holiday_name}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleEditHoliday(holiday)}
                        className="text-primary-600 hover:text-primary-800 text-sm mr-3"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(holiday)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          設定的假日將會在工作天數計算時自動排除（需關閉「包含週末」設定）
        </p>
      </div>
    </div>
  )
}

export default SystemSettings
