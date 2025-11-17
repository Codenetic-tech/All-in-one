import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import Header from './Header';
import { Menu, X, Home, Users, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  // Mobile Navigation Items (customize based on your routes)
  const mobileNavItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Users, label: 'Clients', href: '/' },
    { 
      icon: LogOut, 
      label: 'Logout', 
      onClick: handleLogout,
      className: 'text-red-600 hover:text-red-700'
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col w-full">

          {/* Mobile Slide-out Menu */}
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              
              {/* Slide-out Menu */}
              <div className="lg:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                
                <nav className="p-4 space-y-2">
                  {mobileNavItems.map((item) => {
                    if (item.onClick) {
                      return (
                        <button
                          key={item.label}
                          onClick={() => {
                            item.onClick?.();
                            setMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left ${item.className || ''}`}
                        >
                          <item.icon size={20} className={item.className?.includes('red') ? 'text-red-600' : 'text-gray-600'} />
                          <span className={item.className?.includes('red') ? 'text-red-600 font-medium' : 'text-gray-900 font-medium'}>{item.label}</span>
                        </button>
                      );
                    }
                    
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon size={20} className="text-gray-600" />
                        <span className="text-gray-900 font-medium">{item.label}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </>
          )}

          {/* Desktop Header - Hidden on mobile */}
          <div className="hidden lg:block">
            {/* <Header /> */}
          </div>

          {/* Main Content */}
          <main className="flex-1 p-0.5 lg:p-6 pb-16 lg:pb-6">
            {children}
          </main>

          {/* Mobile Bottom Navigation - Compact and Fixed */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
            <nav className="flex items-center justify-around px-1 py-1.5">
              {mobileNavItems.map((item) => {
                if (item.onClick) {
                  return (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors min-w-0 flex-1 ${item.className || ''}`}
                    >
                      <item.icon 
                        size={18} 
                        className={item.className?.includes('red') ? 'text-red-600' : 'text-gray-600'} 
                      />
                      <span className={`text-[10px] truncate ${item.className?.includes('red') ? 'text-red-600' : 'text-gray-600'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                }
                
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors min-w-0 flex-1"
                  >
                    <item.icon size={18} className="text-gray-600" />
                    <span className="text-[10px] text-gray-600 truncate">{item.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;