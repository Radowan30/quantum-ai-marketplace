import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useEffect } from "react";
import {
  ArrowRight,
  Box,
  Cpu,
  Store,
  Download,
  Network,
  BarChart3,
  Globe,
  Upload,
} from "lucide-react";
import generatedImage from "@assets/generated_images/mimos_ai_marketplace_hero_background.png";

export default function Landing() {
  const [location] = useLocation();

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
    <Layout type="public">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[700px] flex items-center pt-20 pb-24">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={generatedImage}
            alt="MIMOS AI Marketplace"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        </div>

        <div className="container mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Malaysia's National AI Hub
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-700 to-indigo-600 pb-2">
              The Future of AI Model Integration
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
              Discover, deploy, and contribute to Malaysia's premier ecosystem
              of sovereign AI models. Bridging research and industry
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
            <div className="relative z-10 bg-white/5 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background/80 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">
                        MySejahtera Analytics
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Version 2.1.0 • Healthcare
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-green-600 font-bold">
                      98.5% Acc
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Updated 2h ago
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-background/80 rounded-xl border border-border shadow-sm opacity-80 scale-95 origin-top">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Box className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Bahasa Sentiment v1</h4>
                      <p className="text-xs text-muted-foreground">
                        NLP • Social Media
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-green-600 font-bold">
                      94.2% Acc
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl z-0" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl z-0" />
          </motion.div>
        </div>
      </section>

      {/* Powered by MIMOS */}
      <section className="py-16 border-y border-border/40 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6 text-center">
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
      <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50">
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
              Everything you need to discover, deploy, and monetize AI models
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {/* AI Model Marketplace */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl border-none bg-white dark:bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 text-center flex flex-col h-full min-h-[280px]"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <Store className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Model Marketplace</h3>
              <p className="text-muted-foreground leading-relaxed flex-grow">
                Discover and access cutting-edge AI models from leading
                publishers worldwide
              </p>
            </motion.div>

            {/* Direct Model Access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl border-none bg-white dark:bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 text-center flex flex-col h-full min-h-[280px]"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <Download className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Direct Model Access</h3>
              <p className="text-muted-foreground leading-relaxed flex-grow">
                Download and utilize AI models directly through our secure
                platform interface
              </p>
            </motion.div>

            {/* Publisher Network */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl border-none bg-white dark:bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 text-center flex flex-col h-full min-h-[280px]"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <Network className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Publisher Network</h3>
              <p className="text-muted-foreground leading-relaxed flex-grow">
                Connect with AI model publishers and monetize your innovations
              </p>
            </motion.div>

            {/* Analytics Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl border-none bg-white dark:bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 text-center flex flex-col h-full min-h-[280px]"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Analytics Dashboard</h3>
              <p className="text-muted-foreground leading-relaxed flex-grow">
                Track usage, performance, and revenue with detailed analytics
              </p>
            </motion.div>

            {/* Global Reach */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl border-none bg-white dark:bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 text-center flex flex-col h-full min-h-[280px]"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Global Reach</h3>
              <p className="text-muted-foreground leading-relaxed flex-grow">
                Access models from developers worldwide with multi-currency
                support
              </p>
            </motion.div>

            {/* Publish & Monetize */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl border-none bg-white dark:bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 text-center flex flex-col h-full min-h-[280px]"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Publish & Monetize</h3>
              <p className="text-muted-foreground leading-relaxed flex-grow">
                Upload your trained models, manage versions, and gain visibility
                within the national ecosystem
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-800 opacity-90"></div>
        </div>
        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-6">
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
