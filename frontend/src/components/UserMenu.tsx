import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { User, Settings, LogOut, Shield, Calendar, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const UserMenu = () => {
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuth();

  if (!user) return null;

  const getInitials = () => {
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return "U";
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-destructive";
      case "ORGANIZER":
        return "bg-primary";
      default:
        return "bg-accent";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={undefined} alt={user.email} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-64 bg-background border-border shadow-lg z-50" 
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-12 w-12">
                <AvatarImage src={undefined} alt={user.email} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                {(user.firstName || user.lastName) && (
                  <p className="text-sm font-semibold leading-none truncate">
                    {user.firstName} {user.lastName}
                  </p>
                )}
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {user.email}
                </p>
              </div>
            </div>
            <Badge className={`w-fit ${getRoleBadgeColor(user.role)}`}>
              {user.role}
            </Badge>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => navigate("/profile")}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate("/orders")}
          className="cursor-pointer"
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          <span>My Orders</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate("/profile")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        {hasRole("ADMIN") && (
          <DropdownMenuItem 
            onClick={() => navigate("/admin")}
            className="cursor-pointer"
          >
            <Shield className="mr-2 h-4 w-4" />
            <span>Admin Dashboard</span>
          </DropdownMenuItem>
        )}
        
        {hasRole("ORGANIZER") && (
          <DropdownMenuItem 
            onClick={() => navigate("/organizer")}
            className="cursor-pointer"
          >
            <Calendar className="mr-2 h-4 w-4" />
            <span>Organizer Dashboard</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={logout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
