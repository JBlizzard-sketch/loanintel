import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle, PiggyBank } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendChart } from "@/components/charts/trend-chart";

interface DashboardMetrics {
  totalDisbursed: number;
  totalDisbursedChange: number;
  collectionRate: number;
  collectionRateChange: number;
  totalArrears: number;
  totalArrearsChange: number;
  parRate: number;
  parRateChange: number;
  activeCustomers: number;
  activeLoans: number;
  topPerformingBranches: Array<{
    branchId: string;
    branchName: string;
    region: string;
    collectionRate: number;
    disbursedAmount: number;
  }>;
  recentAlerts: Array<{
    customerId: string;
    customerName: string;
    type: string;
    severity: string;
    timestamp: string;
  }>;
  trendData?: {
    labels: string[];
    disbursements: number[];
    collections: number[];
  };
}

function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon,
  format = "number",
  testId
}: { 
  title: string; 
  value: number; 
  change: number; 
  icon: any;
  format?: "number" | "currency" | "percent";
  testId: string;
}) {
  const isPositive = change >= 0;
  const formattedValue = 
    format === "currency" ? `KSh ${value.toLocaleString()}` :
    format === "percent" ? `${value.toFixed(2)}%` :
    value.toLocaleString();

  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold" data-testid={`${testId}-value`}>
          {formattedValue}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-chart-2" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
          <span className={`text-xs font-medium ${isPositive ? 'text-chart-2' : 'text-destructive'}`}>
            {Math.abs(change).toFixed(2)}% from last month
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CEO Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time operational intelligence and performance metrics
        </p>
      </div>

      {metrics && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Disbursed"
              value={metrics.totalDisbursed}
              change={metrics.totalDisbursedChange}
              icon={DollarSign}
              format="currency"
              testId="card-total-disbursed"
            />
            <MetricCard
              title="Collection Rate"
              value={metrics.collectionRate}
              change={metrics.collectionRateChange}
              icon={TrendingUp}
              format="percent"
              testId="card-collection-rate"
            />
            <MetricCard
              title="Total Arrears"
              value={metrics.totalArrears}
              change={metrics.totalArrearsChange}
              icon={AlertTriangle}
              format="currency"
              testId="card-total-arrears"
            />
            <MetricCard
              title="PAR Rate"
              value={metrics.parRate}
              change={metrics.parRateChange}
              icon={PiggyBank}
              format="percent"
              testId="card-par-rate"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card data-testid="card-top-branches">
              <CardHeader>
                <CardTitle>Top Performing Branches</CardTitle>
                <CardDescription>Based on collection rate and disbursement volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.topPerformingBranches?.slice(0, 5).map((branch, idx) => (
                    <div key={branch.branchId} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold flex-shrink-0">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate" data-testid={`text-branch-name-${idx}`}>
                            {branch.branchName}
                          </p>
                          <p className="text-sm text-muted-foreground">{branch.region}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">{Number(branch.collectionRate).toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">
                          KSh {(Number(branch.disbursedAmount) / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-recent-alerts">
              <CardHeader>
                <CardTitle>Recent Fraud Alerts</CardTitle>
                <CardDescription>High-risk cases requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.recentAlerts?.slice(0, 5).map((alert, idx) => (
                    <div key={`${alert.customerId}-${idx}`} className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium truncate" data-testid={`text-customer-name-${idx}`}>
                          {alert.customerName}
                        </p>
                        <p className="text-sm text-muted-foreground">{alert.type}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          alert.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                          alert.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {metrics.trendData && (
            <Card data-testid="card-trends">
              <CardHeader>
                <CardTitle>Weekly Performance Trends</CardTitle>
                <CardDescription>Disbursements vs Collections (Last 7 Days)</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart
                  title="Weekly Trends"
                  labels={metrics.trendData.labels}
                  datasets={[
                    {
                      label: "Disbursements (KSh)",
                      data: metrics.trendData.disbursements,
                    },
                    {
                      label: "Collections (KSh)",
                      data: metrics.trendData.collections,
                    },
                  ]}
                />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Health</CardTitle>
                <CardDescription>Active loans and customer metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Active Customers</span>
                    </div>
                    <span className="text-2xl font-bold" data-testid="text-active-customers">
                      {metrics.activeCustomers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PiggyBank className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Active Loans</span>
                    </div>
                    <span className="text-2xl font-bold" data-testid="text-active-loans">
                      {metrics.activeLoans.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Fraud detection and AI model performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">XGBoost Model</span>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-chart-2/10 text-chart-2">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Groq AI Agents</span>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-chart-2/10 text-chart-2">
                      Operational
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
