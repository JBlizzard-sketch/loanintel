import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, AlertTriangle, Search, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FraudCase {
  customerId: string;
  customerName: string;
  nationalId: string;
  riskScore: number;
  defaultProb: number;
  fraudFlags: string[];
  mlConfidence: number;
  primaryBranch: string;
  region: string;
  lastLoanDate: string;
}

export default function FraudDetection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const { data: fraudCases, isLoading, refetch } = useQuery<FraudCase[]>({
    queryKey: ["/api/fraud/cases", riskFilter],
  });

  const filteredCases = fraudCases?.filter(c => 
    c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customerId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fraud Detection Center</h1>
          <p className="text-muted-foreground mt-1">
            XGBoost ML-powered fraud detection with multi-agent analysis
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" data-testid="button-refresh">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-48" data-testid="select-risk-filter">
            <SelectValue placeholder="Filter by risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cases</SelectItem>
            <SelectItem value="high">High Risk Only</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases && filteredCases.length > 0 ? (
            filteredCases.map((fraudCase) => (
              <Card key={fraudCase.customerId} data-testid={`card-fraud-${fraudCase.customerId}`} className="hover-elevate">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        {fraudCase.customerName}
                        <Badge variant={
                          fraudCase.riskScore >= 70 ? "destructive" :
                          fraudCase.riskScore >= 40 ? "default" :
                          "secondary"
                        }>
                          Risk: {fraudCase.riskScore}/100
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        ID: {fraudCase.customerId} | Branch: {fraudCase.primaryBranch} | {fraudCase.region}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        ML Confidence: {(fraudCase.mlConfidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Fraud Flags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {fraudCase.fraudFlags?.map((flag, idx) => (
                          <Badge key={idx} variant="outline" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Predictions
                      </h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm">Default Probability</span>
                          <span className="text-sm font-semibold">
                            {(fraudCase.defaultProb * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Last Loan</span>
                          <span className="text-sm font-semibold">
                            {new Date(fraudCase.lastLoanDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No fraud cases found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm ? "Try adjusting your search or filters" : "All systems running clean"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
