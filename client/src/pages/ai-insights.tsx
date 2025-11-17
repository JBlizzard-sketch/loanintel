import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2, TrendingUp, Shield, MessageSquare, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface Insight {
  id: string;
  agentType: string;
  query: string;
  response: string;
  confidence: number;
  timestamp: string;
}

const agentTypes = [
  {
    id: "analysis",
    name: "Analysis Agent",
    icon: BarChart3,
    description: "Deep dive into operational metrics and trends",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  {
    id: "fraud",
    name: "Fraud Validation Agent",
    icon: Shield,
    description: "Explain ML fraud detection decisions",
    color: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
  {
    id: "forecast",
    name: "Forecasting Agent",
    icon: TrendingUp,
    description: "Predict future performance and trends",
    color: "bg-green-500/10 text-green-700 dark:text-green-400",
  },
  {
    id: "messaging",
    name: "Messaging Agent",
    icon: MessageSquare,
    description: "Generate CEO summaries and reports",
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
];

export default function AIInsights() {
  const [selectedAgent, setSelectedAgent] = useState("analysis");
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  const { data: recentInsights, isLoading } = useQuery<Insight[]>({
    queryKey: ["/api/insights/recent"],
  });

  const queryMutation = useMutation({
    mutationFn: async (data: { agentType: string; query: string }) => {
      return apiRequest<Insight>("/api/insights/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Query processed",
        description: "AI agent has generated insights",
      });
      setQuery("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Query failed",
        description: error.message || "Failed to process query",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      queryMutation.mutate({ agentType: selectedAgent, query: query.trim() });
    }
  };

  const selectedAgentInfo = agentTypes.find(a => a.id === selectedAgent);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground mt-1">
          Multi-agent system powered by Groq for deep operational intelligence
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {agentTypes.map(agent => {
          const Icon = agent.icon;
          const isSelected = selectedAgent === agent.id;
          return (
            <Card
              key={agent.id}
              className={`cursor-pointer transition-all hover-elevate ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedAgent(agent.id)}
              data-testid={`card-agent-${agent.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${agent.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Ask {selectedAgentInfo?.name}
          </CardTitle>
          <CardDescription>{selectedAgentInfo?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder={`Ask ${selectedAgentInfo?.name} a question about your operations...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={4}
              data-testid="textarea-query"
            />
            <Button
              type="submit"
              disabled={!query.trim() || queryMutation.isPending}
              data-testid="button-submit-query"
            >
              {queryMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Query
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-bold mb-4">Recent Insights</h2>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentInsights && recentInsights.length > 0 ? (
          <div className="space-y-4">
            {recentInsights.map(insight => {
              const agent = agentTypes.find(a => a.id === insight.agentType);
              const Icon = agent?.icon || Sparkles;
              return (
                <Card key={insight.id} data-testid={`card-insight-${insight.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${agent?.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{agent?.name}</CardTitle>
                          <CardDescription className="mt-1">{insight.query}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {(insight.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm whitespace-pre-wrap">{insight.response}</p>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {new Date(insight.timestamp).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
              <p className="text-muted-foreground">Ask a question to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
