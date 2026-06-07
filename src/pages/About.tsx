"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-[var(--paper)] py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-sm font-bold text-[var(--gold)] mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <h1 className="text-4xl font-black text-[var(--ink)] mb-8">About Struta</h1>
        <div className="prose prose-slate max-w-none text-[var(--muted)] space-y-6">
          <p>Struta is a funeral services platform built for Africa, starting in East Africa. We help bereaved families, funeral homes, and vendors coordinate funeral services in one place with dignity, speed, and care.</p>
          <p>We at Emtra built Struta to make one of life’s hardest moments a little easier. When a family loses someone, they should be able to find help quickly, communicate clearly, and organize everything without confusion or unnecessary stress. Struta was made by young founder Emmanuel Nasong&apos;o, founder of Emtra and builder of Struta.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">Our Mission</h2>
          <p>Our mission is to make funeral coordination simpler, more respectful, and more accessible across Africa. We want to reduce delays, confusion, and friction for families while giving funeral homes and vendors a better way to work together.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">What Struta Does</h2>
          <ul>
            <li>Families can search for nearby funeral homes and send requests.</li>
            <li>Funeral homes can validate requests, plan services, and manage cases.</li>
            <li>Vendors can receive bookings for catering, seats, tents, transport, flowers, printing, and related services.</li>
            <li>Invoices can be sent and paid in real time.</li>
            <li>Families can create a free memorial page to honor their loved one.</li>
          </ul>

          <h2 className="text-xl font-bold text-[var(--ink)]">Why We Built It</h2>
          <p>Funeral arrangements are often fragmented, manual, and stressful. Families are usually forced to call many different people, compare unclear prices, and manage everything under pressure. Struta was built to bring structure, transparency, and calm to that process.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">Memorial Pages</h2>
          <p>Struta also gives families the option to create a free memorial page. They can share a tribute, post photos, add memories, and keep their loved one’s story in one respectful place.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">For Funeral Homes and Vendors</h2>
          <p>For funeral homes and vendors, Struta is more than a listing site. It is a working platform that helps manage requests, communication, invoices, subscriptions, plans, and service coordination from start to finish.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">Our Values</h2>
          <ul>
            <li><strong>Dignity:</strong> We treat every family and every case with respect.</li>
            <li><strong>Trust:</strong> We focus on secure communication and reliable service.</li>
            <li><strong>Simplicity:</strong> We make hard processes easier to understand and use.</li>
            <li><strong>Speed:</strong> We help families and providers act quickly when time matters.</li>
            <li><strong>Transparency:</strong> We make requests, pricing, invoices, and service steps clearer.</li>
          </ul>

          <h2 className="text-xl font-bold text-[var(--ink)]">Privacy and Care</h2>
          <p>Struta handles sensitive information, so privacy and security matter to us. We are building the platform to support respectful communication, careful data handling, and reliable notifications across web and mobile devices.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">Our Focus</h2>
          <p>We are starting in East Africa and building for the wider African market. Our goal is to create a platform that fits local needs while staying modern, scalable, and easy to use.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">Closing</h2>
          <p>Struta exists to make funeral coordination more humane, more organized, and more trustworthy. In a difficult moment, we want to make the process a little lighter for families and a little more efficient for providers.</p>
        </div>
      </div>
    </div>
  );
};

export default About;
