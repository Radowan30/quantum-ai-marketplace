import { Layout } from "@/components/layout/Layout";
import { StatsCard } from "@/components/StatsCard";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Store, ShoppingBag, Search, Package, CheckCircle, XCircle, Download, MessageSquare, ArrowRight, ChevronDown, ChevronUp, Activity, Star, Loader2 } from "lucide-react";
import { ModelCard } from "@/components/ModelCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { fetchUserActivities } from "@/lib/activity-logger";

export default function BuyerDashboard() {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const { user, currentRole } = useAuth();

  const [activeSubs, setActiveSubs] = useState<any[]>([]);
  const [subscribedModels, setSubscribedModels] = useState<any[]>([]);
  const [marketplaceModelsCount, setMarketplaceModelsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Fetch subscriptions and models
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Fetch count of published models in marketplace
        const { count: modelsCount, error: countError } = await supabase
          .from('models')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published');

        if (countError) {
          console.error('Error fetching models count:', countError);
        } else {
          setMarketplaceModelsCount(modelsCount || 0);
        }

        // Fetch subscriptions with model details
        const { data: subscriptions, error } = await supabase
          .from('subscriptions')
          .select(`
            *,
            models (
              *,
              users:publisher_id (
                name,
                email
              )
            )
          `)
          .eq('buyer_id', user.id);

        if (error) throw error;

        // Filter active subscriptions only
        const active = subscriptions?.filter(s => s.status === 'active') || [];

        setActiveSubs(active);

        if (active.length === 0) {
          setSubscribedModels([]);
          return;
        }

        // Get all model IDs to fetch their categories
        const modelIds = active
          .map((sub) => sub.model_id)
          .filter(Boolean);

        // Fetch categories for all models
        const { data: modelCategoriesData, error: categoriesError } =
          await supabase
            .from('model_categories')
            .select(`
              model_id,
              categories (
                id,
                name,
                is_custom
              )
            `)
            .in('model_id', modelIds);

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
        }

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

        // Transform to match Model type expected by ModelCard
        const transformedModels = active
          .filter((sub) => sub.models) // Only include subscriptions where model data was fetched
          .map((sub) => ({
            id: sub.models.id,
            name: sub.models.model_name,
            shortDescription: sub.models.short_description || sub.models.detailed_description || '',
            description: sub.models.detailed_description || '',
            publisherId: sub.models.publisher_id,
            publisherName: sub.models.users?.name || 'Unknown Publisher',
            categories: categoriesByModel[sub.model_id] || [],
            version: sub.models.version || '1.0.0',
            price: sub.models.pricing_tier || 'free',
            status: sub.models.status,
            stats: {
              accuracy: sub.models.accuracy || 0,
              responseTime: sub.models.response_time || 0,
              views: 0,
              downloads: 0
            }
          }));

        setSubscribedModels(transformedModels);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Fetch recent activities
  useEffect(() => {
    const loadActivities = async () => {
      if (!user?.id || !currentRole) return;

      try {
        setLoadingActivities(true);
        const activities = await fetchUserActivities(user.id, currentRole as 'buyer' | 'publisher', 20); // Fetch last 20 activities for current role

        // Transform to match UI expectations
        const transformedActivities = activities.map(activity => ({
          id: activity.id,
          type: activity.activityType,
          description: activity.title,
          modelName: activity.modelName || 'Unknown Model',
          modelId: activity.modelId,
          timestamp: activity.createdAt
        }));

        setRecentActivities(transformedActivities);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoadingActivities(false);
      }
    };

    loadActivities();
  }, [user, currentRole]);

  const activitiesToShow = showAllActivities ? recentActivities : recentActivities.slice(0, 5);

  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'subscribed':
        return CheckCircle;
      case 'unsubscribed':
      case 'cancelled':
        return XCircle;
      case 'downloaded':
        return Download;
      case 'commented':
        return MessageSquare;
      case 'rated':
        return Star;
      default:
        return CheckCircle;
    }
  };

  // Get activity icon color based on type
  const getActivityIconColor = (type: string) => {
    switch (type) {
      case 'subscribed':
        return 'text-green-600 bg-green-100';
      case 'unsubscribed':
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'downloaded':
        return 'text-blue-600 bg-blue-100';
      case 'commented':
        return 'text-purple-600 bg-purple-100';
      case 'rated':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Format relative timestamp
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Layout type="dashboard">
       <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">Buyer Dashboard</h1>
          <p className="text-muted-foreground">Manage your AI capabilities and subscriptions.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
           <StatsCard
             title="Available Models in Marketplace"
             value={marketplaceModelsCount}
             icon={Store}
             isLoading={loading}
           />
           <StatsCard
             title="My Subscriptions"
             value={activeSubs.length}
             icon={ShoppingBag}
             isLoading={loading}
           />
        </div>

        {/* Quick Actions Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/marketplace">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-primary/20 hover:border-primary bg-gradient-to-br from-primary/5 to-transparent group">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      Browse Marketplace
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Discover and subscribe to AI models
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/buyer/my-subscriptions">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-primary/20 hover:border-primary bg-gradient-to-br from-primary/5 to-transparent group">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      Manage Subscriptions
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      View and manage your subscriptions
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <div>
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Your Active Models</h2>
              <Link href="/buyer/my-subscriptions">
                 <Button variant="link">View All</Button>
              </Link>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                </div>
              ) : subscribedModels.length > 0 ? (
                 subscribedModels.map((model: any) => (
                    <ModelCard key={model.id} model={model} subscribed={true} />
                 ))
              ) : (
                 <div className="col-span-full py-12 text-center border border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground mb-4">You haven't subscribed to any models yet.</p>
                    <Link href="/marketplace">
                       <Button>Browse Marketplace</Button>
                    </Link>
                 </div>
              )}
           </div>
        </div>

        {/* Recent Activity Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          {loadingActivities ? (
            <Card>
              <CardContent className="p-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              </CardContent>
            </Card>
          ) : recentActivities.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <Activity className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold mb-2">No recent activity</h3>
                  <p className="text-muted-foreground">Your actions will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {activitiesToShow.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    const iconColor = getActivityIconColor(activity.type);

                    return (
                      <Link key={activity.id} href={`/model/${activity.modelId}`}>
                        <div className="flex items-start gap-4 p-4 hover:bg-secondary/50 transition-colors cursor-pointer group">
                          <div className={`p-2 rounded-lg ${iconColor} shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm mb-1">
                              {activity.description}
                            </p>
                            <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                              {activity.modelName}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0">
                            {getRelativeTime(activity.timestamp)}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Show More / Show Less Button */}
                {recentActivities.length > 5 && (
                  <div className="p-4 border-t border-border bg-secondary/20">
                    <Button
                      variant="ghost"
                      className="w-full gap-2"
                      onClick={() => setShowAllActivities(!showAllActivities)}
                    >
                      {showAllActivities ? (
                        <>
                          Show Less
                          <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Show More ({recentActivities.length - 5} more)
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
       </div>
    </Layout>
  );
}
