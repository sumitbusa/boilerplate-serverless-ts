import * as AWS from "aws-sdk";;
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createPool, Pool, PoolOptions, RowDataPacket , ResultSetHeader, OkPacket, ProcedureCallPacket} from 'mysql2/promise';
import * as mysql from 'mysql2/promise';
import * as Joi from 'joi';
import * as jwt from 'jsonwebtoken';
import * as AmazonCognitoIdentity from 'amazon-cognito-identity-js';
import * as crypto from 'crypto';
import * as uuid from 'uuid';

import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';
// Add type annotations where necessary

export {
  AWS, APIGatewayProxyEvent, APIGatewayProxyResult, Context,createPool, Pool, PoolOptions, RowDataPacket, mysql, ResultSetHeader, Joi, jwt, AmazonCognitoIdentity, crypto, CognitoUserPool, CognitoUser,AuthenticationDetails, CognitoUserAttribute, uuid, ProcedureCallPacket, OkPacket
};


// export const responseBuilder = (
//   payload: any,
//   statusCode: number = 200,
//   headers: any = { "Content-Type": "application/json" },
// ) => {
//   return {
//     statusCode,
//     headers,
//     body: JSON.stringify( payload ),
//   };
// };

export const responseBuilder = (
  payload: any,
  statusCode: number = 200,
  headers: any = { "Content-Type": "application/json" },
) => {
  // Check if the payload contains an "error" property with the message "Invalid OTP"
  if (payload && payload?.error && payload?.error?.message?.includes('Invalid OTP')) {
    statusCode = 422; // Set status code to 422 for messages containing "Invalid OTP"
  } else if (payload && payload?.message?.includes('Invalid OTP')) {
    statusCode = 422;
  }

  return {
    statusCode,
    headers,
    body: JSON.stringify(payload),
  };
};