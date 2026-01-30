import { useMemo, useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { KPICard, ChartCard, Filter, DataTable } from '../components'

// Paleta de colores Propel (sin amarillos para mejor contraste)
const COLORS = ['#1F4D42', '#FF7043', '#2a6357', '#e65100', '#3d7a6a', '#ffab91', '#4a9282', '#bf360c']

export default function OrganizationsPage({ users, courses, organizationTypes, orgTypeFilter, onOrgTypeChange }) {

  const orgStats = useMemo(() => {
    const orgs = new Set(users.map(u => u.organization).filter(Boolean))
    const orgTypes = new Set(users.map(u => u.organization_type).filter(Boolean))
    const usersWithOrg = users.filter(u => u.organization && u.organization !== '').length
    return {
      totalOrgs: orgs.size,
      totalOrgTypes: orgTypes.size,
      usersWithOrg,
      usersWithoutOrg: users.length - usersWithOrg
    }
  }, [users])

  const usersByOrgType = useMemo(() => {
    const grouped = {}
    users.forEach(u => {
      const type = u.organization_type || 'Individual'
      grouped[type] = (grouped[type] || 0) + 1
    })
    return Object.entries(grouped)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  }, [users])

  const enrollmentsByOrgType = useMemo(() => {
    const grouped = {}
    courses.forEach(c => {
      const type = c.organization_type || 'Individual'
      if (!grouped[type]) {
        grouped[type] = { started: 0, completed: 0 }
      }
      grouped[type].started++
      if (c.is_completed) grouped[type].completed++
    })
    return Object.entries(grouped)
      .map(([type, data]) => ({
        type,
        ...data,
        rate: data.started > 0 ? ((data.completed / data.started) * 100).toFixed(0) : 0
      }))
      .sort((a, b) => b.started - a.started)
  }, [courses])

  const topOrganizations = useMemo(() => {
    const grouped = {}
    users.forEach(u => {
      if (u.organization && u.organization !== '') {
        if (!grouped[u.organization]) {
          grouped[u.organization] = { users: 0, type: u.organization_type }
        }
        grouped[u.organization].users++
      }
    })

    const orgEmails = {}
    users.forEach(u => {
      if (u.organization && u.organization !== '') {
        if (!orgEmails[u.organization]) orgEmails[u.organization] = new Set()
        orgEmails[u.organization].add(u.email)
      }
    })

    courses.forEach(c => {
      Object.entries(orgEmails).forEach(([org, emails]) => {
        if (emails.has(c.email)) {
          if (!grouped[org].enrollments) grouped[org].enrollments = 0
          if (!grouped[org].completed) grouped[org].completed = 0
          grouped[org].enrollments++
          if (c.is_completed) grouped[org].completed++
        }
      })
    })

    return Object.entries(grouped)
      .map(([name, data]) => ({
        name: name.length > 30 ? name.substring(0, 30) + '...' : name,
        fullName: name,
        users: data.users,
        type: data.type || 'Unknown',
        enrollments: data.enrollments || 0,
        completed: data.completed || 0,
        rate: data.enrollments > 0 ? ((data.completed / data.enrollments) * 100).toFixed(0) : 0
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 15)
  }, [users, courses])

  // Estado para ordenar por Users
  const [usersSortOrder, setUsersSortOrder] = useState('desc')

  // Tabla con fila de totales y ordenamiento
  const topOrganizationsWithTotal = useMemo(() => {
    // Ordenar organizaciones por users
    const sorted = [...topOrganizations].sort((a, b) => {
      return usersSortOrder === 'desc' ? b.users - a.users : a.users - b.users
    })

    const totalUsers = topOrganizations.reduce((sum, o) => sum + o.users, 0)
    const totalEnrollments = topOrganizations.reduce((sum, o) => sum + o.enrollments, 0)
    const totalCompleted = topOrganizations.reduce((sum, o) => sum + o.completed, 0)
    const totalRate = totalEnrollments > 0 ? ((totalCompleted / totalEnrollments) * 100).toFixed(0) : 0

    return [
      ...sorted,
      {
        name: 'TOTAL',
        fullName: 'TOTAL',
        type: '-',
        users: totalUsers,
        enrollments: totalEnrollments,
        completed: totalCompleted,
        rate: totalRate,
        isTotal: true
      }
    ]
  }, [topOrganizations, usersSortOrder])

  const orgTypeOptions = organizationTypes.map(t => ({
    value: t,
    label: t === 'all' ? 'All Organization Types' : t
  }))

  const orgTableColumns = [
    { key: 'name', label: 'Organization' },
    { key: 'type', label: 'Type' },
    {
      key: 'users',
      label: (
        <button
          onClick={() => setUsersSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: 0
          }}
        >
          Users {usersSortOrder === 'desc' ? '↓' : '↑'}
        </button>
      )
    },
    { key: 'enrollments', label: 'Enrollments' },
    {
      key: 'rate',
      label: 'Completion',
      render: val => (
        <span className={`rate-badge ${Number(val) >= 50 ? 'high' : 'low'}`}>
          {val}%
        </span>
      )
    }
  ]

  const performanceColumns = [
    { key: 'type', label: 'Organization Type' },
    { key: 'started', label: 'Courses Started' },
    { key: 'completed', label: 'Completed' },
    {
      key: 'rate',
      label: 'Completion Rate',
      render: val => (
        <span className={`rate-badge ${Number(val) >= 50 ? 'high' : 'low'}`}>
          {val}%
        </span>
      )
    }
  ]

  return (
    <div className="page">
      <div className="page-header">
        <h2>Organizations Analytics</h2>
        <div className="filters">
          <Filter
            label="Organization Type"
            value={orgTypeFilter}
            options={orgTypeOptions}
            onChange={onOrgTypeChange}
          />
        </div>
      </div>

      <section className="kpi-section">
        <KPICard title="Total Organizations" value={orgStats.totalOrgs.toLocaleString()} />
        <KPICard title="Organization Types" value={orgStats.totalOrgTypes.toLocaleString()} />
        <KPICard title="Users in Organizations" value={orgStats.usersWithOrg.toLocaleString()} />
        <KPICard title="Individual Users" value={orgStats.usersWithoutOrg.toLocaleString()} subtitle="No organization" />
      </section>

      <section className="charts-grid">
        <ChartCard title="Users by Organization Type">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={usersByOrgType}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ type, percent }) => {
                  const shortType = type.length > 15 ? type.substring(0, 15) + '...' : type
                  return `${shortType} (${(percent * 100).toFixed(0)}%)`
                }}
                labelLine={{ strokeWidth: 1 }}
              >
                {usersByOrgType.map((entry, i) => (
                  <Cell key={entry.type} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Enrollments by Organization Type">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={enrollmentsByOrgType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="started" fill="#1F4D42" name="Started" />
              <Bar dataKey="completed" fill="#FF7043" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Performance by Organization Type">
          <DataTable columns={performanceColumns} data={enrollmentsByOrgType} />
        </ChartCard>

        <ChartCard title="Top Organizations by Users">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topOrganizations.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={label => topOrganizations.find(o => o.name === label)?.fullName || label} />
              <Bar dataKey="users" fill="#1F4D42" name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Organizations Detail" wide>
          <DataTable columns={orgTableColumns} data={topOrganizationsWithTotal} maxHeight={350} />
        </ChartCard>
      </section>
    </div>
  )
}
