import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Download,
  MessageSquare,
  Star,
  Lock,
  Activity,
  FileText,
  Unlock,
  Eye,
  Users,
  TrendingUp,
  BarChart,
  Mail,
  ExternalLink,
  Loader2,
  Reply,
  Info,
  Trash2,
  ArrowLeftRight,
} from "lucide-react";
import { useRoute } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  fetchModelFiles,
  downloadFile,
  formatFileSize,
} from "@/lib/file-upload";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity-logger";
import { ApiSpecRenderer } from "@/components/ApiSpecRenderer";
import { fetchModelById } from "@/lib/api";
import {
  triggerSubscriptionNotifications,
  triggerNewDiscussionNotification,
  triggerNewCommentNotification,
  triggerNewRatingNotification,
} from "@/lib/notification-triggers";
import { formatCount } from "@/lib/format-utils";
import { Category, Comment, Model } from "@/lib/types";

export default function ModelDetailsPage() {
  const [, params] = useRoute("/model/:id");
  const modelId = params?.id;
  const { toast } = useToast();
  const { user, userProfile, currentRole } = useAuth();

  // Model state
  const [model, setModel] = useState<Model | null>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [showTotalViews, setShowTotalViews] = useState(true);

  // Discussions state
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(true);
  const [displayedDiscussionsCount, setDisplayedDiscussionsCount] = useState(5);
  const [visibleCommentsPerDiscussion, setVisibleCommentsPerDiscussion] =
    useState<{ [key: string]: number }>({});

  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "none" | "active"
  >("none");
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [unsubscribeDialogOpen, setUnsubscribeDialogOpen] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Discussion modal state
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [discussionTitle, setDiscussionTitle] = useState("");
  const [discussionContent, setDiscussionContent] = useState("");
  const [submittingDiscussion, setSubmittingDiscussion] = useState(false);

  // Comment state - track which discussion has active comment form
  const [activeCommentForm, setActiveCommentForm] = useState<string | null>(
    null,
  );
  const [commentContent, setCommentContent] = useState<{
    [key: string]: string;
  }>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(
    null,
  );

  // Reply mode state - track which comment is being replied to
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    discussionId: string;
    userId: string;
    userName: string;
  } | null>(null);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "discussion" | "comment";
    id: string;
    discussionId?: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Files state
  const [modelFiles, setModelFiles] = useState<any[]>([]);
  const [hasFileAccess, setHasFileAccess] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(
    null,
  );

  // Direct collaborator status (bypasses model.collaborators join issues)
  const [isUserCollaborator, setIsUserCollaborator] = useState(false);

  // Fetch model data
  useEffect(() => {
    const loadModel = async () => {
      if (!modelId) return;

      try {
        setLoadingModel(true);
        const modelData = await fetchModelById(modelId);
        setModel(modelData);
      } catch (error) {
        console.error("Error loading model:", error);
        toast({
          title: "Error",
          description: "Failed to load model details.",
          variant: "destructive",
        });
      } finally {
        setLoadingModel(false);
      }
    };

    loadModel();
  }, [modelId, toast]);

  // Refresh model data (pessimistic updates)
  const refreshModel = async () => {
    if (!modelId) return;

    try {
      const updatedModel = await fetchModelById(modelId);
      setModel(updatedModel);
    } catch (error: any) {
      console.error("Error refreshing model:", error);
      // Silent fail - don't show error to user, just log it
    }
  };

  // Check subscription status from database
  useEffect(() => {
    const checkSubscription = async () => {
      if (!modelId || !user) {
        setSubscriptionStatus("none");
        setCheckingSubscription(false);
        return;
      }

      try {
        setCheckingSubscription(true);

        const { data, error } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("model_id", modelId)
          .eq("buyer_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data && data.status === "active") {
          setSubscriptionStatus("active");
        } else {
          setSubscriptionStatus("none");
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setSubscriptionStatus("none");
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [modelId, user]);

  // Direct collaborator check - queries collaborators table directly
  // This bypasses any RLS issues with the model.collaborators join
  useEffect(() => {
    const checkCollaboratorStatus = async () => {
      if (!modelId || !user || currentRole !== "publisher") {
        setIsUserCollaborator(false);
        return;
      }

      // Get user email (prefer userProfile, fallback to user.email)
      const userEmail = (userProfile?.email || user?.email || "")
        .toLowerCase()
        .trim();
      if (!userEmail) {
        console.log("[Collaborator Check] No user email available");
        setIsUserCollaborator(false);
        return;
      }

      try {
        // Direct query to collaborators table
        const { data: collabData, error: collabError } = await supabase
          .from("collaborators")
          .select("email, name")
          .eq("model_id", modelId)
          .ilike("email", userEmail);

        if (collabError) {
          console.error("[Collaborator Check] Query error:", collabError);
          setIsUserCollaborator(false);
        } else {
          const isCollab = collabData && collabData.length > 0;
          console.log("[Collaborator Check] User email:", userEmail);
          console.log("[Collaborator Check] Query result:", collabData);
          console.log("[Collaborator Check] Is collaborator:", isCollab);
          setIsUserCollaborator(isCollab);
        }
      } catch (error) {
        console.error("[Collaborator Check] Error:", error);
        setIsUserCollaborator(false);
      }
    };

    checkCollaboratorStatus();
  }, [modelId, user, userProfile, currentRole]);

  // Check file access and load files based on subscription status
  useEffect(() => {
    const checkAccessAndLoadFiles = async () => {
      // Wait for model to load
      if (!modelId || !model) {
        setLoadingFiles(false);
        return;
      }

      setLoadingFiles(true);

      // CRITICAL ACCESS CONTROL:
      // File access is ONLY granted to buyers with active subscriptions
      // Publishers should NOT have access on the public model details page

      if (!user) {
        // Not logged in = no access
        setHasFileAccess(false);
        setModelFiles([]);
        setLoadingFiles(false);
        return;
      }

      // Check current user's ROLE (not their ID)
      // Publishers (by role) cannot download files UNLESS they own the model
      // This allows publishers to access their own model files
      let userHasAccess = false;

      if (currentRole === "publisher") {
        const isOwner = model?.publisherId === user.id;
        // Use isUserCollaborator state (from direct query) instead of model.collaborators
        // This bypasses any RLS/join issues with model.collaborators
        const isCollab = isUserCollaborator;

        console.log("[File Access] Is owner:", isOwner);
        console.log("[File Access] Is collaborator (direct check):", isCollab);

        if (!isOwner && !isCollab) {
          setHasFileAccess(false);
          setModelFiles([]);
          setLoadingFiles(false);
          return;
        }
        // Publisher is the owner OR collaborator - grant access
        userHasAccess = true;
        setHasFileAccess(true);
      } else {
        // For non-publishers (buyers), use subscriptionStatus state
        // subscriptionStatus is already fetched by the subscription check useEffect
        const hasActiveSubscription = subscriptionStatus === "active";
        userHasAccess = hasActiveSubscription;
        setHasFileAccess(hasActiveSubscription);
      }

      // Fetch files only if user has access
      if (userHasAccess) {
        try {
          const files = await fetchModelFiles(modelId);
          setModelFiles(files);
        } catch (fileError: any) {
          console.error("Error loading files:", fileError);
          // Don't revoke access if file fetch fails, but clear files
          setModelFiles([]);
          toast({
            title: "Error loading file list",
            description: "Could not load files, but you have access.",
            variant: "destructive",
          });
        }
      } else {
        // No access = clear files
        setModelFiles([]);
      }

      setLoadingFiles(false);
    };

    checkAccessAndLoadFiles();
  }, [
    modelId,
    user,
    model,
    subscriptionStatus,
    isUserCollaborator,
    currentRole,
  ]);

  // Track page view
  useEffect(() => {
    const trackView = async () => {
      if (!modelId || !model) return;

      try {
        // Only track views when user is in buyer mode
        if (currentRole !== "buyer") {
          console.log("View not tracked: User is not in buyer mode");
          return;
        }

        // Check if this user has already viewed this model (in database, not just session)
        if (user) {
          const { data: existingView, error: checkError } = await supabase
            .from("views")
            .select("id")
            .eq("model_id", modelId)
            .eq("user_id", user.id)
            .single();

          if (checkError && checkError.code !== "PGRST116") {
            // PGRST116 = no rows found, which is fine
            console.error("Error checking existing view:", checkError);
          }

          if (existingView) {
            console.log("View not tracked: User has already viewed this model");
            return;
          }
        }

        // Track view in database
        const { error: viewError } = await supabase.from("views").insert({
          model_id: modelId,
          user_id: user?.id || null,
          timestamp: new Date().toISOString(),
        });

        if (viewError) {
          console.error("Error tracking view:", viewError);
          // Don't show error to user, just log it
          return;
        }

        console.log("View tracked successfully for model:", modelId);
      } catch (error) {
        console.error("Error in view tracking:", error);
      }
    };

    trackView();
  }, [modelId, user, model, currentRole]);

  // Fetch discussions
  useEffect(() => {
    const loadDiscussions = async () => {
      if (!modelId) return;

      try {
        setLoadingDiscussions(true);
        const { data, error } = await supabase
          .from("discussions")
          .select(
            `
            *,
            comments (
              id,
              discussion_id,
              content,
              created_at,
              user_id,
              user_name,
              parent_comment_id,
              recipient_user_id,
              recipient_user_name
            )
          `,
          )
          .eq("model_id", modelId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Transform to expected format
        const transformedDiscussions =
          data?.map((disc) => ({
            id: disc.id,
            modelId: disc.model_id,
            userId: disc.user_id,
            userName: disc.user_name || "Unknown User",
            title: disc.title,
            content: disc.content,
            date: new Date(disc.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            replies:
              disc.comments?.map((reply: any) => ({
                id: reply.id,
                modelId: modelId,
                userId: reply.user_id,
                userName: reply.user_name || "Unknown User",
                content: reply.content,
                date: new Date(reply.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
                parentCommentId: reply.parent_comment_id,
                recipientUserId: reply.recipient_user_id,
                recipientUserName: reply.recipient_user_name,
              })) || [],
          })) || [];

        setDiscussions(transformedDiscussions);
      } catch (error: any) {
        console.error("Error loading discussions:", error);
        console.error("Error details:", {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
        });
      } finally {
        setLoadingDiscussions(false);
      }
    };

    loadDiscussions();
  }, [modelId]);

  if (!model)
    return (
      <div className="min-h-screen flex items-center justify-center">
        {loadingModel ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-12 w-12 animate-spin text-primary [stroke-width:1.5]" />
            <p className="text-muted-foreground">Loading model details...</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground">Model not found</p>
          </div>
        )}
      </div>
    );

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe.",
        variant: "destructive",
      });
      return;
    }

    if (model.price === "free") {
      try {
        // First check if a subscription already exists
        const { data: existingSub, error: checkError } = await supabase
          .from("subscriptions")
          .select("id, status")
          .eq("buyer_id", user.id)
          .eq("model_id", modelId)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingSub) {
          if (existingSub.status === "active") {
            // Already active subscription
            toast({
              title: "Already Subscribed",
              description: "You are already subscribed to this model.",
              variant: "default",
            });
            setSubscriptionStatus("active");
            return;
          } else {
            // Reactivate cancelled subscription
            const { error: updateError } = await supabase
              .from("subscriptions")
              .update({
                status: "active",
                cancelled_at: null,
              })
              .eq("id", existingSub.id);

            if (updateError) throw updateError;

            toast({
              title: `Resubscribed to ${model.name}!`,
              description: "Your subscription has been reactivated.",
            });
          }
        } else {
          // Create new subscription
          const { error: insertError } = await supabase
            .from("subscriptions")
            .insert({
              buyer_id: user.id,
              model_id: modelId,
              status: "active",
            });

          if (insertError) throw insertError;

          toast({
            title: `Successfully subscribed to ${model.name}!`,
            description:
              "You now have access to model files and documentation.",
          });
        }

        // Update local state - file access useEffect will handle the rest
        setSubscriptionStatus("active");

        // Create notifications for publisher(s) and buyer
        await triggerSubscriptionNotifications({
          modelId: modelId!,
          modelName: model.name,
          publisherId: model.publisherId,
          buyerId: user.id,
          buyerName: userProfile?.name || user.email || "User",
          buyerEmail: userProfile?.email || user.email || "",
        });

        // Log activity
        await logActivity({
          userId: user.id,
          activityType: "subscribed",
          title: `Subscribed to ${model.name}`,
          description: "Free subscription",
          modelId: modelId,
          modelName: model.name,
          role: currentRole as "buyer" | "publisher",
        });

        // Refresh model stats
        await refreshModel();
      } catch (error) {
        console.error("Error subscribing:", error);
        toast({
          title: "Subscription Failed",
          description: "Failed to create subscription. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Paid model - show unavailable message
      toast({
        title: "Paid Subscription Unavailable",
        description: "Payment method coming soon.",
        variant: "default",
      });
    }
  };

  // Open unsubscribe dialog
  const handleUnsubscribeClick = () => {
    setUnsubscribeDialogOpen(true);
  };

  // Handle unsubscribe confirmation
  const handleUnsubscribeConfirm = async () => {
    if (!user || !modelId) return;

    try {
      // Find the subscription
      const { data: subscription, error: findError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("model_id", modelId)
        .eq("buyer_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (findError) throw findError;

      if (!subscription) {
        toast({
          title: "Not Subscribed",
          description: "You are not currently subscribed to this model.",
          variant: "destructive",
        });
        return;
      }

      // Cancel the subscription
      const { error: cancelError } = await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

      if (cancelError) throw cancelError;

      // Update local state - file access useEffect will handle the rest
      setSubscriptionStatus("none");

      // Log activity
      await logActivity({
        userId: user.id,
        activityType: "unsubscribed",
        title: `Unsubscribed from ${model.name}`,
        description: "Cancelled subscription",
        modelId: modelId,
        modelName: model.name,
        role: currentRole as "buyer" | "publisher",
      });

      // Refresh model stats
      await refreshModel();

      toast({
        title: "Successfully Unsubscribed",
        description: `You have unsubscribed from ${model.name}.`,
      });
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast({
        title: "Unsubscribe Failed",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUnsubscribeDialogOpen(false);
    }
  };

  // Handle delete discussion or comment
  const handleDeleteClick = (
    type: "discussion" | "comment",
    id: string,
    discussionId?: string,
  ) => {
    setDeleteTarget({ type, id, discussionId });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      if (deleteTarget.type === "discussion") {
        // Delete entire discussion (cascade will delete all comments)
        const { error } = await supabase
          .from("discussions")
          .delete()
          .eq("id", deleteTarget.id);

        if (error) throw error;

        // Remove from local state
        setDiscussions((prev) => prev.filter((d) => d.id !== deleteTarget.id));

        // Refresh model stats
        await refreshModel();

        toast({
          title: "Discussion Deleted",
          description: "The discussion and all its comments have been removed.",
        });
      } else {
        // Delete individual comment
        const { error } = await supabase
          .from("comments")
          .delete()
          .eq("id", deleteTarget.id);

        if (error) throw error;

        // Remove from local state
        setDiscussions((prev) =>
          prev.map((d) => {
            if (d.id === deleteTarget.discussionId) {
              return {
                ...d,
                replies:
                  d.replies?.filter((r: any) => r.id !== deleteTarget.id) || [],
              };
            }
            return d;
          }),
        );

        toast({
          title: "Comment Deleted",
          description: "The comment has been removed.",
        });
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const isPublisher = currentRole === "publisher";
  const isModelOwner = model?.publisherId === user?.id;
  // Use isUserCollaborator state (from direct DB query) instead of model.collaborators
  // This ensures collaborator detection works even if the join has RLS issues
  const isCollaborator =
    currentRole === "publisher" && isUserCollaborator && !isModelOwner;

  const handleBack = () => {
    window.history.back();
  };

  const handleDownloadFile = async (file: any) => {
    if (!modelId || !user) return;

    try {
      setDownloadingFileId(file.id);

      // Download file with signed URL (includes collaborator access check)
      await downloadFile(
        file.id,
        file.file_path,
        file.file_name,
        modelId,
        user?.id || null,
        userProfile?.email || user?.email || null,
        currentRole,
      );

      // Log download activity
      await logActivity({
        userId: user.id,
        activityType: "downloaded",
        title: `Downloaded file from ${model.name}`,
        description: `File: ${file.file_name}`,
        modelId: modelId,
        modelName: model.name,
        role: currentRole as "buyer" | "publisher",
        metadata: {
          fileName: file.file_name,
          fileSize: file.file_size,
          fileType: "upload",
        },
      });

      // Refresh model stats
      await refreshModel();

      toast({
        title: "Download Started",
        description: `Downloading ${file.file_name}...`,
      });
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleRatingSubmit = async () => {
    if (selectedRating === 0) {
      toast({
        title: "Select a Rating",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to rate models.",
        variant: "destructive",
      });
      return;
    }

    if (submittingRating) return; // Prevent double submission

    try {
      setSubmittingRating(true);

      // Store old rating for comparison
      const oldAverageRating = model.averageRating || 0;

      // Upsert rating (insert or update if exists)
      const { error: ratingError } = await supabase.from("ratings").upsert(
        {
          model_id: modelId,
          user_id: user.id,
          rating_value: selectedRating,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "model_id,user_id",
        },
      );

      if (ratingError) throw ratingError;

      // Fetch all ratings for this model to recalculate average
      const { data: allRatings, error: fetchError } = await supabase
        .from("ratings")
        .select("rating_value")
        .eq("model_id", modelId);

      if (fetchError) throw fetchError;

      // Calculate new average
      const totalRatings = allRatings?.length || 0;
      const sumRatings =
        allRatings?.reduce((sum, r) => sum + r.rating_value, 0) || 0;
      const newAverageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

      // Update model with new average rating
      const { error: updateError } = await supabase
        .from("models")
        .update({
          average_rating: newAverageRating,
          total_rating_count: totalRatings,
        })
        .eq("id", modelId);

      if (updateError) throw updateError;

      // Create notification for publisher(s)
      await triggerNewRatingNotification({
        modelId: modelId!,
        modelName: model.name,
        publisherId: model.publisherId,
        raterName: userProfile?.name || user.email || "User",
        raterId: user.id,
        rating: selectedRating,
      });

      // Log activity
      await logActivity({
        userId: user.id,
        activityType: "rated",
        title: `Rated ${model.name}`,
        description: `Gave ${selectedRating} star${
          selectedRating !== 1 ? "s" : ""
        }`,
        modelId: modelId,
        modelName: model.name,
        role: currentRole as "buyer" | "publisher",
        metadata: {
          rating: selectedRating,
          oldAverage: oldAverageRating,
          newAverage: newAverageRating,
        },
      });

      // Refresh model stats
      await refreshModel();

      toast({
        title: "Rating Submitted",
        description: `You rated this model ${selectedRating} out of 5 stars.`,
      });

      setShowRatingModal(false);
      setSelectedRating(0);
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        title: "Rating Failed",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleCreateDiscussion = async () => {
    if (!discussionTitle.trim() || !discussionContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and description.",
        variant: "destructive",
      });
      return;
    }

    if (discussionTitle.length > 100) {
      toast({
        title: "Title Too Long",
        description: "Title must be 100 characters or less.",
        variant: "destructive",
      });
      return;
    }

    if (discussionContent.length > 2000) {
      toast({
        title: "Content Too Long",
        description: "Description must be 2000 characters or less.",
        variant: "destructive",
      });
      return;
    }

    if (submittingDiscussion) return; // Prevent double submission

    try {
      setSubmittingDiscussion(true);
      // Insert into database
      const { data, error } = await supabase
        .from("discussions")
        .insert({
          model_id: modelId,
          user_id: user?.id,
          user_name: userProfile?.name || "User",
          title: discussionTitle,
          content: discussionContent,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const newDiscussion = {
        id: data.id,
        modelId: modelId,
        userId: user?.id || "",
        userName: userProfile?.name || "User",
        title: discussionTitle,
        content: discussionContent,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        replies: [],
      };

      setDiscussions((prev) => [newDiscussion, ...prev]);

      // Create notification for publisher(s)
      await triggerNewDiscussionNotification({
        modelId: modelId!,
        modelName: model.name,
        publisherId: model.publisherId,
        discussionId: data.id,
        posterName: userProfile?.name || "User",
        posterId: user?.id || "",
        discussionPreview: discussionContent,
      });

      // Log activity
      if (user && currentRole) {
        await logActivity({
          userId: user.id,
          activityType: "commented",
          title: `Posted discussion on ${model.name}`,
          description: discussionTitle,
          modelId: modelId,
          modelName: model.name,
          role: currentRole as "buyer" | "publisher",
        });
      }

      // Refresh model stats
      await refreshModel();

      toast({
        title: "Discussion Created",
        description: "Your discussion has been posted.",
      });

      setShowDiscussionModal(false);
      setDiscussionTitle("");
      setDiscussionContent("");
    } catch (error) {
      console.error("Error creating discussion:", error);
      toast({
        title: "Error",
        description: "Failed to create discussion.",
        variant: "destructive",
      });
    } finally {
      setSubmittingDiscussion(false);
    }
  };

  const handleAddComment = async (discussionId: string) => {
    const content = commentContent[discussionId]?.trim();

    if (!content) {
      toast({
        title: "Missing Content",
        description: "Please enter a comment.",
        variant: "destructive",
      });
      return;
    }

    if (content.length > 1000) {
      toast({
        title: "Comment Too Long",
        description: "Comment must be 1000 characters or less.",
        variant: "destructive",
      });
      return;
    }

    if (submittingComment === discussionId) return; // Prevent double submission

    try {
      setSubmittingComment(discussionId);
      // Insert reply into database
      const { data, error } = await supabase
        .from("comments")
        .insert({
          discussion_id: discussionId,
          user_id: user?.id,
          user_name: userProfile?.name || "User",
          content: content,
          parent_comment_id: replyingTo?.commentId || null,
          recipient_user_id: replyingTo?.userId || null,
          recipient_user_name: replyingTo?.userName || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Create new comment for local state
      const newComment = {
        id: data.id,
        modelId: modelId,
        userId: user?.id || "",
        userName: userProfile?.name || "User",
        content: content,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        parentCommentId: replyingTo?.commentId || null,
        recipientUserId: replyingTo?.userId || null,
        recipientUserName: replyingTo?.userName || null,
      };

      // Update local state
      setDiscussions((prev) =>
        prev.map((disc) => {
          if (disc.id === discussionId) {
            return {
              ...disc,
              replies: [...(disc.replies || []), newComment],
            };
          }
          return disc;
        }),
      );

      // Create notifications (smart logic: reply vs new comment)
      await triggerNewCommentNotification({
        modelId: modelId!,
        modelName: model.name,
        publisherId: model.publisherId,
        discussionId: discussionId,
        commenterName: userProfile?.name || "User",
        commenterId: user?.id || "",
        commentPreview: content,
        parentCommentUserId: replyingTo?.userId, // If exists, triggers reply notification
      });

      // Log activity
      if (user && currentRole) {
        await logActivity({
          userId: user.id,
          activityType: "commented",
          title: `Replied to discussion on ${model.name}`,
          description: content.substring(0, 100),
          modelId: modelId,
          modelName: model.name,
          role: currentRole as "buyer" | "publisher",
        });
      }

      toast({
        title: "Comment Added",
        description: "Your comment has been posted.",
      });

      // Clear comment form and reply state
      setCommentContent((prev) => ({ ...prev, [discussionId]: "" }));
      setActiveCommentForm(null);
      setReplyingTo(null);
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(null);
    }
  };

  return (
    <Layout type="dashboard">
      <div className="max-w-5xl mx-auto space-y-8">
        <Button
          variant="ghost"
          className="gap-2 pl-0 hover:pl-2 transition-all"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-heading font-bold">{model.name}</h1>
            <div className="flex items-center gap-3 flex-wrap mt-2">
              {model.categories.map((category: Category) => (
                <Badge key={category.id}>{category.name}</Badge>
              ))}
              <span className="text-sm text-muted-foreground">
                Updated{" "}
                {new Date(model.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mt-5">
              {model.shortDescription}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>P</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {model.publisherName}
                </span>
              </div>
            </div>
          </div>

          <Card className="w-full md:w-80 border-primary/20 bg-primary/5 shadow-lg">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Pricing</span>
                  {model.price === "free" ? (
                    <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                      <Unlock className="w-3 h-3" />
                      FREE
                    </Badge>
                  ) : (
                    <Badge className="bg-primary gap-1">
                      <Lock className="w-3 h-3" />
                      MYR {model.priceAmount?.toFixed(2)}/month
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Version</span>
                  <span className="font-mono text-sm">{model.version}</span>
                </div>
              </div>

              <Separator className="bg-primary/10" />

              {isPublisher ? (
                <div className="text-center py-2">
                  {model?.publisherId === user?.id ? (
                    <>
                      <Button disabled className="w-full" variant="ghost">
                        Your Own Model
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        You are the creator of this model.
                      </p>
                    </>
                  ) : isCollaborator ? (
                    <>
                      <Button disabled className="w-full" variant="ghost">
                        You are collaborating
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        You have collaborator access to this model.
                      </p>
                    </>
                  ) : (
                    <>
                      <Button disabled className="w-full" variant="ghost">
                        Preview Only - Cannot Subscribe
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Publishers can only preview models. Use a buyer account
                        to subscribe.
                      </p>
                    </>
                  )}
                </div>
              ) : checkingSubscription ? (
                <Button disabled className="w-full gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </Button>
              ) : subscriptionStatus === "active" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {model.price === "free"
                        ? "Active Subscription"
                        : `Active (MYR ${model.priceAmount?.toFixed(2)}/month)`}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={handleUnsubscribeClick}
                  >
                    Unsubscribe
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    className="w-full shadow-md"
                    onClick={handleSubscribe}
                  >
                    {model.price === "free"
                      ? "Subscribe for Free"
                      : `Subscribe (MYR ${model.priceAmount?.toFixed(2)}/mo)`}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    By subscribing, you agree to the{" "}
                    <a href="#" className="underline">
                      Terms of Use
                    </a>
                    .
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Accuracy</p>
              <p className="font-bold text-lg">{model.stats.accuracy}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Response time</p>
              <p className="font-bold text-lg">{model.stats.responseTime}ms</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Star className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Rating</p>
              <div className="flex items-center gap-2">
                <p className="font-bold text-lg">
                  {model.averageRating > 0
                    ? model.averageRating.toFixed(1)
                    : "0.0"}
                  /5
                  {model.totalRatingCount > 0 && (
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      ({formatCount(model.totalRatingCount)})
                    </span>
                  )}
                </p>
                {!isPublisher && (
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Rate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Link */}
        {model.liveLink && (
          <a
            href={model.liveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-colors group"
          >
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors shrink-0">
              <ExternalLink className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                Live Demo
              </p>
              <p className="text-sm font-medium text-primary truncate group-hover:underline">
                {model.liveLink}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-primary/50 group-hover:text-primary shrink-0 transition-colors" />
          </a>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-1 sm:gap-3 md:gap-6">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-2 sm:px-3 md:px-4 py-3 whitespace-nowrap text-sm sm:text-base"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="docs"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-2 sm:px-3 md:px-4 py-3 whitespace-nowrap text-sm sm:text-base"
              >
                Docs
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-2 sm:px-3 md:px-4 py-3 whitespace-nowrap text-sm sm:text-base"
              >
                Files
              </TabsTrigger>
              <TabsTrigger
                value="discussion"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-2 sm:px-3 md:px-4 py-3 whitespace-nowrap text-sm sm:text-base"
              >
                Discussion
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-2 sm:px-3 md:px-4 py-3 whitespace-nowrap text-sm sm:text-base"
              >
                Stats
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="py-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4">Key Features</h3>
              <ul className="grid md:grid-cols-2 gap-3">
                {model.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Detailed Description</h3>
              {model.detailedDescription ? (
                <div className="prose max-w-none text-muted-foreground text-sm whitespace-pre-wrap">
                  {model.detailedDescription}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No detailed description provided.
                </p>
              )}
            </div>

            {/* Model Details Section */}
            <div>
              <h3 className="text-xl font-bold mb-4">Model Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <span className="text-muted-foreground font-medium sm:min-w-32 shrink-0">
                    Creator:
                  </span>
                  <a
                    href={`mailto:${model.publisherEmail}`}
                    className="text-primary hover:underline break-words"
                  >
                    {model.publisherName}
                  </a>
                </div>
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <span className="text-muted-foreground font-medium sm:min-w-32 shrink-0">
                    Collaborators:
                  </span>
                  <div className="break-words">
                    {model.collaborators && model.collaborators.length > 0 ? (
                      model.collaborators.map((collab: any, i: number) => (
                        <span key={i}>
                          <a
                            href={`mailto:${collab.email}`}
                            className="text-primary hover:underline"
                          >
                            {collab.name || collab.email}
                          </a>
                          {i < model.collaborators!.length - 1 && ", "}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground">
                        No collaborators
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <span className="text-muted-foreground font-medium sm:min-w-32 shrink-0">
                    First Published On:
                  </span>
                  <span className="break-words">
                    {new Date(model.publishedDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <span className="text-muted-foreground font-medium sm:min-w-32 shrink-0">
                    Last Update:
                  </span>
                  <span className="break-words">
                    {new Date(model.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Access & Pricing Section */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Access & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {model.price === "free" ? (
                    <>
                      <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Free Subscription
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Subscribe to access and download model files
                      </span>
                    </>
                  ) : (
                    <>
                      <Badge className="bg-primary gap-1">
                        <Lock className="w-3 h-3" />
                        Paid Subscription
                      </Badge>
                      <span className="text-sm font-semibold">
                        MYR {model.priceAmount?.toFixed(2)}/month
                      </span>
                      <span className="text-sm text-muted-foreground">
                        • Requires paid subscription
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Help & Support Section */}
            <div>
              <h3 className="text-xl font-bold mb-4">Help & Support</h3>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  window.location.href = `mailto:${model.publisherEmail}?subject=Question about ${model.name}`;
                }}
              >
                <Mail className="w-4 h-4" />
                Contact Publisher
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="docs" className="py-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">API Documentation</h3>
              {model.apiDocumentation ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">
                      Format:
                    </span>
                    <Badge variant="outline" className="uppercase text-xs">
                      {model.apiSpecFormat || "text"}
                    </Badge>
                  </div>
                  <div className="bg-secondary/20 p-6 rounded-lg border border-border">
                    <ApiSpecRenderer
                      content={model.apiDocumentation}
                      format={
                        (model.apiSpecFormat as
                          | "json"
                          | "yaml"
                          | "markdown"
                          | "text") || "text"
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-secondary/20 rounded-lg border border-dashed border-border">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <h4 className="text-lg font-bold">
                    No Documentation Available
                  </h4>
                  <p className="text-muted-foreground">
                    No documentation has been provided for this model yet.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="files" className="py-6">
            <div className="space-y-4">
              {loadingFiles ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4 [stroke-width:1.5]" />
                  <p className="text-muted-foreground">Loading files...</p>
                </div>
              ) : !hasFileAccess ? (
                <div className="flex flex-col items-center justify-center py-12 bg-secondary/20 rounded-lg border border-dashed border-border">
                  <Lock className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold">Access Restricted</h3>
                  <p className="text-muted-foreground mb-4 text-center max-w-md">
                    {isPublisher
                      ? "File access is only available for buyers with active subscriptions."
                      : "Subscribe to this model to access files and resources."}
                  </p>
                  {!isPublisher && (
                    <Button onClick={handleSubscribe}>Subscribe Now</Button>
                  )}
                </div>
              ) : modelFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-secondary/20 rounded-lg border border-dashed border-border">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold">No Files Available</h3>
                  <p className="text-muted-foreground">
                    No files have been uploaded for this model yet.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">
                      Model Files ({modelFiles.length})
                    </h3>
                    <Badge variant="secondary" className="gap-1">
                      <Unlock className="w-3 h-3" />
                      Access Granted
                    </Badge>
                  </div>

                  {modelFiles.map((file) => {
                    const isExternalUrl =
                      file.file_type === "url" ||
                      file.file_type === "external_url";

                    return (
                      <Card key={file.id}>
                        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2 bg-secondary rounded flex-shrink-0">
                              {isExternalUrl ? (
                                <ExternalLink className="w-5 h-5" />
                              ) : (
                                <FileText className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">
                                {file.file_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {file.file_size
                                  ? formatFileSize(file.file_size)
                                  : "External URL"}
                                {file.description && ` • ${file.description}`}
                              </p>
                              {isExternalUrl && (
                                <a
                                  href={file.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate mt-1 max-w-md block break-all"
                                >
                                  {file.file_url}
                                </a>
                              )}
                            </div>
                          </div>
                          {!isExternalUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto flex-shrink-0 gap-2"
                              onClick={() => handleDownloadFile(file)}
                              disabled={downloadingFileId === file.id}
                            >
                              {downloadingFileId === file.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4" /> Download
                                </>
                              )}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="discussion" className="py-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Community Discussion</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiscussionModal(true)}
              >
                + Start Discussion
              </Button>
            </div>

            <div className="space-y-6">
              {discussions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-secondary/20 rounded-lg border border-dashed border-border">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                  <h4 className="text-lg font-bold">No discussions yet</h4>
                  <p className="text-muted-foreground mb-4">
                    Be the first to start a discussion
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowDiscussionModal(true)}
                  >
                    + Start Discussion
                  </Button>
                </div>
              ) : (
                <>
                  {discussions
                    .slice(0, displayedDiscussionsCount)
                    .map((discussion) => {
                      const visibleComments =
                        visibleCommentsPerDiscussion[discussion.id] || 10;
                      const displayedReplies =
                        discussion.replies?.slice(0, visibleComments) || [];
                      const hasMoreComments =
                        discussion.replies &&
                        discussion.replies.length > visibleComments;

                      return (
                        <Card key={discussion.id}>
                          <CardHeader className="p-4 bg-secondary/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback>
                                    {discussion.userName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">
                                  {discussion.userName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {discussion.date}
                                </span>
                                {(isModelOwner || isCollaborator) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() =>
                                      handleDeleteClick(
                                        "discussion",
                                        discussion.id,
                                      )
                                    }
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            {discussion.title && (
                              <h3 className="font-semibold text-base mb-2">
                                {discussion.title}
                              </h3>
                            )}
                            <p className="text-sm whitespace-pre-wrap">
                              {discussion.content}
                            </p>

                            {/* Replies */}
                            {displayedReplies.length > 0 && (
                              <div className="mt-4 pl-4 border-l-2 border-border space-y-4">
                                {displayedReplies.map((reply: Comment) => (
                                  <div key={reply.id}>
                                    {reply.recipientUserName && (
                                      <div className="text-xs text-muted-foreground/70 mb-1 bg-secondary/30 px-2 py-0.5 rounded inline-block">
                                        Replying to @{reply.recipientUserName}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-xs text-primary">
                                        {reply.userName}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {reply.date}
                                      </span>
                                    </div>
                                    <p className="text-sm">{reply.content}</p>
                                    <div className="mt-1 flex items-center gap-3">
                                      <button
                                        onClick={() => {
                                          setReplyingTo({
                                            commentId: reply.id,
                                            discussionId: discussion.id,
                                            userId: reply.userId,
                                            userName: reply.userName,
                                          });
                                          setActiveCommentForm(discussion.id);
                                        }}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                      >
                                        <Reply className="w-3 h-3" />
                                        Reply
                                      </button>
                                      {(isModelOwner || isCollaborator) && (
                                        <button
                                          onClick={() =>
                                            handleDeleteClick(
                                              "comment",
                                              reply.id,
                                              discussion.id,
                                            )
                                          }
                                          className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Load More Comments Button */}
                            {hasMoreComments && (
                              <div className="mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setVisibleCommentsPerDiscussion((prev) => ({
                                      ...prev,
                                      [discussion.id]: visibleComments + 10,
                                    }))
                                  }
                                  className="w-full"
                                >
                                  Load More Comments (
                                  {discussion.replies.length - visibleComments}{" "}
                                  remaining)
                                </Button>
                              </div>
                            )}

                            {/* Comment Form */}
                            <div className="mt-4">
                              {activeCommentForm === discussion.id ? (
                                <div className="space-y-3">
                                  {replyingTo &&
                                    replyingTo.discussionId ===
                                      discussion.id && (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Reply className="w-4 h-4" />
                                        <span>
                                          Replying to{" "}
                                          <span className="font-semibold text-primary">
                                            @{replyingTo.userName}
                                          </span>
                                        </span>
                                        <button
                                          onClick={() => setReplyingTo(null)}
                                          className="ml-auto text-xs hover:text-destructive"
                                        >
                                          Cancel reply
                                        </button>
                                      </div>
                                    )}
                                  <Textarea
                                    placeholder="Type comment..."
                                    value={commentContent[discussion.id] || ""}
                                    onChange={(e) =>
                                      setCommentContent((prev) => ({
                                        ...prev,
                                        [discussion.id]: e.target.value,
                                      }))
                                    }
                                    maxLength={1000}
                                    className="min-h-[80px]"
                                  />
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">
                                      {
                                        (commentContent[discussion.id] || "")
                                          .length
                                      }
                                      /1000
                                    </span>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setActiveCommentForm(null);
                                          setCommentContent((prev) => ({
                                            ...prev,
                                            [discussion.id]: "",
                                          }));
                                          setReplyingTo(null);
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleAddComment(discussion.id)
                                        }
                                        disabled={
                                          submittingComment === discussion.id
                                        }
                                      >
                                        {submittingComment === discussion.id ? (
                                          <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Posting...
                                          </>
                                        ) : (
                                          "Post Comment"
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-primary"
                                  onClick={() =>
                                    setActiveCommentForm(discussion.id)
                                  }
                                >
                                  Type comment
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                  {/* Load More Discussions Button */}
                  {displayedDiscussionsCount < discussions.length && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setDisplayedDiscussionsCount((prev) => prev + 5)
                        }
                      >
                        Load More Discussions (
                        {discussions.length - displayedDiscussionsCount}{" "}
                        remaining)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="py-6">
            <TooltipProvider>
              <div className="space-y-6">
                <h3 className="text-xl font-bold">Model Statistics</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Page Views with Toggle */}
                  <Card className="relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="absolute top-3 right-3 text-muted-foreground hover:text-primary transition-colors">
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Each user is counted only once, even if they visit the
                          model page multiple times
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Eye className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {showTotalViews ? "Total Views" : "Views (30d)"}
                            </p>
                            <p className="text-2xl font-bold transition-all duration-300">
                              {showTotalViews
                                ? model.totalViews
                                  ? formatCount(model.totalViews)
                                  : "-"
                                : model.pageViews30Days
                                  ? formatCount(model.pageViews30Days)
                                  : "-"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowTotalViews(!showTotalViews)}
                          className="p-2 rounded-md hover:bg-muted transition-colors"
                          title={
                            showTotalViews
                              ? "Show 30-day views"
                              : "Show total views"
                          }
                        >
                          <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Active Subscribers */}
                  <Card className="relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="absolute top-3 right-3 text-muted-foreground hover:text-primary transition-colors">
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Number of users currently subscribed to this model
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Active Subscribers
                          </p>
                          <p className="text-2xl font-bold">
                            {model.activeSubscribers
                              ? formatCount(model.activeSubscribers)
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Total Subscribers (All Time) */}
                  <Card className="relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="absolute top-3 right-3 text-muted-foreground hover:text-primary transition-colors">
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Total number of subscriptions ever made to this model,
                          including cancelled ones
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Subscribers
                          </p>
                          <p className="text-2xl font-bold">
                            {model.totalSubscribers
                              ? formatCount(model.totalSubscribers)
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Engagement Rate */}
                  <Card className="relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="absolute top-3 right-3 text-muted-foreground hover:text-primary transition-colors">
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Calculated as (Total Subscribers /{" "}
                          {showTotalViews
                            ? "Total Page Views"
                            : "Page Views (30d)"}
                          ) × 100. Shows how many viewers convert to subscribers
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <BarChart className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Engagement Rate
                          </p>
                          <p className="text-2xl font-bold transition-all duration-300">
                            {showTotalViews
                              ? model.totalViews && model.totalSubscribers
                                ? `${((model.totalSubscribers / model.totalViews) * 100).toFixed(1)}%`
                                : "-"
                              : model.pageViews30Days && model.totalSubscribers
                                ? `${((model.totalSubscribers / model.pageViews30Days) * 100).toFixed(1)}%`
                                : "-"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Discussions */}
                  <Card className="relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="absolute top-3 right-3 text-muted-foreground hover:text-primary transition-colors">
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Total number of discussion threads created for this
                          model
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-pink-100 rounded-lg">
                          <MessageSquare className="w-6 h-6 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Discussions
                          </p>
                          <p className="text-2xl font-bold">
                            {model.discussionCount !== undefined &&
                            model.discussionCount !== null
                              ? formatCount(model.discussionCount)
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Downloads */}
                  <Card className="relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="absolute top-3 right-3 text-muted-foreground hover:text-primary transition-colors">
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Number of file downloads. External URL clicks are not
                          counted
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-100 rounded-lg">
                          <Download className="w-6 h-6 text-cyan-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Downloads
                          </p>
                          <p className="text-2xl font-bold">
                            {model.stats?.downloads
                              ? formatCount(model.stats.downloads)
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TooltipProvider>
          </TabsContent>
        </Tabs>
      </div>

      {/* Rating Modal */}
      <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate this Model</DialogTitle>
            <DialogDescription>
              How would you rate {model.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= (hoveredRating || selectedRating)
                        ? "fill-orange-400 text-orange-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {selectedRating > 0 && (
              <p className="text-center mt-4 text-sm text-muted-foreground">
                You selected {selectedRating} star
                {selectedRating !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowRatingModal(false);
                setSelectedRating(0);
                setHoveredRating(0);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRatingSubmit}
              disabled={selectedRating === 0 || submittingRating}
            >
              {submittingRating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Rating"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discussion Creation Modal */}
      <Dialog open={showDiscussionModal} onOpenChange={setShowDiscussionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Start New Discussion</DialogTitle>
            <DialogDescription>
              Ask a question or start a conversation about {model.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="discussion-title">
                Discussion Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="discussion-title"
                placeholder="What would you like to discuss?"
                value={discussionTitle}
                onChange={(e) => setDiscussionTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">
                {discussionTitle.length}/100
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discussion-content">
                First comment <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="discussion-content"
                placeholder="Share your thoughts or ask a question..."
                value={discussionContent}
                onChange={(e) => setDiscussionContent(e.target.value)}
                maxLength={2000}
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground text-right">
                {discussionContent.length}/2000
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDiscussionModal(false);
                setDiscussionTitle("");
                setDiscussionContent("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDiscussion}
              disabled={
                !discussionTitle.trim() ||
                !discussionContent.trim() ||
                submittingDiscussion
              }
            >
              {submittingDiscussion ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Discussion"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsubscribe Confirmation Dialog */}
      <AlertDialog
        open={unsubscribeDialogOpen}
        onOpenChange={setUnsubscribeDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsubscribe from {model?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unsubscribe from this model? You will
              lose access to all files and updates associated with this
              subscription.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsubscribeConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Unsubscribe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "discussion"
                ? "Delete Discussion?"
                : "Delete Comment?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "discussion"
                ? "Are you sure you want to delete this discussion? This will permanently remove the discussion and all its comments. This action cannot be undone."
                : "Are you sure you want to delete this comment? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
