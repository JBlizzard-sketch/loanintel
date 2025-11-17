import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, MapPin, Briefcase, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Customer {
  customerId: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  primaryBranch: string;
  region: string;
  businessType: string;
  age: number;
  gender: string;
  monthlyIncomeBand: string;
  historicalCycles: number;
  avgWeeklyCash: number;
  riskScore: number;
  defaultProb: number;
  churnProb: number;
  recommendedLimit: number;
  totalLoans: number;
  activeLoans: number;
  fraudFlags: string[];
}

export default function Customer360() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const { data: searchResults, isLoading: searchLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers/search", searchTerm],
    enabled: searchTerm.length >= 3,
  });

  const { data: customerDetails, isLoading: detailsLoading } = useQuery<Customer>({
    queryKey: ["/api/customers", selectedCustomer],
    enabled: !!selectedCustomer,
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer 360 View</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive customer profiles with AI-powered insights
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer name, ID, or national ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-customer-search"
        />
      </div>

      {searchLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {searchResults && searchResults.length > 0 && !selectedCustomer && (
        <div className="space-y-2">
          {searchResults.map(customer => (
            <Card
              key={customer.customerId}
              className="cursor-pointer hover-elevate"
              onClick={() => setSelectedCustomer(customer.customerId)}
              data-testid={`card-customer-${customer.customerId}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  {customer.firstName} {customer.lastName}
                  <Badge variant={
                    customer.riskScore >= 70 ? "destructive" :
                    customer.riskScore >= 40 ? "default" :
                    "secondary"
                  }>
                    Risk: {customer.riskScore}/100
                  </Badge>
                </CardTitle>
                <CardDescription>
                  ID: {customer.customerId} | National ID: {customer.nationalId} | {customer.primaryBranch}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {selectedCustomer && detailsLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      )}

      {customerDetails && (
        <div className="space-y-6">
          <Card data-testid="card-customer-details">
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-2xl">
                    {customerDetails.firstName} {customerDetails.lastName}
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Customer ID: {customerDetails.customerId} | National ID: {customerDetails.nationalId}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Recommended Limit</div>
                  <div className="text-3xl font-bold text-primary">
                    KSh {customerDetails.recommendedLimit.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Demographics
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {customerDetails.age} years, {customerDetails.gender === 'M' ? 'Male' : 'Female'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{customerDetails.region}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{customerDetails.businessType}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Financial Profile
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Income Band</span>
                      <span className="text-sm font-medium">{customerDetails.monthlyIncomeBand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Weekly Cash</span>
                      <span className="text-sm font-medium">
                        KSh {customerDetails.avgWeeklyCash.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Historical Cycles</span>
                      <span className="text-sm font-medium">{customerDetails.historicalCycles}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Loan Portfolio
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Loans</span>
                      <span className="text-sm font-medium">{customerDetails.totalLoans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active Loans</span>
                      <span className="text-sm font-medium">{customerDetails.activeLoans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Primary Branch</span>
                      <span className="text-sm font-medium">{customerDetails.primaryBranch}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Risk Score</span>
                    <span className="text-sm font-medium">{customerDetails.riskScore}/100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        customerDetails.riskScore >= 70 ? 'bg-destructive' :
                        customerDetails.riskScore >= 40 ? 'bg-yellow-500' :
                        'bg-chart-2'
                      }`}
                      style={{ width: `${customerDetails.riskScore}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Default Probability</span>
                    <span className="text-sm font-semibold">
                      {(customerDetails.defaultProb * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Churn Probability</span>
                    <span className="text-sm font-semibold">
                      {(customerDetails.churnProb * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Fraud Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customerDetails.fraudFlags && customerDetails.fraudFlags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {customerDetails.fraudFlags.map((flag, idx) => (
                      <Badge key={idx} variant="outline">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No fraud indicators detected
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!searchLoading && !selectedCustomer && searchTerm.length >= 3 && (!searchResults || searchResults.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No customers found</h3>
            <p className="text-muted-foreground">Try a different search term</p>
          </CardContent>
        </Card>
      )}

      {!searchLoading && !selectedCustomer && searchTerm.length < 3 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search for a customer</h3>
            <p className="text-muted-foreground">Enter at least 3 characters to search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
