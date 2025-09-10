import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, UserPlus, BarChart3, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalLeads: 0,
    myLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0
  });
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState<
    Array<{ id: string; leadId: string; activityType: string; notes: string; timestamp: string; createdBy?: string; leadName: string }>
  >([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !token) return;
      
      try {
        const res = await fetch(`${API_BASE_URL}/leads`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to fetch leads');
        }

        const data = await res.json();
        const leads = data.leads || [];
        
        setStats({
          totalLeads: leads.length,
          myLeads: user.role === 'admin' ? leads.length : leads.filter((l: any) => l.assignedTo === user.username).length,
          newLeads: leads.filter((l: any) => l.status === 'New').length,
          qualifiedLeads: leads.filter((l: any) => l.status === 'Qualified').length
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, token]);

  useEffect(() => {
    const loadActivities = async () => {
      if (!user || !token) return;
      setActivitiesLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/leads`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          setRecentActivities([]);
          return;
        }
        const data = await res.json();
        const leads = (data.leads || []) as Array<{ id: string; firstName: string; lastName: string }>;
        const subset = leads.slice(0, 10);
        const results = await Promise.all(
          subset.map(async (lead) => {
            try {
              const resp = await fetch(`${API_BASE_URL}/leads/${lead.id}/activities`, {
                headers: { 'Authorization': `Bearer ${token}` },
              });
              if (!resp.ok) return [] as any[];
              const d = await resp.json();
              const acts: any[] = d.activities || [];
              return acts.map((a) => ({ ...a, leadName: `${lead.firstName} ${lead.lastName}` }));
            } catch {
              return [] as any[];
            }
          })
        );
        const flat = results
          .flat()
          .filter((a) => !a.createdBy || a.createdBy === user.username)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivities(flat.slice(0, 3));
      } finally {
        setActivitiesLoading(false);
      }
    };
    loadActivities();
  }, [user, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your CRM today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/leads/" className="block">
        <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user?.role === 'admin' ? 'Total Leads' : 'My Leads'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myLeads}</div>
            <p className="text-xs text-muted-foreground">
              {user?.role === 'admin' ? 'All leads in system' : 'Assigned to you'}
            </p>
          </CardContent>
        </Card>
        </Link>

        <Link to="/leads/new-leads" className="block">
        <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newLeads}</div>
            <p className="text-xs text-muted-foreground">
              Leads to be contacted
            </p>
          </CardContent>
        </Card>
        </Link>

        <Link to="/leads/qualified" className="block">
        <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qualifiedLeads}</div>
            <p className="text-xs text-muted-foreground">
              Ready for conversion
            </p>
          </CardContent>
        </Card>
        </Link>

        <Link to="/leads/conversion-rate" className="block">
        <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalLeads > 0 ? Math.round((stats.qualifiedLeads / stats.totalLeads) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Lead to qualified ratio
            </p>
          </CardContent>
        </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you can perform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link to="/leads">
                <Users className="mr-2 h-4 w-4" />
                View All Leads
              </Link>
            </Button>
            {user?.role === 'admin' && (
              <>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/leads/new">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create New Lead
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/users">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates in your CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : recentActivities.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent activity</div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 mt-1 bg-primary rounded-full"></div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{act.leadName}</span>: {act.activityType}
                      </p>
                      {act.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{act.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(act.timestamp).toLocaleString()}
                        {act.createdBy ? ` • by ${act.createdBy}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;