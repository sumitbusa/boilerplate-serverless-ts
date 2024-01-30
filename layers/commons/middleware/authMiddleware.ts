import { responseBuilder, AWS, AmazonCognitoIdentity, CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute, uuid  } from '../index'
import {USER_POOL_ID, CLIENT_ID} from '../models/property_resolver'
import {validateAccessToken} from '../middleware/jwtTokenHandler';
import {getUserPoolStatusById} from '../models/user_pool';
import { UserPoolStatus } from '../models/constant';
import { USER_NOT_AUTHORIZED, USER_NOT_FOUND } from '../models/errorMessages';

export const getUserStatusFromCognito = async (mobileNumber: string): Promise<string | null> => {
    try {
      const poolData = {
        UserPoolId: USER_POOL_ID,
        ClientId: CLIENT_ID,
      };
      const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  
      const userData = {
        Username: mobileNumber,
        Pool: userPool,
      };
  
      const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  
      return new Promise<string | null>((resolve, reject) => {
        cognitoUser.getUserAttributes((err, result) => {
          if (err) {
            console.error('Error getting user attributes from Cognito:', err);
            reject(err);
          } else {
            // Check if result is defined before accessing its properties
            if (result && result.length > 0) {
              const statusAttribute = result.find(attr => attr.getName() === 'custom:status');
              const userStatus = statusAttribute ? statusAttribute.getValue() : null;
              resolve(userStatus);
            } else {
              resolve(null);
            }
          }
        });
      });
    } catch (error) {
      console.error('Error in getUserStatusFromCognito:', error);
      throw error;
    }
  };


  export const registerUserInCognito = async (userData: {
    mobileNumber: string;
    countryCode: string;
    email?: string;
  }): Promise<string> => {
    try {
      // Ensure the required environment variables are defined
      const userPoolId = USER_POOL_ID;
      const clientId = CLIENT_ID;
  
      console.log('userPoolId :',userPoolId,' clientId : ', clientId);
      if (!userPoolId || !clientId) {
        throw new Error('User pool ID or client ID is not defined.');
      }
  
      // Create a new CognitoUserPool instance
      const poolData: AmazonCognitoIdentity.ICognitoUserPoolData = {
        UserPoolId: userPoolId,
        ClientId: clientId,
      };

      console.log('poolData : ', poolData);
      const userPool = new CognitoUserPool(poolData);
  
      // Generate a UUID based on phone number
    const uuidBasedOnPhoneNumber = uuid.v5(`+${userData.countryCode}${userData.mobileNumber}`, uuid.v5.URL);

      console.log('userPool : ', userPool);

      // Create user attributes
      const attributeList : AmazonCognitoIdentity.CognitoUserAttribute [] = [
        // new CognitoUserAttribute({ Name: 'username', Value: uuidBasedOnPhoneNumber }),
        new CognitoUserAttribute({ Name: 'phone_number', Value: `${userData.countryCode}${userData.mobileNumber}` }),
        new CognitoUserAttribute({ Name: 'email', Value: userData.email || '' }),

        // optional will remove once change config
        new CognitoUserAttribute({ Name: 'given_name', Value: userData.email || '' }),
        new CognitoUserAttribute({ Name: 'family_name', Value: userData.email || '' }),
        new CognitoUserAttribute({ Name: 'gender', Value: userData.email || '' }),
        new CognitoUserAttribute({ Name: 'birthdate', Value: '25/09/1996' }),
        new CognitoUserAttribute({ Name: 'updated_at', Value: '2' }),
      ];

      console.log('attributeList : ',attributeList);
  
      // Register the user in Cognito
      return new Promise<string>((resolve, reject) => {
        userPool.signUp(uuidBasedOnPhoneNumber, 'Pass@1234', attributeList, [], (err, result) => {
          if (err) {
            console.error('Error during user registration in Cognito:', err);
            reject(err);
          } else {
            // Extract and return Cognito user ID from the registration result
            const cognitoUserId = result?.user?.getUsername() || '';
            console.log('User registered successfully in Cognito. Cognito user ID:', cognitoUserId);
            resolve(cognitoUserId);
          }
        });
      });
    } catch (error) {
      console.error('Error during user registration in Cognito:', error);
      throw error;
    }
  };
  


  // Validate Token details
  export const authFun = async (event: any): Promise<any> => {
    try {
      console.log("Auth request --- init: ", event);
  
      const authorizationHeader = event.headers.Authorization || event.headers.authorization;
      if (!authorizationHeader) {
        return responseBuilder(null, 403); // 403 for Forbidden
      }
  
      console.log('Auth header: ', authorizationHeader);
  
      const accessToken = authorizationHeader.replace('Bearer ', '');
  
      const decodedAccessToken = validateAccessToken(accessToken);
  
      const userId = decodedAccessToken.userId;
      if (!userId) {
        return responseBuilder(null, 403); // 403 for Forbidden
      }
  
      console.log('userId: ', userId);
  
      const userPoolStatus = await getUserPoolStatusById(userId);
  
      if (userPoolStatus.status === UserPoolStatus.NOT_FOUND || userPoolStatus.status === UserPoolStatus.SUSPENDED) {
        return responseBuilder(null, 403); // 403 for Forbidden
      }
  
      console.log('user pool status: ', userPoolStatus);
  
      // Pass userId and userPoolStatus to the handler or function that needs this information
      event.userId = userId;
      event.userPoolStatus = userPoolStatus;
  
      console.log('----------- principalId : ', userId);
      console.log(JSON.stringify(generateAuthorizationResponse(userId, event.methodArn)));
  
      const authorizedResponse = generateAuthorizationResponse(userId, event.methodArn);
      return userId;
    } catch (error) {
      console.error('Error during access token validation:', error);
      const errorStatus = new Error('USER_NOT_AUTHORIZED');

      throw errorStatus;
    }
  };
  
  let custom_headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,PATCH,DELETE",
    "Access-Control-Allow-Credentials": true,
  };
  
  function generateAuthorizationResponse(userId: string, resource: string) {
    return {
      principalId: userId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: resource,
          },
        ],
        context: custom_headers
      },
    };
  }

  
  // export const registerUserInCognito = async (userData: {
  //   mobileNumber: string,
  //   countryCode: string,
  //   email?: string;
  // }): Promise<any> => {
  //   try {
  //     // Ensure the required environment variables are defined
  //     const userPoolId = USER_POOL_ID;
  //     const clientId = CLIENT_ID;
  
  //     if (!userPoolId || !clientId) {
  //       throw new Error('User pool ID or client ID is not defined.');
  //     }
  
  //     // Create a new CognitoUserPool instance
  //     const poolData: AmazonCognitoIdentity.ICognitoUserPoolData = {
  //       UserPoolId: userPoolId,
  //       ClientId: clientId,
  //     };
  //     const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  
  //     // Create user attributes
  //     const attributeList: AmazonCognitoIdentity.CognitoUserAttribute[] = [
  //       new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'phone_number', Value: userData.mobileNumber }),
  //       new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: userData.email || ''}),
  //     ];
  
  //     // Register the user in Cognito
  //     return new Promise((resolve, reject) => {
  //       userPool.signUp(userData.mobileNumber, 'YourPassword', attributeList, [], (err, result) => {
  //         if (err) {
  //           console.error('Error during user registration in Cognito:', err);
  //           reject(err);
  //         } else {
  //           // Add your logic to handle the registration result or perform additional actions if needed
  //           console.log('User registered successfully in Cognito:', result);
  //           resolve(result);
  //         }
  //       });
  //     });
  //   } catch (error) {
  //     console.error('Error during user registration in Cognito:', error);
  //     throw error;
  //   }
  // };
  
  