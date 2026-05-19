import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { auth, signOut } from '../firebase'
import Insights from './Insights'
import Calendar from './Calendar'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
const STATUS_OPTIONS = ['All', 'Planned', 'In Progress', 'Complete']
const SORT_OPTIONS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'status', label: 'Status' },
]

const STATUS_META = {
  Planned: { className: 'status-planned', label: 'Planned' },
  'In Progress': { className: 'status-progress', label: 'In Progress' },
  Complete: { className: 'status-complete', label: 'Complete' },
}

export default function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortBy, setSortBy] = useState('recent')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [lastSynced, setLastSynced] = useState(null)

  const headers = { 'x-user-id': user.uid }

  const fetchTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get(`${API_BASE}/tasks`, { headers })
      setTasks(res.data)
      setLastSynced(new Date())
    } catch (err) {
      setError('Unable to load your tasks right now.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  const addTask = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await axios.post(`${API_BASE}/tasks`, { title: title.trim() }, { headers })
      setTitle('')
      fetchTasks()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_BASE}/tasks/${id}`, { status }, { headers })
      fetchTasks()
    } catch (err) { console.error(err) }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (e) {}
    onLogout()
  }

  const counts = tasks.reduce(
    (acc, task) => {
      acc.total += 1
      acc[task.status] += 1
      return acc
    },
    { total: 0, Planned: 0, 'In Progress': 0, Complete: 0 }
  )

  const [view, setView] = useState('tasks') // 'tasks' | 'insights' | 'calendar'
  const [now, setNow] = useState(new Date())

  // live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = `${task.title}`.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'All' || task.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'status') return a.status.localeCompare(b.status) || new Date(b.createdAt) - new Date(a.createdAt)
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

  const handleAddTaskKeyDown = event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addTask()
    }
  }

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Workspace dashboard</p>
          <h2>Welcome back, {user.displayName || user.email}</h2>
          <p className="dashboard-subtitle">Your tasks stay scoped to your Google account.</p>
          <div className="time-row">
            <strong className="time-now">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
            <span className="muted">{now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        <div className="header-actions">
          <div className="view-toggle">
            <button className={`tab ${view === 'tasks' ? 'active' : ''}`} onClick={() => setView('tasks')}>Tasks</button>
            <button className={`tab ${view === 'insights' ? 'active' : ''}`} onClick={() => setView('insights')}>Insights</button>
            <button className={`tab ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>Calendar</button>
          </div>
          <button className="ghost-button" onClick={handleSignOut}>Logout</button>
        </div>
      </header>

      <section className="stats-grid">
        <article className="stat-card accent">
          <span>Total tasks</span>
          <strong>{counts.total}</strong>
        </article>
        <article className="stat-card">
          <span>Planned</span>
          <strong>{counts.Planned}</strong>
        </article>
        <article className="stat-card">
          <span>In progress</span>
          <strong>{counts['In Progress']}</strong>
        </article>
        <article className="stat-card">
          <span>Complete</span>
          <strong>{counts.Complete}</strong>
        </article>
      </section>
      <section className="controls-card">
        <div className="controls-top">
          <div>
            <p className="panel-label">Add task</p>
            <h3>Create a new task</h3>
          </div>
          {lastSynced && <span className="sync-pill">Synced {lastSynced.toLocaleTimeString()}</span>}
        </div>

        <div className="add-task-row">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleAddTaskKeyDown}
            placeholder="Enter task title"
            maxLength={120}
          />
          <button className="primary-button" onClick={addTask} disabled={saving || !title.trim()}>
            {saving ? 'Adding...' : 'Add task'}
          </button>
        </div>

        <div className="task-toolbar">
          <input
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks"
          />

          <div className="toolbar-selects">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map(option => <option key={option}>{option}</option>)}
            </select>

            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {error && <div className="error-banner">{error}</div>}

      {view === 'insights' ? (
        <Insights tasks={tasks} counts={counts} lastSynced={lastSynced} />
      ) : (
        <section className="task-list-card">
        <div className="task-list-header">
          <div>
            <p className="panel-label">Your tasks</p>
            <h3>{filteredTasks.length} matching task{filteredTasks.length === 1 ? '' : 's'}</h3>
          </div>
          <button className="text-button" onClick={fetchTasks} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
        </div>

        {loading ? (
          <div className="empty-state">Loading your tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <strong>No tasks found</strong>
            <p>Create your first task or clear the search/filter to see all tasks.</p>
          </div>
        ) : (
          <div className="task-grid">
            {filteredTasks.map(task => {
              const statusMeta = STATUS_META[task.status]
              return (
                <article key={task._id} className="task-card">
                  <div className="task-card-top">
                    <div>
                      <p className={`task-status ${statusMeta.className}`}>{statusMeta.label}</p>
                      <h4>{task.title}</h4>
                    </div>
                    <select value={task.status} onChange={e => updateStatus(task._id, e.target.value)}>
                      <option>Planned</option>
                      <option>In Progress</option>
                      <option>Complete</option>
                    </select>
                  </div>

                  <div className="task-card-meta">
                    <span>{new Date(task.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
        </section>
      )}
    </section>
  )
}
