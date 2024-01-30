import { executeReadQuery, executeWriteQuery } from '../service/connection';
import { ERROR_ADD_HEALTH_ASPECT } from './errorMessages';

interface UserAspect {
  id: string;
  user_id: string;
  aspect_id: string;
  is_active: 0 | 1;
  created_at?: Date;
  updated_at?: Date;
}

export const addUserAspect = async (
  userId: string,
  aspectId: string,
  configJSON: object
): Promise<any> => {
  try {
    const query = `
      INSERT INTO user_aspects (cognito_user_id, aspect_id, config, is_active)
      VALUES (?, ?, ?, ?)
    `;

    const result = await executeWriteQuery(query, [userId, aspectId, JSON.stringify(configJSON), 1]);

    return result;
  } catch (error) {
    console.error(ERROR_ADD_HEALTH_ASPECT, error);
    throw error; // Handle the error appropriately in your application
  }
};

