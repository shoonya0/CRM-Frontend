import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, UserCheck, Users as UsersIcon } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface DisplayUser {
  id: string;
  username: string;
  role: 'admin' | 'sales_rep';
}

const UsersList = () => {
  const { user, token, tokenClaims } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<DisplayUser | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'sales_rep' as 'admin' | 'sales_rep'
  });

  const isAdmin = tokenClaims?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchUsers = async () => {
    if (!token || !isAdmin) return;
    
    try {
      const response = await apiService.getUsers(token, tokenClaims?.role || 'sales_rep');
      setUsers(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isAdmin) return;

    try {
      if (editingUser) {
        const response = await apiService.updateUser(
          editingUser.id,
          { username: formData.username, role: formData.role },
          token,
          tokenClaims?.role || 'sales_rep'
        );
        setUsers(users.map(u => u.id === editingUser.id ? response.data : u));
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        const response = await apiService.createUser(formData, token, tokenClaims?.role || 'sales_rep');
        setUsers([...users, response.data]);
        toast({
          title: "Success",
          description: "User created successfully",
        });
      }
      
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: editingUser ? "Failed to update user" : "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!token || !isAdmin) return;
    
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiService.deleteUser(userId, token, tokenClaims?.role || 'sales_rep');
      setUsers(users.filter(u => u.id !== userId));
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ username: '', password: '', role: 'sales_rep' });
    setShowCreateForm(false);
    setEditingUser(null);
  };

  const openEditForm = (userToEdit: DisplayUser) => {
    setFormData({
      username: userToEdit.username,
      password: '',
      role: userToEdit.role
    });
    setEditingUser(userToEdit);
    setShowCreateForm(true);
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">
            Manage system users and their permissions
          </p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Update user information and role.' : 'Add a new user to the system.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                {!editingUser && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'admin' | 'sales_rep') => 
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="sales_rep">Sales Rep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingUser ? 'Update User' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Username</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userData) => (
                  <tr key={userData.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          {userData.role === 'admin' ? (
                            <UserCheck className="h-4 w-4 text-primary" />
                          ) : (
                            <UsersIcon className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <span className="font-medium">{userData.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'}>
                        {userData.role === 'admin' ? 'Admin' : 'Sales Rep'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(userData)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(userData.id)}
                          disabled={userData.id === (tokenClaims?.id || user?.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersList;