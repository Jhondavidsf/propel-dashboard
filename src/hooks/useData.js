import { useMemo } from 'react'
import usersData from '../data/users.json'
import coursesData from '../data/courses.json'

export function useData(filters = {}) {
  const { country, organizationType } = filters

  const filteredUsers = useMemo(() => {
    let result = usersData
    if (country && country !== 'all') {
      result = result.filter(u => u.country === country)
    }
    if (organizationType && organizationType !== 'all') {
      result = result.filter(u => u.organization_type === organizationType)
    }
    return result
  }, [country, organizationType])

  const filteredCourses = useMemo(() => {
    let result = coursesData
    if (country && country !== 'all') {
      result = result.filter(c => c.country === country)
    }
    if (organizationType && organizationType !== 'all') {
      result = result.filter(c => c.organization_type === organizationType)
    }
    return result
  }, [country, organizationType])

  const countries = useMemo(() => {
    const set = new Set(usersData.map(u => u.country).filter(Boolean))
    return ['all', ...Array.from(set).sort()]
  }, [])

  const organizationTypes = useMemo(() => {
    const set = new Set(usersData.map(u => u.organization_type).filter(Boolean))
    return ['all', ...Array.from(set).sort()]
  }, [])

  return {
    users: filteredUsers,
    courses: filteredCourses,
    countries,
    organizationTypes,
    allUsers: usersData,
    allCourses: coursesData
  }
}

export function useMetrics(users, courses) {
  return useMemo(() => {
    const totalUsers = users.length
    const totalEnrollments = courses.length
    const completedCourses = courses.filter(c => c.is_completed).length
    const completionRate = totalEnrollments > 0
      ? ((completedCourses / totalEnrollments) * 100).toFixed(1)
      : 0

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeEmails = new Set(
      courses
        .filter(c => c.started_on && new Date(c.started_on) >= thirtyDaysAgo)
        .map(c => c.email)
    )

    // Usuarios únicos con al menos un curso completado
    const usersWithCompletedCourses = new Set(
      courses
        .filter(c => c.is_completed)
        .map(c => c.email)
    ).size

    // Usuarios únicos con cursos (para promedio)
    const uniqueUsersWithCourses = new Set(courses.map(c => c.email)).size

    // Promedio de cursos por usuario
    const avgCoursesPerUser = uniqueUsersWithCourses > 0
      ? (totalEnrollments / uniqueUsersWithCourses).toFixed(1)
      : 0

    // Distribución de recurrencia (cuántos cursos tiene cada usuario)
    const coursesByUser = {}
    courses.forEach(c => {
      coursesByUser[c.email] = (coursesByUser[c.email] || 0) + 1
    })
    const recurrenceDistribution = {
      oneCourse: 0,
      twoCourses: 0,
      threePlus: 0
    }
    Object.values(coursesByUser).forEach(count => {
      if (count === 1) recurrenceDistribution.oneCourse++
      else if (count === 2) recurrenceDistribution.twoCourses++
      else recurrenceDistribution.threePlus++
    })

    // Calcular tiempo promedio en cursos
    const coursesWithTime = courses.filter(c => c.time_minutes != null)
    const totalTimeMinutes = coursesWithTime.reduce((sum, c) => sum + c.time_minutes, 0)
    const avgTimeMinutes = coursesWithTime.length > 0
      ? Math.round(totalTimeMinutes / coursesWithTime.length)
      : 0

    // Formatear tiempo promedio
    const formatTime = (minutes) => {
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins}m`
      }
      return `${minutes}m`
    }

    return {
      totalUsers,
      totalEnrollments,
      completedCourses,
      completionRate,
      activeUsers: activeEmails.size,
      usersWithCompletedCourses,
      avgTimeOnCourse: formatTime(avgTimeMinutes),
      avgTimeMinutes,
      totalTimeHours: Math.round(totalTimeMinutes / 60),
      // Nuevas métricas
      avgCoursesPerUser,
      uniqueUsersWithCourses,
      recurrenceDistribution
    }
  }, [users, courses])
}

export function groupByMonth(items, dateField) {
  const grouped = {}
  items.forEach(item => {
    if (item[dateField]) {
      const month = item[dateField].substring(0, 7)
      grouped[month] = (grouped[month] || 0) + 1
    }
  })
  return Object.entries(grouped)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }))
}

export function groupCoursesByMonth(courses) {
  const grouped = {}
  courses.forEach(c => {
    if (c.started_on) {
      const month = c.started_on.substring(0, 7)
      if (!grouped[month]) grouped[month] = { started: 0, completed: 0 }
      grouped[month].started++
      if (c.is_completed) grouped[month].completed++
    }
  })
  return Object.entries(grouped)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({ month, ...data }))
}

export function getTopCourses(courses, limit = 10) {
  const grouped = {}
  courses.forEach(c => {
    // Ignorar cursos sin título
    if (!c.course_title || c.course_title.trim() === '') return

    if (!grouped[c.course_title]) {
      grouped[c.course_title] = { started: 0, completed: 0 }
    }
    grouped[c.course_title].started++
    if (c.is_completed) grouped[c.course_title].completed++
  })
  return Object.entries(grouped)
    .map(([title, data]) => ({
      name: title.length > 35 ? title.substring(0, 35) + '...' : title,
      fullName: title,
      ...data,
      rate: data.started > 0 ? ((data.completed / data.started) * 100).toFixed(0) : 0
    }))
    .sort((a, b) => b.started - a.started)
    .slice(0, limit)
}

export function groupByField(items, field, limit = 10) {
  const grouped = {}
  items.forEach(item => {
    const value = item[field] || 'Unknown'
    grouped[value] = (grouped[value] || 0) + 1
  })
  return Object.entries(grouped)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// Agrupa usuarios por cantidad de cursos y calcula Completion Rate por grupo
export function getCompletionRateByEngagement(courses) {
  // Paso 1: Agrupar cursos por usuario
  const userCourses = {}
  courses.forEach(c => {
    if (!userCourses[c.email]) {
      userCourses[c.email] = { total: 0, completed: 0 }
    }
    userCourses[c.email].total++
    if (c.is_completed) {
      userCourses[c.email].completed++
    }
  })

  // Paso 2: Clasificar usuarios por cantidad de cursos (1, 2, 3+)
  const groups = {
    '1 curso': { users: 0, totalCourses: 0, completedCourses: 0 },
    '2 cursos': { users: 0, totalCourses: 0, completedCourses: 0 },
    '3+ cursos': { users: 0, totalCourses: 0, completedCourses: 0 }
  }

  Object.values(userCourses).forEach(userData => {
    let groupKey
    if (userData.total === 1) {
      groupKey = '1 curso'
    } else if (userData.total === 2) {
      groupKey = '2 cursos'
    } else {
      groupKey = '3+ cursos'
    }

    groups[groupKey].users++
    groups[groupKey].totalCourses += userData.total
    groups[groupKey].completedCourses += userData.completed
  })

  // Paso 3: Calcular Completion Rate por grupo
  return Object.entries(groups).map(([name, data]) => ({
    name,
    users: data.users,
    totalCourses: data.totalCourses,
    completedCourses: data.completedCourses,
    completionRate: data.totalCourses > 0
      ? Math.round((data.completedCourses / data.totalCourses) * 100)
      : 0
  }))
}
