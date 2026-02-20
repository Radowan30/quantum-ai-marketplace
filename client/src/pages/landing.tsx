import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Store,
  Download,
  Network,
  BarChart3,
  Globe,
  Upload,
  Atom,
  Zap,
} from "lucide-react";
import { HolographicCard } from "@/components/ui/HolographicCard";
import { SpotlightText } from "@/components/ui/SpotlightText";

export default function Landing() {
  const [location] = useLocation();

  const [videoLoaded, setVideoLoaded] = useState(false);

  // Handle hash navigation (e.g., /#features)
  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          // Small delay to ensure page is fully rendered
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    // Run on mount and when hash changes
    handleHashNavigation();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashNavigation);

    return () => {
      window.removeEventListener("hashchange", handleHashNavigation);
    };
  }, [location]); // Re-run when location (pathname) changes

  return (
    <Layout type="public" showBackground={false}>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[700px] flex items-center pt-20 pb-24">
        {/* Background Image with Overlay */}
        {/* Quantum Background with Overlay */}
        {/* Video Background with Overlay */}
        <div className="absolute inset-0 z-0 bg-black">
          <video
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              videoLoaded ? "opacity-60" : "opacity-0"
            }`}
          >
            <source src="/hero_background_vid.mp4" type="video/mp4" />
          </video>
          {/* Gradient Overlay for Text Readability (Left) */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/50 to-transparent"></div>
          {/* Gradient Overlay for Vignette (Right) */}
          <div className="absolute inset-0 bg-gradient-to-l from-background/80 via-background/20 to-transparent"></div>
          {/* Radial Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/20 to-background opacity-50"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6 backdrop-blur-sm neon-border">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              Malaysia's National Quantum AI Hub
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-bold leading-tight mb-6 pb-2 cursor-default">
              <SpotlightText className="block leading-tight" spotlightColor="rgba(139, 92, 246, 1)">
                <span className="block neon-text">The Quantum Leap in</span>
                <span className="block neon-text">AI Model Integration</span>
              </SpotlightText>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
              Discover, deploy, and contribute to Malaysia's premier ecosystem
              of sovereign Quantum-Ready AI models. Bridging research and industry
              implementation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg rounded-full border-2 hover:bg-secondary/50 transition-all"
                >
                  Explore Features
                </Button>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden md:block relative"
          >
            {/* Visual Abstract Elements */}
            <HolographicCard className="p-6 neon-border bg-black/40" spotlightColor="rgba(139, 92, 246, 0.15)">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/60 rounded-xl border border-white/10 shadow-sm backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                      <Atom className="w-5 h-5 text-accent animate-spin-slow" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        Q-Optimized Logistics
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Quantum Annealing • Supply Chain
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-accent font-bold drop-shadow-md">
                      99.9% Opt
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Updated 10m ago
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-black/60 rounded-xl border border-white/10 shadow-sm opacity-90 scale-95 origin-top backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center border border-blue-500/30">
                      <Zap className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Bahasa Sentiment Q1</h4>
                      <p className="text-xs text-muted-foreground">
                        Hybrid NLP • Social Media
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-blue-400 font-bold">
                      98.2% Acc
                    </p>
                  </div>
                </div>
              </div>
            </HolographicCard>

            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/30 rounded-full blur-[100px] z-0 animate-pulse pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-accent/20 rounded-full blur-[100px] z-0 pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* Powered by MIMOS */}
      <section className="py-16 relative overflow-hidden bg-black border-y border-white/10">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-purple-900/30 opacity-90 blur-xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        </div>
        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8">
            Powered by MIMOS Berhad
          </p>
          <div className="flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <img
                src="/MIMOSlogo.png"
                alt="MIMOS Logo"
                className="h-24 w-auto md:h-28 lg:h-32 object-contain hover:scale-105 transition-transform duration-300"
              />
            </motion.div>
            <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
              MIMOS is Malaysia's national Applied Research and Development
              Centre that contributes to socio-economic growth through
              innovative technology platforms.
            </p>
          </div>
        </div>
      </section>

      {/* Powerful Features Section */}
      <section id="features" className="py-24 bg-black relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-primary/5 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/15 rounded-full blur-[200px] pointer-events-none"></div>
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-foreground">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to discover, deploy, and monetize Quantum-Ready AI models
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {/* AI Model Marketplace */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <HolographicCard className="p-8 h-full flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Store className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Quantum Model Marketplace</h3>
                <p className="text-muted-foreground leading-relaxed flex-grow">
                  Discover and access cutting-edge Quantum and Hybrid AI models from leading
                  publishers worldwide
                </p>
              </HolographicCard>
            </motion.div>

            {/* Direct Model Access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <HolographicCard className="p-8 h-full flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Download className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Instant Quantum Access</h3>
                <p className="text-muted-foreground leading-relaxed flex-grow">
                  Download and utilize Q-optimized models directly through our secure
                  platform interface
                </p>
              </HolographicCard>
            </motion.div>

            {/* Publisher Network */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <HolographicCard className="p-8 h-full flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Network className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Publisher Network</h3>
                <p className="text-muted-foreground leading-relaxed flex-grow">
                  Connect with AI model publishers and monetize your innovations
                </p>
              </HolographicCard>
            </motion.div>

            {/* Analytics Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <HolographicCard className="p-8 h-full flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Analytics Dashboard</h3>
                <p className="text-muted-foreground leading-relaxed flex-grow">
                  Track usage, performance, and revenue with detailed analytics
                </p>
              </HolographicCard>
            </motion.div>

            {/* Global Reach */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <HolographicCard className="p-8 h-full flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Global Reach</h3>
                <p className="text-muted-foreground leading-relaxed flex-grow">
                  Access models from developers worldwide with multi-currency
                  support
                </p>
              </HolographicCard>
            </motion.div>

            {/* Publish & Monetize */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <HolographicCard className="p-8 h-full flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Publish & Monetize</h3>
                <p className="text-muted-foreground leading-relaxed flex-grow">
                  Upload your quantum algorithms, manage versions, and gain visibility
                  within the national ecosystem
                </p>
              </HolographicCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden bg-black border-t border-white/10">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-purple-900/30 opacity-90 blur-xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        </div>
        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-6 neon-text">
              Ready to Transform Your AI Journey?
            </h2>
            <p className="text-purple-100 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Join thousands of developers and start integrating powerful AI
              models today with our platform
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth?mode=register&tab=buyer">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-14 px-8 text-lg font-bold shadow-lg hover:scale-105 transition-all"
                >
                  Create Account
                </Button>
              </Link>
              <Link href="/auth">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg border-2 border-white/30 text-white hover:bg-white/10 hover:text-white"
                >
                  Login to Browse
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </Layout>
  );
}
