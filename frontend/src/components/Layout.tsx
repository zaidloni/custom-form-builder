import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Layers, LogOut, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="flex items-center gap-2">
      <Switch
        aria-label="Toggle theme"
        checked={theme === 'dark'}
        onChange={() => toggleTheme()}
      />
      <div
        className="flex items-center gap-1 text-sm text-muted-foreground font-mono"
        title={theme === 'dark' ? 'Dark' : 'Light'}>
        {theme === 'dark' ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">
          {theme === 'dark' ? 'Dark' : 'Light'}
        </span>
      </div>
    </div>
  );
}

export function Layout() {
  const { userEmail, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              FormForge
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button
                variant={
                  location.pathname === '/dashboard' ? 'secondary' : 'ghost'
                }
                size="sm"
                className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>

            <div className="flex items-center gap-3 pl-4 border-l">
              {/* Theme toggle */}
              <div className="mr-2">
                <ThemeToggle />
              </div>
              <span className="text-sm text-muted-foreground font-mono">
                {userEmail}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
