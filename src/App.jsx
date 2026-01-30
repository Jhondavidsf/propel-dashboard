import { useState } from 'react'
import { Navigation } from './components'
import { PeoplePage, OrganizationsPage } from './pages'
import { useData } from './hooks/useData'
import './App.css'

export default function App() {
  const [activePage, setActivePage] = useState('people')
  const [countryFilter, setCountryFilter] = useState('all')
  const [orgTypeFilter, setOrgTypeFilter] = useState('all')

  const { users, courses, countries, organizationTypes } = useData({
    country: countryFilter,
    organizationType: orgTypeFilter
  })

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Propel Academy Dashboard</h1>
        <Navigation activePage={activePage} onPageChange={setActivePage} />
      </header>

      <main>
        {activePage === 'people' && (
          <PeoplePage
            users={users}
            courses={courses}
            countries={countries}
            countryFilter={countryFilter}
            onCountryChange={setCountryFilter}
          />
        )}

        {activePage === 'organizations' && (
          <OrganizationsPage
            users={users}
            courses={courses}
            organizationTypes={organizationTypes}
            orgTypeFilter={orgTypeFilter}
            onOrgTypeChange={setOrgTypeFilter}
          />
        )}
      </main>

      <footer className="footer">
        <p>Propel Nonprofit Academy | Data as of January 2026</p>
      </footer>
    </div>
  )
}
/* Deploy trigger vi., 30 de ene. de 2026  1:47:12 */
