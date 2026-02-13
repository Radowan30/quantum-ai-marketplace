import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  Eye,
  Package,
  CheckCircle,
  Users,
  Loader2,
  FileX,
  Send,
  ChevronDown,
} from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Model } from "@/lib/types";
import { transformDatabaseModels } from "@/lib/data-transforms";
import { formatCount } from "@/lib/format-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";

// My Models Page - Publisher's model management dashboard

export default function MyModelsPage() {
  const { user, userProfile } = useAuth();
  const [myModels, setMyModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modelTypeFilter, setModelTypeFilter] = useState<
    "all" | "own" | "collaborating"
  >("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  // Store collaborating model IDs fetched separately to avoid database permission (RLS) issues
  // We query the collaborators table directly instead of joining it with models
  const [collaboratingModelIds, setCollaboratingModelIds] = useState<string[]>(
    [],
  );
  const [, setLocation] = useLocation(); // Using blank destructuring - we only need setLocation, not the current location
  const { toast } = useToast();

  // Extracted refetch function for cross-page freshness
  const refetchModels = async () => {
    if (!user) return;

      try {
        setLoading(true);

        // STEP 1: Fetch models where the current user is the OWNER
        // This query gets all models published by this user
        // We also fetch the list of collaborators and categories for each model using a join
        const { data: ownModels, error: ownError } = await supabase
          .from("models")
          .select(
            `
            *,
            model_categories(
              categories(id, name, is_custom)
            ),
            collaborators(name, email)
          `,
          )
          .eq("publisher_id", user.id)
          .order("created_at", { ascending: false });

        if (ownError) throw ownError;

        // STEP 2: Fetch models where the current user is a COLLABORATOR (not the owner)
        // First, get the user's email address for looking up collaborator records
        const userEmail = (userProfile?.email || user.email || "")
          .toLowerCase()
          .trim();
        console.log(
          "[My Models] User email for collaborator check:",
          userEmail,
        );

        // Query the collaborators table to find all models where this user is listed
        // We use 'ilike' for case-insensitive email matching
        const { data: collabData, error: collabError } = await supabase
          .from("collaborators")
          .select("model_id")
          .ilike("email", userEmail || "");

        if (collabError) {
          console.error("[My Models] Collaborator query error:", collabError);
          throw collabError;
        }

        console.log("[My Models] Collaborator query result:", collabData);

        // Extract just the model IDs from the results
        const collabModelIds = (collabData || []).map((c: any) => c.model_id);
        // Store these IDs in state so we can use them later for filtering and badge display
        // This avoids database permission issues that can happen with complex joins
        setCollaboratingModelIds(collabModelIds);
        console.log("[My Models] Collaborating model IDs:", collabModelIds);

        // STEP 3: Fetch the full details for models where user is a collaborator
        // We only fetch models where the user is NOT the owner (to avoid duplicates)
        let collabModels: any[] = [];
        if (collabModelIds.length > 0) {
          const { data: collabModelsData, error: collabModelsError } =
            await supabase
              .from("models")
              .select(
                `
              *,
              model_categories(
                categories(id, name, is_custom)
              ),
              collaborators(name, email)
            `,
              )
              .in("id", collabModelIds)
              .neq("publisher_id", user.id)
              .order("created_at", { ascending: false });

          if (collabModelsError) throw collabModelsError;
          collabModels = collabModelsData || [];
        }

        // STEP 4: Combine owned and collaborating models into a single array
        // The spread operator (...) unpacks both arrays into one
        const data = [...(ownModels || []), ...collabModels];

        // If no models found at all, show empty state
        if (!data || data.length === 0) {
          setMyModels([]);
          setLoading(false);
          return;
        }

        // STEP 5: Fetch statistics for all models
        // Extract all model IDs so we can query views and downloads for all of them at once
        const modelIds = data.map((m) => m.id);

        // Query the 'views' table to count how many times each model was viewed
        // This gives us all-time view counts (not just recent)
        const { data: allViews, error: viewsError } = await supabase
          .from("views")
          .select("model_id")
          .in("model_id", modelIds);

        if (viewsError) {
          console.error("Error fetching views:", viewsError);
        }

        // Query the 'user_activities' table to count downloads
        // We filter by activity_type = 'downloaded' to only get download events
        const { data: allDownloads, error: downloadsError } = await supabase
          .from("user_activities")
          .select("model_id")
          .in("model_id", modelIds)
          .eq("activity_type", "downloaded");

        if (downloadsError) {
          console.error("Error fetching downloads:", downloadsError);
        }

        // STEP 6: Count views and downloads for each model
        // We create lookup objects (dictionaries) to store counts by model ID
        const viewsByModel: { [key: string]: number } = {};
        const downloadsByModel: { [key: string]: number } = {};

        // Loop through each view record and increment the count for that model
        // The (viewsByModel[view.model_id] || 0) pattern means "get current count, or 0 if first time"
        (allViews || []).forEach((view: any) => {
          viewsByModel[view.model_id] = (viewsByModel[view.model_id] || 0) + 1;
        });

        // Do the same for downloads
        (allDownloads || []).forEach((download: any) => {
          downloadsByModel[download.model_id] =
            (downloadsByModel[download.model_id] || 0) + 1;
        });

        // STEP 7: Attach the statistics and transform nested categories
        // We use the spread operator (...model) to copy all existing fields,
        // then add our new total_views and downloads fields
        // Also extract categories from the nested model_categories structure
        const modelsWithStats = data.map((model) => ({
          ...model,
          categories: model.model_categories?.map((mc: any) => mc.categories).filter(Boolean) || [],
          total_views: viewsByModel[model.id] || 0,
          downloads: downloadsByModel[model.id] || 0,
        }));

      // STEP 8: Transform database format to UI format and save to state
      // transformDatabaseModels converts field names from snake_case to camelCase
      setMyModels(transformDatabaseModels(modelsWithStats));
    } catch (error: any) {
      console.error("Error fetching models:", error);
      toast({
        title: "Error loading models",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Refetch data when tab regains focus
  useRefetchOnFocus(refetchModels);

  // Fetch all models that the current user can see (both owned and collaborating)
  useEffect(() => {
    refetchModels();
  }, [user, userProfile]);

  // Fetch active subscribers for all the publisher's models
  // This runs whenever myModels changes (after models are loaded)
  useEffect(() => {
    const fetchSubscribers = async () => {
      // Don't query if user isn't logged in or if we haven't loaded models yet
      if (!user || myModels.length === 0) {
        setSubscribers([]);
        return;
      }

      try {
        // Get all model IDs to query subscriptions
        const modelIds = myModels.map((m) => m.id);

        // Fetch all ACTIVE subscriptions for these models
        // We only count active subscriptions (not cancelled ones)
        const { data, error } = await supabase
          .from("subscriptions")
          .select("id, buyer_id, model_id, status")
          .in("model_id", modelIds)
          .eq("status", "active");

        if (error) throw error;

        setSubscribers(data || []);
      } catch (error: any) {
        console.error("Error fetching subscribers:", error);
      }
    };

    fetchSubscribers();
  }, [user, myModels]); // Re-run when user or myModels changes

  // Fetch all categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, is_custom")
          .order("is_custom", { ascending: true })
          .order("name", { ascending: true });

        if (error) throw error;
        setAllCategories(data || []);
      } catch (error: any) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Calculate summary statistics for the dashboard cards
  const totalModels = myModels.length;
  const publishedModels = myModels.filter(
    (m) => m.status === "published",
  ).length;

  // Count unique users who have subscribed to any of the models
  // Using a Set automatically removes duplicates (same user subscribing to multiple models)
  const uniqueSubscribers = new Set(subscribers.map((sub) => sub.buyer_id))
    .size;

  // Filter the models list based on all active filters (search, category, status, ownership)
  // This runs every time any of these values change: myModels, searchTerm, categoryFilter, statusFilter, modelTypeFilter
  const filteredModels = myModels.filter((model) => {
    // FILTER 1: Search by model name (case-insensitive)
    // Empty search term matches everything
    const matchesSearch =
      searchTerm === "" ||
      model.name.toLowerCase().includes(searchTerm.toLowerCase());

    // FILTER 2: Category filter (multi-select)
    // If no categories selected, show all. Otherwise, show models that have at least one matching category
    const matchesCategory =
      categoryFilter.length === 0 ||
      model.categories.some((cat) => categoryFilter.includes(cat.id));

    // FILTER 3: Status filter (draft or published)
    const matchesStatus =
      statusFilter === "all" || model.status === statusFilter;

    // FILTER 4: Ownership filter (own models vs collaborating models)
    let matchesTypeFilter = true;
    const isOwnModel = model.publisherId === user?.id;
    // Check if this model is in our list of models we're collaborating on
    // We use the collaboratingModelIds array from state (fetched separately) to avoid database permission issues
    const isCollaborating = collaboratingModelIds.includes(model.id);

    if (modelTypeFilter === "own") {
      // Show only models where user is the owner
      matchesTypeFilter = isOwnModel;
    } else if (modelTypeFilter === "collaborating") {
      // Show only models where user is a collaborator (but NOT the owner)
      matchesTypeFilter = isCollaborating && !isOwnModel;
    }
    // If filter is "all", matchesTypeFilter stays true (shows everything)

    // A model must match ALL filters to be shown
    return (
      matchesSearch && matchesCategory && matchesStatus && matchesTypeFilter
    );
  });

  // ========== ACTION HANDLERS ==========
  // These functions handle user interactions with the model list

  // Navigate to the public model details page
  const handleViewDetails = (modelId: string) => {
    setLocation(`/model/${modelId}`);
  };

  // Navigate to the model editing page
  const handleEditModel = (modelId: string) => {
    setLocation(`/publisher/edit-model/${modelId}`);
  };

  // Open the delete confirmation dialog
  // We don't delete immediately - we ask for confirmation first
  const handleDeleteClick = (modelId: string) => {
    setModelToDelete(modelId);
    setDeleteDialogOpen(true);
  };

  // Actually delete the model after user confirms
  const handleDeleteConfirm = async () => {
    if (!modelToDelete) return;

    try {
      // Find the model name for the success message
      const model = myModels.find((m) => m.id === modelToDelete);

      // Delete from database
      const { error } = await supabase
        .from("models")
        .delete()
        .eq("id", modelToDelete);

      if (error) throw error;

      // Update local state to remove the deleted model from the UI
      // This avoids having to refetch all models from the database
      setMyModels((prev) => prev.filter((m) => m.id !== modelToDelete));

      toast({
        title: "Model Deleted",
        description: `${model?.name} has been deleted successfully.`,
      });
    } catch (error: any) {
      console.error("Error deleting model:", error);
      toast({
        title: "Error deleting model",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      // Always close the dialog and clear the modelToDelete, even if there was an error
      setDeleteDialogOpen(false);
      setModelToDelete(null);
    }
  };

  // Change a published model back to draft status
  const handleUnpublish = async (modelId: string) => {
    try {
      const model = myModels.find((m) => m.id === modelId);

      // Update the model status in the database
      const { error } = await supabase
        .from("models")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", modelId);

      if (error) throw error;

      // Update local state to reflect the change immediately in the UI
      // We use map() to find and update just the one model that changed
      setMyModels((prev) =>
        prev.map((m) => (m.id === modelId ? { ...m, status: "draft" } : m)),
      );

      toast({
        title: "Model Unpublished",
        description: `${model?.name} has been unpublished and is now a draft.`,
      });
    } catch (error: any) {
      console.error("Error unpublishing model:", error);
      toast({
        title: "Error unpublishing model",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Publish a draft model to make it visible in the marketplace
  const handlePublish = async (modelId: string) => {
    try {
      const model = myModels.find((m) => m.id === modelId);

      // Update the model status in the database
      const { error } = await supabase
        .from("models")
        .update({
          status: "published",
          updated_at: new Date().toISOString(),
        })
        .eq("id", modelId);

      if (error) throw error;

      // Update local state to show the change immediately
      setMyModels((prev) =>
        prev.map((m) => (m.id === modelId ? { ...m, status: "published" } : m)),
      );

      toast({
        title: "Model Published",
        description: `${model?.name} has been published and is now live on the marketplace.`,
      });
    } catch (error: any) {
      console.error("Error publishing model:", error);
      toast({
        title: "Error publishing model",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Layout type="dashboard">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">My Models</h1>
            <p className="text-muted-foreground">
              Manage your published algorithms and datasets.
            </p>
          </div>
          <Link href="/publisher/create-model">
            <Button className="gap-2 shadow-lg hover:shadow-primary/20">
              <Plus className="w-4 h-4" /> Create New Model
            </Button>
          </Link>
        </div>

        {/* Overview Stats Cards - Quick summary of the publisher's model portfolio */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total Models"
            value={totalModels}
            icon={Package}
            isLoading={loading}
          />
          <StatsCard
            title="Published"
            value={publishedModels}
            icon={CheckCircle}
            isLoading={loading}
          />
          {/* formatCount() converts large numbers to readable format (e.g., 1500 → "1.5K") */}
          <StatsCard
            title="Total Users"
            value={formatCount(uniqueSubscribers)}
            icon={Users}
            isLoading={loading}
          />
        </div>

        {/* Filter Controls Bar - Allows filtering models by search, category, status, and ownership */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-card p-4 rounded-lg border border-border">
          {/* Search input with icon positioned absolutely inside */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={modelTypeFilter}
              onValueChange={(value: "all" | "own" | "collaborating") =>
                setModelTypeFilter(value)
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Model Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All models</SelectItem>
                <SelectItem value="own">Own models</SelectItem>
                <SelectItem value="collaborating">Collaborating</SelectItem>
              </SelectContent>
            </Select>

            {/* Multi-select category filter using Popover with checkboxes */}
            {/* The button text changes based on how many categories are selected */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex h-9 w-full sm:w-[200px] items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring">
                  <span className="truncate text-left">
                    {/* Dynamic button text based on selection:
                        - No selection: "All Categories"
                        - One selected: Show the category name
                        - Multiple selected: "Multiple Categories" */}
                    {categoryFilter.length === 0
                      ? "All Categories"
                      : categoryFilter.length === 1
                        ? allCategories.find((c) => c.id === categoryFilter[0])
                            ?.name
                        : "Multiple Categories"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <div className="max-h-[300px] overflow-y-auto">
                  <div className="flex items-center justify-between p-3 border-b border-border sticky top-0 bg-background">
                    <span className="text-sm font-medium">Categories</span>
                    {categoryFilter.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-xs"
                        onClick={() => setCategoryFilter([])}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="p-2">
                    {allCategories.map((category) => {
                      const isSelected = categoryFilter.includes(category.id);
                      return (
                        <div
                          key={category.id}
                          className="flex items-center space-x-2 p-2 hover:bg-secondary rounded-md cursor-pointer"
                          onClick={() => {
                            setCategoryFilter((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== category.id)
                                : [...prev, category.id],
                            );
                          }}
                        >
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              setCategoryFilter((prev) =>
                                checked
                                  ? [...prev, category.id]
                                  : prev.filter((id) => id !== category.id),
                              );
                            }}
                          />
                          <Label
                            htmlFor={`category-${category.id}`}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {category.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Version</TableHead>
                  <TableHead className="whitespace-nowrap">Ownership</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Price</TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Stats
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Conditional rendering: Show loading spinner, empty state, or model list */}
                {loading ? (
                  // LOADING STATE: Show spinner while fetching data from database
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredModels.length === 0 ? (
                  // EMPTY STATE: No models match the current filters (or no models exist)
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-muted-foreground">
                          No models found.
                        </p>
                        <Link href="/publisher/create-model">
                          <Button variant="outline" className="gap-2">
                            <Plus className="w-4 h-4" /> New Model
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  // Render a table row for each filtered model
                  filteredModels.map((model) => {
                    // Determine the ownership status for this model
                    const isOwnModel = model.publisherId === user?.id;
                    const isCollaborating = collaboratingModelIds.includes(
                      model.id,
                    );

                    return (
                      <TableRow key={model.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{model.name}</span>
                            {/* Show categories below the model name as a comma-separated list */}
                            <span className="text-xs text-muted-foreground">
                              {model.categories
                                .map((cat) => cat.name)
                                .join(", ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{model.version}</TableCell>
                        <TableCell>
                          {/* Display ownership badge based on user's relationship to the model */}
                          {isOwnModel ? (
                            // Blue badge for models the user owns
                            <Badge
                              variant="default"
                              className="bg-blue-500 hover:bg-blue-600"
                            >
                              Own Model
                            </Badge>
                          ) : isCollaborating ? (
                            // Purple badge for models the user is collaborating on
                            <Badge
                              variant="secondary"
                              className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                              Collaborating
                            </Badge>
                          ) : (
                            // This shouldn't normally appear - every model should be either owned or collaborating
                            <Badge variant="outline">Unknown</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              model.status === "published"
                                ? "default"
                                : "secondary"
                            }
                            className="capitalize"
                          >
                            {model.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {model.price}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          <div>{formatCount(model.stats.views)} total views</div>
                          <div>
                            {formatCount(model.stats.downloads)} downloads
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(model.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditModel(model.id)}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit Model
                              </DropdownMenuItem>
                              {model.status === "draft" && (
                                <DropdownMenuItem
                                  onClick={() => handlePublish(model.id)}
                                >
                                  <Send className="mr-2 h-4 w-4" /> Publish
                                </DropdownMenuItem>
                              )}
                              {model.status === "published" && (
                                <DropdownMenuItem
                                  onClick={() => handleUnpublish(model.id)}
                                >
                                  <FileX className="mr-2 h-4 w-4" /> Unpublish
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteClick(model.id)}
                              >
                                <Trash className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              model and remove it from the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
