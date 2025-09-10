import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Phone, Mail, Users as UsersIcon } from 'lucide-react';
import { apiService, Lead, Activity } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const LeadEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignees, setAssignees] = useState<Array<{ id: string; username: string; role: 'admin' | 'sales_rep' }>>([]);
  const [assigneesLoading, setAssigneesLoading] = useState<boolean>(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState<boolean>(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    status: 'New' as 'New' | 'Contacted' | 'Qualified' | 'Closed',
    source: '',
    assignedTo: ''
  });

  useEffect(() => {
    if (id) {
      fetchLead();
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const fetchAssignees = async () => {
      if (!user || !token) {
        setAssigneesLoading(false);
        return;
      }
      try {
        if (user.role === 'admin') {
          const res = await apiService.getUsers(token, user.role);
          setAssignees(res.data);
        } else {
          setAssignees([{ id: user.id, username: user.username, role: user.role }]);
          if (!formData.assignedTo) {
            setFormData({ ...formData, assignedTo: user.username });
          }
        }
      } catch {
        setAssignees([]);
      } finally {
        setAssigneesLoading(false);
      }
    };
    fetchAssignees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!id || !user || !token) return;
      setActivitiesLoading(true);
      try {
        const resp = await apiService.getActivities(id, token, user.role, user.username);
        setActivities(resp.data);
      } catch {
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };
    if (id) fetchActivities();
  }, [id, user, token]);

  const fetchLead = async () => {
    if (!id || !user || !token) return;
    
    try {
      const response = await apiService.getLead(id, token, user.role, user.username);
      const leadData = response.data;
      setLead(leadData);
      setFormData({
        firstName: leadData.firstName,
        lastName: leadData.lastName,
        company: leadData.company,
        email: leadData.email,
        status: leadData.status,
        source: leadData.source,
        assignedTo: leadData.assignedTo
      });
    } catch (error: any) {
      if (error.message === 'Forbidden') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to edit this lead",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;
    
    setSaving(true);

    try {
      if (id) {
        // Edit existing lead
        await apiService.updateLead(id, formData, token, user.role, user.username);
        toast({
          title: "Success",
          description: "Lead updated successfully",
        });
      } else {
        // Create new lead
        if (user.role !== 'admin') {
          toast({
            title: "Access Denied",
            description: "Only admins can create new leads",
            variant: "destructive",
          });
          return;
        }
        await apiService.createLead(formData, token, user.role);
        toast({
          title: "Success",
          description: "Lead created successfully",
        });
      }
      navigate('/leads');
    } catch (error) {
      toast({
        title: "Error",
        description: id ? "Failed to update lead" : "Failed to create lead",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isCreating = !id;
  const canEdit = user?.role === 'admin' || (lead && lead.assignedTo === user?.username);

  if (!isCreating && !canEdit) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You don't have permission to edit this lead</p>
        <Button asChild className="mt-4">
          <Link to="/leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leads
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-8xl mx-auto">
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button asChild variant="ghost">
          <Link to={id ? `/leads/${id}` : '/leads'}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isCreating ? 'Create New Lead' : 'Edit Lead'}
          </h1>
          <p className="text-muted-foreground">
            {isCreating ? 'Add a new lead to the system' : 'Update lead information'}
          </p>
        </div>
      </div>
    
    
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {!isCreating && lead && (
          <div className="lg:col-span-2 space-y-6">
            <Card className="w-full max-w-5xl mx-auto">
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
                    <div className="mt-2">
                      <Badge>
                        {lead.status}
                      </Badge>
                    </div>
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

            <Card className="w-full max-w-5xl mx-auto">
              <CardHeader>
                <CardTitle>Activities</CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No activities recorded yet</p>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => {
                      const iconMap = { Call: Phone, Email: Mail, Meeting: UsersIcon } as const;
                      const IconComp = iconMap[activity.activityType];
                      return (
                        <div key={activity.id} className="flex space-x-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <IconComp className="h-4 w-4 text-primary" />
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {isCreating && (
          <div className="lg:col-span-1 w-full max-w-5xl mx-auto justify-center">
          </div>
        )}

        <div className="lg:col-span-1 w-full max-w-5xl mx-auto justify-center">
          <Card className="w-full max-w-2xl justify-center">
            <CardHeader className="p-6 justify-center">
              <CardTitle>{isCreating ? 'Lead Information' : 'Edit Lead Information'}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 justify-center">
              <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="justify-center">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="justify-center">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'New' | 'Contacted' | 'Qualified' | 'Closed') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Cold Call">Cold Call</SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                    <SelectItem value="Advertisement">Advertisement</SelectItem>
                    <SelectItem value="Trade Show">Trade Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                disabled={user?.role !== 'admin' || assigneesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={assigneesLoading ? 'Loading...' : 'Select assignee'} />
                </SelectTrigger>
                <SelectContent>
                  {assignees.map((u) => (
                    <SelectItem key={u.id} value={u.username}>{u.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : (isCreating ? 'Create Lead' : 'Update Lead')}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={id ? `/leads/${id}` : '/leads'}>
                  Cancel
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    
    {isCreating && (
      <div className="lg:col-span-1 w-full max-w-5xl mx-auto justify-center">
      </div>
    )}
    </div>
    </div>
    </div>
  );
};

export default LeadEdit;