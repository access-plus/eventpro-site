import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RecentlyViewedEvents } from "@/components/RecentlyViewedEvents";
import { Ticket, Calendar, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Ticket,
      title: "Easy Ticketing",
      description: "Simple and secure ticket purchasing for all your favorite events",
    },
    {
      icon: Calendar,
      title: "Event Discovery",
      description: "Discover amazing events happening near you or around the world",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Your data and transactions are protected with industry-leading security",
    },
    {
      icon: Zap,
      title: "Instant Access",
      description: "Get your tickets instantly and access them from any device",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Experience Events Like Never Before
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Your gateway to unforgettable experiences. Discover, book, and enjoy events with EventPro.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary text-lg px-8 shadow-glow"
                onClick={() => navigate("/events")}
              >
                <Calendar className="mr-2 h-5 w-5" />
                Explore Events
              </Button>
              {!isAuthenticated && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8"
                  onClick={() => navigate("/signup")}
                >
                  Get Started Free
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recently Viewed Events */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <RecentlyViewedEvents maxDisplay={6} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose EventPro?</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need for seamless event experiences
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-shadow bg-gradient-card border-border/50">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="p-12 text-center bg-gradient-hero border-0">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join thousands of event-goers discovering amazing experiences
              </p>
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-lg px-8"
                onClick={() => navigate(isAuthenticated ? "/events" : "/signup")}
              >
                <Ticket className="mr-2 h-5 w-5" />
                {isAuthenticated ? "Browse Events" : "Create Your Account"}
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
