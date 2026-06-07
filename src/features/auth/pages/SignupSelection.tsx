"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Building2, Store, ArrowRight } from 'lucide-react';

const SignupSelection = () => {
  const options = [
    {
      title: "Bereaved Family",
      description: "Find support and plan a memorial for a loved one.",
      icon: Heart,
      path: "/signup/family",
      color: "bg-[var(--gold)]",
      tag: "Support"
    },
    {
      title: "Funeral Home",
      description: "Manage your operations and serve families better.",
      icon: Building2,
      path: "/signup/home",
      color: "bg-[var(--ink)]",
      tag: "Business"
    },
    {
      title: "Service Vendor",
      description: "Provide flowers, transport, or other funeral services.",
      icon: Store,
      path: "/signup/vendor",
      color: "bg-emerald-600",
      tag: "Marketplace"
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-[var(--ink)] mb-4">Create your account</h1>
          <p className="text-[var(--muted)]">Choose the type of account that best fits your needs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((option) => (
            <Link 
              key={option.title} 
              to={option.path}
              className="card-struta group hover:border-[var(--gold)] transition-all flex flex-col"
            >
              <div className={`w-12 h-12 rounded-xl ${option.color} flex items-center justify-center mb-6 text-white`}>
                <option.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)] mb-2">{option.tag}</span>
              <h3 className="text-xl font-bold mb-3 text-[var(--ink)]">{option.title}</h3>
              <p className="text-sm text-[var(--muted)] mb-8 flex-1">
                {option.description}
              </p>
              <div className="flex items-center text-sm font-bold text-[var(--ink)] group-hover:text-[var(--gold)] transition-colors">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-[var(--muted)]">
          Already have an account? <Link to="/login" className="text-[var(--gold)] font-bold">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupSelection;