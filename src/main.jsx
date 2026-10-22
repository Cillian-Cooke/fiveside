import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import WeekPage, { WeekRedirect } from './pages/WeekPage.jsx'
import Tables from './pages/Tables.jsx'
import Tournament from './pages/Tournament.jsx'
import Team from './pages/Team.jsx'
import './index.css'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <WeekRedirect /> },
      { path: '/week/:weekId', element: <WeekPage /> },
      { path: '/tables', element: <Tables /> },
      { path: '/tournament', element: <Tournament /> },
      { path: '/results', element: <Navigate to="/tables" replace /> },
      { path: '/teams', element: <Navigate to="/tables" replace /> },
      { path: '/teams/:slug', element: <Team /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
