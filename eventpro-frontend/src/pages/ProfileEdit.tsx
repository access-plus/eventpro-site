import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const inputFocusClass =
  "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:shadow-[0_0_0_2px_hsl(var(--primary)_/_0.2),0_0_12px_hsl(var(--primary)_/_0.15)] transition-all duration-200";

/** Predefined cultural niches for Hyper-Local & Cultural Discovery (feeds search taxonomy). */
const CULTURAL_NICHE_OPTIONS = [
  "West African Cultural Events",
  "Cultural & Community Events",
  "Afro-Caribbean & Diaspora",
  "Diaspora & Heritage",
  "Live Music & Festivals",
  "Conference & Professional",
  "Other",
];

const ProfileEdit = () => {
  const { user, hasRole, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [culturalNiche, setCulturalNiche] = useState(user?.culturalNiche ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.updateUser({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phoneNumber: phoneNumber || undefined,
        bio: bio || undefined,
        location: location || undefined,
        culturalNiche: culturalNiche || undefined,
      });
      await refreshUser();
      toast({ title: "Profile updated", description: "Your changes have been saved." });
      navigate("/profile");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save profile.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 rounded-full bg-accent/5 blur-3xl" />
      </div>
      <div className="container relative mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 bg-white/80 dark:bg-white/10 backdrop-blur-md shadow-lg">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputFocusClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputFocusClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={inputFocusClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short bio (optional)"
                    className={inputFocusClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, State (optional)"
                    className={inputFocusClass}
                  />
                </div>

                {hasRole("ORGANIZER") && (
                  <div className="space-y-2">
                    <Label>Cultural Niche / Focus</Label>
                    <Select
                      value={culturalNiche || undefined}
                      onValueChange={(v) => setCulturalNiche(v)}
                    >
                      <SelectTrigger className={inputFocusClass}>
                        <SelectValue placeholder="Select your focus (feeds search)" />
                      </SelectTrigger>
                      <SelectContent>
                        {CULTURAL_NICHE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Helps attendees discover your events in cultural taxonomy.
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate("/profile")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-md hover:shadow-glow"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileEdit;
