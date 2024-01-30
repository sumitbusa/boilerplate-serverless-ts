import {executeReadQuery, executeWriteQuery} from '../service/connection'
import {Joi} from '../index';
 
export interface User {
    id?: string;
    cognito_user_id: string;
    first_name: string;
    last_name: string;
    mobile_number: string;
    country_code: string;
    email: string;
    gender: 'MALE' | 'FEMALE' | 'TRANSGENDER' | 'NOT_DEFINED';
    date_of_birth: Date;
    weight: number,
    status: boolean;
    created_at?: Date;
    updated_at?: Date;
}

// Define the Joi schema for User validation
const userSchema = Joi.object({
  cognito_user_id: Joi.string().required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  mobile_number: Joi.string().required(),
  country_code: Joi.string().required(),
  email: Joi.string(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'TRANSGENDER', 'NOT_DEFINED').required(),
  date_of_birth: Joi.date().required(),
  weight: Joi.number(),
  status: Joi.boolean().required(),
  created_at: Joi.date(),
  updated_at: Joi.date(),
});

export async function checkUserMandatoryFields(cognitoUserId: string): Promise<boolean> {
  const query = 'CALL check_user_mandatory_fields(?, @mandatoryFieldsPresent)';
  const values = [cognitoUserId];
  await executeReadQuery(query, values);
  
  // Retrieve the result from the session variable
  const result = await executeReadQuery('SELECT @mandatoryFieldsPresent AS mandatoryFieldsPresent');
  
  // Return the boolean result
  return result[0].mandatoryFieldsPresent === 1;
}

export async function insertUser(user: User): Promise<void> {
  // Validate the user object using Joi schema
  const validationResult = userSchema.validate(user);
  if (validationResult.error) {
    throw new Error(validationResult.error.details[0].message);
  }

  // Remove properties with null values to avoid SQL syntax errors
  const sanitizedUser = Object.fromEntries(
    Object.entries(user).filter(([_, value]) => value !== null)
  );

  // Construct the list of column names
  const columns = Object.keys(sanitizedUser).join(', ');

  // Generate the placeholder string for values
  const placeholders = Object.values(sanitizedUser).map(() => '?').join(', ');

  // Convert the user object values into an array
  const userValues = Object.values(sanitizedUser);

  // Call the stored procedure or execute an insert query to add the user
  const insertQuery = `INSERT INTO users (${columns}) VALUES (${placeholders})`;
  await executeWriteQuery(insertQuery, userValues);
}

export async function updateUserData(updatedUser: User): Promise<void> {
  // Validate the updated user object using Joi schema
  const validationResult = userSchema.validate(updatedUser);
  if (validationResult.error) {
    throw new Error(validationResult.error.details[0].message);
  }

  // Extract the cognito_user_id from the updatedUser
  const { cognito_user_id, ...updatedValues } = updatedUser;

  console.log('---updated User Values : ', updatedValues);

  // Filter out properties with undefined values
  const nonUndefinedValues = Object.entries(updatedValues)
    .filter(([key, value]) => value !== undefined)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

  // Construct the SET clause for the UPDATE statement
  const setClause = Object.keys(nonUndefinedValues).map(column => `${column} = ?`).join(', ');

  // Call the stored procedure or execute an update query to update the user
  const updateQuery = `UPDATE users SET ${setClause} WHERE cognito_user_id = ?`;
  const updateValuesArray = [...Object.values(nonUndefinedValues), cognito_user_id];

  await executeWriteQuery(updateQuery, updateValuesArray);
}
