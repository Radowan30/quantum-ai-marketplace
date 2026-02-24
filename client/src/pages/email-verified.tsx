import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Email Verification Landing Page
 *
 * Supabase redirects here after the user clicks the verification link in their
 * confirmation email (PKCE flow). The URL arrives with a `?code=` param which
 * the Supabase client exchanges for a session automatically. We immediately
 * sign the user back out so they are not auto-logged-in — they should close
 * this tab and log in normally from the auth page.
 */
export default function EmailVerifiedPage() {
  useEffect(() => {
    // Give Supabase ~800 ms to complete the PKCE code exchange, then sign out
    // so the user is not automatically logged in from this verification tab.
    const timer = setTimeout(async () => {
      await supabase.auth.signOut();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-6 text-center max-w-sm"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center"
        >
          <CheckCircle className="w-12 h-12 text-green-500" />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <h1 className="text-2xl font-heading font-bold mb-3">
            Email Verified!
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Your email has been verified. You can now close this tab.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
