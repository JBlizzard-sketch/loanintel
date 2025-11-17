import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RegionalMetrics {
  region: string;
  totalBranches: number;
  totalDisbursed: number;
  totalCollected: number;
  collectionRate: number;
  avgParPercent: number;
  activeCustomers: number;
}

export default function RegionalAnalytics() {
  const { data: regions, isLoading } = useQuery<RegionalMetrics[]>({
    queryKey: ["/api/analytics/regional"],
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Regional Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Performance comparison across all regions
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {regions?.map((region) => (
            <Card key={region.region} data-testid={`card-region-${region.region}`} className="hover-elevate">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {region.region}
                  </CardTitle>
                  <Badge variant={
                    region.collectionRate >= 90 ? "default" :
                    region.collectionRate >= 75 ? "secondary" :
                    "destructive"
                  }>
                    {region.collectionRate.toFixed(1)}%
                  </Badge>
                </div>
                <CardDescription>
                  {region.totalBranches} branches | {region.activeCustomers.toLocaleString()} customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Disbursed</span>
                    <span className="text-sm font-semibold">
                      KSh {(region.totalDisbursed / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Collected</span>
                    <span className="text-sm font-semibold">
                      KSh {(region.totalCollected / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg PAR %</span>
                    <span className="text-sm font-semibold">
                      {region.avgParPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Avg per branch: KSh {(region.totalDisbursed / region.totalBranches / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
