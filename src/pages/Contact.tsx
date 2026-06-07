"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const Contact = () => {
  return (
    <div className="min-h-screen bg-[var(--paper)] py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center text-sm font-bold text-[var(--gold)] mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h1 className="text-4xl font-black text-[var(--ink)] mb-6">Get in touch</h1>
            <p className="text-lg text-[var(--muted)] mb-12">
              Have questions about our platform or need support? Our team is here to help you with compassion and care.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--gold-bg)] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--ink)]">Email</h3>
                  <p className="text-[var(--muted)]">support@struta.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--gold-bg)] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--ink)]">Phone</h3>
                  <p className="text-[var(--muted)]">+254 700 000 000</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--gold-bg)] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--ink)]">Office</h3>
                  <p className="text-[var(--muted)]">Nairobi, Kenya</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-struta">
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="How can we help?" className="min-h-[150px]" />
              </div>
              <Button className="w-full btn-struta-gold">Send Message</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;