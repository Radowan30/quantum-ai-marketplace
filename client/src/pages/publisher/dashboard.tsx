import { Layout } from "@/components/layout/Layout";
import { StatsCard } from "@/components/StatsCard";
import { useAuth } from "@/hooks/use-auth";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye,
  Box,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  X,
  Loader2,
  Info,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";
import {
  fetchPublisherAnalytics,
  fetchModelWeeklyViews,
} from "@/lib/analytics";
import { supabase } from "@/lib/supabase";
import { formatCount } from "@/lib/format-utils";

const COLORS = ["#981E7D", "#A8A9AD", "#00C49F", "#FFBB28"];

export default function PublisherDashboard() {
  const { user, userProfile } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");

  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Model views chart state
  const [selectedModelId, setSelectedModelId] = useState<string>("all");
  const [viewsData, setViewsData] = useState<any[]>([]);
  const [loadingViews, setLoadingViews] = useState(false);

  // Models table pagination state
  const [modelsCurrentPage, setModelsCurrentPage] = useState(1);
  const modelsPerPage = 5;

  // Subscribers state
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);

  // Collaborating models state (for ownership column)
  const [collaboratingModelIds, setCollaboratingModelIds] = useState<string[]>(
    [],
  );

  // Extracted refetch functions for cross-page freshness
  const refetchAnalytics = async () => {
    if (!user?.id) return;

    try {
      setLoadingAnalytics(true);
      const data = await fetchPublisherAnalytics(user.id);
      setAnalytics(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const refetchSubscribers = async () => {
    if (!user?.id) return;

    try {
      setLoadingSubscribers(true);

      // Get publisher's owned models
      const { data: ownedModels, error: modelsError } = await supabase
        .from("models")
        .select("id, model_name")
        .eq("publisher_id", user.id);

      if (modelsError) throw modelsError;

      // Get user's email for collaborator check
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("Error fetching user email:", userError);
      }

      let collaboratingModels: any[] = [];

      // Get collaborating models if we have the user's email
      if (userData?.email) {
        const { data: collaborators, error: collabError } = await supabase
          .from("collaborators")
          .select("model_id")
          .ilike("email", userData.email);

        if (collabError) {
          console.error("Error fetching collaborators:", collabError);
        } else if (collaborators && collaborators.length > 0) {
          const collaboratingModelIds = collaborators.map((c) => c.model_id);

          const { data: collabModels, error: collabModelsError } =
            await supabase
              .from("models")
              .select("id, model_name")
              .in("id", collaboratingModelIds);

          if (collabModelsError) {
            console.error(
              "Error fetching collaborating models:",
              collabModelsError,
            );
          } else {
            collaboratingModels = collabModels || [];
          }
        }
      }

      // Combine owned and collaborating models
      const allModels = [...(ownedModels || []), ...collaboratingModels];
      const uniqueModels = Array.from(
        new Map(allModels.map((m) => [m.id, m])).values(),
      );

      if (uniqueModels.length === 0) {
        setSubscribers([]);
        return;
      }

      const models = uniqueModels;
      const modelIds = models.map((m) => m.id);

      // Get subscriptions for these models
      const { data: subscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select(
          `
          id,
          model_id,
          buyer_id,
          status,
          subscribed_at,
          cancelled_at,
          users:buyer_id (
            name,
            email
          )
        `,
        )
        .in("model_id", modelIds)
        .order("subscribed_at", { ascending: false });

      if (subsError) throw subsError;

      // Transform data
      const transformedSubscribers =
        subscriptions?.map((sub: any) => {
          const model = models.find((m) => m.id === sub.model_id);
          const user = sub.users;
          return {
            id: sub.id,
            subscriber: user?.name || "Unknown User",
            email: user?.email || "",
            model: model?.model_name || "Unknown Model",
            status: sub.status === "active" ? "Active" : "Cancelled",
            subscriptionDate: new Date(sub.subscribed_at)
              .toISOString()
              .split("T")[0],
          };
        }) || [];

      setSubscribers(transformedSubscribers);
    } catch (error) {
      console.error("Error loading subscribers:", error);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const refetchAll = () => {
    refetchAnalytics();
    refetchSubscribers();
  };

  // Refetch data when tab regains focus
  useRefetchOnFocus(refetchAll);

  // Fetch collaborating model IDs
  useEffect(() => {
    const fetchCollaboratingModelIds = async () => {
      if (!user?.id || !userProfile?.email) return;

      try {
        // Direct query to collaborators table to get model IDs
        const { data: collaborators, error } = await supabase
          .from("collaborators")
          .select("model_id")
          .ilike("email", userProfile.email);

        if (error) {
          console.error("Error fetching collaborating models:", error);
          return;
        }

        const modelIds = collaborators?.map((c) => c.model_id) || [];
        setCollaboratingModelIds(modelIds);
      } catch (error) {
        console.error("Error in fetchCollaboratingModelIds:", error);
      }
    };

    fetchCollaboratingModelIds();
  }, [user, userProfile]);

  // Fetch analytics data
  useEffect(() => {
    refetchAnalytics();
  }, [user]);

  // Fetch views data when model selection changes
  useEffect(() => {
    const loadViewsData = async () => {
      if (!analytics) return;

      try {
        setLoadingViews(true);

        if (selectedModelId === "all") {
          // Show aggregated data for all models
          setViewsData(analytics.weeklyViews || []);
        } else {
          // Fetch data for specific model
          const modelViews = await fetchModelWeeklyViews(selectedModelId);
          setViewsData(modelViews);
        }
      } catch (error) {
        console.error("Error loading views data:", error);
      } finally {
        setLoadingViews(false);
      }
    };

    loadViewsData();
  }, [selectedModelId, analytics]);

  // Fetch subscribers data
  useEffect(() => {
    refetchSubscribers();
  }, [user]);

  // Aggregate stats (use analytics data, no fallback to mock data)
  const totalViews = analytics?.totalViews || 0;
  const totalModels = analytics?.totalModels || 0;
  const totalSubscribers = analytics?.totalSubscribers || 0;

  // Get models from analytics
  const myModels = analytics?.models || [];

  const subscribedModels = Array.from(
    new Set(subscribers.map((sub) => sub.model)),
  );

  // Category data for pie chart
  const categoryData = analytics?.categoryDistribution || [];

  // Models table pagination (models are already sorted by views in analytics)
  const totalModelsPages = Math.ceil(myModels.length / modelsPerPage);
  const modelsStartIndex = (modelsCurrentPage - 1) * modelsPerPage;
  const modelsEndIndex = modelsStartIndex + modelsPerPage;
  const paginatedModels = myModels.slice(modelsStartIndex, modelsEndIndex);

  const handleModelsPreviousPage = () => {
    setModelsCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleModelsNextPage = () => {
    setModelsCurrentPage((prev) => Math.min(prev + 1, totalModelsPages));
  };

  // Filtering logic
  const filteredSubscribers = subscribers.filter((subscriber) => {
    // Search filter (name or email)
    const matchesSearch =
      searchTerm === "" ||
      subscriber.subscriber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Model filter
    const matchesModel =
      modelFilter === "all" || subscriber.model === modelFilter;

    // Status filter
    const matchesStatus =
      statusFilter === "all" || subscriber.status === statusFilter;

    // Date range filter
    let matchesDate = true;
    if (dateRange) {
      const subDate = new Date(subscriber.subscriptionDate);
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      matchesDate = subDate >= fromDate && subDate <= toDate;
    }

    return matchesSearch && matchesModel && matchesStatus && matchesDate;
  });

  // Pagination calculations (based on filtered results)
  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubscribers = filteredSubscribers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleApplyDateRange = () => {
    if (tempStartDate && tempEndDate) {
      setDateRange({ from: tempStartDate, to: tempEndDate });
      setDatePickerOpen(false);
      handleFilterChange();
    }
  };

  const handleClearDateRange = () => {
    setDateRange(null);
    setTempStartDate("");
    setTempEndDate("");
    handleFilterChange();
  };

  return (
    <Layout type="dashboard">
      <div className="space-y-8">
        <div className="flex justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-heading font-bold">
              Publisher Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {userProfile?.name || "Publisher"}. Here's how your
              models are performing.
            </p>
          </div>

          {/* First Model CTA - Only shown when user has 0 models */}
          {!loadingAnalytics && totalModels === 0 && (
            <Card className="w-80 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg flex-shrink-0 animate-in slide-in-from-right duration-700 fade-in">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/15 rounded-lg flex-shrink-0">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      Head to the 'My Models' page to create your first model!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total Models"
            value={formatCount(totalModels)}
            icon={Box}
            isLoading={loadingAnalytics}
          />
          <StatsCard
            title="Total Views"
            value={formatCount(totalViews)}
            icon={Eye}
            isLoading={loadingAnalytics}
          />
          <StatsCard
            title="Active Subscriptions"
            value={formatCount(totalSubscribers)}
            icon={Users}
            isLoading={loadingAnalytics}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Model Views Over Time</CardTitle>
                <Select
                  value={selectedModelId}
                  onValueChange={setSelectedModelId}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {myModels.map((model: any) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.model_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pl-2">
              {loadingAnalytics || loadingViews ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : viewsData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-center">
                  <Eye className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No View Data Yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    View trends will appear here once your models start getting
                    views.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={viewsData}
                    margin={{ top: 20, bottom: 10, left: 10, right: 10 }}
                  >
                    <XAxis
                      dataKey="week"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      cursor={{
                        stroke: "hsl(var(--primary))",
                        strokeWidth: 1,
                        strokeDasharray: "5 5",
                      }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value: any, name: any, props: any) => {
                        return [value, "Views"];
                      }}
                      labelFormatter={(label: any, payload: any) => {
                        if (
                          payload &&
                          payload.length > 0 &&
                          payload[0].payload.dateRange
                        ) {
                          return payload[0].payload.dateRange;
                        }
                        return label;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-3 border-border/50">
            <CardHeader>
              <CardTitle>Models by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAnalytics ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : categoryData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-center">
                  <Box className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Models Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Category distribution will appear here once you publish
                    models.
                  </p>
                </div>
              ) : (
                <>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map(
                            (
                              _entry: { name: string; value: number },
                              index: number,
                            ) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ),
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground mt-2">
                    {categoryData.map(
                      (
                        entry: { name: string; value: number },
                        index: number,
                      ) => (
                        <div
                          key={entry.name}
                          className="flex items-center gap-1 whitespace-nowrap"
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          {entry.name}
                        </div>
                      ),
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Models by View Count Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Models by View Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Model Name</TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      Views
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Ownership
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Category
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAnalytics ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedModels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <p className="text-muted-foreground">
                          No models found.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedModels.map((model: any) => {
                      // Check if the model's publisher_id matches the current user
                      const isOwnModel = model.publisher_id === user?.id;
                      const isCollaborating = collaboratingModelIds.includes(
                        model.id,
                      );

                      return (
                        <TableRow key={model.id}>
                          <TableCell className="font-medium">
                            {model.model_name}
                          </TableCell>
                          <TableCell className="text-right">
                            {(model.total_views || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {isOwnModel ? (
                              <Badge
                                variant="default"
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                Own Model
                              </Badge>
                            ) : isCollaborating ? (
                              <Badge
                                variant="secondary"
                                className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                              >
                                Collaborating
                              </Badge>
                            ) : (
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
                            >
                              {model.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{model.categories}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {myModels.length > modelsPerPage && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {myModels.length > 0 ? modelsStartIndex + 1 : 0} to{" "}
                  {Math.min(modelsEndIndex, myModels.length)} of{" "}
                  {myModels.length} models
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleModelsPreviousPage}
                    disabled={modelsCurrentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Page {modelsCurrentPage} of {totalModelsPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleModelsNextPage}
                    disabled={modelsCurrentPage === totalModelsPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model Subscribers Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Model Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleFilterChange();
                  }}
                />
              </div>

              {/* Model Filter */}
              <Select
                value={modelFilter}
                onValueChange={(value) => {
                  setModelFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {subscribedModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full md:w-[220px] h-8 justify-start gap-2 border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  >
                    <Calendar className="h-4 w-4" />
                    {dateRange ? (
                      <span className="truncate text-sm">
                        {new Date(dateRange.from).toLocaleDateString()} -{" "}
                        {new Date(dateRange.to).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm">Select date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <Input
                        type="date"
                        value={tempStartDate}
                        onChange={(e) => setTempStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date</label>
                      <Input
                        type="date"
                        value={tempEndDate}
                        onChange={(e) => setTempEndDate(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleApplyDateRange}
                        disabled={!tempStartDate || !tempEndDate}
                        className="flex-1"
                      >
                        Apply
                      </Button>
                      {dateRange && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleClearDateRange}
                          className="gap-1"
                        >
                          <X className="h-3 w-3" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Subscriber</TableHead>
                    <TableHead className="min-w-[150px]">Email</TableHead>
                    <TableHead className="min-w-[150px]">Model</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Subscription Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingSubscribers ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedSubscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-muted-foreground">
                            No subscribers found matching your filters.
                          </p>
                          {(searchTerm ||
                            modelFilter !== "all" ||
                            statusFilter !== "all" ||
                            dateRange) && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => {
                                setSearchTerm("");
                                setModelFilter("all");
                                setStatusFilter("all");
                                setDateRange(null);
                                setTempStartDate("");
                                setTempEndDate("");
                                handleFilterChange();
                              }}
                            >
                              Clear all filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSubscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">
                          {subscriber.subscriber}
                        </TableCell>
                        <TableCell>{subscriber.email}</TableCell>
                        <TableCell>{subscriber.model}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              subscriber.status === "Active"
                                ? "default"
                                : "outline"
                            }
                            className={
                              subscriber.status === "Active"
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-gray-500 hover:bg-gray-600"
                            }
                          >
                            {subscriber.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{subscriber.subscriptionDate}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {filteredSubscribers.length > 0 ? startIndex + 1 : 0} to{" "}
                {Math.min(endIndex, filteredSubscribers.length)} of{" "}
                {filteredSubscribers.length} subscribers
                {filteredSubscribers.length !== subscribers.length && (
                  <span className="text-primary ml-1">
                    (filtered from {subscribers.length} total)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
