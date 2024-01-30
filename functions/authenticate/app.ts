import { APIGatewayProxyEvent, APIGatewayProxyResult, AWS, responseBuilder } from "commons/index";
import { UserPool, getUserPoolStatus, registerUser, updateUserPoolStatus } from 'commons/models/user_pool';
import {checkUserMandatoryFields} from 'commons/models/user'
import { AuthInput, authInputSchema } from 'commons/models/request/authInput';
import { UserPoolStatus } from 'commons/models/constant';
import { generateAccessToken, generateRefreshToken } from 'commons/middleware/jwtTokenHandler';
import { CLIENT_ID, USER_POOL_ID, COGNITO_CONFIG_KEY } from 'commons/models/property_resolver';
import { generateOTP, storeOTPInMySQL, sendOTPViaSNS, retrieveStoredOTPFromMySQL, markOTPasUsed } from 'commons/models/otp_store';
import { crypto } from "commons/index";

const sns = new AWS.SNS();
const cognito = new AWS.CognitoIdentityServiceProvider();

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;
  try {
    const { value: authInput, error } = authInputSchema.validate(JSON.parse(event.body || '{}'));
    // Validate input parameters using Joi
    if (error) {
      return responseBuilder({ error: 'Invalid input parameters' }, 400);
    }

    // Check if OTP code is provided
    if (authInput.otpCode) {
      // Verify OTP
      const verificationResult = await verifyAuthChallenge(authInput.mobileNumber, authInput.countryCode, authInput.otpCode);
      let isProfile = false;

      // Handle verification result as needed
      if (verificationResult.success) {
          // Verification successful, proceed with the next steps
          // Retrieve updated user pool status
          let userPoolStatus =
          await getUserPoolStatus(authInput.mobileNumber, authInput.countryCode);

          // Register user if not found
          if (userPoolStatus.status === UserPoolStatus.NOT_FOUND) {
            userPoolStatus = await registerUser(authInput.mobileNumber, authInput.countryCode, authInput.email);
            await updateUserPoolStatus(authInput.mobileNumber, UserPoolStatus.ACTIVE);
          } else {
            console.log('already registered user : ', userPoolStatus.id);
            isProfile = await checkUserMandatoryFields(userPoolStatus.id);
          }

          // Generate JWT tokens

          const accessToken = generateAccessToken(userPoolStatus.id);
          const refreshToken = generateRefreshToken(userPoolStatus.id);

          // Set refresh token as an HTTP-only cookie
          const headers = {
            'Authentication':`${accessToken}`,
            'Set-Cookie': `refreshToken=${refreshToken}; HttpOnly; Secure; Max-Age=${90 * 24 * 60 * 60}; SameSite=None`,
          };

          // Mark the OTP as used
          markOTPasUsed(authInput.otpCode);
          // Return user pool status and access token
          return responseBuilder({ status: isProfile }, 200, headers);
      } else {
        // Verification failed, handle accordingly
        return responseBuilder({ error: 'Invalid OTP' }, 422);
      }
    } else {
      // Send OTP
      // Check user pool status
      const userPoolStatus = await getUserPoolStatus(authInput.mobileNumber, authInput.countryCode);


      console.log('userPoolStatus : ',userPoolStatus);

      // Check if the user is suspended
      if (userPoolStatus.status === UserPoolStatus.SUSPENDED) {
        console.log('User is suspended. OTP will not be sent.');
        return responseBuilder({ error: 'User is suspended. OTP will not be sent.' }, 400);
      }

      const challengeResult = await createAuthChallenge(authInput.mobileNumber, authInput.countryCode);

      // Return challenge result
      return responseBuilder(challengeResult, 200);
    }
  } catch (err: unknown) {
    console.log(err);
    response = responseBuilder(
      { message: err instanceof Error ? err.message : "some error happened" },
      400,
    );
  }

  return response;
};


// Function to create an authentication challenge
export const createAuthChallenge = async (mobileNumber: string, countryCode: string): Promise<any> => {
  try {
    // Check if the mobile number is verified in SNS
    // const snsAttributes = await sns.getSMSAttributes({ attributes: ['DefaultSMSType'], }).promise();

    // console.log('snsAttributes', snsAttributes);

    // if (snsAttributes.attributes && snsAttributes.attributes.DefaultSMSType === 'Transactional') {
      // Mobile number is verified, proceed to send OTP via SMS

      // Generate session ID
      const session = generateSession(mobileNumber);

      // Generate OTP
      const otp = generateOTP(6);

      // Store OTP in MySQL or any other storage mechanism along with the session ID
      await storeOTPInMySQL(mobileNumber, countryCode, otp);

      // Send OTP via SMS using SNS
      const message = `Your OTP is: ${otp}`;
      const snsParams = {
        Message: message,
        PhoneNumber: `+${mobileNumber}`,
      };

      // await sns.publish(snsParams).promise();

      // Return a customized challenge
      // return {
      //   publicChallengeParameters: { otpChallenge: true },
      //   privateChallengeParameters: { session },
      //   challengeMetadata: 'Enter OTP sent to your mobile.',
      // };

      return {
        otpCode: otp
      };
    // } else {
    //   // Mobile number is not verified, handle accordingly
    //   return {
    //     publicChallengeParameters: { otpChallenge: false },
    //     privateChallengeParameters: { session: null }, // Set session to null if not sending OTP
    //     challengeMetadata: 'Mobile number is not verified. OTP not sent.',
    //   };
    // }
  } catch (error) {
    console.error('Error during OTP creation:', error);
    throw error;
  }
};


// Function to verify an authentication challenge
export const verifyAuthChallenge = async (mobileNumber: string, countryCode: string, otpCode: string): Promise<any> => {
  try {
    // Retrieve stored OTP from MySQL or any other storage mechanism
    const storedOTP = await retrieveStoredOTPFromMySQL(mobileNumber, countryCode);

    console.log('storedOTP ',storedOTP);
    // Compare the stored OTP with the one provided by the user
    const isOTPValid = otpCode === storedOTP;

    // Return the result of OTP verification
    return {
      success: isOTPValid,
      metadata: isOTPValid ? 'OTP verification successful.' : 'Invalid OTP.',
    };
  } catch (error) {
    console.error('Error during OTP verification:', error);
    throw error;
  }
};

function generateSession(mobileNumber: string) {
  return mobileNumber+crypto.randomUUID;
  // throw new Error("Function not implemented.");
}
