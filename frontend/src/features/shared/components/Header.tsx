import { Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'

export function Header() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/images/Leviathan.png"
              alt="Leviathan"
              className="w-8 h-8"
            />
            <span className="text-xl font-bold text-primary">Leviathan</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/hermit"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/hermit') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Hermit Finance
            </Link>
            <Link
              to="/launchpad"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/launchpad') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Humpback Launchpad
            </Link>
            <Link
              to="/splash"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/splash') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Splash Zone
            </Link>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}