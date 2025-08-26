import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  ChevronLeft, 
  ChevronRight,
  LogOut
} from 'lucide-react';

export default function Sidebar({ 
  isOpen, 
  toggle, 
  user, 
  menuItems, 
  activePath, 
  onLogout 
}) {
  return (
    // Container utama sidebar dengan transisi lebar
    <aside className={`
      bg-white shadow-lg flex flex-col h-screen transition-all duration-300 ease-in-out
      ${isOpen ? 'w-64' : 'w-20'}
    `}>
      
      {/* 1. Header Sidebar (Logo & Toggle Button) */}
      <div className="flex items-center h-16 px-4 border-b flex-shrink-0">
        {/* Logo dan Nama Aplikasi */}
        <Link to="/dashboard" className={`flex items-center gap-3 overflow-hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-blue-600 p-2 rounded-lg">
            <Wifi className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">MonitorPelangganKu</h1>
          </div>
        </Link>
        
        {/* Tombol Toggle yang diposisikan secara absolut untuk kerapian */}
        <div className={`absolute top-4 transition-all duration-300 ease-in-out ${isOpen ? 'left-[220px]' : 'left-[58px]'}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-7 w-7 rounded-full bg-white hover:bg-gray-100 border"
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 2. User Info */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-bold text-lg">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className={`flex-1 min-w-0 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.path;
          return (
            <div key={item.path} className="relative group">
              <Link
                to={item.path}
                className={`
                  flex items-center h-11 rounded-lg transition-colors duration-200
                  ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
                  ${isOpen ? 'px-3 gap-3' : 'justify-center'}
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className={`
                  flex-1 whitespace-nowrap transition-opacity duration-200
                  ${isOpen ? 'opacity-100' : 'opacity-0'}
                `}>
                  {item.label}
                </span>
              </Link>
              {/* Tooltip saat sidebar tertutup */}
              {!isOpen && (
                <div className="
                  absolute left-full ml-4 px-2 py-1 rounded-md bg-gray-800 text-white text-sm
                  invisible opacity-0 -translate-x-3 transition-all
                  group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                ">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 4. Logout Button */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          onClick={onLogout}
          className={`
            w-full h-11 flex items-center text-red-600 hover:text-red-700 hover:bg-red-50
            ${isOpen ? 'px-3 gap-3 justify-start' : 'justify-center'}
          `}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className={`
            flex-1 text-left whitespace-nowrap transition-opacity duration-200
            ${isOpen ? 'opacity-100' : 'opacity-0'}
          `}>
            Logout
          </span>
        </Button>
      </div>
    </aside>
  );
}
