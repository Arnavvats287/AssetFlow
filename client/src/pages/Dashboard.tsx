import { useDashboardStats } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Box, CheckCircle2, AlertTriangle, UserCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useTheme } from "@/hooks/use-theme"; // Placeholder, assuming context or just basic
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  
  const cardData = [
    {
      title: "Total Assets",
      value: stats?.totalAssets || 0,
      icon: Box,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      desc: "All registered items"
    },
    {
      title: "Available",
      value: stats?.availableAssets || 0,
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10",
      desc: "Ready to assign"
    },
    {
      title: "Assigned",
      value: stats?.assignedAssets || 0,
      icon: UserCheck,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      desc: "Currently in use"
    },
    {
      title: "Maintenance",
      value: stats?.maintenanceAssets || 0,
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      desc: "Requires attention"
    },
  ];

  const chartData = [
    { name: 'Available', value: stats?.availableAssets || 0, color: '#22c55e' },
    { name: 'Assigned', value: stats?.assignedAssets || 0, color: '#6366f1' },
    { name: 'Maintenance', value: stats?.maintenanceAssets || 0, color: '#f59e0b' },
  ];

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your asset inventory and status.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cardData.map((card, idx) => (
          <Card key={idx} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Asset Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
