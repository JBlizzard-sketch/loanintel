import { 
  LayoutDashboard, 
  Shield, 
  TrendingUp, 
  Users, 
  Upload,
  Building2,
  BarChart3
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "CEO Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Fraud Detection",
    url: "/fraud",
    icon: Shield,
  },
  {
    title: "Branch Performance",
    url: "/branches",
    icon: Building2,
  },
  {
    title: "Regional Analytics",
    url: "/regions",
    icon: BarChart3,
  },
  {
    title: "Customer 360",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Data Upload",
    url: "/upload",
    icon: Upload,
  },
  {
    title: "AI Insights",
    url: "/insights",
    icon: TrendingUp,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">OptiLend</h1>
            <p className="text-xs text-muted-foreground">Intelligence Platform</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Analytics & Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
