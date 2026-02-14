import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Gift, ArrowRight, CheckCircle2, DollarSign, Megaphone, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const Partners = () => {
  const ambassadorBenefits = [
    "Earn 10% commission on every ticket sold through your referral link",
    "Early access to exclusive cultural events in your community",
    "Free tickets to partner events for content creation",
    "Featured spotlight on our social media channels",
    "Custom promotional materials in your language",
    "Dedicated partner success manager",
  ];

  const venueBenefits = [
    "Priority listing for events hosted at your venue",
    "Co-marketing opportunities with cultural organizers",
    "Access to our network of 500+ community event organizers",
    "Streamlined booking and ticketing integration",
    "Revenue share on platform-hosted events",
    "Custom venue page with your branding",
  ];

  const affiliateTiers = [
    {
      name: "Bronze",
      referrals: "1-5",
      commission: "15%",
      perks: ["Basic dashboard access", "Monthly payouts"],
    },
    {
      name: "Silver",
      referrals: "6-15",
      commission: "20%",
      perks: ["Priority support", "Bi-weekly payouts", "Co-branded materials"],
    },
    {
      name: "Gold",
      referrals: "16+",
      commission: "25%",
      perks: ["Dedicated account manager", "Weekly payouts", "Event sponsorship opportunities", "VIP event access"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-4">
            Partner With Us
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Grow Together With Our{" "}
            <span className="text-primary">Partner Program</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join a thriving network connecting diaspora communities across the US. 
            Whether you're an influencer, venue owner, or event organizer, there's a place for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="#ambassador">Become an Ambassador</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#affiliate">Start Referring</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">500+</p>
              <p className="text-muted-foreground">Active Partners</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">$2M+</p>
              <p className="text-muted-foreground">Partner Earnings</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">50+</p>
              <p className="text-muted-foreground">Cultural Communities</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">25%</p>
              <p className="text-muted-foreground">Max Commission</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Ambassadors Section */}
      <section id="ambassador" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Megaphone className="h-6 w-6 text-primary" />
                </div>
                <Badge>Community Ambassadors</Badge>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Represent Your Community
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Are you a voice in your diaspora community? Join our ambassador program to 
                help connect your community with authentic cultural events while earning rewards.
              </p>
              <ul className="space-y-3 mb-8">
                {ambassadorBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg">
                Apply to Be an Ambassador
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Who We're Looking For
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-background/50">
                  <h4 className="font-semibold mb-2">Social Media Influencers</h4>
                  <p className="text-sm text-muted-foreground">
                    Content creators with engaged diaspora audiences on Instagram, TikTok, or YouTube
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <h4 className="font-semibold mb-2">Community Leaders</h4>
                  <p className="text-sm text-muted-foreground">
                    Religious leaders, cultural organization heads, and community advocates
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <h4 className="font-semibold mb-2">Event Enthusiasts</h4>
                  <p className="text-sm text-muted-foreground">
                    Frequent attendees who love sharing cultural experiences with friends and family
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Venue Partners Section */}
      <section id="venues" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Card className="order-2 lg:order-1 bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-accent-foreground" />
                  Venue Types We Partner With
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Cultural Centers",
                    "Banquet Halls",
                    "Churches & Mosques",
                    "Community Centers",
                    "Restaurants",
                    "Outdoor Spaces",
                    "Hotels & Resorts",
                    "Theaters",
                  ].map((venue, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-background/50 text-center text-sm font-medium"
                    >
                      {venue}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Building2 className="h-6 w-6 text-accent-foreground" />
                </div>
                <Badge variant="secondary">Venue Partners</Badge>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Fill Your Venue With Culture
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Connect your space with passionate event organizers looking for the perfect 
                location to host cultural celebrations, galas, and community gatherings.
              </p>
              <ul className="space-y-3 mb-8">
                {venueBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" variant="secondary">
                List Your Venue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Affiliate/Referral Program Section */}
      <section id="affiliate" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <Badge>Affiliate Program</Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Refer Organizers, Earn Rewards
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Know event organizers in your community? Refer them to Access Plus and earn 
              ongoing commissions on their ticket sales. The more you refer, the more you earn.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {affiliateTiers.map((tier, index) => (
              <Card
                key={tier.name}
                className={`relative ${
                  index === 2
                    ? "border-primary shadow-lg scale-105"
                    : "border-border"
                }`}
              >
                {index === 2 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.referrals} organizers referred</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold text-primary">{tier.commission}</span>
                    <span className="text-muted-foreground ml-1">commission</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.perks.map((perk, perkIndex) => (
                      <li key={perkIndex} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg">
              <DollarSign className="mr-2 h-4 w-4" />
              Join the Affiliate Program
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Apply",
                description:
                  "Fill out a quick application form. We'll review and get back to you within 48 hours.",
              },
              {
                step: "2",
                title: "Get Your Link",
                description:
                  "Once approved, receive your unique referral link and promotional materials.",
              },
              {
                step: "3",
                title: "Start Earning",
                description:
                  "Share with your network and earn commissions on every successful referral or sale.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Partner With Us?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join hundreds of partners already earning and growing with Access Plus. 
            Have questions? Our partnership team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              Apply Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">Contact Partnership Team</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Partners;
