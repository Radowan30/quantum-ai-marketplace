import { Layout } from "@/components/layout/Layout";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Target, Eye, Lightbulb, Users, Award, BookOpen } from "lucide-react";

export default function AboutPage() {
  // Reset scroll position to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const values = [
    {
      icon: Lightbulb,
      title: "Innovation",
      description:
        "We believe in pushing the boundaries of AI technology and making cutting-edge models accessible to everyone.",
    },
    {
      icon: Users,
      title: "Community",
      description:
        "We foster a collaborative ecosystem where AI researchers, developers, and businesses can thrive together.",
    },
    {
      icon: Award,
      title: "Excellence",
      description:
        "We strive for excellence in everything we do, from platform performance to customer support.",
    },
  ];

  return (
    <Layout type="public">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[500px] flex items-center pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-indigo-500/5" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl font-heading font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-700 to-indigo-600 pb-2">
              About Our Platform
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We're building the future of AI model integration, making powerful
              artificial intelligence accessible to developers and businesses
              worldwide.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-indigo-500/10 rounded-2xl p-8 md:p-12 border border-primary/20"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Target className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold">
                  Our Mission
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                To democratize access to cutting-edge AI models by creating a
                secure, reliable, and user-friendly marketplace that connects AI
                researchers with developers and businesses worldwide.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe that artificial intelligence should be accessible to
                everyone, not just large corporations with extensive resources.
                Our platform bridges the gap between AI innovation and practical
                application.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 relative overflow-hidden bg-black border-y border-white/10">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-purple-900/30 opacity-90 blur-xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        </div>
        <div className="container relative z-10 mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                  <Eye className="w-7 h-7 text-white" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
                Our Vision
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                A world where AI innovation drives progress for everyone
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Our Values
              </h2>
              <p className="text-lg text-muted-foreground">
                The principles that guide everything we do
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-4">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 relative overflow-hidden bg-black border-y border-white/10">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-purple-900/30 opacity-90 blur-xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        </div>
        <div className="container relative z-10 mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold">
                  Our Story
                </h2>
              </div>

              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  Founded in 2025, our AI marketplace emerged from a simple
                  observation: while AI technology was advancing rapidly,
                  accessing and integrating these innovations remained complex
                  and fragmented.
                </p>
                <p>
                  Our team of AI researchers and software engineers came
                  together with a shared vision of creating a platform that
                  would make AI models as easy to use as any other software
                  tool.
                </p>
              </div>

              <div className="mt-10 pt-8 border-t border-border">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 mb-2">
                      2025
                    </div>
                    <div className="text-sm text-muted-foreground">Founded</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 mb-2">
                      Global
                    </div>
                    <div className="text-sm text-muted-foreground">Reach</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 mb-2">
                      AI First
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Innovation
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </Layout>
  );
}
