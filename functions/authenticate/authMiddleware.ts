import { validateAccessToken } from 'commons/middleware/jwtTokenHandler';
import { getUserPoolStatusById } from 'commons/models/user_pool';
import { responseBuilder } from 'commons';
import { UserPoolStatus } from 'commons/models/constant';

export const lambdaHandler = async (event: any, context: any, callback: any): Promise<any> => {
  try {
    console.log("Auth request --- init: ", event);

    const authorizationHeader = event.headers.Authorization || event.headers.authorization;
    if (!authorizationHeader) {
      return handleUnauthorizedRequest('callback', event.methodArn);
    }

    console.log('Auth header: ', authorizationHeader);

    const accessToken = authorizationHeader.replace('Bearer ', '');

    const decodedAccessToken = validateAccessToken(accessToken);

    const userId = decodedAccessToken.userId;
    if (!userId) {
      return handleUnauthorizedRequest(callback, event.methodArn);
    }

    console.log('userId: ', userId);

    const userPoolStatus = await getUserPoolStatusById(userId);

    if (userPoolStatus.status === UserPoolStatus.NOT_FOUND || userPoolStatus.status === UserPoolStatus.SUSPENDED) {
      return handleUnauthorizedRequest(callback, event.methodArn);
    }

    console.log('user pool status: ', userPoolStatus);

    // Pass userId and userPoolStatus to the handler or function that needs this information
    event.userId = userId;
    event.userPoolStatus = userPoolStatus;

    console.log('----------- principalId : ', userId);
    console.log(JSON.stringify(generateAuthorizationResponse(userId, event.methodArn)));

    context.succeed(generateAuthorizationResponse(userId, event.methodArn));
    return false;
    // Return the authorization response with principalId and policyDocument
    // return generateAuthorizationCallBackResponse(callback, userId, event.methodArn);
  } catch (error) {
    console.error('Error during access token validation:', error);
    return handleUnauthorizedRequest(callback, event.methodArn);
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

function handleUnauthorizedRequest(callback: any, resource: string) {
  return callback(null, {
    principalId: 'anonymous',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Deny',
          Resource: resource,
        },
      ],
    },
  });
}
