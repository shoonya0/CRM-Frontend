import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { apiService, Lead } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const statusColors = {
  New: 'bg-status-new text-white',
  Contacted: 'bg-status-contacted text-black',
  Qualified: 'bg-status-qualified text-white',
  Closed: 'bg-status-closed text-white'
};

interface LeadsListProps {
  filter?: 'my' | 'new' | 'qualified';
}

const LeadsList: React.FC<LeadsListProps> = ({ filter }) => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    let current = leads;

    // route-based filtering
    if (filter === 'my' && user) {
      current = current.filter(lead => lead.assignedTo === user.username);
    }
    if (filter === 'new') {
      current = current.filter(lead => lead.status === 'New');
    }
    if (filter === 'qualified') {
      current = current.filter(lead => lead.status === 'Qualified');
    }

    // search filtering
    const searched = current.filter(lead =>
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLeads(searched);
  }, [leads, searchTerm, filter, user]);

  const fetchLeads = async () => {
    if (!user || !token) return;
    
    try {
      const response = await apiService.getLeads(token, user.role, user.username);
      setLeads(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!user || !token || user.role !== 'admin') return;
    
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      await apiService.deleteLead(leadId, token, user.role);
      setLeads(leads.filter(lead => lead.id !== leadId));
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lead",
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{filter === 'my' ? 'My Leads' : filter === 'new' ? 'New Leads' : filter === 'qualified' ? 'Qualified Leads' : 'Leads'}</h1>
          <p className="text-muted-foreground">
            Manage your leads and track their progress
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button asChild>
            <Link to="/leads/new">
              <Plus className="mr-2 h-4 w-4" />
              New Lead
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Leads: {filteredLeads.length}</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Company</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Source</th>
                  <th className="text-left py-3 px-4 font-medium">Assigned To</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="font-medium">
                        {lead.firstName} {lead.lastName}
                      </div>
                    </td>
                    <td className="py-3 px-4">{lead.company}</td>
                    <td className="py-3 px-4 text-muted-foreground">{lead.email}</td>
                    <td className="py-3 px-4">
                      <Badge className={statusColors[lead.status]}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{lead.source}</td>
                    <td className="py-3 px-4">{lead.assignedTo}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/leads/${lead.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {(user?.role === 'admin' || lead.assignedTo === user?.username) && (
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/leads/${lead.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {user?.role === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(lead.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLeads.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No leads found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsList;