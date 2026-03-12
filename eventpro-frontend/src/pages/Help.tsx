import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronRight, HelpCircle, Mail } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "How do I buy tickets?",
    a: "Browse events on the home or Events page, select an event, choose your ticket type and quantity, and proceed to checkout. You can check out as a guest or create an account to track your orders.",
  },
  {
    q: "Can I get a refund?",
    a: "Refund policies are set by the event organizer. After purchasing, check your order confirmation or contact the organizer. For payment issues, contact our support team.",
  },
  {
    q: "How do I create an event?",
    a: "Sign up or log in, then go to the Organizer dashboard. Click Create event and fill in the details (name, date, venue, ticket types). You can save as draft and publish when ready.",
  },
  {
    q: "When do I get paid as an organizer?",
    a: "Basic: standard payout after the event (T+2). Pro and Enterprise tiers may qualify for early or instant payouts based on your account and risk assessment. Complete identity verification to unlock payouts.",
  },
  {
    q: "How do I check in attendees?",
    a: "Use the Check-in page in the Organizer section (or the Check-in shortcut on the mobile app). Scan the QR code on each ticket to mark the attendee as checked in.",
  },
  {
    q: "Where is my data?",
    a: "Organizers can export attendee data (CSV) from the event attendees view. Our Privacy Policy explains how we collect and use data. You can request deletion or a copy of your data by contacting us.",
  },
];

const Help = () => {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          <div className="text-center">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center mb-4">
              <HelpCircle className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Help Center
            </h1>
            <p className="text-muted-foreground text-lg">
              Find answers to common questions about tickets, events, and payouts.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Frequently asked questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">Still need help?</p>
                  <p className="text-sm text-muted-foreground">
                    Our support team is ready to assist you.
                  </p>
                </div>
                <Button asChild>
                  <Link to="/contact">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact us
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Help;
