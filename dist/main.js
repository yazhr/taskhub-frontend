import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import { motion } from 'https://esm.sh/framer-motion@11.11.9?bundle';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'https://esm.sh/recharts@2.12.7?bundle';

const h = React.createElement;
const API_BASE = 'http://localhost:4000';
const ADMIN_EMAIL = 'admin@taskhub.com';
const makeUserId = (email) => btoa(email.toLowerCase()).replace(/=/g, '').slice(0, 28);
const ADMIN_UID = makeUserId(ADMIN_EMAIL);
const NAV_ITEMS = ['Overview', 'Tasks', 'Insights', 'Activity', 'Calendar', 'Help'];
const STATUS_OPTIONS = ['Planned', 'In Progress', 'Complete'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
const STATUS_META = {
  Planned: { tone: 'bg-slate-100 text-slate-700 ring-slate-200', label: 'Planned' },
  'In Progress': { tone: 'bg-blue-50 text-blue-700 ring-blue-100', label: 'In Progress' },
  Complete: { tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100', label: 'Complete' },
};
const PRIORITY_META = {
  Low: { tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100', label: 'Low' },
  Medium: { tone: 'bg-amber-50 text-amber-700 ring-amber-100', label: 'Medium' },
  High: { tone: 'bg-rose-50 text-rose-700 ring-rose-100', label: 'High' },
};
const NAV_META = {
  Overview: { icon: 'layout-dashboard' },
  Tasks: { icon: 'clipboard-list' },
  Insights: { icon: 'chart-area' },
  Activity: { icon: 'activity' },
  Calendar: { icon: 'calendar' },
  Admin: { icon: 'shield' },
  Help: { icon: 'help-circle' },
};

function Logo({ compact = false } = {}) {
  const size = compact ? 'h-10 w-10' : 'h-12 w-12';
  return h(
    'div',
    {
      className: `grid place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm ${size}`,
      'aria-hidden': 'true',
    },
    h(
      'svg',
      { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2.25', className: 'h-6 w-6' },
      h('path', { d: 'M4 6h16' }),
      h('path', { d: 'M4 12h10' }),
      h('path', { d: 'M4 18h13' })
    )
  );
}

function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

function Icon({ name, className = 'h-4 w-4' }) {
  const icons = {
    'layout-dashboard': h('path', { d: 'M4 5a1 1 0 0 1 1-1h6v8H4V5Z' }),
    'clipboard-list': h('path', { d: 'M9 4h6a1 1 0 0 1 1 1v2H8V5a1 1 0 0 1 1-1Z' }),
    'chart-area': [h('path', { key: 'a', d: 'M4 19h16' }), h('path', { key: 'b', d: 'M5 17 9 11l4 3 5-8 2 3' })],
    activity: [h('path', { key: 'a', d: 'M4 12h4l2-5 4 10 2-5h4' }), h('circle', { key: 'b', cx: '20', cy: '12', r: '1.5' })],
    calendar: [h('path', { key: 'a', d: 'M8 2v4' }), h('path', { key: 'b', d: 'M16 2v4' }), h('path', { key: 'c', d: 'M3 10h18' }), h('path', { key: 'd', d: 'M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z' })],
    shield: [h('path', { key: 'a', d: 'M12 3 20 6v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V6l8-3Z' }), h('path', { key: 'b', d: 'M9 12h6' })],
    'help-circle': [h('circle', { key: 'a', cx: '12', cy: '12', r: '9' }), h('path', { key: 'b', d: 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.5 1.1-1.5 2.2' }), h('circle', { key: 'c', cx: '12', cy: '17', r: '1' })],
  };

  const glyph = icons[name];
  return h(
    'svg',
    { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className },
    Array.isArray(glyph) ? glyph : [glyph]
  );
}

function NavTab({ label, icon, active, onClick }) {
  return h(
    motion.button,
    {
      onClick,
      whileHover: { y: -2, scale: active ? 1 : 1.02 },
      whileTap: { scale: 0.98 },
      className: cn(
        'relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all',
        active ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
      ),
    },
    h(Icon, { name, className: 'h-4 w-4' }),
    h('span', null, label),
    active ? h('span', { className: 'absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-white' }) : null
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function formatDay(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function isSameDay(left, right) {
  return dateKey(left) === dateKey(right);
}

function Badge({ children, tone }) {
  return h(
    'span',
    { className: cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1', tone) },
    children
  );
}

function Spinner() {
  return h(
    'div',
    { className: 'flex items-center gap-3 text-sm text-slate-500' },
    h('span', { className: 'h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900' }),
    h('span', null, 'Loading tasks...')
  );
}

function ToastList({ toasts, onDismiss }) {
  return h(
    'div',
    { className: 'fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3' },
    toasts.map((toast) =>
      h(
        'div',
        {
          key: toast.id,
          className: cn(
            'rounded-2xl border bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.12)] transition-all duration-300',
            toast.type === 'success' ? 'border-emerald-200' : toast.type === 'error' ? 'border-rose-200' : 'border-slate-200'
          ),
        },
        h('div', { className: 'flex items-start justify-between gap-3' },
          h('div', null,
            h('div', { className: 'text-sm font-semibold text-slate-900' }, toast.title),
            h('div', { className: 'mt-1 text-sm text-slate-500' }, toast.message)
          ),
          h('button', { onClick: () => onDismiss(toast.id), className: 'text-slate-400 transition hover:text-slate-600' }, '×')
        )
      )
    )
  );
}

async function signInWithGoogle() {
  const email = window.prompt('Enter your Google email for this assessment login:');
  if (!email) return null;
  const displayName = email.split('@')[0];
  const uid = makeUserId(email);
  return {
    uid,
    displayName: email.toLowerCase() === ADMIN_EMAIL ? 'Admin' : displayName,
    email,
    isAdmin: email.toLowerCase() === ADMIN_EMAIL,
  };
}

async function fetchTasks(userId) {
  const response = await fetch(`${API_BASE}/tasks`, { headers: { 'x-user-id': userId } });
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

async function fetchAdminOverview(userId) {
  const response = await fetch(`${API_BASE}/tasks/admin/overview`, { headers: { 'x-user-id': userId } });
  if (!response.ok) throw new Error('Failed to fetch admin overview');
  return response.json();
}

async function createTask(userId, title, priority = 'Medium', userName = '', userEmail = '') {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ title, priority, userName, userEmail }),
  });
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
}

async function updateTask(userId, id, payload) {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
}

function StatCard({ label, value, hint }) {
  return h(
    'article',
    {
      className:
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
    },
    h('p', { className: 'text-sm font-medium text-slate-500' }, label),
    h('div', { className: 'mt-2 text-3xl font-semibold tracking-tight text-slate-900' }, value),
    h('p', { className: 'mt-2 text-sm text-slate-500' }, hint)
  );
}

function PageShell({ title, subtitle, children, actions }) {
  return h(
    'section',
    { className: 'space-y-6' },
    h(
      'div',
      { className: 'flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between' },
      h('div', null, h('p', { className: 'text-xs font-semibold uppercase tracking-[0.28em] text-blue-600' }, subtitle), h('h2', { className: 'mt-2 text-2xl font-semibold tracking-tight text-slate-900' }, title)),
      actions || null
    ),
    children
  );
}

function TaskCard({ task, onStatusChange, onPriorityChange }) {
  return h(
    motion.article,
    {
      initial: { opacity: 0, scale: 0.95 },
      whileInView: { opacity: 1, scale: 1 },
      whileHover: { y: -2, boxShadow: '0 12px 32px rgba(15,23,42,0.15)' },
      transition: { duration: 0.2 },
      className:
        'flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all lg:flex-row lg:items-center lg:justify-between hover:border-slate-300',
    },
    h('div', { className: 'min-w-0 space-y-2 flex-1' },
      h('div', { className: 'flex flex-wrap items-center gap-2' },
        h('h3', { className: 'truncate text-sm font-semibold tracking-tight text-slate-900' }, task.title),
        h(Badge, { tone: STATUS_META[task.status].tone }, STATUS_META[task.status].label),
        h(Badge, { tone: PRIORITY_META[task.priority || 'Medium'].tone }, task.priority || 'Medium')
      ),
      h('p', { className: 'text-xs text-slate-500' }, `Created ${new Date(task.createdAt).toLocaleDateString()}`)
    ),
    h('div', { className: 'flex flex-col gap-2 sm:flex-row gap-3' },
      React.createElement(motion.select, {
        whileHover: { scale: 1.02 },
        value: task.status,
        onChange: (e) => onStatusChange(task._id, e.target.value),
        className:
          'rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition hover:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 lg:w-40',
      }, STATUS_OPTIONS.map((status) => h('option', { key: status, value: status }, status))),
      React.createElement(motion.select, {
        whileHover: { scale: 1.02 },
        value: task.priority || 'Medium',
        onChange: (e) => onPriorityChange(task._id, e.target.value),
        className:
          'rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition hover:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 lg:w-36',
      }, PRIORITY_OPTIONS.map((priority) => h('option', { key: priority, value: priority }, priority)))
    )
  );
}

function CircularProgressRing({ value, label, caption, color = 'from-blue-600 to-indigo-600' }) {
  const size = 140;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamp(value, 0, 100) / 100) * circumference;

  return h(
    'div',
    { className: 'flex items-center justify-between gap-4' },
    h('div', null,
      h('p', { className: 'text-xs font-semibold uppercase text-slate-500 tracking-wider' }, label),
      h('p', { className: 'mt-1 text-sm text-slate-600' }, caption)
    ),
    h('div', { className: 'relative' },
      h('svg', { viewBox: `0 0 ${size} ${size}`, className: 'h-32 w-32 -rotate-90' },
        h('circle', {
          cx: size / 2,
          cy: size / 2,
          r: radius,
          stroke: '#e2e8f0',
          strokeWidth: stroke,
          fill: 'none',
        }),
        React.createElement(motion.circle, {
          cx: size / 2,
          cy: size / 2,
          r: radius,
          stroke: 'url(#progressGradient)',
          strokeWidth: stroke,
          strokeLinecap: 'round',
          fill: 'none',
          strokeDasharray: circumference,
          initial: { strokeDashoffset: circumference },
          animate: { strokeDashoffset: offset },
          transition: { duration: 1.2, ease: 'easeOut' },
        }),
        h('defs', null,
          h('linearGradient', { id: 'progressGradient', x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
            h('stop', { offset: '0%', stopColor: '#2563eb' }),
            h('stop', { offset: '100%', stopColor: '#4f46e5' })
          )
        )
      ),
      h('div', { className: 'absolute inset-0 flex items-center justify-center' },
        h('div', { className: 'text-center' },
          h('div', { className: 'text-3xl font-bold text-slate-900' }, `${clamp(value, 0, 100)}%`),
          h('div', { className: 'text-xs text-slate-500 mt-1' }, 'complete')
        )
      )
    )
  );
}

function MiniStatStrip({ label, value, tone, hint }) {
  return h(
    motion.article,
    {
      initial: { opacity: 0, y: 12 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, amount: 0.4 },
      transition: { duration: 0.35 },
      className: 'rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
    },
    h('div', { className: 'flex items-center justify-between gap-3' },
      h('div', null,
        h('p', { className: 'text-sm font-medium text-slate-500' }, label),
        h('div', { className: 'mt-2 text-2xl font-semibold tracking-tight text-slate-900' }, value)
      ),
      h('span', { className: cn('h-3 w-3 rounded-full ring-4', tone) })
    ),
    h('p', { className: 'mt-3 text-sm text-slate-500' }, hint)
  );
}

function ProductivitySection({ stats, progress, weeklyData, productivityScore, completedToday, completionTrend }) {
  return h(
    motion.section,
    {
      initial: { opacity: 0, y: 18 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, amount: 0.25 },
      transition: { duration: 0.45 },
      className: 'overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm',
    },
    h('div', { className: 'border-b border-slate-200 px-5 py-5 sm:px-6' },
      h('div', { className: 'flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between' },
        h('div', null,
          h('p', { className: 'text-xs font-semibold uppercase tracking-[0.26em] text-blue-600' }, 'Productivity progress'),
          h('h2', { className: 'mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl' }, 'Your task momentum at a glance'),
          h('p', { className: 'mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base' }, 'A clean overview of completion, momentum, and weekly productivity so progress stays motivating and easy to understand.')
        ),
        h('div', { className: 'rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600' }, `${progress}% overall completion`)
      )
    ),
    h('div', { className: 'grid gap-5 p-5 sm:p-6 xl:grid-cols-[1.05fr_0.95fr]' },
      h('div', { className: 'grid gap-5' },
        h('div', { className: 'grid gap-5 lg:grid-cols-[0.9fr_1.1fr]' },
          h(CircularProgressRing, {
            value: progress,
            label: 'Completion overview',
            caption: 'Completion ring with live task distribution',
          }),
          h('div', { className: 'grid gap-4' },
            h('div', { className: 'rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm' },
              h('div', { className: 'flex items-center justify-between gap-3' },
                h('div', null,
                  h('p', { className: 'text-xs font-semibold uppercase tracking-[0.24em] text-blue-600' }, 'Daily productivity score'),
                  h('h3', { className: 'mt-2 text-xl font-semibold tracking-tight text-slate-900' }, 'Motivation widget')
                ),
                h('div', { className: 'rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700' }, `${productivityScore}/100`)
              ),
              h('div', { className: 'mt-5 flex items-end gap-4' },
                h('div', { className: 'text-5xl font-semibold tracking-tight text-slate-900' }, productivityScore),
                h('div', { className: 'pb-2 text-sm text-slate-500' }, 'Daily score based on completion momentum, task flow, and recent activity.')
              ),
              h('div', { className: 'mt-5 grid gap-3' },
                h('div', { className: 'h-2 overflow-hidden rounded-full bg-slate-100' }, h('div', { className: 'h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600', style: { width: `${productivityScore}%` } })),
                h('div', { className: 'flex items-center justify-between text-xs text-slate-500' }, h('span', null, 'Progress toward a strong day'), h('span', null, `${completedToday} completed today`))
              )
            ),
            h('div', { className: 'grid gap-4 sm:grid-cols-3' },
              h(MiniStatStrip, { label: 'Completed', value: stats.complete, tone: 'bg-emerald-500', hint: 'Finished work' }),
              h(MiniStatStrip, { label: 'Pending', value: stats.planned, tone: 'bg-slate-400', hint: 'Awaiting start' }),
              h(MiniStatStrip, { label: 'In Progress', value: stats.inprogress, tone: 'bg-blue-500', hint: 'Currently active' })
            )
          )
        ),
        h('div', { className: 'grid gap-5 lg:grid-cols-2' },
          h('div', { className: 'rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm' },
            h('div', { className: 'flex items-center justify-between' },
              h('div', null, h('p', { className: 'text-xs font-semibold uppercase tracking-[0.24em] text-blue-600' }, 'Weekly productivity'), h('h3', { className: 'mt-2 text-xl font-semibold tracking-tight text-slate-900' }, 'Productive days this week')),
              h('span', { className: 'text-sm text-slate-500' }, 'Completed vs created')
            ),
            h('div', { className: 'mt-4 h-64' },
              h(ResponsiveContainer, { width: '100%', height: '100%' },
                h(BarChart, { data: weeklyData, margin: { top: 12, right: 12, left: 0, bottom: 0 } },
                  h(CartesianGrid, { strokeDasharray: '3 3', vertical: false, stroke: '#e2e8f0' }),
                  h(XAxis, { dataKey: 'label', tick: { fill: '#64748b', fontSize: 12 }, axisLine: false, tickLine: false }),
                  h(YAxis, { tick: { fill: '#64748b', fontSize: 12 }, axisLine: false, tickLine: false }),
                  h(Tooltip, {
                    contentStyle: { borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 16px 40px rgba(15,23,42,0.12)' },
                  }),
                  h(Bar, { dataKey: 'completed', radius: [10, 10, 0, 0], fill: 'url(#completedBarGradient)' }),
                  h(Bar, { dataKey: 'created', radius: [10, 10, 0, 0], fill: '#cbd5e1' }),
                  h('defs', null,
                    h('linearGradient', { id: 'completedBarGradient', x1: '0%', y1: '0%', x2: '100%', y2: '0%' },
                      h('stop', { offset: '0%', stopColor: '#2563eb' }),
                      h('stop', { offset: '100%', stopColor: '#4f46e5' })
                    )
                  )
                )
              )
            )
          ),
          h('div', { className: 'rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm' },
            h('div', { className: 'flex items-center justify-between' },
              h('div', null, h('p', { className: 'text-xs font-semibold uppercase tracking-[0.24em] text-blue-600' }, 'Completion trend'), h('h3', { className: 'mt-2 text-xl font-semibold tracking-tight text-slate-900' }, 'Trend line graph')),
              h('span', { className: 'text-sm text-slate-500' }, `${completionTrend}% trend`)
            ),
            h('div', { className: 'mt-4 h-64' },
              h(ResponsiveContainer, { width: '100%', height: '100%' },
                h(AreaChart, { data: weeklyData, margin: { top: 12, right: 12, left: 0, bottom: 0 } },
                  h(CartesianGrid, { strokeDasharray: '3 3', vertical: false, stroke: '#e2e8f0' }),
                  h(XAxis, { dataKey: 'label', tick: { fill: '#64748b', fontSize: 12 }, axisLine: false, tickLine: false }),
                  h(YAxis, { tick: { fill: '#64748b', fontSize: 12 }, axisLine: false, tickLine: false, domain: [0, 100] }),
                  h(Tooltip, {
                    contentStyle: { borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 16px 40px rgba(15,23,42,0.12)' },
                  }),
                  h(Area, {
                    type: 'monotone',
                    dataKey: 'score',
                    stroke: '#2563eb',
                    strokeWidth: 3,
                    fill: 'url(#trendAreaGradient)',
                    fillOpacity: 1,
                  }),
                  h('defs', null,
                    h('linearGradient', { id: 'trendAreaGradient', x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
                      h('stop', { offset: '0%', stopColor: '#3b82f6', stopOpacity: 0.35 }),
                      h('stop', { offset: '100%', stopColor: '#3b82f6', stopOpacity: 0.02 })
                    )
                  )
                )
              )
            )
          )
        )
      ),
      h('div', { className: 'grid gap-4 xl:grid-cols-1' },
        h('div', { className: 'rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-sm' },
          h('div', { className: 'flex items-center justify-between gap-3' },
            h('div', null, h('p', { className: 'text-xs font-semibold uppercase tracking-[0.24em] text-sky-300' }, 'Productivity pulse'), h('h3', { className: 'mt-2 text-xl font-semibold tracking-tight' }, 'Weekly completion momentum')),
            h('div', { className: 'rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80' }, `${completionTrend}%`)
          ),
          h('div', { className: 'mt-5 space-y-4' },
            weeklyData.map((day) =>
              h('div', { key: day.label },
                h('div', { className: 'mb-2 flex items-center justify-between text-sm text-white/80' },
                  h('span', null, day.label),
                  h('span', null, `${day.score}%`)
                ),
                h('div', { className: 'h-2 overflow-hidden rounded-full bg-white/10' },
                  h('div', { className: 'h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400', style: { width: `${day.score}%` } })
                )
              )
            )
          )
        )
      )
    )
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [adminOverview, setAdminOverview] = useState(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState('Overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const storedUser = window.localStorage.getItem('taskhub-user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const loadWorkspace = async () => {
      try {
        if (user.isAdmin || user.email?.toLowerCase() === ADMIN_EMAIL) {
          const overview = await fetchAdminOverview(user.uid);
          setAdminOverview(overview);
          setTasks(overview.tasks || []);
          setCurrentPage('Admin');
        } else {
          const data = await fetchTasks(user.uid);
          setTasks(data);
          setAdminOverview(null);
          setCurrentPage('Overview');
        }
        setError('');
      } catch (err) {
        setError('Could not load workspace data');
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [user]);

  const pushToast = (type, titleText, message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((items) => [...items, { id, type, title: titleText, message }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 2600);
  };

  const dismissToast = (id) => setToasts((items) => items.filter((item) => item.id !== id));

  const stats = useMemo(() => {
    const totals = tasks.reduce(
      (acc, task) => {
        acc.total += 1;
        acc[task.status.toLowerCase().replace(/\s+/g, '')] += 1;
        return acc;
      },
      { total: 0, planned: 0, inprogress: 0, complete: 0 }
    );
    return { ...totals, progress: totals.total === 0 ? 0 : Math.round((totals.complete / totals.total) * 100) };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...tasks]
      .filter((task) => (filter === 'All' ? true : task.status === filter))
      .filter((task) => (q ? task.title.toLowerCase().includes(q) : true))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tasks, query, filter]);

  const recentTasks = useMemo(
    () => [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4),
    [tasks]
  );

  const activityTasks = useMemo(
    () => [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6),
    [tasks]
  );

  const weeklyData = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return { date, label: formatDay(date) };
    });

    return days.map(({ date, label }) => {
      const created = tasks.filter((task) => isSameDay(new Date(task.createdAt), date)).length;
      const completed = tasks.filter(
        (task) => task.status === 'Complete' && isSameDay(new Date(task.updatedAt || task.createdAt), date)
      ).length;
      const inProgress = tasks.filter(
        (task) => task.status === 'In Progress' && isSameDay(new Date(task.updatedAt || task.createdAt), date)
      ).length;

      const score = clamp(Math.round(completed * 28 + created * 8 + inProgress * 12 + (dateKey(date) === dateKey(today) ? 12 : 0)), 0, 100);

      return { label, created, completed, inProgress, score };
    });
  }, [tasks]);

  const calendarDays = useMemo(() => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - monthStart.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const dayKey = dateKey(date);
      const dayTasks = tasks.filter((task) => dateKey(new Date(task.updatedAt || task.createdAt)) === dayKey);

      return {
        date,
        day: date.getDate(),
        inMonth: date.getMonth() === today.getMonth(),
        isToday: dayKey === dateKey(today),
        count: dayTasks.length,
        completed: dayTasks.filter((task) => task.status === 'Complete').length,
      };
    });
  }, [tasks]);

  const calendarMonthLabel = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, []);

  const calendarMonths = useMemo(() => {
    const year = new Date().getFullYear();

    return Array.from({ length: 12 }, (_, monthIndex) => {
      const monthTasks = tasks.filter((task) => {
        const taskDate = new Date(task.updatedAt || task.createdAt);
        return taskDate.getFullYear() === year && taskDate.getMonth() === monthIndex;
      });

      return {
        monthIndex,
        label: new Date(year, monthIndex, 1).toLocaleDateString(undefined, { month: 'long' }),
        tasks: monthTasks,
        total: monthTasks.length,
        completed: monthTasks.filter((task) => task.status === 'Complete').length,
        inProgress: monthTasks.filter((task) => task.status === 'In Progress').length,
        planned: monthTasks.filter((task) => task.status === 'Planned').length,
        isCurrentMonth: monthIndex === new Date().getMonth(),
      };
    });
  }, [tasks]);

  const productivityScore = useMemo(() => {
    const weekCompleted = weeklyData.reduce((sum, day) => sum + day.completed, 0);
    const weekCreated = weeklyData.reduce((sum, day) => sum + day.created, 0);
    return clamp(Math.round(stats.progress * 0.45 + weekCompleted * 6 + weekCreated * 2), 0, 100);
  }, [stats.progress, weeklyData]);

  const completedToday = weeklyData[weeklyData.length - 1]?.completed || 0;
  const completionTrend = weeklyData.length
    ? clamp(Math.round(weeklyData.slice(-3).reduce((sum, day) => sum + day.score, 0) / Math.min(3, weeklyData.length)), 0, 100)
    : 0;

  const handleLogin = async () => {
    const loggedInUser = await signInWithGoogle();
    if (!loggedInUser) return;
    window.localStorage.setItem('taskhub-user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    window.localStorage.removeItem('taskhub-user');
    setUser(null);
    setTasks([]);
    setAdminOverview(null);
    setCurrentPage('Overview');
  };

  const handleAddTask = async () => {
    if (!title.trim()) return;
    try {
      setError('');
      await createTask(user.uid, title.trim(), priority, user.displayName, user.email);
      setTitle('');
      setPriority('Medium');
      if (user.isAdmin || user.email?.toLowerCase() === ADMIN_EMAIL) {
        const overview = await fetchAdminOverview(user.uid);
        setAdminOverview(overview);
        setTasks(overview.tasks || []);
      } else {
        setTasks(await fetchTasks(user.uid));
      }
      pushToast('success', 'Task created', 'The new task was added successfully.');
    } catch {
      setError('Could not create task');
      pushToast('error', 'Create failed', 'Please try again to add the task.');
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      setError('');
      await updateTask(user.uid, taskId, { status });
      setTasks(await fetchTasks(user.uid));
      pushToast('success', 'Status updated', 'Task status changed successfully.');
    } catch {
      setError('Could not update task');
      pushToast('error', 'Update failed', 'Could not update task status.');
    }
  };

  const handlePriorityChange = async (taskId, nextPriority) => {
    try {
      setError('');
      await updateTask(user.uid, taskId, { priority: nextPriority });
      setTasks(await fetchTasks(user.uid));
      pushToast('success', 'Priority updated', 'Task priority changed successfully.');
    } catch {
      setError('Could not update task');
      pushToast('error', 'Update failed', 'Could not update task priority.');
    }
  };

  const isAdmin = user?.isAdmin || user?.email?.toLowerCase() === ADMIN_EMAIL;
  const visibleNavItems = isAdmin ? [...NAV_ITEMS, 'Admin'] : NAV_ITEMS;

  useEffect(() => {
    if (!user) return;
    setCurrentPage(isAdmin ? 'Admin' : 'Overview');
  }, [user?.uid, isAdmin]);

  if (!user) {
    return h(
      'main',
      {
        className:
          'relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.12),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.08),_transparent_22%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900',
      },
      h('div', { className: 'pointer-events-none absolute inset-x-0 top-[-120px] mx-auto h-72 w-72 rounded-full bg-blue-300/20 blur-3xl' }),
      h('div', { className: 'pointer-events-none absolute bottom-[-140px] right-[-90px] h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl' }),
      h(
        'div',
        { className: 'relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8' },
        h(
          'section',
          {
            className:
              'grid w-full gap-8 overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/88 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl xl:grid-cols-[1.08fr_0.92fr] xl:items-center xl:p-8',
          },
          h('div', { className: 'space-y-8 self-center lg:pr-4' },
            h('div', { className: 'flex items-center gap-4' }, h(Logo, { compact: true }), h('div', { className: 'leading-tight' }, h('div', { className: 'text-xl font-semibold tracking-tight text-slate-900' }, 'TaskHub'), h('div', { className: 'text-sm text-slate-500' }, 'Task management dashboard'))),
            h('div', { className: 'inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700' }, h('span', { className: 'h-2 w-2 rounded-full bg-blue-600' }), 'Secure access'),
            h('div', { className: 'space-y-5' },
              h('p', { className: 'text-sm font-semibold uppercase tracking-[0.28em] text-blue-600' }, 'Workspace overview'),
              h('h1', { className: 'max-w-xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl xl:text-[3.6rem] xl:leading-[1.02]' }, 'A focused workspace for managing tasks with clarity and control.'),
              h('p', { className: 'max-w-2xl text-base leading-7 text-slate-600 sm:text-lg' }, 'TaskHub provides a refined interface for organized task management, clear status visibility, and smooth day-to-day coordination.')
            ),
            h('div', { className: 'flex flex-wrap items-center gap-4' },
              h('button', { className: 'rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800', onClick: handleLogin }, 'Continue with Google'),
              h('div', { className: 'flex flex-wrap items-center gap-2 text-sm text-slate-500' },
                h('span', { className: 'rounded-full border border-slate-200 bg-white/80 px-3 py-2' }, 'Private dashboard'),
                h('span', { className: 'rounded-full border border-slate-200 bg-white/80 px-3 py-2' }, 'Structured UI'),
                h('span', { className: 'rounded-full border border-slate-200 bg-white/80 px-3 py-2' }, 'Reliable updates')
              )
            ),
            h('div', { className: 'grid max-w-xl grid-cols-3 gap-3' },
              h('div', { className: 'rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm' }, h('div', { className: 'text-2xl font-semibold text-slate-900' }, '99%'), h('div', { className: 'mt-1 text-sm text-slate-500' }, 'Visibility')),
              h('div', { className: 'rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm' }, h('div', { className: 'text-2xl font-semibold text-slate-900' }, '3'), h('div', { className: 'mt-1 text-sm text-slate-500' }, 'Status levels')),
              h('div', { className: 'rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm' }, h('div', { className: 'text-2xl font-semibold text-slate-900' }, '1 tap'), h('div', { className: 'mt-1 text-sm text-slate-500' }, 'Google access'))
            )
          ),
          h('div', { className: 'grid self-center gap-4 rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:grid-cols-2 xl:grid-cols-1' },
            h('div', { className: 'rounded-[24px] border border-white bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm' },
              h('div', { className: 'text-xs font-semibold uppercase tracking-[0.24em] text-blue-600' }, 'Overview'),
              h('div', { className: 'mt-2 text-lg font-semibold text-slate-900' }, 'Workspace structure'),
              h('p', { className: 'mt-2 text-sm leading-6 text-slate-500' }, 'A clear layout designed to support focus, balance, and efficient task review.')
            ),
            h('div', { className: 'grid grid-cols-2 gap-3' },
              h('div', { className: 'rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm' }, h('div', { className: 'text-2xl font-semibold text-slate-900' }, '01'), h('div', { className: 'mt-1 text-sm text-slate-500' }, 'Workflow clarity')),
              h('div', { className: 'rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm' }, h('div', { className: 'text-2xl font-semibold text-slate-900' }, '02'), h('div', { className: 'mt-1 text-sm text-slate-500' }, 'Consistent spacing')),
              h('div', { className: 'rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm' }, h('div', { className: 'text-2xl font-semibold text-slate-900' }, '03'), h('div', { className: 'mt-1 text-sm text-slate-500' }, 'Readable hierarchy')),
              h('div', { className: 'rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm' }, h('div', { className: 'text-2xl font-semibold text-slate-900' }, '04'), h('div', { className: 'mt-1 text-sm text-slate-500' }, 'Responsive design'))
            )
          )
        )
      )
    );
  }

  // Reorganize weekly data for advanced charts
  const dailyProgressData = weeklyData.map(day => ({
    ...day,
    pending: day.created - day.completed,
    trend: Math.max(0, Math.min(100, day.score)),
  }));

  return h(
    'main',
    { className: 'min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900' },
    h(ToastList, { toasts, onDismiss: dismissToast }),
    // Modern Top Navigation Bar
    React.createElement(motion.header,
      {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
        className: 'sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-lg shadow-sm',
      },
      h(
        'div',
        { className: 'mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8' },
        // Logo & Brand
        h('div', { className: 'flex items-center gap-3 shrink-0' },
          h(Logo, { compact: true }),
          h('div', null,
            h('div', { className: 'text-base font-bold tracking-tight text-slate-900' }, 'TaskHub'),
            h('div', { className: 'text-xs text-slate-500' }, 'Pro Dashboard')
          )
        ),
        // Main Navigation - Horizontal
        h(
          'nav',
          { className: 'flex flex-wrap items-center gap-1' },
          visibleNavItems.map((item) =>
            h(
              motion.button,
              {
                key: item,
                onClick: () => setCurrentPage(item),
                whileHover: { y: -1 },
                whileTap: { scale: 0.98 },
                className: cn(
                  'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all relative',
                  item === currentPage
                    ? 'text-blue-600 bg-blue-50 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                ),
              },
              h(Icon, { name: NAV_META[item].icon, className: 'h-4 w-4' }),
              h('span', null, item),
              item === currentPage ? h('span', { className: 'absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-blue-600' }) : null
            )
          )
        ),
        // User Menu & Actions
        h('div', { className: 'flex items-center gap-2 sm:gap-3' },
          h('div', { className: 'hidden sm:flex flex-col text-right' },
            h('div', { className: 'text-xs font-semibold text-slate-900' }, user.displayName),
            h('div', { className: 'text-xs text-slate-500' }, user.email)
          ),
          h(
            motion.button,
            {
              whileHover: { scale: 1.05 },
              whileTap: { scale: 0.95 },
              onClick: handleLogout,
              className: 'rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors',
            },
            'Logout'
          )
        )
      )
    ),
    // Main Content Area
    h(
      'div',
      { className: 'mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8' },
      // Overview Page - New Horizontal SaaS Layout
      currentPage === 'Overview' && h(
        motion.div,
        { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } },
        h('div', { className: 'space-y-6' },
          // Header Section
          h('div', { className: 'space-y-2' },
            h('h1', { className: 'text-3xl font-bold tracking-tight text-slate-900' }, 'Dashboard'),
            h('p', { className: 'text-sm text-slate-600' }, `Welcome back, ${user.displayName}. Here's your productivity overview.`)
          ),
          // KPI Cards in Horizontal Grid
          h('div', { className: 'grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' },
            React.createElement(motion.div, { initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, transition: { duration: 0.3 } },
              h('div', { className: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow' },
                h('div', { className: 'flex items-center justify-between' },
                  h('div', null,
                    h('p', { className: 'text-xs font-semibold uppercase text-slate-500 tracking-wider' }, 'Total Tasks'),
                    h('div', { className: 'mt-2 text-2xl font-bold text-slate-900' }, stats.total)
                  ),
                  h('div', { className: 'text-3xl text-blue-600 opacity-20' }, '◆')
                )
              )
            ),
            React.createElement(motion.div, { initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, transition: { duration: 0.35, delay: 0.05 } },
              h('div', { className: 'rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-emerald-50/30 p-4 shadow-sm hover:shadow-md transition-shadow' },
                h('div', { className: 'flex items-center justify-between' },
                  h('div', null,
                    h('p', { className: 'text-xs font-semibold uppercase text-slate-500 tracking-wider' }, 'Completed'),
                    h('div', { className: 'mt-2 text-2xl font-bold text-emerald-700' }, stats.complete)
                  ),
                  h('div', { className: 'text-3xl text-emerald-600 opacity-20' }, '✓')
                )
              )
            ),
            React.createElement(motion.div, { initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, transition: { duration: 0.35, delay: 0.1 } },
              h('div', { className: 'rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-50/30 p-4 shadow-sm hover:shadow-md transition-shadow' },
                h('div', { className: 'flex items-center justify-between' },
                  h('div', null,
                    h('p', { className: 'text-xs font-semibold uppercase text-slate-500 tracking-wider' }, 'In Progress'),
                    h('div', { className: 'mt-2 text-2xl font-bold text-blue-700' }, stats.inprogress)
                  ),
                  h('div', { className: 'text-3xl text-blue-600 opacity-20' }, '→')
                )
              )
            ),
            React.createElement(motion.div, { initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, transition: { duration: 0.35, delay: 0.15 } },
              h('div', { className: 'rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-50/30 p-4 shadow-sm hover:shadow-md transition-shadow' },
                h('div', { className: 'flex items-center justify-between' },
                  h('div', null,
                    h('p', { className: 'text-xs font-semibold uppercase text-slate-500 tracking-wider' }, 'Pending'),
                    h('div', { className: 'mt-2 text-2xl font-bold text-slate-700' }, stats.planned)
                  ),
                  h('div', { className: 'text-3xl text-slate-600 opacity-20' }, '◇')
                )
              )
            )
          ),
          // Main Analytics Section - Two Column Grid
          h('div', { className: 'grid gap-4 lg:grid-cols-3' },
            // Left: Large Circular Progress + Metrics
            h(
              motion.div,
              { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.1 } },
              h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm' },
                h('div', { className: 'flex items-start justify-between mb-6' },
                  h('div', null,
                    h('p', { className: 'text-xs font-semibold uppercase text-blue-600 tracking-wider' }, 'Completion'),
                    h('h2', { className: 'mt-1 text-lg font-bold text-slate-900' }, 'Overall Progress')
                  ),
                  h('div', { className: 'px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-blue-700' }, `${stats.progress}%`)
                ),
                h(CircularProgressRing, {
                  value: stats.progress,
                  label: '',
                  caption: '',
                })
              )
            ),
            // Middle: Charts Section (Bar + Line combined)
            h(
              motion.div,
              { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.2 } },
              h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm' },
                h('div', { className: 'mb-4' },
                  h('p', { className: 'text-xs font-semibold uppercase text-blue-600 tracking-wider' }, 'Weekly Performance'),
                  h('h2', { className: 'mt-1 text-lg font-bold text-slate-900' }, 'Task Activity')
                ),
                h('div', { className: 'h-64' },
                  h(ResponsiveContainer, { width: '100%', height: '100%' },
                    h(BarChart, { data: dailyProgressData, margin: { top: 8, right: 12, left: -20, bottom: 0 } },
                      h(CartesianGrid, { strokeDasharray: '3 3', vertical: false, stroke: '#e2e8f0' }),
                      h(XAxis, { dataKey: 'label', tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false }),
                      h(YAxis, { tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false }),
                      h(Tooltip, { contentStyle: { borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'none', background: '#fff' } }),
                      h(Bar, { dataKey: 'completed', radius: [8, 8, 0, 0], fill: '#10b981', name: 'Completed' }),
                      h(Bar, { dataKey: 'created', radius: [8, 8, 0, 0], fill: '#e5e7eb', name: 'Created' })
                    )
                  )
                )
              )
            ),
            // Right: Productivity Score + Mini Stats
            h(
              motion.div,
              { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.3 } },
              h('div', { className: 'rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-sm text-white' },
                h('div', { className: 'mb-6' },
                  h('p', { className: 'text-xs font-semibold uppercase text-sky-300 tracking-wider' }, 'Momentum'),
                  h('h2', { className: 'mt-1 text-lg font-bold' }, 'Productivity Score')
                ),
                h('div', { className: 'flex items-end gap-2 mb-6' },
                  h('div', { className: 'text-5xl font-bold tracking-tight' }, productivityScore),
                  h('div', { className: 'text-sm text-white/60 pb-2' }, '/ 100')
                ),
                h('div', { className: 'space-y-3' },
                  h('div', null,
                    h('div', { className: 'flex items-center justify-between text-xs mb-1.5' },
                      h('span', null, 'This week'),
                      h('span', { className: 'text-sky-300' }, `${completedToday} today`)
                    ),
                    h('div', { className: 'h-2 rounded-full bg-white/10 overflow-hidden' },
                      h('div', { className: 'h-full bg-gradient-to-r from-sky-400 to-indigo-400 rounded-full', style: { width: `${Math.min(completedToday * 20, 100)}%` } })
                    )
                  ),
                  h('div', null,
                    h('div', { className: 'flex items-center justify-between text-xs mb-1.5' },
                      h('span', null, '7-day trend'),
                      h('span', { className: 'text-sky-300' }, `${completionTrend}%`)
                    ),
                    h('div', { className: 'h-2 rounded-full bg-white/10 overflow-hidden' },
                      h('div', { className: 'h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full', style: { width: `${completionTrend}%` } })
                    )
                  )
                )
              )
            )
          ),
          // Lower Section - Charts and Latest
          h('div', { className: 'grid gap-4 lg:grid-cols-2' },
            // Trend Line Chart
            h(
              motion.div,
              { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.25 } },
              h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm' },
                h('div', { className: 'mb-4' },
                  h('p', { className: 'text-xs font-semibold uppercase text-blue-600 tracking-wider' }, 'Trends'),
                  h('h2', { className: 'mt-1 text-lg font-bold text-slate-900' }, 'Completion Trend')
                ),
                h('div', { className: 'h-56' },
                  h(ResponsiveContainer, { width: '100%', height: '100%' },
                    h(LineChart, { data: dailyProgressData, margin: { top: 8, right: 12, left: -20, bottom: 0 } },
                      h(CartesianGrid, { strokeDasharray: '3 3', vertical: false, stroke: '#e2e8f0' }),
                      h(XAxis, { dataKey: 'label', tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false }),
                      h(YAxis, { tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false, domain: [0, 100] }),
                      h(Tooltip, { contentStyle: { borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'none', background: '#fff' } }),
                      h(Line, { type: 'monotone', dataKey: 'score', stroke: '#2563eb', strokeWidth: 3, dot: { fill: '#2563eb', r: 5 }, activeDot: { r: 7 } })
                    )
                  )
                )
              )
            ),
            // Quick Add + Recent Activity
            h(
              motion.div,
              { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.35 } },
              h('div', { className: 'space-y-4' },
                // Quick Add
                h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm' },
                  h('div', { className: 'mb-4' },
                    h('p', { className: 'text-xs font-semibold uppercase text-blue-600 tracking-wider' }, 'Quick Action'),
                    h('h2', { className: 'mt-1 text-lg font-bold text-slate-900' }, 'Add Task')
                  ),
                  h('div', { className: 'space-y-3' },
                    h('input', {
                      type: 'text',
                      value: title,
                      placeholder: 'What needs to be done?',
                      onChange: (e) => setTitle(e.target.value),
                      onKeyDown: (e) => e.key === 'Enter' && handleAddTask(),
                      className: 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
                    }),
                    h('div', { className: 'flex gap-2' },
                      h('select', {
                        value: priority,
                        onChange: (e) => setPriority(e.target.value),
                        className: 'flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
                      }, PRIORITY_OPTIONS.map((p) => h('option', { key: p, value: p }, p))),
                      React.createElement(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: handleAddTask, className: 'rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition' }, 'Add')
                    ),
                    error ? h('p', { className: 'text-xs text-red-600 font-medium' }, error) : null
                  )
                ),
                // Recent Activity
                h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm' },
                  h('div', { className: 'mb-4' },
                    h('p', { className: 'text-xs font-semibold uppercase text-blue-600 tracking-wider' }, 'Activity'),
                    h('h2', { className: 'mt-1 text-lg font-bold text-slate-900' }, 'Recent Updates')
                  ),
                  h('div', { className: 'space-y-2 max-h-48 overflow-y-auto' },
                    loading
                      ? h(Spinner)
                      : recentTasks.length === 0
                        ? h('p', { className: 'text-sm text-slate-500 py-4' }, 'No activity yet')
                        : recentTasks.map((task) =>
                            h(
                              motion.div,
                              { key: task._id, initial: { opacity: 0, x: -10 }, whileInView: { opacity: 1, x: 0 }, transition: { duration: 0.2 } },
                              h('div', { className: 'flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition' },
                                h('span', { className: cn('mt-1.5 h-2 w-2 rounded-full shrink-0', STATUS_META[task.status].tone.split(' ')[0] === 'bg-emerald-50' ? 'bg-emerald-500' : STATUS_META[task.status].tone.split(' ')[0] === 'bg-blue-50' ? 'bg-blue-500' : 'bg-slate-400') }),
                                h('div', { className: 'min-w-0 flex-1' },
                                  h('div', { className: 'truncate text-xs font-medium text-slate-900' }, task.title),
                                  h('div', { className: 'text-xs text-slate-500 mt-0.5' }, STATUS_META[task.status].label)
                                )
                              )
                            )
                          )
                  )
                )
              )
            )
          )
        )
      ),
      // Tasks Page
      currentPage === 'Tasks' && h(
        motion.div,
        { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } },
        h('div', { className: 'space-y-4' },
          h('div', { className: 'space-y-2' },
            h('h1', { className: 'text-3xl font-bold tracking-tight text-slate-900' }, 'Tasks'),
            h('p', { className: 'text-sm text-slate-600' }, 'Manage and track all your tasks')
          ),
          h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm' },
            h('div', { className: 'space-y-4' },
              h('div', { className: 'flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between' },
                h('input', {
                  type: 'search',
                  value: query,
                  placeholder: 'Search tasks...',
                  onChange: (e) => setQuery(e.target.value),
                  className: 'w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
                }),
                h('div', { className: 'flex flex-wrap gap-2' },
                  ['All', ...STATUS_OPTIONS].map((status) =>
                    h(
                      motion.button,
                      {
                        key: status,
                        onClick: () => setFilter(status),
                        whileHover: { scale: 1.05 },
                        whileTap: { scale: 0.95 },
                        className: cn(
                          'px-3 py-1.5 text-xs font-medium rounded-lg transition',
                          status === filter
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        ),
                      },
                      status
                    )
                  )
                )
              ),
              h('div', { className: 'h-1.5 rounded-full bg-slate-100 overflow-hidden' },
                h('div', { className: 'h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full transition-all', style: { width: `${stats.progress}%` } })
              ),
              h('div', { className: 'grid gap-2' },
                loading
                  ? h('div', { className: 'py-8' }, h(Spinner))
                  : filteredTasks.length === 0
                    ? h('div', { className: 'py-8 text-center text-sm text-slate-500' }, 'No tasks match your filters')
                    : h(
                        motion.div,
                        { className: 'space-y-2', initial: 'hidden', animate: 'visible', variants: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } } },
                        filteredTasks.map((task) =>
                          h(
                            motion.div,
                            { key: task._id, variants: { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } } },
                            h(TaskCard, {
                              task,
                              onStatusChange: handleStatusChange,
                              onPriorityChange: handlePriorityChange,
                            })
                          )
                        )
                      )
              )
            )
          )
        )
      ),
      // Insights Page
      currentPage === 'Insights' && h(
        motion.div,
        { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } },
        h('div', { className: 'space-y-6' },
          h('div', { className: 'space-y-2' },
            h('h1', { className: 'text-3xl font-bold tracking-tight text-slate-900' }, 'Performance Insights'),
            h('p', { className: 'text-sm text-slate-600' }, 'Deep dive into your productivity metrics')
          ),
          h('div', { className: 'grid gap-3 grid-cols-1 sm:grid-cols-3 lg:grid-cols-3' },
            h('div', { className: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm' },
              h('p', { className: 'text-xs font-semibold uppercase text-slate-500 tracking-wider' }, 'Completion Rate'),
              h('div', { className: 'mt-2 text-2xl font-bold text-slate-900' }, `${stats.progress}%`),
              h('p', { className: 'mt-1 text-xs text-slate-500' }, 'Tasks completed')
            ),
            h('div', { className: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm' },
              h('p', { className: 'text-xs font-semibold uppercase text-slate-500 tracking-wider' }, 'Task Load'),
              h('div', { className: 'mt-2 text-2xl font-bold text-slate-900' }, stats.total),
              h('p', { className: 'mt-1 text-xs text-slate-500' }, 'Total tasks')
            ),
            h('div', { className: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm' },
              h('p', { className: 'text-xs font-semibold uppercase text-slate-500 tracking-wider' }, 'Current'),
              h('div', { className: 'mt-2 text-2xl font-bold text-slate-900' }, stats.inprogress),
              h('p', { className: 'mt-1 text-xs text-slate-500' }, 'In progress')
            )
          ),
          h('div', { className: 'grid gap-4 lg:grid-cols-3' },
            h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2' },
              h('div', { className: 'mb-4' },
                h('p', { className: 'text-xs font-semibold uppercase text-blue-600 tracking-wider' }, 'Distribution'),
                h('h2', { className: 'mt-1 text-lg font-bold text-slate-900' }, 'Status Breakdown')
              ),
              h('div', { className: 'space-y-4' },
                ['Planned', 'In Progress', 'Complete'].map((status, idx) => {
                  const value = stats[status.toLowerCase().replace(/\s+/g, '')] || 0;
                  const percent = stats.total === 0 ? 0 : Math.round((value / stats.total) * 100);
                  const colors = ['bg-slate-400', 'bg-blue-500', 'bg-emerald-500'];
                  return h('div', { key: status },
                    h('div', { className: 'flex items-center justify-between mb-2' },
                      h('span', { className: 'text-sm font-medium text-slate-700' }, status),
                      h('div', { className: 'flex items-center gap-2' },
                        h('span', { className: 'text-sm font-bold text-slate-900' }, value),
                        h('span', { className: 'text-xs text-slate-500' }, `${percent}%`)
                      )
                    ),
                    h('div', { className: 'h-2 rounded-full bg-slate-100 overflow-hidden' },
                      h('div', { className: `h-full ${colors[idx]} rounded-full transition-all`, style: { width: `${percent}%` } })
                    )
                  );
                })
              )
            ),
            h('div', { className: 'rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-sm' },
              h('p', { className: 'text-xs font-semibold uppercase text-indigo-600 tracking-wider' }, 'Summary'),
              h('h2', { className: 'mt-1 text-lg font-bold text-slate-900' }, 'Key Metrics'),
              h('div', { className: 'mt-5 space-y-3' },
                h('div', { className: 'rounded-lg bg-white p-3' },
                  h('div', { className: 'text-xs text-slate-600 mb-1' }, 'Completion %'),
                  h('div', { className: 'text-xl font-bold text-slate-900' }, `${stats.progress}%`)
                ),
                h('div', { className: 'rounded-lg bg-white p-3' },
                  h('div', { className: 'text-xs text-slate-600 mb-1' }, 'Pending'),
                  h('div', { className: 'text-xl font-bold text-slate-900' }, stats.planned)
                ),
                h('div', { className: 'rounded-lg bg-white p-3' },
                  h('div', { className: 'text-xs text-slate-600 mb-1' }, 'Active'),
                  h('div', { className: 'text-xl font-bold text-slate-900' }, stats.inprogress)
                )
              )
            )
          )
        )
      ),
      // Activity Page - Enhanced
      currentPage === 'Activity' && h(
        motion.div,
        { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } },
        h('div', { className: 'space-y-6' },
          // Header with stats
          h('div', { className: 'space-y-4' },
            h('div', { className: 'space-y-2' },
              h('h1', { className: 'text-3xl font-bold tracking-tight text-slate-900' }, '📊 Activity Timeline'),
              h('p', { className: 'text-sm text-slate-600' }, `Track all your task updates and changes (${activityTasks.length} recent activities)`)
            ),
            // Activity stats cards
            h('div', { className: 'grid gap-3 grid-cols-1 sm:grid-cols-3 lg:grid-cols-5' },
              h(
                motion.div,
                { initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, transition: { duration: 0.3 } },
                h('div', { className: 'rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-3' },
                  h('div', { className: 'flex items-center justify-between' },
                    h('div', null,
                      h('div', { className: 'text-xs uppercase tracking-wide font-semibold text-emerald-600' }, 'Completed'),
                      h('div', { className: 'text-2xl font-bold text-emerald-900 mt-1' }, stats.completed)
                    ),
                    h('div', { className: 'text-2xl' }, '✓')
                  )
                )
              ),
              h(
                motion.div,
                { initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, transition: { duration: 0.3, delay: 0.05 } },
                h('div', { className: 'rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-3' },
                  h('div', { className: 'flex items-center justify-between' },
                    h('div', null,
                      h('div', { className: 'text-xs uppercase tracking-wide font-semibold text-blue-600' }, 'In Progress'),
                      h('div', { className: 'text-2xl font-bold text-blue-900 mt-1' }, stats.inprogress)
                    ),
                    h('div', { className: 'text-2xl' }, '→')
                  )
                )
              ),
              h(
                motion.div,
                { initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, transition: { duration: 0.3, delay: 0.1 } },
                h('div', { className: 'rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-3' },
                  h('div', { className: 'flex items-center justify-between' },
                    h('div', null,
                      h('div', { className: 'text-xs uppercase tracking-wide font-semibold text-slate-600' }, 'Pending'),
                      h('div', { className: 'text-2xl font-bold text-slate-900 mt-1' }, stats.pending)
                    ),
                    h('div', { className: 'text-2xl' }, '◇')
                  )
                )
              ),
              h(
                motion.div,
                { initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, transition: { duration: 0.3, delay: 0.15 } },
                h('div', { className: 'rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 p-3' },
                  h('div', { className: 'flex items-center justify-between' },
                    h('div', null,
                      h('div', { className: 'text-xs uppercase tracking-wide font-semibold text-violet-600' }, 'Total'),
                      h('div', { className: 'text-2xl font-bold text-violet-900 mt-1' }, stats.total)
                    ),
                    h('div', { className: 'text-2xl' }, '≡')
                  )
                )
              ),
              h(
                motion.div,
                { initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, transition: { duration: 0.3, delay: 0.2 } },
                h('div', { className: 'rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-3' },
                  h('div', { className: 'flex items-center justify-between' },
                    h('div', null,
                      h('div', { className: 'text-xs uppercase tracking-wide font-semibold text-orange-600' }, 'Completion'),
                      h('div', { className: 'text-2xl font-bold text-orange-900 mt-1' }, `${Math.round((stats.completed / (stats.total || 1)) * 100)}%`)
                    ),
                    h('div', { className: 'text-2xl' }, '🎯')
                  )
                )
              )
            )
          ),
          // Timeline section
          h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-8 shadow-sm' },
            h('h2', { className: 'text-lg font-bold text-slate-900 mb-6' }, 'Recent Activity Stream'),
            h('div', { className: 'space-y-2' },
              h(
                motion.div,
                { className: 'space-y-3', initial: 'hidden', animate: 'visible', variants: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } } },
                activityTasks.length === 0
                  ? h('div', { className: 'py-12 text-center' },
                      h('p', { className: 'text-4xl mb-3' }, '📭'),
                      h('p', { className: 'text-slate-500' }, 'No activity yet. Create your first task to get started!')
                    )
                  : activityTasks.map((task, idx) =>
                      h(
                        motion.div,
                        { key: task._id, variants: { hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } } },
                        h('div', { className: 'flex gap-4 p-5 rounded-xl hover:bg-slate-50 transition-all duration-300 border border-transparent hover:border-slate-200 hover:shadow-md group cursor-pointer' },
                          h('div', { className: 'flex flex-col items-center gap-2 shrink-0 pt-1' },
                            h('div', { className: cn('h-4 w-4 rounded-full ring-4 ring-offset-4 transition-all group-hover:ring-offset-2', STATUS_META[task.status].tone.split(' ')[0] === 'bg-emerald-50' ? 'bg-emerald-500 ring-emerald-200' : STATUS_META[task.status].tone.split(' ')[0] === 'bg-blue-50' ? 'bg-blue-500 ring-blue-200' : 'bg-slate-400 ring-slate-200') }),
                            idx < activityTasks.length - 1 ? h('div', { className: 'w-1 h-12 bg-gradient-to-b from-slate-300 to-slate-100' }) : null
                          ),
                          h('div', { className: 'flex-1 min-w-0 pt-1' },
                            h('div', { className: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2' },
                              h('div', null,
                                h('h3', { className: 'font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition' }, task.title),
                                h('p', { className: 'text-xs text-slate-500 mt-1' }, `Created ${new Date(task.createdAt).toLocaleDateString()} at ${new Date(task.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`)
                              ),
                              h('span', { className: 'text-xs text-slate-500 shrink-0 font-mono bg-slate-100 px-2 py-1 rounded' }, new Date(task.createdAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}))
                            ),
                            h('div', { className: 'flex flex-wrap items-center gap-2' },
                              h(Badge, { tone: STATUS_META[task.status].tone }, `${STATUS_META[task.status].label}`),
                              task.priority && h(Badge, { tone: PRIORITY_META[task.priority].tone }, `🔥 ${task.priority}`),
                              h('span', { className: 'text-xs text-slate-400' }, '|'),
                              h('span', { className: 'text-xs px-2 py-1 rounded bg-slate-100 text-slate-600' }, task._id.substring(0, 8))
                            )
                          )
                        )
                      )
                    )
              )
            )
          )
        )
      ),
      // Calendar Page
      currentPage === 'Calendar' && h(
        motion.div,
        { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } },
        h('div', { className: 'space-y-6' },
          h('div', { className: 'space-y-2' },
            h('h1', { className: 'text-3xl font-bold tracking-tight text-slate-900' }, 'Calendar'),
            h('p', { className: 'text-sm text-slate-600' }, 'View task activity across the full year without changing months')
          ),
          h('div', { className: 'grid gap-4 lg:grid-cols-[1.5fr_0.5fr]' },
            h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm' },
              h('div', { className: 'mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between' },
                h('div', null,
                  h('p', { className: 'text-xs font-semibold uppercase tracking-wider text-blue-600' }, 'Year view'),
                  h('h2', { className: 'mt-1 text-lg font-bold text-slate-900' }, new Date().getFullYear())
                ),
                h('div', { className: 'text-sm text-slate-500' }, `${tasks.length} total tasks`)
              ),
              h('div', { className: 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3' },
                calendarMonths.map((month) =>
                  h(
                    'article',
                    {
                      key: month.monthIndex,
                      className: cn(
                        'rounded-2xl border p-4 transition',
                        month.isCurrentMonth ? 'border-blue-300 bg-blue-50/70 ring-1 ring-blue-100' : 'border-slate-200 bg-slate-50'
                      ),
                    },
                    h('div', { className: 'flex items-start justify-between gap-3' },
                      h('div', null,
                        h('p', { className: 'text-xs font-semibold uppercase tracking-wider text-blue-600' }, month.label),
                        h('h3', { className: 'mt-1 text-lg font-bold text-slate-900' }, `${month.total} task${month.total === 1 ? '' : 's'}`)
                      ),
                      month.isCurrentMonth ? h('span', { className: 'rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white' }, 'Current') : null
                    ),
                    h('div', { className: 'mt-4 space-y-2 text-sm text-slate-600' },
                      h('div', { className: 'flex items-center justify-between' }, h('span', null, 'Completed'), h('strong', { className: 'text-slate-900' }, month.completed)),
                      h('div', { className: 'flex items-center justify-between' }, h('span', null, 'In progress'), h('strong', { className: 'text-slate-900' }, month.inProgress)),
                      h('div', { className: 'flex items-center justify-between' }, h('span', null, 'Planned'), h('strong', { className: 'text-slate-900' }, month.planned))
                    ),
                    h('div', { className: 'mt-4 h-2 overflow-hidden rounded-full bg-white' },
                      h('div', {
                        className: 'h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600',
                        style: { width: `${month.total === 0 ? 0 : Math.max(10, Math.min(100, (month.completed / month.total) * 100))}%` },
                      })
                    ),
                    h('div', { className: 'mt-4 space-y-1' },
                      month.tasks.slice(0, 3).map((task) =>
                        h('div', { key: task._id, className: 'truncate rounded-lg bg-white px-3 py-2 text-xs text-slate-600' }, task.title)
                      ),
                      month.total === 0 ? h('div', { className: 'rounded-lg bg-white px-3 py-2 text-xs text-slate-400' }, 'No tasks this month') : null
                    )
                  )
                )
              )
            ),
            h('div', { className: 'space-y-4' },
              h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm' },
                h('p', { className: 'text-xs font-semibold uppercase tracking-wider text-blue-600' }, 'Year summary'),
                h('h3', { className: 'mt-2 text-lg font-bold text-slate-900' }, 'Calendar summary'),
                h('div', { className: 'mt-4 space-y-3 text-sm text-slate-600' },
                  h('div', { className: 'flex items-center justify-between' }, h('span', null, 'Tasks this year'), h('strong', { className: 'text-slate-900' }, tasks.length)),
                  h('div', { className: 'flex items-center justify-between' }, h('span', null, 'Completed'), h('strong', { className: 'text-slate-900' }, stats.complete)),
                  h('div', { className: 'flex items-center justify-between' }, h('span', null, 'In progress'), h('strong', { className: 'text-slate-900' }, stats.inprogress))
                )
              ),
              h('div', { className: 'rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm' },
                h('p', { className: 'text-xs font-semibold uppercase tracking-wider text-blue-600' }, 'Tip'),
                h('h3', { className: 'mt-2 text-lg font-bold text-slate-900' }, 'Use Calendar to review monthly workload'),
                h('p', { className: 'mt-2 text-sm leading-6 text-slate-600' }, 'Open this view for a full-year snapshot of task distribution and completion patterns.')
              )
            )
          )
        )
      ),
      // Admin Page
      currentPage === 'Admin' && h(
        motion.div,
        { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } },
        h('div', { className: 'space-y-6' },
          h('div', { className: 'space-y-2' },
            h('h1', { className: 'text-3xl font-bold tracking-tight text-slate-900' }, 'Admin Dashboard'),
            h('p', { className: 'text-sm text-slate-600' }, 'Monitor all users, their progress, and current workload from one place')
          ),
          loading ? h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm' }, h(Spinner)) : null,
          h('div', { className: 'grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4' },
            h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm' },
              h('p', { className: 'text-xs font-semibold uppercase tracking-wider text-slate-500' }, 'Total users'),
              h('div', { className: 'mt-2 text-2xl font-bold text-slate-900' }, adminOverview?.summary?.totalUsers ?? 0)
            ),
            h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm' },
              h('p', { className: 'text-xs font-semibold uppercase tracking-wider text-slate-500' }, 'Total tasks'),
              h('div', { className: 'mt-2 text-2xl font-bold text-slate-900' }, adminOverview?.summary?.totalTasks ?? tasks.length)
            ),
            h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm' },
              h('p', { className: 'text-xs font-semibold uppercase tracking-wider text-slate-500' }, 'Completion rate'),
              h('div', { className: 'mt-2 text-2xl font-bold text-slate-900' }, `${adminOverview?.summary?.progress ?? stats.progress}%`)
            ),
            h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm' },
              h('p', { className: 'text-xs font-semibold uppercase tracking-wider text-slate-500' }, 'In progress'),
              h('div', { className: 'mt-2 text-2xl font-bold text-slate-900' }, adminOverview?.summary?.inProgress ?? stats.inprogress)
            )
          ),
          h('div', { className: 'grid gap-4 xl:grid-cols-2' },
            (adminOverview?.users || []).length === 0
              ? h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2' },
                  h('p', { className: 'text-sm text-slate-500' }, 'No user data is available yet. Once users create tasks, their progress will appear here.')
                )
              : adminOverview.users.map((member) =>
                  h(
                    'article',
                    { key: member.userId, className: 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm' },
                    h('div', { className: 'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between' },
                      h('div', null,
                        h('h3', { className: 'text-lg font-bold text-slate-900' }, member.userName || member.userEmail || `User ${member.userId.slice(0, 6)}`),
                        h('p', { className: 'text-sm text-slate-500' }, member.userEmail || member.userId)
                      ),
                      h('div', { className: 'rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700' }, `${member.progress}% complete`)
                    ),
                    h('div', { className: 'mt-4 h-2 overflow-hidden rounded-full bg-slate-100' },
                      h('div', { className: 'h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600', style: { width: `${member.progress}%` } })
                    ),
                    h('div', { className: 'mt-4 grid grid-cols-3 gap-2 text-sm' },
                      h('div', { className: 'rounded-xl bg-slate-50 p-3' }, h('div', { className: 'text-xs text-slate-500' }, 'Total'), h('div', { className: 'mt-1 font-bold text-slate-900' }, member.total)),
                      h('div', { className: 'rounded-xl bg-slate-50 p-3' }, h('div', { className: 'text-xs text-slate-500' }, 'Active'), h('div', { className: 'mt-1 font-bold text-slate-900' }, member.inProgress)),
                      h('div', { className: 'rounded-xl bg-slate-50 p-3' }, h('div', { className: 'text-xs text-slate-500' }, 'Done'), h('div', { className: 'mt-1 font-bold text-slate-900' }, member.complete))
                    ),
                    h('div', { className: 'mt-4 space-y-2' },
                      h('p', { className: 'text-xs font-semibold uppercase tracking-wider text-slate-500' }, 'Recent tasks'),
                      member.recentTasks.length > 0
                        ? member.recentTasks.map((task) =>
                            h('div', { key: task.id, className: 'flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm' },
                              h('span', { className: 'truncate text-slate-700' }, task.title),
                              h('span', { className: 'shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-500' }, task.status)
                            )
                          )
                        : h('div', { className: 'rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400' }, 'No recent tasks')
                    )
                  )
                )
          )
        )
      ),
      // Help Page - Enhanced
      currentPage === 'Help' && h(
        motion.div,
        { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } },
        h('div', { className: 'space-y-8' },
          // Header
          h('div', { className: 'space-y-2 mb-8' },
            h('h1', { className: 'text-4xl font-bold tracking-tight text-slate-900' }, '❓ Help & Documentation'),
            h('p', { className: 'text-lg text-slate-600' }, 'Everything you need to master TaskHub')
          ),
          
          // Getting Started Section
          h(
            motion.div,
            { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.4 } },
            h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-8 shadow-sm' },
              h('h2', { className: 'text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2' }, h('span', null, '🚀'), 'Quick Start Guide'),
              h('div', { className: 'grid gap-4 grid-cols-1 md:grid-cols-2' },
                h('div', { className: 'flex gap-4 p-4 rounded-lg bg-blue-50 border border-blue-200' },
                  h('div', { className: 'text-2xl shrink-0' }, '1️⃣'),
                  h('div', null,
                    h('h3', { className: 'font-semibold text-slate-900' }, 'Sign In'),
                    h('p', { className: 'text-sm text-slate-600 mt-1' }, 'Click Logout then sign in with your Google account to access your dashboard')
                  )
                ),
                h('div', { className: 'flex gap-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200' },
                  h('div', { className: 'text-2xl shrink-0' }, '2️⃣'),
                  h('div', null,
                    h('h3', { className: 'font-semibold text-slate-900' }, 'Create Tasks'),
                    h('p', { className: 'text-sm text-slate-600 mt-1' }, 'Go to Overview page and use the "Quick Add" section to create new tasks')
                  )
                ),
                h('div', { className: 'flex gap-4 p-4 rounded-lg bg-violet-50 border border-violet-200' },
                  h('div', { className: 'text-2xl shrink-0' }, '3️⃣'),
                  h('div', null,
                    h('h3', { className: 'font-semibold text-slate-900' }, 'Manage Tasks'),
                    h('p', { className: 'text-sm text-slate-600 mt-1' }, 'Update status and priority on the Tasks page with filters and search')
                  )
                ),
                h('div', { className: 'flex gap-4 p-4 rounded-lg bg-orange-50 border border-orange-200' },
                  h('div', { className: 'text-2xl shrink-0' }, '4️⃣'),
                  h('div', null,
                    h('h3', { className: 'font-semibold text-slate-900' }, 'Track Progress'),
                    h('p', { className: 'text-sm text-slate-600 mt-1' }, 'View insights and analytics to track your productivity and task completion')
                  )
                )
              )
            )
          ),
          
          // Features Overview
          h(
            motion.div,
            { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: 0.1 } },
            h('div', { className: 'rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-8 shadow-sm' },
              h('h2', { className: 'text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2' }, h('span', null, '✨'), 'Key Features'),
              h('div', { className: 'grid gap-3 grid-cols-1 md:grid-cols-2' },
                h('div', { className: 'flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 transition' },
                  h('span', { className: 'text-xl mt-0.5' }, '📊'),
                  h('div', null,
                    h('h3', { className: 'font-semibold text-slate-900' }, 'Real-time Analytics'),
                    h('p', { className: 'text-sm text-slate-600' }, 'View charts and insights about your task completion')
                  )
                ),
                h('div', { className: 'flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 transition' },
                  h('span', { className: 'text-xl mt-0.5' }, '🎯'),
                  h('div', null,
                    h('h3', { className: 'font-semibold text-slate-900' }, 'Priority Tracking'),
                    h('p', { className: 'text-sm text-slate-600' }, 'Organize tasks by priority and status')
                  )
                ),
                h('div', { className: 'flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 transition' },
                  h('span', { className: 'text-xl mt-0.5' }, '📈'),
                  h('div', null,
                    h('h3', { className: 'font-semibold text-slate-900' }, 'Productivity Scoring'),
                    h('p', { className: 'text-sm text-slate-600' }, 'Get insights into your task completion rate')
                  )
                ),
                h('div', { className: 'flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 transition' },
                  h('span', { className: 'text-xl mt-0.5' }, '🔍'),
                  h('div', null,
                    h('h3', { className: 'font-semibold text-slate-900' }, 'Search & Filter'),
                    h('p', { className: 'text-sm text-slate-600' }, 'Quickly find tasks with powerful search')
                  )
                )
              )
            )
          ),
          
          // FAQ Section
          h(
            motion.div,
            { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: 0.2 } },
            h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-8 shadow-sm' },
              h('h2', { className: 'text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2' }, h('span', null, '❔'), 'Frequently Asked Questions'),
              h('div', { className: 'space-y-4' },
                h('details', { className: 'p-4 rounded-lg border border-slate-200 hover:border-blue-200 transition open:bg-blue-50' },
                  h('summary', { className: 'cursor-pointer font-semibold text-slate-900 hover:text-blue-600 transition flex items-center justify-between' },
                    'How do I change a task status?',
                    h('span', { className: 'text-slate-400' }, '+')
                  ),
                  h('p', { className: 'mt-3 text-slate-600 text-sm' }, 'Navigate to the Tasks page, find your task, and click on the status dropdown to change it between Planned, In Progress, or Complete')
                ),
                h('details', { className: 'p-4 rounded-lg border border-slate-200 hover:border-blue-200 transition open:bg-blue-50' },
                  h('summary', { className: 'cursor-pointer font-semibold text-slate-900 hover:text-blue-600 transition flex items-center justify-between' },
                    'Can I see my task history?',
                    h('span', { className: 'text-slate-400' }, '+')
                  ),
                  h('p', { className: 'mt-3 text-slate-600 text-sm' }, 'Yes! Visit the Activity page to see a complete timeline of all your task updates and changes')
                ),
                h('details', { className: 'p-4 rounded-lg border border-slate-200 hover:border-blue-200 transition open:bg-blue-50' },
                  h('summary', { className: 'cursor-pointer font-semibold text-slate-900 hover:text-blue-600 transition flex items-center justify-between' },
                    'What do the priority levels mean?',
                    h('span', { className: 'text-slate-400' }, '+')
                  ),
                  h('p', { className: 'mt-3 text-slate-600 text-sm' }, 'High = urgent and critical, Medium = standard priority, Low = can be done when time allows. You can filter tasks by priority on the Tasks page')
                ),
                h('details', { className: 'p-4 rounded-lg border border-slate-200 hover:border-blue-200 transition open:bg-blue-50' },
                  h('summary', { className: 'cursor-pointer font-semibold text-slate-900 hover:text-blue-600 transition flex items-center justify-between' },
                    'How is productivity score calculated?',
                    h('span', { className: 'text-slate-400' }, '+')
                  ),
                  h('p', { className: 'mt-3 text-slate-600 text-sm' }, 'Your productivity score is based on your completion percentage, weekly completed tasks, and task velocity. Higher completion rate = higher score')
                )
              )
            )
          ),
          
          // Tips & Tricks
          h(
            motion.div,
            { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: 0.3 } },
            h('div', { className: 'rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8 shadow-sm' },
              h('h2', { className: 'text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2' }, h('span', null, '💡'), 'Pro Tips'),
              h('ul', { className: 'space-y-3' },
                h('li', { className: 'flex gap-3' },
                  h('span', { className: 'text-lg' }, '⚡'),
                  h('div', null,
                    h('strong', { className: 'text-slate-900' }, 'Use filters:'), h('span', { className: 'text-slate-600 ml-2' }, 'Filter by status to focus on what matters most')
                  )
                ),
                h('li', { className: 'flex gap-3' },
                  h('span', { className: 'text-lg' }, '🎯'),
                  h('div', null,
                    h('strong', { className: 'text-slate-900' }, 'Set priorities:'), h('span', { className: 'text-slate-600 ml-2' }, 'Always mark urgent tasks as High priority to stay focused')
                  )
                ),
                h('li', { className: 'flex gap-3' },
                  h('span', { className: 'text-lg' }, '📊'),
                  h('div', null,
                    h('strong', { className: 'text-slate-900' }, 'Check insights:'), h('span', { className: 'text-slate-600 ml-2' }, 'Review the Insights page weekly to track your progress')
                  )
                ),
                h('li', { className: 'flex gap-3' },
                  h('span', { className: 'text-lg' }, '✅'),
                  h('div', null,
                    h('strong', { className: 'text-slate-900' }, 'Complete tasks:'), h('span', { className: 'text-slate-600 ml-2' }, 'Mark tasks as complete to see your productivity score increase')
                  )
                )
              )
            )
          ),
          
          // Support Section
          h(
            motion.div,
            { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: 0.4 } },
            h('div', { className: 'rounded-2xl border border-slate-200 bg-white p-8 shadow-sm' },
              h('h2', { className: 'text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2' }, h('span', null, '📞'), 'Need Help?'),
              h('div', { className: 'grid gap-4 grid-cols-1 md:grid-cols-2' },
                h('div', { className: 'p-5 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition' },
                  h('h3', { className: 'font-semibold text-slate-900 mb-2' }, '📧 Email Support'),
                  h('p', { className: 'text-sm text-slate-600 mb-3' }, 'Have a question? Email us anytime'),
                  h('a', { href: 'mailto:support@taskhub.com', className: 'inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium' }, 'Contact Support')
                ),
                h('div', { className: 'p-5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-md transition' },
                  h('h3', { className: 'font-semibold text-slate-900 mb-2' }, '🐛 Report a Bug'),
                  h('p', { className: 'text-sm text-slate-600 mb-3' }, 'Found an issue? Help us improve TaskHub'),
                  h('a', { href: 'mailto:bugs@taskhub.com', className: 'inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium' }, 'Report Bug')
                )
              ),
              h('div', { className: 'mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200' },
                h('p', { className: 'text-sm text-slate-600' },
                  h('strong', null, 'Version:'), ' TaskHub Pro v2.0 | ',
                  h('strong', null, 'Last Updated:'), ' May 2026'
                )
              )
            )
          )
        )
      )
    )
  );
}

createRoot(document.getElementById('root')).render(React.createElement(App));