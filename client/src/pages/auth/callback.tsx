import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * OAuth Callback Handler
 *
 * This page handles the redirect after Google OAuth login:
 * 1. User clicks "Sign in with Google" → Redirected to Google
 * 2. User approves → Google redirects back to THIS page
 * 3. We validate the session and set up the user's role
 * 4. Finally redirect to the appropriate dashboard
 */
export default function AuthCallback() {
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Step 1: Retrieve the authenticated session from Supabase
        // After OAuth, Supabase stores the session - we're just retrieving it
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.user) {
          // Step 2: Validation failed - no authenticated user found
          // Send them back to login page to try again
          window.location.href = '/auth';
          return;
        }

        // Step 3: Determine the user's role (buyer or publisher)
        // The role was selected BEFORE the OAuth redirect and stored in two places:
        // - URL parameter: ?role=buyer or ?role=publisher
        // - localStorage: as a backup in case URL params are lost
        const urlParams = new URLSearchParams(window.location.search);
        const roleFromUrl = urlParams.get('role') as 'buyer' | 'publisher' | null;
        const roleFromStorage = localStorage.getItem('currentRole') as 'buyer' | 'publisher' | null;
        const selectedRole = roleFromUrl || roleFromStorage || 'buyer'; // Fallback to buyer

        // Save role to localStorage for the authenticated session
        localStorage.setItem('currentRole', selectedRole);

        // Step 4: Look up the role ID in the database
        // We have the role name ('buyer' or 'publisher'), but need the UUID
        // to link it to the user in the user_roles table
        const { data: role, error: roleError } = await supabase
          .from('roles')
          .select('id')
          .eq('role_name', selectedRole)
          .single();

        if (roleError || !role) {
          toast({
            title: "Role configuration error",
            description: "Please contact support.",
            variant: "destructive",
          });
          window.location.href = '/auth';
          return;
        }

        // Step 5: Check if this user already has the role assigned
        // This prevents duplicate role assignments if they log in multiple times
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('role_id', role.id)
          .single();

        if (!existingRole) {
          // Step 6: First-time login - create user profile and assign role
          // We use an RPC (Remote Procedure Call = database function) instead of
          // multiple INSERT queries because it's atomic (all-or-nothing) and
          // handles any conflicts if the user was created simultaneously elsewhere
          console.log('Adding role for OAuth user');

          const { data: result, error: rpcError } = await supabase.rpc('create_user_with_role', {
            p_user_id: session.user.id,
            p_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            p_email: session.user.email || '',
            p_role_name: selectedRole
          });

          if (rpcError) {
            console.error('Error adding role for OAuth user:', rpcError);
            throw rpcError;
          }

          if (result && !result.success) {
            console.error('Function returned error for OAuth user:', result);
            throw new Error(result.error || 'Failed to add role');
          }

          toast({
            title: "Welcome!",
            description: `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} access has been set up for your account.`,
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "Successfully signed in with Google.",
          });
        }

        // Step 7: Redirect to the appropriate dashboard
        // We use window.location.href (hard navigation) instead of React Router
        // because it forces a full page reload, which:
        // 1. Ensures AuthContext re-initializes with the fresh session data
        // 2. Prevents "race conditions" where old React state conflicts with new auth state
        // 3. Clears any stale data from the previous session
        const targetPath = selectedRole === 'publisher' ? '/publisher/dashboard' : '/buyer/dashboard';
        window.location.href = targetPath;

      } catch (error: any) {
        console.error('OAuth callback error:', error);

        toast({
          title: "Authentication failed",
          description: error.message || "Unable to complete sign in. Please try again.",
          variant: "destructive",
        });
        window.location.href = '/auth';
      }
    };

    handleCallback();
  }, [toast]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary [stroke-width:1.5]" />
        <h2 className="text-xl font-semibold">Setting up your account...</h2>
        <p className="text-muted-foreground text-sm">Please wait while we complete your sign in.</p>
      </div>
    </div>
  );
}
