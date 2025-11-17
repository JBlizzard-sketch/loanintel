import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, TrendingUp, Users, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BranchPerformance {
  branchId: string;
  branchName: string;
  region: string;
  dailyTarget: number;
  dailyCollected: number;
  disbursedAmount: number;
  arrearsAmount: number;
  parPercent: number;
  collectionRate: number;
  recruitedToday: number;
}

export default function BranchPerformance() {
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("daily");

  const { data: branches, isLoading: branchesLoading } = useQuery<{ branchId: string; branchName: string; region: string }[]>({
    queryKey: ["/api/branches/list"],
  });

  const { data: performance, isLoading: performanceLoading } = useQuery<BranchPerformance[]>({
    queryKey: ["/api/branches/performance", selectedBranch, timeRange],
  });

  const isLoading = branchesLoading || performanceLoading;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branch Performance</h1>
          <p className="text-muted-foreground mt-1">
            Real-time performance metrics and analytics by branch
          </p>
        </div>
        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger className="w-64" data-testid="select-branch">
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches?.map(branch => (
              <SelectItem key={branch.branchId} value={branch.branchId}>
                {branch.branchName} - {branch.region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={timeRange} onValueChange={setTimeRange} className="w-full">
        <TabsList data-testid="tabs-timerange">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value={timeRange} className="space-y-6 mt-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : performance && performance.length > 0 ? (
            <div className="space-y-6">
              {performance.map(branch => (
                <Card key={branch.branchId} data-testid={`card-branch-${branch.branchId}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <CardTitle className="flex items-center gap-3">
                          <Building2 className="h-5 w-5" />
                          {branch.branchName}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {branch.region} | Collection Rate: {branch.collectionRate.toFixed(1)}%
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {((branch.dailyCollected / branch.dailyTarget) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">of target</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          Disbursed
                        </div>
                        <div className="text-xl font-bold">
                          KSh {(branch.disbursedAmount / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          Collected
                        </div>
                        <div className="text-xl font-bold">
                          KSh {(branch.dailyCollected / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          Recruited
                        </div>
                        <div className="text-xl font-bold">
                          {branch.recruitedToday}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">PAR %</div>
                        <div className="text-xl font-bold">
                          {branch.parPercent.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No performance data available</h3>
                <p className="text-muted-foreground">Select a different branch or time range</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
