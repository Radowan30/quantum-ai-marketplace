import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import { Search, CheckCircle, XCircle, ShoppingBag, ChevronDown, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity-logger";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import type { Category } from "@/lib/types";

export default function MySubscriptionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { user, currentRole } = useAuth();
  const { toast } = useToast();
  const [subscribedModels, setSubscribedModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch subscriptions with model details
  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // First, fetch subscriptions with basic model info
        const { data: subscriptionsData, error: subsError } = await supabase
          .from("subscriptions")
          .select(
            `
            *,
            models (
              *,
              users:publisher_id (
                name,
                email
              )
            )
          `
          )
          .eq("buyer_id", user.id)
          .order("subscribed_at", { ascending: false });

        if (subsError) {
          console.error("Error fetching subscriptions:", subsError);
          throw subsError;
        }

        console.log("Fetched subscriptions:", subscriptionsData);

        if (!subscriptionsData || subscriptionsData.length === 0) {
          setSubscribedModels([]);
          return;
        }

        // Get all model IDs to fetch their categories
        const modelIds = subscriptionsData
          .map((sub) => sub.model_id)
          .filter(Boolean);

        console.log("Model IDs:", modelIds);

        // Fetch categories for all models
        const { data: modelCategoriesData, error: categoriesError } =
          await supabase
            .from("model_categories")
            .select(
              `
            model_id,
            categories (
              id,
              name,
              is_custom
            )
          `
            )
            .in("model_id", modelIds);

        if (categoriesError) {
          console.error("Error fetching categories:", categoriesError);
        }

        console.log("Fetched categories:", modelCategoriesData);

        // Group categories by model_id
        const categoriesByModel: { [key: string]: any[] } = {};
        (modelCategoriesData || []).forEach((mc: any) => {
          if (!categoriesByModel[mc.model_id]) {
            categoriesByModel[mc.model_id] = [];
          }
          if (mc.categories) {
            categoriesByModel[mc.model_id].push(mc.categories);
          }
        });

        // Transform to match expected format
        const transformed = subscriptionsData
          .filter((sub) => sub.models) // Only include subscriptions where model data was fetched
          .map((sub) => ({
            id: sub.id,
            buyerId: sub.buyer_id,
            modelId: sub.model_id,
            status: sub.status,
            startDate: new Date(sub.subscribed_at).toLocaleDateString(),
            cancelledDate: sub.cancelled_at
              ? new Date(sub.cancelled_at).toLocaleDateString()
              : null,
            model: {
              id: sub.models.id,
              name: sub.models.model_name,
              publisherName: sub.models.users?.name || "Unknown Publisher",
              publisherEmail: sub.models.users?.email || "",
              categories: categoriesByModel[sub.model_id] || [],
              version: sub.models.version || "1.0.0",
              description:
                sub.models.short_description ||
                sub.models.detailed_description ||
                "",
            },
          }));

        console.log("Transformed subscriptions:", transformed);
        setSubscribedModels(transformed);
      } catch (error) {
        console.error("Error loading subscriptions:", error);
        toast({
          title: "Error loading subscriptions",
          description:
            "Failed to load your subscriptions. Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptions();
  }, [user, toast]);

  // Open cancel dialog
  const handleCancelClick = (subscriptionId: string, modelName: string) => {
    setSubscriptionToCancel({ id: subscriptionId, name: modelName });
    setCancelDialogOpen(true);
  };

  // Handle subscription cancellation
  const handleCancelConfirm = async () => {
    if (!user || !subscriptionToCancel) return;

    const { id: subscriptionId, name: modelName } = subscriptionToCancel;

    try {
      setCancellingId(subscriptionId);

      // Update subscription status in database
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId)
        .eq("buyer_id", user.id); // Ensure user owns this subscription

      if (error) throw error;

      // Log activity
      await logActivity({
        userId: user.id,
        activityType: "unsubscribed",
        title: `Cancelled subscription to ${modelName}`,
        description: "Subscription cancelled by user",
        modelId: subscribedModels.find((s) => s.id === subscriptionId)?.modelId,
        modelName: modelName,
        role: currentRole as 'buyer' | 'publisher',
      });

      // Update local state
      setSubscribedModels((prev) =>
        prev.map((sub) =>
          sub.id === subscriptionId
            ? {
                ...sub,
                status: "cancelled",
                cancelledDate: new Date().toLocaleDateString(),
              }
            : sub
        )
      );

      toast({
        title: "Subscription Cancelled",
        description: `Your subscription to ${modelName} has been cancelled.`,
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
      setCancelDialogOpen(false);
      setSubscriptionToCancel(null);
    }
  };

  // Get unique categories from all subscribed models
  const categoriesMap = new Map();
  subscribedModels.forEach((sm) => {
    if (sm?.model?.categories) {
      sm.model.categories.forEach((cat: Category) => {
        if (!categoriesMap.has(cat.id)) {
          categoriesMap.set(cat.id, cat);
        }
      });
    }
  });
  const categories = Array.from(categoriesMap.values());

  // Apply all filters to subscriptions
  const filteredSubscriptions = subscribedModels.filter((sub) => {
    if (!sub) return false;

    // Status filter
    const matchesStatus =
      statusFilter === "all" ||
      sub.status === statusFilter;

    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      sub.model.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter (multi-select)
    const matchesCategory =
      categoryFilter.length === 0 ||
      sub.model.categories.some((cat: Category) => categoryFilter.includes(cat.id));

    return matchesStatus && matchesSearch && matchesCategory;
  });

  // Split filtered results into active and previous
  const filteredActiveSubscriptions = filteredSubscriptions.filter(
    (sub) => sub.status === "active"
  );
  const filteredPreviousSubscriptions = filteredSubscriptions.filter(
    (sub) => sub.status === "cancelled"
  );

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 gap-1">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="w-3 h-3" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Layout type="dashboard">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">My Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your active and previous model subscriptions.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All Subscriptions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subscriptions</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="cancelled">Cancelled Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter - Multi-Select */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex h-9 w-full md:w-[200px] items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring">
                <span className="truncate text-left">
                  {categoryFilter.length === 0
                    ? "All Categories"
                    : categoryFilter.length === 1
                    ? categories.find(c => c.id === categoryFilter[0])?.name
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
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="p-2">
                  {categories.map(category => {
                    const isSelected = categoryFilter.includes(category.id);
                    return (
                      <div
                        key={category.id}
                        className="flex items-center space-x-2 p-2 hover:bg-secondary rounded-md cursor-pointer"
                        onClick={() => {
                          setCategoryFilter(prev =>
                            isSelected
                              ? prev.filter(id => id !== category.id)
                              : [...prev, category.id]
                          );
                        }}
                      >
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            setCategoryFilter(prev =>
                              checked
                                ? [...prev, category.id]
                                : prev.filter(id => id !== category.id)
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
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Active Subscriptions Section */}
        {!loading && filteredActiveSubscriptions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Active Subscriptions</h2>
            {filteredActiveSubscriptions.map((sub) => {
              if (!sub) return null;
              const { model } = sub;

              return (
                <Card
                  key={sub.id}
                  className="border-border/50 hover:border-primary/30 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        href={`/model/${model.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold hover:text-primary transition-colors">
                              {model.name}
                            </h3>
                            {getStatusBadge(sub.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Provider: {model.publisherName} • Subscribed on{" "}
                            {sub.startDate}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {model.categories.slice(0, 2).map((cat: Category) => (
                              <Badge
                                key={cat.id}
                                variant="outline"
                                className="font-normal"
                              >
                                {cat.name}
                              </Badge>
                            ))}
                            {model.categories.length > 2 && (
                              <Badge variant="outline" className="font-normal">
                                +{model.categories.length - 2} more
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="font-normal whitespace-nowrap"
                            >
                              Version: {model.version}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelClick(sub.id, model.name)}
                        disabled={cancellingId === sub.id}
                      >
                        {cancellingId === sub.id
                          ? "Cancelling..."
                          : "Cancel Subscription"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Separator between sections */}
        {!loading && filteredActiveSubscriptions.length > 0 &&
          filteredPreviousSubscriptions.length > 0 && (
            <Separator className="my-8" />
          )}

        {/* Previous Subscriptions Section */}
        {!loading && filteredPreviousSubscriptions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Previous Subscriptions</h2>
            {filteredPreviousSubscriptions.map((sub) => {
              if (!sub) return null;
              const { model } = sub;

              return (
                <Link
                  key={sub.id}
                  href={`/model/${model.id}`}
                  className="block"
                >
                  <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{model.name}</h3>
                          {getStatusBadge(sub.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Provider: {model.publisherName} • Subscribed on{" "}
                          {sub.startDate}
                          {sub.status === "cancelled" &&
                            sub.cancelledDate &&
                            ` • Cancelled on ${sub.cancelledDate}`}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {model.categories.slice(0, 2).map((cat: Category) => (
                            <Badge
                              key={cat.id}
                              variant="outline"
                              className="font-normal"
                            >
                              {cat.name}
                            </Badge>
                          ))}
                          {model.categories.length > 2 && (
                            <Badge variant="outline" className="font-normal">
                              +{model.categories.length - 2} more
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="font-normal whitespace-nowrap"
                          >
                            Version: {model.version}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredActiveSubscriptions.length === 0 &&
          filteredPreviousSubscriptions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-secondary/20 rounded-lg border border-dashed border-border">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
              {subscribedModels.length === 0 ? (
                <>
                  <h3 className="text-xl font-bold mb-2">
                    No subscriptions yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Subscribe to models to see them here
                  </p>
                  <Link href="/marketplace">
                    <Button>Browse Marketplace</Button>
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-2">No models found</h3>
                  <p className="text-muted-foreground mb-6">
                    No models match your current filters
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter([]);
                      setStatusFilter("all");
                    }}
                  >
                    Clear all filters
                  </Button>
                </>
              )}
            </div>
          )}
      </div>

      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription to{" "}
              {subscriptionToCancel?.name}? You will lose access to this model
              and its features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
