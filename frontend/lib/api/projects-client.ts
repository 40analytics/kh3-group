const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface Project {
  id: string;
  name: string;
  clientId: string;
  client?: {
    id: string;
    name: string;
  };
  leadId?: string;
  lead?: {
    id: string;
    contactName: string;
    company: string;
  };
  status: string; // 'Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'
  value: number;
  startDate?: string;
  completedDate?: string;
  description?: string;
  projectManagerId?: string;
  projectManager?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  clientId: string;
  leadId?: string;
  status: string;
  value: number;
  startDate?: string;
  completedDate?: string;
  description?: string;
  projectManagerId?: string;
}

// Client-side only - synchronous cookie reading
function getTokenFromClientCookies(): string | null {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'token') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

export const projectsApi = {
  async getByClient(clientId: string): Promise<Project[]> {
    const token = getTokenFromClientCookies();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/projects/client/${clientId}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    return response.json();
  },

  async getById(id: string): Promise<Project> {
    const token = getTokenFromClientCookies();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/projects/${id}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }

    return response.json();
  },

  async create(data: CreateProjectDto): Promise<Project> {
    const token = getTokenFromClientCookies();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create project: ${error}`);
    }

    return response.json();
  },

  async update(id: string, data: Partial<CreateProjectDto>): Promise<Project> {
    const token = getTokenFromClientCookies();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update project: ${error}`);
    }

    return response.json();
  },

  async delete(id: string): Promise<void> {
    const token = getTokenFromClientCookies();

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  },

  async convertLead(
    leadId: string,
    clientId: string,
    projectManagerId?: string
  ): Promise<Project> {
    const token = getTokenFromClientCookies();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/projects/convert-lead/${leadId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ clientId, projectManagerId }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to convert lead: ${error}`);
    }

    return response.json();
  },
};
