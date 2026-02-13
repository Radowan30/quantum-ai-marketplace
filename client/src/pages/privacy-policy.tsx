import { Layout } from "@/components/layout/Layout";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function PrivacyPolicyPage() {
  // Reset scroll position to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout type="public">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[400px] flex items-center pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-indigo-500/5" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl font-heading font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-700 to-indigo-600 pb-2">
              Privacy Policy
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-xl"
            >
              <p className="text-lg text-muted-foreground leading-relaxed">
                Content to be added.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </Layout>
  );
}
