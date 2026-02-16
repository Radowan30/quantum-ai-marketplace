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
import { WaveBackground } from "@/components/effects/WaveBackground";
import { CircuitOverlay } from "@/components/effects/CircuitOverlay";

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
        {/* Quantum Wave Background */}
        <WaveBackground intensity="medium" />

        {/* Circuit Overlay */}
        <CircuitOverlay opacity={0.15} animated={true} />

        <div className="container mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7855DD]/10 border border-[#7855DD]/20 text-[#7855DD] text-sm font-medium mb-6">
              Malaysia's Quantum AI Hub
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#7855DD] via-[#4F46E5] to-[#7855DD] pb-2 animate-gradient quantum-glow-sm">
              Discover the Future of Quantum AI Models
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed max-w-xl">
              Access cutting-edge quantum-enhanced AI models. Deploy, collaborate,
              and innovate on Malaysia's premier quantum AI platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg rounded-full bg-[#7855DD] hover:bg-[#7855DD]/90 shadow-lg shadow-[#7855DD]/20 hover:shadow-xl hover:shadow-[#7855DD]/40 transition-all hover:scale-105"
                >
                  Explore Quantum Models
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg rounded-full border-2 border-[#7855DD]/40 hover:bg-[#7855DD]/10 hover:border-[#7855DD] transition-all"
                >
                  Learn More
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
            {/* Quantum Model Cards Showcase */}
            <div className="relative z-10 glass-quantum border border-[#7855DD]/20 p-6 rounded-2xl shadow-2xl quantum-border-glow">
              <div className="space-y-4">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center justify-between p-4 bg-[#0A0A0F]/80 backdrop-blur-sm rounded-xl border border-[#7855DD]/30 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#7855DD]/20 border border-[#A78BFA]/30 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-[#A78BFA]" style={{ filter: 'drop-shadow(0 0 4px #A78BFA)' }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        Quantum Neural Network
                      </h4>
                      <p className="text-xs text-gray-400">
                        Version 2.1.0 • Quantum ML
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-[#60A5FA] font-bold">
                      99.2% Acc
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Updated 1h ago
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="flex items-center justify-between p-4 bg-[#0A0A0F]/80 backdrop-blur-sm rounded-xl border border-[#7855DD]/30 shadow-sm opacity-80 scale-95 origin-top"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#4F46E5]/20 border border-[#4F46E5]/30 flex items-center justify-center">
                      <Box className="w-5 h-5 text-[#4F46E5]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Quantum Sentiment v3</h4>
                      <p className="text-xs text-gray-400">
                        NLP • Quantum Processing
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-[#60A5FA] font-bold">
                      96.8% Acc
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Decorative quantum gradient orbs */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 w-64 h-64 bg-[#7855DD]/20 rounded-full blur-3xl z-0"
            />
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#60A5FA]/10 rounded-full blur-3xl z-0"
            />
          </motion.div>
        </div>
      </section>

      {/* Powered by MIMOS */}
      <section className="py-16 border-y border-[#7855DD]/20 bg-[#1A1625]/30 relative">
        {/* Subtle circuit background */}
        <CircuitOverlay opacity={0.05} animated={false} />

        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-8">
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
                style={{ filter: 'drop-shadow(0 0 20px rgba(120, 85, 221, 0.3))' }}
              />
            </motion.div>
            <p className="max-w-3xl text-gray-300 text-sm leading-relaxed">
              MIMOS is Malaysia's national Applied Research and Development
              Centre that contributes to socio-economic growth through
              innovative technology platforms.
            </p>
          </div>
        </div>
      </section>

      {/* Powerful Quantum Features Section */}
      <section id="features" className="py-24 bg-[#0A0A0F]/50 relative">
        {/* Subtle circuit grid background */}
        <CircuitOverlay opacity={0.05} animated={false} />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-white">
              Powerful <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7855DD] to-[#4F46E5]">Quantum</span> Features
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Everything you need to discover, deploy, and monetize quantum AI models
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {/* Quantum AI Marketplace */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl glass-quantum border border-[#7855DD]/20 shadow-lg hover:shadow-xl hover:shadow-[#7855DD]/20 hover:glass-quantum-hover hover:border-[#7855DD]/40 hover:scale-[1.02] transition-all duration-300 text-center flex flex-col h-full min-h-[280px]"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#7855DD]/15 border border-[#7855DD]/30 flex items-center justify-center mb-6 text-[#7855DD] group-hover:bg-[#7855DD]/25 transition-all">
                <Store className="w-7 h-7" style={{ filter: 'drop-shadow(0 0 6px rgba(120, 85, 221, 0.4))' }} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Quantum AI Marketplace</h3>
              <p className="text-gray-300 leading-relaxed flex-grow">
                Discover and access cutting-edge quantum-enhanced AI models from leading
                researchers worldwide
              </p>
            </motion.div>

            {/* Quantum Model Access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl glass-quantum border border-[#7855DD]/20 shadow-lg hover:shadow-xl hover:shadow-[#7855DD]/20 hover:glass-quantum-hover hover:border-[#7855DD]/40 hover:scale-[1.02] transition-all duration-300 text-center flex flex-col h-full min-h-[280px]"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#7855DD]/15 border border-[#7855DD]/30 flex items-center justify-center mb-6 text-[#7855DD] group-hover:bg-[#7855DD]/25 transition-all">
                <Download className="w-7 h-7" style={{ filter: 'drop-shadow(0 0 6px rgba(120, 85, 221, 0.4))' }} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Quantum Model Access</h3>
              <p className="text-gray-300 leading-relaxed flex-grow">
                Download and utilize quantum AI models directly through our secure
                platform interface
              </p>
            </motion.div>

            {/* Publisher Network */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl glass-quantum border border-[#7855DD]/20 shadow-lg hover:shadow-xl hover:shadow-[#7855DD]/20 hover:glass-quantum-hover hover:border-[#7855DD]/40 hover:scale-[1.02] transition-all duration-300 text-center flex flex-col h-full min-h-[280px]"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#7855DD]/15 border border-[#7855DD]/30 flex items-center justify-center mb-6 text-[#7855DD] group-hover:bg-[#7855DD]/25 transition-all">
                <Network className="w-7 h-7" style={{ filter: 'drop-shadow(0 0 6px rgba(120, 85, 221, 0.4))' }} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Publisher Network</h3>
              <p className="text-gray-300 leading-relaxed flex-grow">
                Connect with quantum AI model publishers and monetize your innovations
              </p>
            </motion.div>

            {/* Analytics Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl glass-quantum border border-[#7855DD]/20 shadow-lg hover:shadow-xl hover:shadow-[#7855DD]/20 hover:glass-quantum-hover hover:border-[#7855DD]/40 hover:scale-[1.02] transition-all duration-300 text-center flex flex-col h-full min-h-[280px]"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#7855DD]/15 border border-[#7855DD]/30 flex items-center justify-center mb-6 text-[#7855DD] group-hover:bg-[#7855DD]/25 transition-all">
                <BarChart3 className="w-7 h-7" style={{ filter: 'drop-shadow(0 0 6px rgba(120, 85, 221, 0.4))' }} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Analytics Dashboard</h3>
              <p className="text-gray-300 leading-relaxed flex-grow">
                Track usage, performance, and revenue with detailed analytics
              </p>
            </motion.div>

            {/* Global Reach */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl glass-quantum border border-[#7855DD]/20 shadow-lg hover:shadow-xl hover:shadow-[#7855DD]/20 hover:glass-quantum-hover hover:border-[#7855DD]/40 hover:scale-[1.02] transition-all duration-300 text-center flex flex-col h-full min-h-[280px]"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#7855DD]/15 border border-[#7855DD]/30 flex items-center justify-center mb-6 text-[#7855DD] group-hover:bg-[#7855DD]/25 transition-all">
                <Globe className="w-7 h-7" style={{ filter: 'drop-shadow(0 0 6px rgba(120, 85, 221, 0.4))' }} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Global Reach</h3>
              <p className="text-gray-300 leading-relaxed flex-grow">
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
              className="group p-8 rounded-2xl glass-quantum border border-[#7855DD]/20 shadow-lg hover:shadow-xl hover:shadow-[#7855DD]/20 hover:glass-quantum-hover hover:border-[#7855DD]/40 hover:scale-[1.02] transition-all duration-300 text-center flex flex-col h-full min-h-[280px]"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#7855DD]/15 border border-[#7855DD]/30 flex items-center justify-center mb-6 text-[#7855DD] group-hover:bg-[#7855DD]/25 transition-all">
                <Upload className="w-7 h-7" style={{ filter: 'drop-shadow(0 0 6px rgba(120, 85, 221, 0.4))' }} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Publish & Monetize</h3>
              <p className="text-gray-300 leading-relaxed flex-grow">
                Upload your quantum AI models, manage versions, and gain visibility
                within the national ecosystem
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Bold quantum gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#7855DD] via-[#4F46E5] to-[#7855DD] z-0">
          {/* Animated wave overlay */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(circle at 30% 50%, #4F46E5 0%, transparent 50%),
                radial-gradient(circle at 70% 50%, #7855DD 0%, transparent 50%)
              `,
              filter: "blur(60px)",
            }}
            animate={{
              x: [-50, 50, -50],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Circuit accent lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#A78BFA] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#A78BFA] to-transparent" />

        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-6" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              Ready to Enter the Quantum AI Era?
            </h2>
            <p className="text-purple-100 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Join the future of AI innovation. Access cutting-edge quantum models and
              transform your applications today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth?mode=register&tab=buyer">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg font-bold bg-white text-[#7855DD] hover:bg-white/90 shadow-lg hover:shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all"
                >
                  Get Started
                </Button>
              </Link>
              <Link href="/auth">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg border-2 border-white/30 text-white bg-transparent hover:bg-white/10 hover:border-white hover:text-white transition-all"
                >
                  Explore Models
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
