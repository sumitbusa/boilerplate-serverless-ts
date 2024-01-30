import {executeReadQuery, executeWriteQuery} from '../service/connection'
import {ERROR_GET_USER_POOL_STATUS, ERROR_REGISTER_USER_POOL_STATUS, ERROR_UPDATE_USER_POOL_STATUS} from './errorMessages'
import {UserPoolStatus} from './constant'
import { getUserStatusFromCognito, registerUserInCognito } from '../middleware/authMiddleware';

export interface UserPool {
    id: string;
    mobile_number: string;
    country_code: string;
    email: string | null;
    status: 'PENDING' | 'COMPLETED';
    validate_at?: Date;
    updated_at?: Date;
}

interface UserPoolInfo {
  id: string;
  status: UserPoolStatus;
}


export const getUserPoolStatus = async (mobileNumber: string, countryCode: string): Promise<UserPoolInfo> => {
  try {
    // Check if the user with the given mobile number exists in the user pool
    const rows = await executeReadQuery('SELECT id, status FROM user_pool WHERE mobile_number = ? and country_code = ?', [mobileNumber, countryCode]);

    if (rows.length === 0) {
      return { id: '-1', status: UserPoolStatus.NOT_FOUND }; // Adjust the default values as needed
    } else {
      const { id, status } = rows[0];
      return { id, status };
    }
  } catch (error) {
    console.error(ERROR_GET_USER_POOL_STATUS, error);
    throw error; // Handle the error appropriately in your application
  }
};

export const getUserPoolStatusById = async (id: string): Promise<UserPoolInfo> => {
  try {
    // Check if the user with the given mobile number exists in the user pool
    const rows = await executeReadQuery('SELECT id, status FROM user_pool WHERE id = ?', [id]);
    console.log('rows',rows);
    if (rows.length === 0) {
      return { id: '-1', status: UserPoolStatus.NOT_FOUND }; // Adjust the default values as needed
    } else {
      const { id, status } = rows[0];
      return { id, status };
    }
  } catch (error) {
    console.error(ERROR_GET_USER_POOL_STATUS, error);
    throw error; // Handle the error appropriately in your application
  }
};

// get User Pool details mobile number
export const getUserPoolData = async (mobileNumber: string, countryCode: string): Promise<UserPoolInfo> => {
  try {
    // Check if the user with the given mobile number exists in the user pool
    const rows = await executeReadQuery('SELECT id, status FROM user_pool WHERE mobile_number = ? and country_code = ?', [mobileNumber, countryCode]);

    if (rows.length === 0) {
      return { id: '-1', status: UserPoolStatus.NOT_FOUND }; // Adjust the default values as needed
    } else {
      const { id, status } = rows[0];
      return { id, status };
    }
  } catch (error) {
    console.error(ERROR_GET_USER_POOL_STATUS, error);
    throw error; // Handle the error appropriately in your application
  }
};

// Function to register a new user in the user pool
export const registerUser = async (mobileNumber: string, countryCode: string, email?: string): Promise<UserPoolInfo> => {
  try {
    console.log('register User : ', mobileNumber, countryCode);

    // Check if the user is suspended
    const registrationResult = await registerUserInCognito({mobileNumber, countryCode, email});

    console.log('registrationResult : ',registrationResult);
    // Assuming `registrationResult` contains information about the registered user
    // Ensure registrationResult is an object before accessing the user property
    const cognitoUserId = registrationResult;

    // Implement the logic to insert a new user into the user pool
    await executeWriteQuery(
      'INSERT INTO user_pool (id, mobile_number, country_code, email, status) VALUES (?, ?, ?, ?, ?)',
      [cognitoUserId, mobileNumber, countryCode, email || null, UserPoolStatus.ACTIVE]
    );

    return { status:UserPoolStatus.COMPLETED, id: cognitoUserId };

  } catch (error) {
    console.error(ERROR_REGISTER_USER_POOL_STATUS, error);
    throw error;
  }
};



// Function to update the status of a user in the user pool
export const updateUserPoolStatus = async (mobileNumber: string, status: 'PENDING' | 'COMPLETED' | 'ACTIVE'): Promise<void> => {
  try {
    // Implement the logic to update the status of a user in the user pool
    await executeWriteQuery('UPDATE user_pool SET status = ? WHERE mobile_number = ?', [status, mobileNumber]);
  } catch (error) {
    console.error(ERROR_UPDATE_USER_POOL_STATUS, error);
    throw error;
  }
};