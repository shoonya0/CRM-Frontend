// Global API URL prefix - can be configured by adding prefix/suffix
let baseUrl = 'https://crm-backend-zeta-eight.vercel.app/';
if(baseUrl) {
  baseUrl = baseUrl + '/api';
}

export const API_BASE_URL = baseUrl || '/api';

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'sales_rep';
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Closed';
  source: string;
  assignedTo: string;
}

export interface Activity {
  id: string;
  leadId: string;
  activityType: 'Call' | 'Email' | 'Meeting';
  notes: string;
  timestamp: string;
}
 
// Real API functions that call the backend server
export const apiService = {
  // Auth
  async login(username: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          token: data.token,
          user: data.user
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Login failed');
    }
  },

  async register(username: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          user: data.user,
          message: data.message
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Registration failed');
    }
  },

  // Leads
  async getLeads(token: string, _userRole?: string, _username?: string) {
    const response = await fetch(`${API_BASE_URL}/leads`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch leads');
    }
    const data = await response.json();
    return { success: true, data: (data.leads || []) as Lead[] };
  },

  async getLead(id: string, token: string, _userRole?: string, _username?: string) {
    const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch lead');
    }
    const data = await response.json();
    return { success: true, data: data.lead as Lead };
  },

  async createLead(leadData: Omit<Lead, 'id'>, token: string, _userRole?: string) {
    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(leadData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create lead');
    }
    const data = await response.json();
    return { success: true, data: data.lead as Lead };
  },

  async updateLead(id: string, updates: Partial<Lead>, token: string, _userRole?: string, _username?: string) {
    const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update lead');
    }
    const data = await response.json();
    return { success: true, data: data.lead as Lead };
  },

  async deleteLead(id: string, token: string, _userRole?: string) {
    const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete lead');
    }
    return { success: true };
  },

  // Activities
  async getActivities(leadId: string, token: string, _userRole?: string, _username?: string) {
    const response = await fetch(`${API_BASE_URL}/leads/${leadId}/activities`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch activities');
    }
    const data = await response.json();
    return { success: true, data: (data.activities || []) as Activity[] };
  },

  async createActivity(activityData: Omit<Activity, 'id'>, token: string, _userRole?: string, _username?: string) {
    const response = await fetch(`${API_BASE_URL}/leads/${activityData.leadId}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ activityType: activityData.activityType, notes: activityData.notes }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create activity');
    }
    const data = await response.json();
    return { success: true, data: data.activity as Activity };
  },

  // Users (Admin only)
  async getUsers(token: string, _userRole?: string) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch users');
    }
    const data = await response.json();
    return { success: true, data: (data.users || []).map((u: any) => ({ id: u.id, username: u.username, role: u.role })) as User[] };
  },

  async createUser(userData: Omit<User, 'id'>, token: string, _userRole?: string) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create user');
    }
    const data = await response.json();
    const u = data.user;
    return { success: true, data: { id: u.id, username: u.username, role: u.role } as any };
  },

  async updateUser(id: string, updates: Partial<User>, token: string, _userRole?: string) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update user');
    }
    const data = await response.json();
    const u = data.user;
    return { success: true, data: { id: u.id, username: u.username, role: u.role } };
  },

  async deleteUser(id: string, token: string, _userRole?: string) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete user');
    }
    return { success: true };
  }
};