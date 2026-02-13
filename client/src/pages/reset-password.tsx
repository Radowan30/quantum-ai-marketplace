import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const verifyResetToken = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);

        // Check for error in URL (expired/invalid token)
        const errorCode = urlParams.get('error_code');

        if (errorCode === 'otp_expired') {
          toast({
            title: "Link Already Used or Expired",
            description: "This password reset link has already been used or has expired. Please request a new password reset link.",
            variant: "destructive",
          });
          setTimeout(() => setLocation('/auth'), 3000);
          return;
        }

        // Verify the token_hash from URL
        const tokenHash = urlParams.get('token_hash');
        const type = urlParams.get('type');

        if (tokenHash && type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: tokenHash,
          });

          if (error) {
            throw new Error('Invalid or expired reset link.');
          }

          // Clear URL parameters after successful verification
          window.history.replaceState({}, document.title, '/reset-password');
          setVerifying(false);
          return;
        }

        // Check if session already exists
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setVerifying(false);
        } else {
          throw new Error('No active session found.');
        }
      } catch (error: any) {
        toast({
          title: "Invalid or expired link",
          description: error.message || "Please request a new password reset link.",
          variant: "destructive",
        });
        setTimeout(() => setLocation('/auth'), 2000);
      }
    };

    verifyResetToken();
  }, [setLocation, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated!",
        description: "Your password has been successfully reset. You can now log in.",
      });

      // Redirect to login page
      setTimeout(() => {
        setLocation('/auth');
      }, 2000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Reset failed",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while verifying the reset link
  if (verifying) {
    return (
      <Layout type="public">
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-secondary/20">
          <Card className="w-full max-w-md shadow-xl border-border/50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Verifying reset link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout type="public">
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-secondary/20">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-md mb-2">
              <span className="text-primary-foreground font-bold text-xl">M</span>
            </div>
            <CardTitle className="text-2xl font-heading">Reset Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting password..." : "Reset Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
