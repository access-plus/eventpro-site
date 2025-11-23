import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, Ticket, TrendingUp, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const featuredEvents = [
  {
    id: 1,
    title: "Summer Music Festival",
    date: "Jul 15, 2025",
    location: "Central Park, NY",
    image: "https://images.unsplash.com/photo-1533174442332-5680c099e2d0?w=800&h=600&fit=crop",
    attendees: "2.5K",
    price: "$49",
  },
  {
    id: 2,
    title: "Tech Innovation Summit",
    date: "Aug 22, 2025",
    location: "Convention Center, SF",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
    attendees: "1.2K",
    price: "$89",
  },
  {
    id: 3,
    title: "Food & Wine Experience",
    date: "Sep 5, 2025",
    location: "Downtown, LA",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop",
    attendees: "800",
    price: "$65",
  },
  {
    id: 4,
    title: "Art Gallery Opening",
    date: "Oct 10, 2025",
    location: "Museum District, CHI",
    image: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800&h=600&fit=crop",
    attendees: "450",
    price: "Free",
  },
];

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Discover Amazing Events</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Your Next Experience
              <br />
              Awaits
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From concerts to conferences, find and book tickets to thousands of events happening near you.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button size="lg" className="text-lg h-14 px-8 shadow-primary" onClick={() => navigate("/events")}>
                Explore Events
              </Button>
              <Button size="lg" variant="outline" className="text-lg h-14 px-8" onClick={() => navigate("/create")}>
                Create Event
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
            {[
              { icon: Calendar, label: "Active Events", value: "10K+" },
              { icon: Users, label: "Happy Attendees", value: "500K+" },
              { icon: TrendingUp, label: "Success Rate", value: "99%" },
            ].map((stat, idx) => (
              <Card key={idx} className="shadow-card hover-scale animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                <CardContent className="p-6 text-center">
                  <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="px-6 py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Events</h2>
              <p className="text-muted-foreground">Don't miss out on these trending experiences</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/events")}>View All</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredEvents.map((event, idx) => (
              <Card 
                key={event.id} 
                className="group overflow-hidden shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="relative overflow-hidden aspect-[4/3]">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-semibold">
                    {event.price}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees} attending</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    <Ticket className="w-4 h-4 mr-2" />
                    Get Tickets
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
