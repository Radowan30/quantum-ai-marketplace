import { Model } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader } from "@/components/ui/card";
import { HolographicCard } from "@/components/ui/HolographicCard";
import { Eye, Download, Activity, Clock, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { formatCount } from "@/lib/format-utils";

interface ModelCardProps {
  model: Model;
  mode?: "preview" | "action";
  subscribed?: boolean;
  currentUserId?: string;
}

export function ModelCard({ model, mode = "action", subscribed = false, currentUserId }: ModelCardProps) {
  const isOwnModel = currentUserId && model.publisherId === currentUserId;
  const publisherDisplay = mode === "preview" && isOwnModel ? "you" : model.publisherName;
  return (
    <Link href={`/model/${model.id}`} className="block h-full">
      <HolographicCard className="h-full flex flex-col overflow-hidden">
        {/* Diagonal glass shine */}
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-xl"
          style={{
            background: "linear-gradient(135deg, transparent 25%, rgba(255,255,255,0.02) 30%, rgba(255,255,255,0.07) 40%, rgba(255,255,255,0.07) 55%, rgba(255,255,255,0.02) 62%, transparent 68%)",
          }}
        />
        <CardHeader className="p-0">
          <div className="h-1 bg-gradient-to-r from-primary via-purple-400 to-accent group-hover:h-2 transition-all duration-300" />
        </CardHeader>
        <CardContent className="p-6 flex-1 flex flex-col gap-4">
          {/* Header with categories and price badge */}
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                {model.categories.slice(0, 2).map((category) => (
                  <Badge
                    key={category.id}
                    variant="outline"
                    className="text-xs font-normal text-muted-foreground border-primary/20 bg-primary/5 max-w-[120px] truncate"
                    title={category.name}
                  >
                    {category.name}
                  </Badge>
                ))}
                {subscribed && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs gap-1 flex-shrink-0">
                    <CheckCircle className="w-3 h-3" />
                    Subscribed
                  </Badge>
                )}
              </div>
              <Badge
                variant={model.price === "free" ? "secondary" : "default"}
                className="uppercase text-[10px] tracking-wide flex-shrink-0"
              >
                {model.price}
              </Badge>
            </div>
            {model.categories.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{model.categories.length - 2} more
              </p>
            )}
            <h3 className="font-heading font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
              {model.name}
            </h3>
            <p className="text-xs text-muted-foreground">by {publisherDisplay}</p>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {model.shortDescription}
          </p>

          <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-auto pt-4 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span>{model.stats.accuracy !== null ? `${model.stats.accuracy}% Acc` : 'N/A Acc'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{model.stats.responseTime !== null ? `${model.stats.responseTime}ms` : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="w-3.5 h-3.5" />
              <span>{formatCount(model.stats.views)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Download className="w-3.5 h-3.5" />
              <span>{formatCount(model.stats.downloads)}</span>
            </div>
          </div>
        </CardContent>
      </HolographicCard>
    </Link>
  );
}
