import { supabase } from '../lib/supabase';

export type EntityType = 'building' | 'apartment' | 'payment';
export type ActionType = 'create' | 'update' | 'delete';

export const auditService = {
  async log(
    entityType: EntityType,
    entityId: string,
    actionType: ActionType,
    buildingId: string,
    oldData: any = null,
    newData: any = null
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('audit_logs').insert([
        {
          entity_type: entityType,
          entity_id: entityId,
          action_type: actionType,
          performed_by: user.id,
          building_id: buildingId,
          old_data: oldData,
          new_data: newData,
        },
      ]);

      if (error) {
        // In production, we might want to log this to a monitoring service
        // but we don't want to break the main flow.
        console.error('Audit logging failed:', error);
      }
    } catch (err) {
      console.error('Audit service error:', err);
    }
  },

  async logCreate(entityType: EntityType, entityId: string, buildingId: string, newData: any) {
    return this.log(entityType, entityId, 'create', buildingId, null, newData);
  },

  async logUpdate(entityType: EntityType, entityId: string, buildingId: string, oldData: any, newData: any) {
    return this.log(entityType, entityId, 'update', buildingId, oldData, newData);
  },

  async logDelete(entityType: EntityType, entityId: string, buildingId: string, oldData: any) {
    return this.log(entityType, entityId, 'delete', buildingId, oldData, null);
  },
};
