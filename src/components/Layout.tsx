import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  LogOut,
  Menu,
  X,
  ListChecks,
  PlusCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: Users },
    ...(user?.role === 'admin' ? [{ name: 'Users', href: '/users', icon: UserCheck }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col overflow-hidden bg-card border-r border-border transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:fixed lg:inset-y-0 lg:left-0 lg:h-screen
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">CRM System</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive(item.href) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-border space-y-1">
            <Link
              to="/leads/my"
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${isActive('/leads/my') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <ListChecks className="mr-3 h-5 w-5" />
              My Leads
            </Link>
            <Link
              to="/leads/new-leads"
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${isActive('/leads/new-leads') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <PlusCircle className="mr-3 h-5 w-5" />
              New Leads
            </Link>
            <Link
              to="/leads/qualified"
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${isActive('/leads/qualified') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <CheckCircle className="mr-3 h-5 w-5" />
              Qualified
            </Link>
            <Link
              to="/leads/conversion-rate"
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${isActive('/leads/conversion-rate') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <TrendingUp className="mr-3 h-5 w-5" />
              Conversion Rate
            </Link>
          </div>
        </nav>
        <div className="mt-auto px-3 py-4 border-t border-border">
          <div className="p-3 bg-muted rounded-lg flex flex-col items-center">
            <div className="w-full flex items-center mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{user?.username}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role.replace('_', ' ')}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full flex items-center justify-center mt-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

      </div>

      {/* Main content */}
      <div className="flex-1 w-full lg:ml-64">
        {/* Top navigation */}
        <header className="bg-card border-b border-border sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            <div className="flex items-center space-x-4 ml-auto">
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 w-full max-w-full overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;