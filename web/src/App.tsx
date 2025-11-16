import { createBrowserRouter, RouterProvider, Link, Outlet } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import ComponentsDemo from './pages/ComponentsDemo'
import ReduxDemo from './pages/ReduxDemo'
import './App.css'

// Root layout component with navigation
function Root() {
  return (
    <div className="min-h-screen bg-background">
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
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
