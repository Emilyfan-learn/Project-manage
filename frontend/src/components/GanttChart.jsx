/**
 * Gantt Chart Component using Frappe Gantt
 */
import React, { useEffect, useRef } from 'react'
import Gantt from 'frappe-gantt'
import 'frappe-gantt/dist/frappe-gantt.css'

const GanttChart = ({ tasks, viewMode = 'Day', onTaskClick, onDateChange }) => {
  const ganttRef = useRef(null)
  const ganttInstance = useRef(null)

  useEffect(() => {
    console.log('GanttChart effect triggered:', {
      hasRef: !!ganttRef.current,
      tasksCount: tasks?.length || 0,
      tasks: tasks
    })

    if (!ganttRef.current || !tasks || tasks.length === 0) {
      console.log('Skipping Gantt render - missing requirements')
      return
    }

    // Convert WBS data to Gantt format
    const ganttTasks = tasks.map((task) => {
      // Get dates and ensure they are valid
      const startDate = task.revised_planned_start || task.original_planned_start || task.actual_start_date
      const endDate = task.revised_planned_end || task.original_planned_end || task.actual_end_date

      // If no dates available, use today and tomorrow
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const start = startDate || today.toISOString().split('T')[0]
      const end = endDate || tomorrow.toISOString().split('T')[0]

      // Ensure end is after start
      const startDateTime = new Date(start).getTime()
      const endDateTime = new Date(end).getTime()
      const finalEnd = endDateTime > startDateTime ? end : new Date(startDateTime + 86400000).toISOString().split('T')[0]

      const taskData = {
        id: task.wbs_id,
        name: task.task_name || task.wbs_id,
        start: start,
        end: finalEnd,
        progress: task.actual_progress || 0,
        dependencies: task.dependencies || '',
        custom_class: getTaskClass(task),
      }
      console.log('Converted task:', task.wbs_id, taskData)
      return taskData
    })

    console.log('Gantt tasks prepared:', ganttTasks)

    // Destroy existing instance
    if (ganttInstance.current) {
      ganttInstance.current = null
      ganttRef.current.innerHTML = ''
    }

    // Create new Gantt instance
    try {
      console.log('Creating Gantt instance with', ganttTasks.length, 'tasks')
      ganttInstance.current = new Gantt(ganttRef.current, ganttTasks, {
        view_mode: viewMode,
        bar_height: 30,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        date_format: 'YYYY-MM-DD',
        custom_popup_html: (task) => {
          const originalTask = tasks.find(t => t.wbs_id === task.id)
          const startDate = task._start ? new Date(task._start).toLocaleDateString('zh-TW') : 'N/A'
          const endDate = task._end ? new Date(task._end).toLocaleDateString('zh-TW') : 'N/A'
          return `
            <div class="gantt-popup">
              <h3 style="margin: 0 0 10px 0; font-size: 14px;">${task.name}</h3>
              <p style="margin: 5px 0; font-size: 12px;"><strong>WBS ID:</strong> ${task.id}</p>
              <p style="margin: 5px 0; font-size: 12px;"><strong>開始:</strong> ${startDate}</p>
              <p style="margin: 5px 0; font-size: 12px;"><strong>結束:</strong> ${endDate}</p>
              <p style="margin: 5px 0; font-size: 12px;"><strong>進度:</strong> ${task.progress}%</p>
              ${originalTask?.primary_owner ? `<p style="margin: 5px 0; font-size: 12px;"><strong>負責人:</strong> ${originalTask.primary_owner}</p>` : ''}
              ${originalTask?.status ? `<p style="margin: 5px 0; font-size: 12px;"><strong>狀態:</strong> ${originalTask.status}</p>` : ''}
            </div>
          `
        },
        on_click: (task) => {
          if (onTaskClick) {
            const originalTask = tasks.find(t => t.wbs_id === task.id)
            onTaskClick(originalTask)
          }
        },
        on_date_change: (task, start, end) => {
          if (onDateChange) {
            onDateChange(task.id, start, end)
          }
        },
      })
      console.log('Gantt chart created successfully')
    } catch (error) {
      console.error('Error creating Gantt chart:', error)
      console.error('Error stack:', error.stack)
      console.error('Tasks that caused error:', ganttTasks)
    }

    return () => {
      if (ganttInstance.current) {
        ganttInstance.current = null
      }
    }
  }, [tasks, viewMode, onTaskClick, onDateChange])

  const getTaskClass = (task) => {
    // Add custom classes based on task status
    if (task.status === '已完成') return 'gantt-bar-complete'
    if (task.status === '進行中') return 'gantt-bar-in-progress'
    if (task.status === '延遲') return 'gantt-bar-delayed'
    if (task.progress_variance && task.progress_variance < -10) return 'gantt-bar-behind'
    return ''
  }

  return (
    <div className="gantt-container">
      <svg ref={ganttRef}></svg>
    </div>
  )
}

export default GanttChart
