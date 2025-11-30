import { useState } from "react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Monitor, Bell, Layout, Image, Save } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const Settings = () => {
  const { preferences, updatePreferences } = usePreferences();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleSave = () => {
    updatePreferences(localPrefs);
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and settings</p>
        </div>

        <div className="space-y-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how EventPro looks on your device</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Theme</Label>
                <RadioGroup value={theme} onValueChange={setTheme}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                      <Sun className="h-4 w-4" />
                      Light
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                      <Moon className="h-4 w-4" />
                      Dark
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                      <Monitor className="h-4 w-4" />
                      System
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Choose what updates you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="order-confirmation">Order Confirmations</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails when you purchase tickets
                  </p>
                </div>
                <Switch
                  id="order-confirmation"
                  checked={localPrefs.emailNotifications.orderConfirmation}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({
                      ...localPrefs,
                      emailNotifications: {
                        ...localPrefs.emailNotifications,
                        orderConfirmation: checked,
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="event-reminders">Event Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded 24 hours before your events
                  </p>
                </div>
                <Switch
                  id="event-reminders"
                  checked={localPrefs.emailNotifications.eventReminders}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({
                      ...localPrefs,
                      emailNotifications: {
                        ...localPrefs.emailNotifications,
                        eventReminders: checked,
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="promotions">Promotions & Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive news about upcoming events and special offers
                  </p>
                </div>
                <Switch
                  id="promotions"
                  checked={localPrefs.emailNotifications.promotions}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({
                      ...localPrefs,
                      emailNotifications: {
                        ...localPrefs.emailNotifications,
                        promotions: checked,
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Display Options
              </CardTitle>
              <CardDescription>Customize how events are displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-view">Compact View</Label>
                  <p className="text-sm text-muted-foreground">
                    Show more events in less space
                  </p>
                </div>
                <Switch
                  id="compact-view"
                  checked={localPrefs.display.compactView}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({
                      ...localPrefs,
                      display: {
                        ...localPrefs.display,
                        compactView: checked,
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-images" className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Show Event Images
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display event cover images in listings
                  </p>
                </div>
                <Switch
                  id="show-images"
                  checked={localPrefs.display.showEventImages}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({
                      ...localPrefs,
                      display: {
                        ...localPrefs.display,
                        showEventImages: checked,
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-gradient-primary">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
