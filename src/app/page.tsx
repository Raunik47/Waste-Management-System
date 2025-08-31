// @ts-nocheck
"use client";

import { useState } from "react";
import { Poppins } from "next/font/google";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin } from "lucide-react";

const poppins = Poppins({
  weight: ["300", "400", "600"],
  subsets: ["latin"],
  display: "swap",
});

/* ============================
   HERO (video with readable overlay)
============================= */
function EcoScene() {
  return (
    <section
      aria-label="Hero"
      className="relative w-full h-[70vh] rounded-2xl overflow-hidden ring-1 ring-black/5 bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50"
    >
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/movie.mp4" type="video/mp4" />
        {/* Use a second format only if you actually have it:
        <source src="/movie.webm" type="video/webm" /> */}
        Your browser does not support the video tag.
      </video>

      {/* Stronger greenish overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 via-emerald-900/40 to-emerald-800/30" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-start justify-center text-center px-6 pt-16 md:pt-24">
        <div className="mx-auto max-w-3xl">
          <h1
            className={`${poppins.className} text-3xl md:text-3xl font-extrabold text-white drop-shadow-2xl`}
          >
            Smart Solutions for a{" "}
            <span className="text-emerald-800">Safer Tomorrow</span> ♻️
          </h1>
          <p className="mt-4 text-lg md:text-xl text-emerald-50/95 leading-relaxed drop-shadow">
            Together, let’s make our environment cleaner and greener.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================
   FEATURE CARD (modern/glassy)
============================= */
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/80 supports-[backdrop-filter]:bg-white/60 backdrop-blur-sm p-8 text-center shadow-md ring-1 ring-black/5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Accent gradient glow */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-200/40 via-emerald-100/20 to-blue-100/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />

      {/* Icon circle */}
      <div className="relative mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-inner ring-1 ring-emerald-900/5">
        <Icon className="h-8 w-8 text-emerald-700" aria-hidden="true" />
      </div>

      <h3 className="relative text-xl font-semibold text-emerald-900">
        {title}
      </h3>
      <p className="relative mt-3 text-sm leading-relaxed text-gray-600">
        {description}
      </p>
    </div>
  );
}

/* ============================
   IMPACT STAT CARD
============================= */
function ImpactCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
}) {
  const formattedValue =
    typeof value === "number"
      ? value.toLocaleString("en-US", { maximumFractionDigits: 1 })
      : value;

  return (
    <div className="relative rounded-2xl bg-white/80 supports-[backdrop-filter]:bg-white/60 backdrop-blur-sm p-6 shadow-md ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-xl">
      {/* Decorative ring */}
      <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-blue-100 opacity-60" />
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 ring-1 ring-emerald-900/5 mt-3">
          <Icon className="h-7 w-7 text-emerald-700" aria-hidden="true" />
        </div>
        <div>
          <p className="text-3xl font-extrabold tracking-tight text-emerald-900 mt-4">
            {formattedValue}
          </p>
          <h4 className="mt-1 text-sm font-semibold text-emerald-700">
            {title}
          </h4>
        </div>
      </div>
    </div>
  );
}

/* ============================
   PAGE
============================= */
export default function Home() {
  const [loggedIn] = useState(false);
  const [impactData] = useState({
    wasteCollected: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0,
  });

  return (
    <div className="container mx-auto px-6">
      {/* HERO */}
      <section className="mb-24 pt-4">
        <EcoScene />

        {/* Supporting CTA (kept outside hero for scroll cue) */}
        <div className="mt-12 space-y-6 text-center">
          <p className="text-lg md:text-2xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
            Join our community in making{" "}
            <span className="text-emerald-700 font-semibold">
              waste management smarter
            </span>
            , more
            <span className="text-emerald-700 font-semibold"> efficient</span>,
            and <span className="text-emerald-700 font-semibold">rewarding</span>
            !
          </p>

          <div className="flex justify-center">
            <Button className="group inline-flex items-center rounded-full bg-emerald-600 px-10 py-6 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-emerald-700 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        aria-labelledby="features-heading"
        className="mx-auto mb-24 max-w-6xl"
      >
        <h2
          id="features-heading"
          className="mb-10 text-center text-2xl md:text-3xl font-bold text-emerald-900"
        >
          What You Can Do
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <FeatureCard
            icon={Leaf}
            title="Eco-Friendly"
            description="Report and collect waste to keep neighborhoods clean and nature thriving."
          />
          <FeatureCard
            icon={Coins}
            title="Earn Rewards"
            description="Collect tokens and redeem perks for your sustainable contributions."
          />
          <FeatureCard
            icon={Users}
            title="Community-Driven"
            description="Join a supportive community working together for a greener future."
          />
        </div>
      </section>

      {/* IMPACT */}
      <section
        aria-labelledby="impact-heading"
        className="mx-auto mb-24 max-w-6xl "
      >
        <h2
          id="impact-heading"
          className="mb-10 text-center text-2xl md:text-3xl font-bold text-emerald-900"
        >
          Our Impact
        </h2>

        <div className="grid gap-6 md:grid-cols-4  h-[200px] ">
          <ImpactCard
            title="Waste Collected"
            value={`${impactData.wasteCollected} kg`}
            icon={Recycle}
          />
          <ImpactCard
            title="Reports Submitted"
            value={impactData.reportsSubmitted.toString()}
            icon={MapPin}
          />
          <ImpactCard
            title="Tokens Earned"
            value={impactData.tokensEarned.toString()}
            icon={Coins}
          />
          <ImpactCard
            title="CO₂ Offset"
            value={`${impactData.co2Offset} kg`}
            icon={Leaf}
          />
        </div>
      </section>
    </div>
  );
}
