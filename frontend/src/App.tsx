import { createBrowserRouter, RouterProvider, Link, Outlet } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import ComponentsDemo from './pages/ComponentsDemo'
import ReduxDemo from './pages/ReduxDemo'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Profile from './pages/Profile'
import AdminRoute from './components/common/AdminRoute'
import OrganizerRoute from './components/common/OrganizerRoute'
import AuthInitializer from './components/common/AuthInitializer'
import './App.css'

// Root layout component with navigation
function Root() {
  return (
    <div className="min-h-screen bg-background">
      <AuthInitializer />
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <ul className="flex space-x-6">
            <li>
              <Link to="/" className="text-foreground hover:text-primary">
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-foreground hover:text-primary">
                About
              </Link>
            </li>
            <li>
              <Link to="/components" className="text-foreground hover:text-primary">
                Components Demo
              </Link>
            </li>
            <li>
              <Link to="/redux" className="text-foreground hover:text-primary">
                Redux Demo
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
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
