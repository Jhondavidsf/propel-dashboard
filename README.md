# Propel Nonprofit Academy Dashboard

Interactive analytics dashboard for Propel Nonprofit Academy built with React and Recharts.

**Live Demo:** [https://propel-dashboard.vercel.app](https://propel-dashboard.vercel.app)

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/propel-dashboard.git
cd propel-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
  App.jsx              # Main component with routing
  App.css              # Global styles (Propel brand colors)
  components/
    KPICard.jsx        # Metric cards
    ChartCard.jsx      # Chart containers
    Navigation.jsx     # Page navigation
    Filter.jsx         # Dropdown filters
    DataTable.jsx      # Reusable data table
  pages/
    PeoplePage.jsx     # People analytics
    OrganizationsPage.jsx  # Organizations analytics
  hooks/
    useData.js         # Data management and filtering
  data/
    users.json         # Cleaned user data (1,062 records)
    courses.json       # Course enrollments (880 records)
```

## Features

### People Page
- **KPIs:** Registered users, active users, enrollments, completions, graduation rate
- **Charts:** Registration timeline, courses started vs completed, country distribution
- **Tables:** Top 10 courses, completion rate by course (sortable)
- **Filter:** By country

### Organizations Page
- **KPIs:** Total organizations, organization types, users in orgs, individual users
- **Charts:** Users by org type, enrollments by org type, top organizations
- **Tables:** Performance by org type, top organizations detail (sortable)
- **Filter:** By organization type

## Tech Stack

- React 18
- Vite
- Recharts
- CSS3

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Verde Bosque | `#1F4D42` | Primary |
| Naranja Coral | `#FF7043` | Accents |
| Blanco Crema | `#F5F5F5` | Background |

## Author

Data Officer Candidate - Propel Nonprofit Academy Job Sample (January 2026)
