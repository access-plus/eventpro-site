import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { User, Ticket } from "lucide-react";
import { apiService } from "@/lib/api";
import type { FollowedOrganizer } from "@/types/api";

const Following = () => {
  const [list, setList] = useState<FollowedOrganizer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService
      .getFollowing()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Following</h1>
        <p className="text-muted-foreground mb-6">
          Organizers you follow. Visit their events from event pages.
        </p>
        {list.length === 0 ? (
          <Card className="p-8 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">You aren’t following any organizers yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Go to an event and click <strong>Follow</strong> next to the organizer.
            </p>
            <Link to="/events" className="inline-block mt-4 text-primary font-medium hover:underline">
              Discover events →
            </Link>
          </Card>
        ) : (
          <ul className="space-y-3">
            {list.map((o) => (
              <li key={o.organizerId}>
                <Link
                  to={`/events?organizerId=${o.organizerId}`}
                  className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {o.profilePictureUrl ? (
                    <img
                      src={o.profilePictureUrl}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover bg-muted"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-foreground">
                      {[o.firstName, o.lastName].filter(Boolean).join(" ") || "Organizer"}
                    </span>
                  </div>
                  <Ticket className="h-5 w-5 text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Following;
