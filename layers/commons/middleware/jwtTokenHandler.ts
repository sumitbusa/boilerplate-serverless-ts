import {jwt} from '../index';
import { DECODE_TOKEN_ERROR, INVALID_ACCESS_TOKEN } from '../models/errorMessages';
import { JWT_REFRESH_KEY, JWT_PUB_KEY } from '../models/property_resolver';

export const generateAccessToken = (userId: string, expiresIn: string = '15m'): string => {
    const payload = { userId };
    return jwt.sign(payload, JWT_PUB_KEY, { expiresIn });
};
  
export const generateRefreshToken = (userId: string, expiresIn: string = '90d'): string => {
    const payload = { userId };
    return jwt.sign(payload, JWT_REFRESH_KEY, { expiresIn });
};


export const validateAccessToken = (token: string): any => {
    try {
      return jwt.verify(token, JWT_PUB_KEY);
    } catch (error) {
      throw new Error(INVALID_ACCESS_TOKEN);
    }
};

export const decodeAccessToken = (token: string): any => {
  try {
    return jwt.decode(token, { complete: true, json: true });
  } catch (error) {
    // Handle decoding error
    console.error(DECODE_TOKEN_ERROR, error);
    throw new Error(DECODE_TOKEN_ERROR);
  }
};

export const validateAccessTokenForRefreshToken = (token: string): any => {
  try {
    const decodedPayload = jwt.verify(token, JWT_PUB_KEY);
    return { expired: false, payload: decodedPayload };
  } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
          // Token has expired
          return { expired: true, payload: null }; // You can customize this as needed
      } else {
          throw new Error(INVALID_ACCESS_TOKEN);
      }
  }
};