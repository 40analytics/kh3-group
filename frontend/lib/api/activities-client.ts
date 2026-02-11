import { apiFetch } from './client';

export interface Activity {
  id: string;
  leadId: string;
  type: 'call' | 'note' | 'status_change' | 'email';
  content: string;
  metadata?: any;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface CreateActivityDto {
  type: 'call' | 'note' | 'status_change' | 'email';
  content: string;
  metadata?: any;
}

export const activitiesApi = {
  async getActivities(leadId: string, serverToken?: string): Promise<Activity[]> {
    return apiFetch(`/leads/${leadId}/activities`, {}, serverToken);
  },

  async createActivity(
    leadId: string,
    data: CreateActivityDto,
    serverToken?: string
  ): Promise<Activity> {
    return apiFetch(`/leads/${leadId}/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, serverToken);
  },

  async deleteActivity(
    leadId: string,
    activityId: string,
    serverToken?: string
  ): Promise<void> {
    return apiFetch(`/leads/${leadId}/activities/${activityId}`, {
      method: 'DELETE',
    }, serverToken);
  },
};
