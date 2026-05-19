import React, { useState, useMemo } from 'react'

function getMonthMatrix(year, month) {
  const first = new Date(year, month, 1)
  const startDay = first.getDay() // 0 (Sun) - 6
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const matrix = []
  let week = new Array(7).fill(null)
  let day = 1
  // fill first week
  for (let i = startDay; i < 7; i++) {
    week[i] = day++
  }
  matrix.push(week)
  while (day <= daysInMonth) {
    week = new Array(7).fill(null)
    for (let i = 0; i < 7 && day <= daysInMonth; i++) {
      week[i] = day++
    }
    matrix.push(week)
  }
  return matrix
}

export default function Calendar({ tasks }) {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState(null)

  const tasksByDate = useMemo(() => {
    const map = {}
    tasks.forEach(t => {
      const d = new Date(t.createdAt)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      map[key] = map[key] || []
      map[key].push(t)
    })
    return map
  }, [tasks])

  const matrix = useMemo(() => getMonthMatrix(viewYear, viewMonth), [viewYear, viewMonth])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })

  return (
    <section className="calendar">
      <header className="calendar-header">
        <button className="text-button" onClick={prevMonth}>‹</button>
        <strong>{monthLabel}</strong>
        <button className="text-button" onClick={nextMonth}>›</button>
      </header>

      <table className="calendar-grid">
        <thead>
          <tr>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <th key={d}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {matrix.map((week, i) => (
            <tr key={i}>
              {week.map((day, j) => {
                const key = day == null ? null : `${viewYear}-${viewMonth}-${day}`
                const dayTasks = key ? tasksByDate[key] : null
                const isToday = day != null && viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()
                return (
                  <td key={j} className={`calendar-cell ${day ? '' : 'empty'} ${isToday ? 'today' : ''}`} onClick={() => day && setSelectedDay(day)}>
                    {day && (
                      <div className="cell-content">
                        <div className="cell-day">{day}</div>
                        {dayTasks && <div className="cell-dot" />}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <aside className="calendar-side">
        <p className="panel-label">Tasks on selected day</p>
        {selectedDay == null ? (
          <div className="empty-state">Select a day to view tasks.</div>
        ) : (
          <div>
            <h4>{new Date(viewYear, viewMonth, selectedDay).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h4>
            <ul className="recent-list">
              {(tasksByDate[`${viewYear}-${viewMonth}-${selectedDay}`] || []).map(t => (
                <li key={t._id} className="recent-item">
                  <strong>{t.title}</strong>
                  <span className="muted">{t.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </section>
  )
}
