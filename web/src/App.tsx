import { createBrowserRouter, RouterProvider, Link, Outlet } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import './App.css'

// Root layout component with navigation
function Root() {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
        </ul>
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
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
