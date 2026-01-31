import { useMemo, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { KPICard, ChartCard, Filter, DataTable } from '../components'
import {
  useMetrics,
  groupByMonth,
  groupCoursesByMonth,
  getTopCourses,
  groupByField,
  getCompletionRateByEngagement
} from '../hooks/useData'

// Paleta de colores Propel (sin amarillos para mejor contraste)
const COLORS = ['#1F4D42', '#FF7043', '#2a6357', '#e65100', '#3d7a6a', '#ffab91', '#4a9282', '#bf360c']

export default function PeoplePage({ users, courses, countries, countryFilter, onCountryChange }) {
  const metrics = useMetrics(users, courses)

  // Emails de usuarios con al menos un curso
  const usersWithCoursesEmails = useMemo(
    () => new Set(courses.map(c => c.email)),
    [courses]
  )

  // Registros por mes: con cursos, sin cursos y total
  const registrationsByMonth = useMemo(() => {
    const grouped = {}
    users.forEach(user => {
      if (user.registered_date) {
        const month = user.registered_date.substring(0, 7)
        if (!grouped[month]) {
          grouped[month] = { withCourses: 0, withoutCourses: 0 }
        }
        if (usersWithCoursesEmails.has(user.email)) {
          grouped[month].withCourses++
        } else {
          grouped[month].withoutCourses++
        }
      }
    })
    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month,
        withCourses: data.withCourses,
        withoutCourses: data.withoutCourses,
        total: data.withCourses + data.withoutCourses // Línea total calculada
      }))
  }, [users, usersWithCoursesEmails])

  const coursesByMonth = useMemo(
    () => groupCoursesByMonth(courses),
    [courses]
  )

  const topCourses = useMemo(
    () => getTopCourses(courses),
    [courses]
  )

  // Estado para ordenar por Rate
  const [rateSortOrder, setRateSortOrder] = useState('desc') // 'desc' = mayor a menor

  // Cursos ordenados por Rate
  const sortedCoursesByRate = useMemo(() => {
    return [...topCourses].sort((a, b) => {
      const rateA = Number(a.rate)
      const rateB = Number(b.rate)
      return rateSortOrder === 'desc' ? rateB - rateA : rateA - rateB
    })
  }, [topCourses, rateSortOrder])

  const usersByCountry = useMemo(
    () => groupByField(users, 'country', 8).map(d => ({ country: d.name, count: d.count })),
    [users]
  )

  // Datos para gráfico de recurrencia (distribución de cursos por usuario)
  const recurrenceData = useMemo(() => [
    { name: '1 curso', value: metrics.recurrenceDistribution?.oneCourse || 0, fill: '#1F4D42' },
    { name: '2 cursos', value: metrics.recurrenceDistribution?.twoCourses || 0, fill: '#FF7043' },
    { name: '3+ cursos', value: metrics.recurrenceDistribution?.threePlus || 0, fill: '#2a6357' }
  ], [metrics.recurrenceDistribution])

  // Completion Rate por nivel de engagement (¿los más activos completan más?)
  const engagementCompletionData = useMemo(
    () => getCompletionRateByEngagement(courses),
    [courses]
  )

  const courseColumns = [
    { key: 'name', label: 'Course' },
    { key: 'started', label: 'Started' },
    { key: 'completed', label: 'Completed' },
    {
      key: 'rate',
      label: 'Rate',
      render: val => (
        <span className={`rate-badge ${Number(val) >= 50 ? 'high' : 'low'}`}>
          {val}%
        </span>
      )
    }
  ]

  const countryOptions = countries.map(c => ({
    value: c,
    label: c === 'all' ? 'All Countries' : c
  }))

  return (
    <div className="page">
      <div className="page-header">
        <h2>People Analytics</h2>
        <div className="filters">
          <Filter
            label="Country"
            value={countryFilter}
            options={countryOptions}
            onChange={onCountryChange}
          />
        </div>
      </div>

      <section className="kpi-section">
        <KPICard title="Registered Users" value={metrics.totalUsers.toLocaleString()} />
        <KPICard title="Active Users" value={metrics.activeUsers.toLocaleString()} subtitle="Last 30 days" />
        <KPICard title="Course Enrollments" value={metrics.totalEnrollments.toLocaleString()} />
        <KPICard title="Courses Completed" value={metrics.completedCourses.toLocaleString()} />
        <KPICard title="Users Graduated" value={metrics.usersWithCompletedCourses.toLocaleString()} subtitle="With 1+ course done" />
        <KPICard title="Completion Rate" value={`${metrics.completionRate}%`} />
        <KPICard title="Avg. Courses/User" value={metrics.avgCoursesPerUser} subtitle="Fidelidad" highlight />
      </section>

      <section className="charts-grid">
        <ChartCard title="User Registrations Over Time">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={registrationsByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              {/* Línea Total: sutil, gris, delgada, sin puntos */}
              <Line
                type="monotone"
                dataKey="total"
                stroke="#9ca3af"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                name="Total"
              />
              {/* Líneas principales con puntos */}
              <Line
                type="monotone"
                dataKey="withCourses"
                stroke="#1F4D42"
                strokeWidth={2}
                dot={{ fill: '#1F4D42', r: 3 }}
                name="Con cursos"
              />
              <Line
                type="monotone"
                dataKey="withoutCourses"
                stroke="#FF7043"
                strokeWidth={2}
                dot={{ fill: '#FF7043', r: 3 }}
                name="Sin cursos"
              />
            </LineChart>
          </ResponsiveContainer>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginTop: '12px',
            fontSize: '0.8rem',
            fontWeight: '500'
          }}>
            <span style={{ color: '#1F4D42' }}>
              ● Con cursos: {usersWithCoursesEmails.size.toLocaleString()} ({((usersWithCoursesEmails.size / users.length) * 100).toFixed(0)}%)
            </span>
            <span style={{ color: '#FF7043' }}>
              ● Sin cursos: {(users.length - usersWithCoursesEmails.size).toLocaleString()} ({(((users.length - usersWithCoursesEmails.size) / users.length) * 100).toFixed(0)}%)
            </span>
          </div>
        </ChartCard>

        <ChartCard title="Courses Started vs Completed">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={coursesByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="started" fill="#1F4D42" name="Started" />
              <Bar dataKey="completed" fill="#FF7043" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Users by Country">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={usersByCountry}
                dataKey="count"
                nameKey="country"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ country, percent }) => `${country} (${(percent * 100).toFixed(0)}%)`}
                labelLine={{ strokeWidth: 1 }}
              >
                {usersByCountry.map((entry, i) => (
                  <Cell key={entry.country} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="User Engagement (Recurrence)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={recurrenceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [`${value} usuarios`, '']}
                labelFormatter={(label) => label}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {recurrenceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Completion Rate by Engagement">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={engagementCompletionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'completionRate') return [`${value}%`, 'Tasa de completación']
                  if (name === 'users') return [value, 'Usuarios']
                  return [value, name]
                }}
                labelFormatter={(label) => `Grupo: ${label}`}
              />
              <Legend />
              <Bar
                dataKey="completionRate"
                fill="#1F4D42"
                name="Completion Rate %"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '8px', textAlign: 'center' }}>
            ¿Los usuarios con más cursos completan más?
          </p>
        </ChartCard>

        <ChartCard title="Completion Rate by Course">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
            <button
              onClick={() => setRateSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              style={{
                padding: '4px 12px',
                fontSize: '0.75rem',
                backgroundColor: '#1F4D42',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Rate {rateSortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
          <DataTable columns={courseColumns} data={sortedCoursesByRate} />
        </ChartCard>

        <ChartCard title="Top Courses by Enrollment" wide>
          <ResponsiveContainer width="100%" height={700}>
            <BarChart data={topCourses} layout="vertical" margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 14 }} />
              <YAxis type="category" dataKey="name" width={280} tick={{ fontSize: 13 }} />
              <Tooltip labelFormatter={label => topCourses.find(c => c.name === label)?.fullName || label} />
              <Legend wrapperStyle={{ fontSize: 14 }} />
              <Bar dataKey="started" fill="#1F4D42" name="Started" barSize={20} />
              <Bar dataKey="completed" fill="#FF7043" name="Completed" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </div>
  )
}
