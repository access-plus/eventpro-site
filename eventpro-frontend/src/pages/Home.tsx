import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentlyViewedEvents } from "@/components/RecentlyViewedEvents";
import { EventCard } from "@/components/EventCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { Ticket, Calendar, Shield, Zap, Play, ChevronDown, TrendingUp, ArrowRight, Clock } from "lucide-react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiService } from "@/lib/api";
import type { Event } from "@/types/api";
import heroImage from "@/assets/hero-concert.jpg";

function AnimatedStat({ end, suffix, label, duration }: { end: number; suffix: string; label: string; duration: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, end, { duration, ease: "easeOut" });
    return controls.stop;
  }, [inView, end, duration, count]);

  useEffect(() => {
    const unsub = rounded.on("change", (v) => setDisplay(String(v)));
    return unsub;
  }, [rounded]);

  return (
    <motion.div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-white">
        {display}{suffix}
      </div>
      <div className="text-sm text-white/70">{label}</div>
    </motion.div>
  );
}

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);
  const [currentEvents, setCurrentEvents] = useState<Event[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const loadTrendingEvents = async () => {
      try {
        setIsLoadingTrending(true);
        let events: Event[];
        
        if (selectedCategory) {
          events = await apiService.getEventsByCategory(selectedCategory);
          events = events.slice(0, 6);
        } else {
          events = await apiService.getEvents(1, 6);
        }
        
        setTrendingEvents(events);
      } catch (error) {
        console.error("Failed to load trending events:", error);
        setTrendingEvents([]);
      } finally {
        setIsLoadingTrending(false);
      }
    };

    const loadCurrentEvents = async () => {
      try {
        setIsLoadingCurrent(true);
        // Fetch enough events so we can filter to upcoming (API returns startTime)
        const events = await apiService.getEvents(1, 50);
        const now = new Date();
        const getStartDate = (event: Event) => new Date(event.startTime || event.startDateTime || 0);
        const upcomingEvents = events
          .filter(event => getStartDate(event) >= now)
          .sort((a, b) => getStartDate(a).getTime() - getStartDate(b).getTime())
          .slice(0, 6);
        setCurrentEvents(upcomingEvents);
      } catch (error) {
        console.error("Failed to load current events:", error);
        setCurrentEvents([]);
      } finally {
        setIsLoadingCurrent(false);
      }
    };

    loadTrendingEvents();
    loadCurrentEvents();
  }, [selectedCategory]);

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

  const scrollToContent = () => {
    document.getElementById("trending")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section: full-bleed background */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden -mt-[4rem] pt-[4rem]">
        {/* Full-bleed background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Concert crowd"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/95" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-transparent to-cyan-500/20" />
        </div>

        {/* Hero Content */}
        <div className="container relative z-10 mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-6xl mx-auto text-center overflow-visible"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-8"
            >
              <Play className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-white/90">{t("home.hero.subtitle").split('.')[0]}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold mb-6 text-gradient-hero tracking-tight px-2 sm:px-4 break-words"
            >
              {(() => {
                const title = t("home.hero.title");
                const spaceIndex = title.indexOf(" ");
                const firstWord = spaceIndex > 0 ? title.slice(0, spaceIndex) : title;
                const rest = spaceIndex > 0 ? title.slice(spaceIndex + 1) : "";
                return (
                  <>
                    <span className="whitespace-nowrap">{firstWord}</span>
                    {rest ? ` ${rest}` : null}
                  </>
                );
              })()}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto"
            >
              {t("home.hero.subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                className="bg-gradient-cta text-white text-lg px-10 py-6 shadow-glow hover:shadow-xl hover:scale-105 transition-all border-0"
                onClick={() => navigate("/events")}
              >
                <Calendar className="mr-2 h-5 w-5" />
                {t("home.browse_events")}
              </Button>
              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                  onClick={() => navigate("/signup")}
                >
                  Join the Front Row
                </Button>
              )}
            </motion.div>

            {/* Stats with animated counters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16"
            >
              {[
                { end: 10, suffix: "K+", label: "Events", duration: 2 },
                { end: 500, suffix: "K+", label: "Tickets Sold", duration: 2 },
                { end: 99, suffix: "%", label: "Happy Customers", duration: 2 },
              ].map((stat) => (
                <AnimatedStat key={stat.label} {...stat} />
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-sm">Discover More</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.button>
      </section>

      {/* Trending Events Section */}
      <section id="trending" className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
          >
            <div>
              <div className="inline-flex items-center gap-2 text-primary mb-3">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">{t("home.trending")}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold heading-presence">Hot Events This Week</h2>
              <p className="text-xl text-muted-foreground mt-2">
                Don't miss out on the most popular experiences
              </p>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="self-start md:self-auto rtl:ml-0 rtl:mr-auto"
              onClick={() => navigate("/events")}
            >
              {t("common.view_all")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-8"
          >
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </motion.div>

          {isLoadingTrending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-52 w-full" />
                  <div className="p-5 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : trendingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(200px,auto)]">
              {trendingEvents.slice(0, 1).map((event, index) => (
                <div key={event.id} className="md:col-span-2 md:row-span-2 min-h-[320px]">
                  <EventCard event={event} index={index} />
                </div>
              ))}
              {trendingEvents.slice(1, 5).map((event, index) => (
                <div key={event.id} className="min-h-[200px]">
                  <EventCard event={event} index={index + 1} />
                </div>
              ))}
              {trendingEvents.length >= 6 && (
                <div key={trendingEvents[5].id} className="md:col-span-2 min-h-[200px]">
                  <EventCard event={trendingEvents[5]} index={5} />
                </div>
              )}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No events available</h3>
              <p className="text-muted-foreground mb-6">
                Check back soon for exciting new events
              </p>
              <Button onClick={() => navigate("/events")}>
                Browse All Events
              </Button>
            </Card>
          )}
        </div>
      </section>

      {/* Current Events Section - subtle gradient wash + geometric vibe */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
          >
            <div>
              <div className="inline-flex items-center gap-2 text-primary mb-3">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">{t("home.upcoming")}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold heading-presence">{t("home.upcoming")}</h2>
              <p className="text-xl text-muted-foreground mt-2">
                Don't miss these events happening in the coming days
              </p>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="self-start md:self-auto"
              onClick={() => navigate("/events")}
            >
              View All Events
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

          {isLoadingCurrent ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-52 w-full" />
                  <div className="p-5 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : currentEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentEvents.map((event, index) => (
                <div key={event.id} className="relative">
                  {index === 0 && (
                    <div className="absolute -top-2 left-4 z-10 px-3 py-1 rounded-full bg-primary/90 backdrop-blur-md text-primary-foreground text-xs font-bold uppercase tracking-wider shadow-lg">
                      Featured
                    </div>
                  )}
                  <EventCard event={event} index={index} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No upcoming events</h3>
              <p className="text-muted-foreground mb-6">
                Check back soon for new events
              </p>
              <Button onClick={() => navigate("/events")}>
                Browse All Events
              </Button>
            </Card>
          )}
        </div>
      </section>

      {/* Recently Viewed Events */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <RecentlyViewedEvents maxDisplay={6} />
        </div>
      </section>

      {/* Features Section - scroll reveal fade-in */}
      <section id="features" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose EventPro?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for seamless event experiences
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
                >
                  <Card className="p-6 h-full hover:shadow-lg hover:shadow-primary/15 transition-all hover:-translate-y-1 bg-gradient-card border-border/50 group/feat">
                    <div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 shadow-md group-hover/feat:shadow-lg group-hover/feat:shadow-[0_0_24px_hsl(var(--primary)_/_0.25)] transition-shadow duration-300">
                      <Icon className="h-7 w-7 text-primary-foreground" />
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
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <Card className="relative overflow-hidden p-12 md:p-16 text-center border-0">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-hero" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
              
              <div className="relative">
                <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
                  Ready to Secure Your Tickets?
                </h2>
                <p className="text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
                  Browse events and buy tickets—no account required. Sign up to save your orders and never miss an event.
                </p>
                <Button
                  size="lg"
                  className="bg-gradient-cta text-primary-foreground hover:opacity-95 text-lg px-10 py-6 border-0 shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_0_30px_hsl(var(--primary)_/_0.4),0_8px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3),0_0_40px_hsl(var(--primary)_/_0.5),0_12px_28px_rgba(0,0,0,0.2)] transition-shadow duration-300"
                  onClick={() => navigate("/events")}
                >
                  <Ticket className="mr-2 h-5 w-5" />
                  Get Early Access — Browse events & get tickets
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
