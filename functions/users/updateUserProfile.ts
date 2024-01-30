import {responseBuilder} from 'commons/index'
import { USER_NOT_AUTHORIZED, USER_NOT_FOUND , } from 'commons/models/errorMessages';
import { updateUserData } from 'commons/models/user';
import { authFun } from 'commons/middleware/authMiddleware';

export const lambdaHandler = async (event: any, context: any, callback: any): Promise<any> => {
    try {
      // const userId = event.requestContext.authorizer.principalId;
      const userId = await authFun(event);
  
      if (!userId) {
        return responseBuilder({ message: USER_NOT_FOUND });
      }
  
      console.log('Update Lambda event : ', event);
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
  
      // Construct the updated user object
      const updatedUser = {
        cognito_user_id: userId,
        first_name,
        last_name,
        mobile_number,
        country_code,
        email,
        gender,
        date_of_birth,
        weight,
        status: true, // Assuming status is always true for an updated user
      };
  
      // Update the user in the database
      await updateUserData(updatedUser);
  
      // Return a success response
      return responseBuilder({ message: 'User details updated successfully' }, 200);
    } catch (error: any) {
        console.error('Error in lambdaHandler:', error);
         // Check if the error is a duplicate entry error
          if (error.code === 'ER_DUP_ENTRY') {
              return responseBuilder({ message: 'Unable to update entry. User already exists with similar details.' }, 409);
          }
          if (error.message === 'USER_NOT_AUTHORIZED') {
            return responseBuilder({ message: USER_NOT_AUTHORIZED }, 403); // 403 for Forbidden
          }
        return responseBuilder({ message: 'Unable to update the user profile,' }, 500);
    }
};