import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  LogOut,
  Menu,
  X,
  Shield,
  BookOpen,
  Clock,
  Upload,
  MapPin,
} from "lucide-react";

export const DashboardLayout = ({ children, navigation }) => {
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 mr-2"
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-indigo-600" />
                <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                  GeoAttend Pro
                </span>
                <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                  {user?.role === "TEACHER" ? "Educator" : "Student"}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-100 to-violet-100 border border-indigo-200 text-indigo-700 font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform active:scale-95 hover:shadow-md"
                >
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden animation-fade-in border border-slate-100">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                        {user?.email || "user@geoattend.com"}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Mobile Sidebar overlay */}
        <div
          className={`fixed inset-0 bg-slate-800/50 z-40 transition-opacity duration-300 md:hidden ${
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`fixed md:fixed top-16 z-40 w-64 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } flex flex-col`}
        >
          <div className="p-4 flex-1 overflow-y-auto">
            <p className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-4 ml-2">
              Menu
            </p>
            <nav className="space-y-1.5 pb-4">
              {navigation.map((item) => {
                const isActive = item.active;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.onClick();
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 ${
                        isActive
                          ? "text-indigo-600"
                          : "text-slate-400 group-hover:text-slate-500"
                      }`}
                    />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative md:ml-64 w-full h-[calc(100vh-4rem)]">
          <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8 w-full">
            <div className="max-w-7xl mx-auto flex flex-col h-full">
              <div className="flex-1">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
