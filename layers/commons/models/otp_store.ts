import {executeWriteQuery, executeReadQuery} from '../service/connection'
import { AWS } from '../index'
export interface OTPStore {
    id: number;
    mobile_number: string;
    otp: string;
    creation_time: Date;
}

// Function to store OTP in the database
export const storeOTP = async (mobileNumber: string, otp: string): Promise<void> => {
    try {
      await executeWriteQuery('INSERT INTO otp_store (mobile_number, otp) VALUES (?, ?)', [mobileNumber, otp]);
    } catch (error) {
      console.error('Error storing OTP:', error);
      throw error;
    }
};

// Function to verify OTP for a given mobile number
export const verifyOTP = async (mobileNumber: string, otp: string): Promise<boolean> => {
    try {
      const rows = await executeReadQuery(
        'SELECT id FROM otp_store WHERE mobile_number = ? AND otp = ? AND creation_time >= NOW() - INTERVAL 10 MINUTE ORDER BY creation_time DESC LIMIT 1',
        [mobileNumber, otp]
      );
  
      return rows.length > 0;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
};

// Function to retrieve the latest OTP for a given mobile number
export const getLatestOTP = async (mobileNumber: string): Promise<string | null> => {
    try {
      const rows = await executeReadQuery(
        'SELECT otp FROM otp_store WHERE mobile_number = ? ORDER BY creation_time DESC LIMIT 1',
        [mobileNumber]
      );
  
      return rows.length > 0 ? rows[0].otp : null;
    } catch (error) {
      console.error('Error retrieving OTP:', error);
      throw error;
    }
};
  

// Function to store OTP in MySQL
export async function storeOTPInMySQL(mobileNumber: string, countryCode: string, otp: string): Promise<void> {
    const query = 'CALL insert_otp(?, ?, ?, @p_result)';
    const values = [mobileNumber, countryCode, otp];
    await executeWriteQuery(query, values);
}

// Function to send OTP via SNS
export async function sendOTPViaSNS(userName: string, otp: string): Promise<void> {
    // Implement your logic to send OTP via SNS here
    // You can use the AWS SDK for SNS or any other preferred method
    // Example using AWS SDK:
    const sns = new AWS.SNS();
    const params = {
      Message: `Your OTP is: ${otp}`,
      PhoneNumber: `+${userName}`, // Assuming userName is the mobile number
    };
    await sns.publish(params).promise();
}

// Function to generate a random OTP of a specified length
export function generateOTP(length: number): string {
    const characters = '0123456789'; // You can include more characters if needed
    let otp = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      otp += characters[randomIndex];
    }
  
    return otp;
}

// Function to retrieve stored OTP from MySQL
export async function retrieveStoredOTPFromMySQL(mobileNumber: string, countryCode: string): Promise<string> {
  // Calculate the current time
  const currentTime = new Date();

  // Calculate 30 seconds ago
  const thirtySecondsAgo = new Date(currentTime.getTime() - 60 * 1000);

  const query = `
      SELECT otp, creation_time
      FROM otp_store
      WHERE mobile_number = ? 
          AND country_code = ? 
          AND is_used = FALSE 
          AND creation_time > ?
      ORDER BY creation_time DESC 
      LIMIT 1`;

  const values = [mobileNumber, countryCode, thirtySecondsAgo];
  const rows = await executeReadQuery(query, values);

  if (rows && rows.length > 0) {
      const otp = rows[0].otp;

      // Mark the OTP as used
      // await markOTPasUsed(otp);

      return otp;
  } else {
      throw new Error('Invalid OTP');
  }
}

export async function markOTPasUsed(otp: string): Promise<void> {
  const updateQuery = 'UPDATE otp_store SET is_used = TRUE WHERE otp = ?';
  const updateValues = [otp];
  await executeWriteQuery(updateQuery, updateValues);
}
