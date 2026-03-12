import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { Link } from "react-router-dom";
import { apiService } from "@/lib/api";
import {
  LogOut,
  Trash2,
  Palette,
  Shield,
  User,
  Mail,
  HelpCircle,
  FileText,
  CreditCard,
  Ticket,
  ChevronRight,
  Bell,
} from "lucide-react";
import { motion } from "framer-motion";

const Settings = () => {
  const { logout, isAuthenticated } = useAuth();
  const { clearRecentlyViewed, notificationPreferences, setNotificationPreferences } = usePreferences();
  const [prefsLoading, setPrefsLoading] = useState(false);

  // Sync in-app preference from API when logged in
  useEffect(() => {
    if (!isAuthenticated) return;
    setPrefsLoading(true);
    apiService
      .getMyNotificationPreferences()
      .then((p) => setNotificationPreferences({ inAppNotifications: p.pushEnabled }))
      .catch(() => {})
      .finally(() => setPrefsLoading(false));
  }, [isAuthenticated]);

  const handleInAppChange = async (v: boolean) => {
    setNotificationPreferences({ inAppNotifications: v });
    if (!isAuthenticated) return;
    try {
      await apiService.updateMyNotificationPreferences({ pushEnabled: v });
    } catch {
      setNotificationPreferences({ inAppNotifications: !v });
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent">
          Settings
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Quick links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Account
              </CardTitle>
              <CardDescription>Profile, orders, and subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <Button variant="ghost" className="w-full justify-between" asChild>
                <Link to="/profile/edit">
                  Edit profile
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-between" asChild>
                <Link to="/orders">
                  <span className="flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    Order history
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-between" asChild>
                <Link to="/pricing">
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pricing & subscription
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card id="notifications">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>
                {isAuthenticated
                  ? "In-app preference is saved to your account. Email toggles are stored on this device."
                  : "Choose how we contact you. Sign in to sync in-app preference to your account."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order confirmations (email)</p>
                  <p className="text-sm text-muted-foreground">Receive a confirmation when you purchase tickets</p>
                </div>
                <Switch
                  checked={notificationPreferences.emailOrderConfirmations}
                  onCheckedChange={(v) => setNotificationPreferences({ emailOrderConfirmations: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing & tips (email)</p>
                  <p className="text-sm text-muted-foreground">News, offers, and event recommendations</p>
                </div>
                <Switch
                  checked={notificationPreferences.emailMarketing}
                  onCheckedChange={(v) => setNotificationPreferences({ emailMarketing: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Event reminders (email)</p>
                  <p className="text-sm text-muted-foreground">Reminders before events you’re attending</p>
                </div>
                <Switch
                  checked={notificationPreferences.emailEventReminders}
                  onCheckedChange={(v) => setNotificationPreferences({ emailEventReminders: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">In-app notifications</p>
                  <p className="text-sm text-muted-foreground">Notifications inside the app when you’re logged in</p>
                </div>
                <Switch
                  checked={notificationPreferences.inAppNotifications}
                  onCheckedChange={handleInAppChange}
                  disabled={prefsLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                To opt out of marketing entirely, turn off &quot;Marketing & tips&quot; above. For more choices, see our{" "}
                <Link to="/privacy" className="text-primary hover:underline">Privacy page</Link>.
              </p>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how EventPro looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark mode
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Support
              </CardTitle>
              <CardDescription>Get help or get in touch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <Button variant="ghost" className="w-full justify-between" asChild>
                <Link to="/help">
                  Help center
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-between" asChild>
                <Link to="/contact">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact us
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-between" asChild>
                <Link to="/privacy">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Data & privacy
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Privacy
              </CardTitle>
              <CardDescription>Manage your data on this device</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recently viewed events</p>
                  <p className="text-sm text-muted-foreground">
                    Clear your recently viewed events list
                  </p>
                </div>
                <Button variant="outline" onClick={clearRecentlyViewed}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sign out */}
          <Card className="border-destructive/20">
            <CardContent className="pt-6">
              <Button
                variant="destructive"
                onClick={logout}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
