import { Home, Calendar, Ticket, Plus, User, Settings, LogIn, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectIsAuthenticated, signOutAsync } from "@/store/slices/authSlice";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Events", url: "/events", icon: Calendar },
  { title: "My Tickets", url: "/tickets", icon: Ticket },
  { title: "Create Event", url: "/create", icon: Plus },
];

const staticBottomItems = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const isActive = (path: string) => location.pathname === path;

  /**
   * Handles logout action.
   * Dispatches signOutAsync to clear authentication state and tokens,
   * then navigates to home page.
   */
  const handleLogout = async () => {
    try {
      await dispatch(signOutAsync()).unwrap();
      // Navigate to home page after successful logout
      navigate('/', { replace: true });
    } catch (error) {
      // Even if logout fails, navigate away and clear local state
      console.error('Logout failed:', error);
      navigate('/', { replace: true });
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            {open && (
              <div className="flex flex-col">
                <span className="font-bold text-lg text-sidebar-foreground">EventPro</span>
                <span className="text-xs text-muted-foreground">Book your experience</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="pt-6">
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="transition-smooth hover:bg-sidebar-accent data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className="flex items-center gap-3"
                      activeClassName="font-medium"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Navigation */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Login/Logout button - conditional based on auth state */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild={!isAuthenticated}
                  onClick={isAuthenticated ? handleLogout : undefined}
                  className="transition-smooth hover:bg-sidebar-accent data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                >
                  {isAuthenticated ? (
                    <button
                      className="flex items-center gap-3 w-full text-left"
                      type="button"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  ) : (
                    <NavLink 
                      to="/login"
                      className="flex items-center gap-3"
                      activeClassName="font-medium"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>Login</span>
                    </NavLink>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {/* Static bottom items */}
              {staticBottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="transition-smooth hover:bg-sidebar-accent data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-3"
                      activeClassName="font-medium"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}




