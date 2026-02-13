import type { Express } from "express";
import { type Server } from "http";
import { supabaseAdmin } from "./supabase-admin";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // API route to add password to Google-only account
  app.post("/api/auth/add-password", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Email and password are required"
        });
      }

      // Get user by email using getUserByEmail
      let existingUser;
      try {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) {
          console.error("Error listing users:", listError);
          return res.status(500).json({
            success: false,
            error: "Failed to check user status"
          });
        }

        existingUser = users?.find(u => u.email === email);
      } catch (err) {
        console.error("Error finding user:", err);
        return res.status(500).json({
          success: false,
          error: "Failed to find user"
        });
      }

      if (!existingUser) {
        console.log(`User with email ${email} not found`);
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      console.log(`Found user ${existingUser.id} with email ${email}`);
      console.log(`User providers:`, existingUser.app_metadata?.providers);
      console.log(`User identities:`, existingUser.identities?.map(i => i.provider));

      // Check providers from both app_metadata and identities
      const providersFromMeta = existingUser.app_metadata?.providers || [];
      const providersFromIdentities = existingUser.identities?.map((i: any) => i.provider) || [];

      // Combine both sources of provider information
      const allProviders = Array.from(new Set([...providersFromMeta, ...providersFromIdentities]));

      console.log(`All providers for user:`, allProviders);

      // Check if user has Google but not email
      const hasGoogle = allProviders.includes('google');
      const hasEmail = allProviders.includes('email');

      if (!hasGoogle) {
        console.log(`User does not have Google provider`);
        return res.status(400).json({
          success: false,
          error: "User doesn't have Google authentication"
        });
      }

      if (hasEmail) {
        console.log(`User already has email provider`);
        return res.status(400).json({
          success: false,
          error: "User already has email/password authentication"
        });
      }

      console.log(`User has Google-only authentication, adding password...`);

      // Step 1: Update user password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );

      if (updateError) {
        console.error("Error updating user password:", updateError);
        return res.status(500).json({
          success: false,
          error: `Failed to add password: ${updateError.message}`
        });
      }

      console.log(`Successfully added password for user ${existingUser.id}`);

      // Step 2: Add email identity to the user
      // This creates the actual identity record in auth.identities table
      const { error: identityError } = await supabaseAdmin.rpc('add_email_identity_to_user', {
        p_user_id: existingUser.id
      });

      if (identityError) {
        console.error("Error adding email identity:", identityError);
        // Don't fail the request - password is already set
        // The user can still log in with email/password
        console.log("Warning: Email identity not created, but password is set");
      } else {
        console.log(`Successfully added email identity for user ${existingUser.id}`);
      }

      return res.json({
        success: true,
        userId: existingUser.id
      });

    } catch (error: any) {
      console.error("Server error in add-password:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error"
      });
    }
  });

  return httpServer;
}
