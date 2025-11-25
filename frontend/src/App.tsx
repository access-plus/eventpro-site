import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import ComponentsDemo from './pages/ComponentsDemo'
import ReduxDemo from './pages/ReduxDemo'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import VerifyEmail from './pages/VerifyEmail'
import Profile from './pages/Profile'
import Events from './pages/Events'
import Tickets from './pages/Tickets'
import CreateEvent from './pages/CreateEvent'
import Settings from './pages/Settings'
import AdminRoute from './components/common/AdminRoute'
import OrganizerRoute from './components/common/OrganizerRoute'
import AuthInitializer from './components/common/AuthInitializer'
import { Layout } from './components/Layout'
import './App.css'

// Root layout component with sidebar
function Root() {
  return (
    <>
      <AuthInitializer />
      <Layout>
        <Outlet />
      </Layout>
    </>
  )
}

// Create router with route configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'about',
        element: <About />,
      },
      {
        path: 'components',
        element: <ComponentsDemo />,
      },
      {
        path: 'redux',
        element: <ReduxDemo />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'signup',
        element: <SignUp />,
      },
      {
        path: 'verify-email',
        element: <VerifyEmail />,
      },
      {
        path: 'events',
        element: <Events />,
      },
      {
        path: 'tickets',
        element: <Tickets />,
      },
      {
        path: 'create',
        element: <CreateEvent />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      // Protected routes - require authentication
      {
        path: 'profile',
        element: <Profile />,
      },
      // Admin-only routes
      {
        path: 'admin',
        element: (
          <AdminRoute>
            <div>
              <h1>Admin Dashboard</h1>
              <p>This is an admin-only route. Only users with ADMIN role can see this.</p>
            </div>
          </AdminRoute>
        ),
      },
      // Organizer-only routes (also accessible by admins)
      {
        path: 'organizer',
        element: (
          <OrganizerRoute>
            <div>
              <h1>Organizer Dashboard</h1>
              <p>This is an organizer-only route. Only users with ORGANIZER or ADMIN role can see this.</p>
            </div>
          </OrganizerRoute>
        ),
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
