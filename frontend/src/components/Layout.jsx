import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  Home,
  CreditCard,
  FileText,
  Users,
  LogOut,
  Wifi,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Sub-component for the Sidebar Header
const SidebarHeader = ({ sidebarOpen, isMobile, toggleSidebar }) => (
  <div className="flex items-center justify-between p-4 border-b">
    <div className={`flex items-center space-x-3 ${!sidebarOpen && !isMobile && 'justify-center'}`}>
      <div className="p-2 bg-blue-600 rounded-lg">
        <Wifi className="h-6 w-6 text-white" />
      </div>
      {(sidebarOpen || isMobile) && (
        <div>
          <h1 className="text-lg font-bold text-gray-900">MonitorPelangganKu</h1>
          <p className="text-xs text-gray-500">WiFi Monitoring</p>
        </div>
      )}
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleSidebar}
      className="p-1"
    >
      {sidebarOpen ? (
        isMobile ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </Button>
  </div>
);

// Sub-component for User Info in Sidebar
const UserInfo = ({ user, sidebarOpen, isMobile }) => (
  <div className="p-4 border-b">
    <div className={`flex items-center space-x-3 ${!sidebarOpen && !isMobile && 'justify-center'}`}>
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <span className="text-blue-600 font-medium text-sm">
          {user?.name?.charAt(0)?.toUpperCase()}
        </span>
      </div>
      {(sidebarOpen || isMobile) && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.name}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {user?.role}
          </p>
        </div>
      )}
    </div>
  </div>
);

// Sub-component for Navigation in Sidebar
const SidebarNav = ({ menuItems, location, sidebarOpen, isMobile, setSidebarOpen }) => (
  <nav className="flex-1 p-4">
    <ul className="space-y-2">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <li key={item.path}>
            <Link
              to={item.path}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${!sidebarOpen && !isMobile && 'justify-center'}`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {(sidebarOpen || isMobile) && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  </nav>
);

// Sub-component for Logout in Sidebar
const SidebarLogout = ({ handleLogout, sidebarOpen, isMobile }) => (
  <div className="p-4 border-t">
    <Button
      variant="ghost"
      onClick={handleLogout}
      className={`w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 ${
        !sidebarOpen && !isMobile && 'justify-center px-2'
      }`}
    >
      <LogOut className="h-5 w-5 flex-shrink-0" />
      {(sidebarOpen || isMobile) && <span className="ml-3">Logout</span>}
    </Button>
  </div>
);

// Main Sidebar Component
const Sidebar = ({ sidebarOpen, isMobile, toggleSidebar, user, menuItems, location, setSidebarOpen, handleLogout, handleOverlayClick }) => (
  <>
    {isMobile && sidebarOpen && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={handleOverlayClick}
      />
    )}
    <div className={`
      bg-white shadow-lg transition-all duration-300 ease-in-out z-50
      ${isMobile ? 'fixed left-0 top-0 h-full' : 'relative'}
      ${sidebarOpen ? (isMobile ? 'w-64' : 'w-64') : (isMobile ? '-translate-x-full w-64' : 'w-16')}
      ${isMobile ? 'transform' : ''}
    `}>
      <div className="flex flex-col h-full">
        <SidebarHeader sidebarOpen={sidebarOpen} isMobile={isMobile} toggleSidebar={toggleSidebar} />
        <UserInfo user={user} sidebarOpen={sidebarOpen} isMobile={isMobile} />
        <SidebarNav menuItems={menuItems} location={location} sidebarOpen={sidebarOpen} isMobile={isMobile} setSidebarOpen={setSidebarOpen} />
        <SidebarLogout handleLogout={handleLogout} sidebarOpen={sidebarOpen} isMobile={isMobile} />
      </div>
    </div>
  </>
);

// Sub-component for the Top Bar
const TopBar = ({ isMobile, toggleSidebar, menuItems, location, user }) => (
  <header className="bg-white shadow-sm border-b px-4 md:px-6 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h2>
          <p className="text-xs md:text-sm text-gray-500">
            Selamat datang, {user?.name}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-xs md:text-sm text-gray-500 hidden sm:block">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
        <div className="text-xs text-gray-500 sm:hidden">
          {new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </div>
      </div>
    </div>
  </header>
);

// Main Layout Component
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleOverlayClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/billing', label: 'Billing', icon: CreditCard },
    { path: '/kontrak', label: 'Kontrak', icon: FileText },
    ...(user?.role === 'superadmin' ? [
      { path: '/management-akun', label: 'Management Akun', icon: Users }
    ] : [])
  ];

  return (
    <div className="flex h-screen bg-gray-100 relative">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        isMobile={isMobile}
        toggleSidebar={toggleSidebar}
        user={user}
        menuItems={menuItems}
        location={location}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
        handleOverlayClick={handleOverlayClick}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          isMobile={isMobile}
          toggleSidebar={toggleSidebar}
          menuItems={menuItems}
          location={location}
          user={user}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}