import {responseBuilder} from 'commons/index'
import { USER_NOT_AUTHORIZED, USER_NOT_FOUND , } from 'commons/models/errorMessages';
import {insertUser } from 'commons/models/user';
import { authFun } from 'commons/middleware/authMiddleware';

export const lambdaHandler = async (event: any, context: any, callback: any): Promise<any> => {
    try {
      // Assuming userId is provided by the authentication middleware
      // const userId = event.requestContext.authorizer.principalId;
      const userId = await authFun(event);
      console.log('userId : ',userId);
  
      if (!userId) {
        return responseBuilder({ message: USER_NOT_FOUND });
      }
  
      console.log('Lambda event : ', event);
      console.log('Context event : ', context);
  
      // Extract user details from the request body
      const {
        first_name,
        last_name,
        mobile_number,
        country_code,
        email,
        gender,
        date_of_birth,
        weight,
        // Add other properties as needed
      } = JSON.parse(event.body);
  
      // Construct the user object
      const user = {
        cognito_user_id: userId,
        first_name,
        last_name,
        mobile_number,
        country_code,
        email,
        gender,
        date_of_birth,
        weight,
        status: true, // Assuming status is always true for a new user
      };
  
      // Insert the user into the database
      await insertUser(user);
  
      // Return a success response
      return responseBuilder({ message: 'User details inserted successfully' }, 200);
    } catch (error: any) {
      console.error('Error in lambdaHandler:', error);
       // Check if the error is a duplicate entry error
        if (error.code === 'ER_DUP_ENTRY') {
            return responseBuilder({ message: 'Unable to register the details due to constraints violation .' }, 409);
        }
        if (error.message === 'USER_NOT_AUTHORIZED') {
            return responseBuilder({ message: USER_NOT_AUTHORIZED }, 403); // 403 for Forbidden
        }

      return responseBuilder({ message: 'Unable to register the user profile,' }, 500);
    }
};