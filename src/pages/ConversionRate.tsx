import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL, Lead } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';

const ConversionRate: React.FC = () => {
  const { user, token } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState<
    Array<{ id: string; leadId: string; activityType: string; notes: string; timestamp: string; createdBy?: string; leadName: string }>
  >([]);

  useEffect(() => {
    const load = async () => {
      if (!user || !token) return;
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/leads`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to fetch leads');
        }

        const data = await response.json();
        const backendLeads: Lead[] = (data.leads || []) as Lead[];
        setLeads(backendLeads);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch leads');
      }
    };
    load();
  }, [user, token]);

  const metrics = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter(l => l.status === 'Contacted' || l.status === 'Qualified' || l.status === 'Closed').length;
    const qualified = leads.filter(l => l.status === 'Qualified' || l.status === 'Closed').length;
    const closed = leads.filter(l => l.status === 'Closed').length;

    const contactedRate = total === 0 ? 0 : Math.round((contacted / total) * 100);
    const qualificationRate = contacted === 0 ? 0 : Math.round((qualified / contacted) * 100);
    const winRate = qualified === 0 ? 0 : Math.round((closed / qualified) * 100);
    const overallRate = total === 0 ? 0 : Math.round((closed / total) * 100);

    return { total, contacted, qualified, closed, contactedRate, qualificationRate, winRate, overallRate };
  }, [leads]);

  const stageData = useMemo(() => {
    const newCount = leads.filter(l => l.status === 'New').length;
    const contactedCount = leads.filter(l => l.status === 'Contacted').length;
    const qualifiedCount = leads.filter(l => l.status === 'Qualified').length;
    const closedCount = leads.filter(l => l.status === 'Closed').length;
    return [
      { stage: 'New', count: newCount },
      { stage: 'Contacted', count: contactedCount },
      { stage: 'Qualified', count: qualifiedCount },
      { stage: 'Closed', count: closedCount },
    ];
  }, [leads]);

  const chartConfig = {
    count: {
      label: 'Leads',
      color: 'hsl(var(--primary))',
    },
  } as const;

  const pieChartConfig = {
    new: { label: 'New', color: 'hsl(var(--status-new))' },
    contacted: { label: 'Contacted', color: 'hsl(var(--status-contacted))' },
    qualified: { label: 'Qualified', color: 'hsl(var(--status-qualified))' },
    closed: { label: 'Closed', color: 'hsl(var(--status-closed))' },
  } as const;

  const pieData = useMemo(() => {
    return stageData
      .map((d) => ({ ...d, key: d.stage.toLowerCase() }))
      .filter((d) => d.count > 0);
  }, [stageData]);

  useEffect(() => {
    const loadActivities = async () => {
      if (!user || !token || leads.length === 0) return;
      setActivitiesLoading(true);
      try {
        const subset = leads.slice(0, 10);
        const results = await Promise.all(
          subset.map(async (lead) => {
            try {
              const resp = await fetch(`${API_BASE_URL}/leads/${lead.id}/activities`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!resp.ok) return [] as any[];
              const data = await resp.json();
              const acts: any[] = data.activities || [];
              return acts.map((a) => ({ ...a, leadName: `${lead.firstName} ${lead.lastName}` }));
            } catch {
              return [] as any[];
            }
          })
        );
        const flat = results.flat().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivities(flat.slice(0, 7));
      } finally {
        setActivitiesLoading(false);
      }
    };
    loadActivities();
  }, [leads, token, user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Conversion Rate</h1>
        <p className="text-muted-foreground">Overview of funnel performance</p>
      </div>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contacted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.contacted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Qualified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.qualified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.closed}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Stage Conversion</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Contacted Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.contactedRate}%</div>
              <div className="text-xs text-muted-foreground">Contacted / Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Qualification Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.qualificationRate}%</div>
              <div className="text-xs text-muted-foreground">Qualified / Contacted</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.winRate}%</div>
              <div className="text-xs text-muted-foreground">Closed / Qualified</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Overall Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.overallRate}%</div>
              <div className="text-xs text-muted-foreground">Closed / Total</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Leads by Stage</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <ChartContainer config={chartConfig} className="w-full h-[300px]">
                <BarChart data={stageData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="stage" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent labelKey="stage" />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader> <CardTitle>Pie Chart</CardTitle> </CardHeader>
            <CardContent className="">
              <ChartContainer config={pieChartConfig} className="w-full h-[300px]">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="stage"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.stage} fill={`var(--color-${entry.key})`} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent labelKey="stage" />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConversionRate;


