import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, Search, Bell, LogOut, User, Moon, Sun, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface HeaderProps {
  onMenuClick: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  onOpenAuth: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onSearch, searchQuery, onOpenAuth }) => {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center gap-4 sticky top-0 z-30">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition">
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search records, medications, tests..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <button className="p-2 rounded-xl hover:bg-gray-100 transition relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {user.email?.split('@')[0]}
                </span>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.email?.split('@')[0]}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={onOpenAuth}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
