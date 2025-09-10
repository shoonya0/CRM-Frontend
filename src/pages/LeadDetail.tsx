import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit, Plus, Calendar, Phone, Mail, Users } from 'lucide-react';
import { apiService, Lead, Activity } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const statusColors = {
  New: 'bg-status-new text-white',
  Contacted: 'bg-status-contacted text-black',
  Qualified: 'bg-status-qualified text-white',
  Closed: 'bg-status-closed text-white'
};

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivityForm, setShowActivityForm] = useState(false);
  
  const [newActivity, setNewActivity] = useState({
    activityType: 'Call' as 'Call' | 'Email' | 'Meeting',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      fetchLeadData();
    }
  }, [id]);

  const fetchLeadData = async () => {
    if (!id || !user || !token) return;
    
    try {
      const [leadResponse, activitiesResponse] = await Promise.all([
        apiService.getLead(id, token, user.role, user.username),
        apiService.getActivities(id, token, user.role, user.username)
      ]);
      
      setLead(leadResponse.data);
      setActivities(activitiesResponse.data);
    } catch (error: any) {
      if (error.message === 'Forbidden') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this lead",
          variant: "destructive",
        });
        navigate('/leads');
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch lead data",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !token) return;

    try {
      const response = await apiService.createActivity(
        {
          leadId: id,
          activityType: newActivity.activityType,
          notes: newActivity.notes,
          timestamp: new Date().toISOString()
        },
        token,
        user.role,
        user.username
      );

      setActivities([response.data, ...activities]);
      setNewActivity({ activityType: 'Call', notes: '' });
      setShowActivityForm(false);
      
      toast({
        title: "Success",
        description: "Activity added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add activity",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Lead not found</p>
        <Button asChild className="mt-4">
          <Link to="/leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leads
          </Link>
        </Button>
      </div>
    );
  }

  const canEdit = user?.role === 'admin' || lead.assignedTo === user?.username;
  const activityIcons = {
    Call: Phone,
    Email: Mail,
    Meeting: Users
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="ghost">
            <Link to="/leads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Leads
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {lead.firstName} {lead.lastName}
            </h1>
            <p className="text-muted-foreground">{lead.company}</p>
          </div>
        </div>
        {canEdit && (
          <Button asChild>
            <Link to={`/leads/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Lead
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="text-lg font-medium">{lead.firstName} {lead.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                  <p className="text-lg font-medium">{lead.company}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-lg font-medium">{lead.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-2">  </div>
                  <Badge className={statusColors[lead.status]}>
                    {lead.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Source</Label>
                  <p className="text-lg font-medium">{lead.source}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
                  <p className="text-lg font-medium">{lead.assignedTo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activities</CardTitle>
              {canEdit && (
                <Button
                  onClick={() => setShowActivityForm(!showActivityForm)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Activity
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {showActivityForm && (
                <form onSubmit={handleAddActivity} className="mb-6 p-4 border rounded-lg space-y-4">
                  <div>
                    <Label htmlFor="activityType">Activity Type</Label>
                    <Select
                      value={newActivity.activityType}
                      onValueChange={(value: 'Call' | 'Email' | 'Meeting') => 
                        setNewActivity({ ...newActivity, activityType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Call">Call</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Meeting">Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newActivity.notes}
                      onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
                      placeholder="Enter activity notes..."
                      required
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit">Add Activity</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowActivityForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {activities.map((activity) => {
                  const IconComponent = activityIcons[activity.activityType];
                  return (
                    <div key={activity.id} className="flex space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <IconComponent className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{activity.activityType}</h4>
                          <time className="text-sm text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </time>
                        </div>
                        <p className="text-muted-foreground mt-1">{activity.notes}</p>
                      </div>
                    </div>
                  );
                })}
                {activities.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No activities recorded yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Activities</span>
                  <span className="font-medium">{activities.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Contact</span>
                  <span className="font-medium">
                    {activities.length > 0 
                      ? new Date(activities[0].timestamp).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Lead Age</span>
                  <span className="font-medium">2 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;