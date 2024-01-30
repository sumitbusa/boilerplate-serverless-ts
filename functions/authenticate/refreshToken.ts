import { decodeAccessToken, generateAccessToken,validateAccessTokenForRefreshToken } from 'commons/middleware/jwtTokenHandler';
import { executeReadQuery, executeWriteQuery, handleQueryError } from 'commons/service/connection';
import { responseBuilder } from 'commons/index';
import { getUserPoolStatusById } from 'commons/models/user_pool';
import { UserPoolStatus } from 'commons/models/constant';
import { USER_NOT_FOUND } from 'commons/models/errorMessages';
import { checkUserMandatoryFields } from 'commons/models/user';

export const lambdaHandler = async (event: any, context: any): Promise<any> => {
  try {
    // Extract the refresh token from the Cookie header
    const cookieHeader = event.headers && event.headers.Cookie;
    const refreshTokenCookie = cookieHeader && cookieHeader.split(';').find((cookie: string) => cookie.trim().startsWith('refreshToken='));

    // Extract the access token from the Authorization header
    const authorizationHeader = event.headers && (event.headers.Authorization || event.headers.authorization);
    const accessToken = authorizationHeader && authorizationHeader.replace('Bearer ', '');    

    if (!refreshTokenCookie || !accessToken) {
      // No refresh token found in the cookie
      return responseBuilder({ message: 'Missing token' }, 401);
    }

    const refreshToken = refreshTokenCookie.split('=')[1];


    const decodedRefreshToken = decodeAccessToken(refreshToken);

    console.log('decodedRefreshToken : ',decodedRefreshToken);
    // Check the user pool status
    const userId = decodedRefreshToken.payload.userId;
    const userPoolStatus = await getUserPoolStatusById(userId);

    if(userPoolStatus.status === UserPoolStatus.NOT_FOUND) {
      return responseBuilder({ message: USER_NOT_FOUND }, 404);
    }

    // Validate the refresh token
    if (!validateAccessTokenForRefreshToken(accessToken).expired) {
      return responseBuilder(userPoolStatus.status, 200, {
        'Authentication':`${accessToken}`
      });
    }

    // Generate a new access token
    const newAccessToken = generateAccessToken(userId);

    // Send the new access token in the header and refresh token in the response body
    const headers = {
      'Authentication':`${newAccessToken}`
    };

    const isProfile = await checkUserMandatoryFields(userId);
    return responseBuilder({status :isProfile}, 200, headers);
  } catch (error) {
    console.error('Error during refresh token:', error);
    return responseBuilder({ error: 'Internal Server Error' }, 500);
  }
};
