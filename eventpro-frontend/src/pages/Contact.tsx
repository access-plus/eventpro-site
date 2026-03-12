import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SUPPORT_EMAIL = "support@accessplus.com";

const Contact = () => {
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=EventPro%20Support%20Request`;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Contact Us
            </h1>
            <p className="text-muted-foreground text-lg">
              Have a question or need help? We're here for you.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Email support</CardTitle>
                <CardDescription>
                  For account, billing, or event questions. We typically respond within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a href={mailto}>
                    Email {SUPPORT_EMAIL}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-border hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Help center</CardTitle>
                <CardDescription>
                  FAQs, guides, and troubleshooting for tickets, payouts, and events.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/help">
                    Visit Help Center
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Other inquiries</CardTitle>
              <CardDescription>
                For partnerships, enterprise plans, or press, use the email above and include your topic in the subject line.
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
