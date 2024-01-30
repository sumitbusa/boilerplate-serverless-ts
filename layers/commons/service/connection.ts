import {createPool, Pool, PoolOptions, RowDataPacket, mysql, ResultSetHeader} from './../index'
import * as propertyResolver from './../models/property_resolver';
import * as errorMessages from './../models/errorMessages'

const writePoolConfig: mysql.PoolOptions = {
    host: propertyResolver.DB_WRITE_HOST,
    user: propertyResolver.DB_WRITE_USER,
    port: propertyResolver.DB_WRITE_PORT,
    password: propertyResolver.DB_WRITE_PASSWORD,
    database: propertyResolver.DB_WRITE_NAME,
    connectionLimit: propertyResolver.DB_WRITE_CONNECTION_LIMIT // Adjust as needed
};
  
  const readPoolConfig: mysql.PoolOptions = {
    host: propertyResolver.DB_READ_HOST,
    user: propertyResolver.DB_READ_USER,
    port: propertyResolver.DB_READ_PORT,
    password: propertyResolver.DB_READ_PASSWORD,
    database: propertyResolver.DB_READ_NAME,
    connectionLimit: propertyResolver.DB_READ_CONNECTION_LIMIT // Adjust as needed
};
// Create separate pools for read and write operations
const writePool: Pool = createPool(writePoolConfig);
const readPool: Pool = createPool(readPoolConfig);

export async function executeWriteQuery(query: string, values?: any[]): Promise<ResultSetHeader> {
  console.log('executeWriteQuery : ', query, ' writePoolConfig: ', writePoolConfig);
    const connection = await writePool.getConnection();
  
    try {
      const [result] = await connection.query(query, values);
      return result as ResultSetHeader;
    } catch (error) {
      handleQueryError(error);
      throw error;
    } finally {
      connection.release();
    }
}

export async function executeReadQuery(query: string, values?: any[]): Promise<RowDataPacket[]> {
    console.log('executeReadQuery : ', query, ' readPoolConfig: ', readPoolConfig);
    const connection = await readPool.getConnection();
  
    try {
      const [rows] = await connection.query(query, values);
      return rows as RowDataPacket[];
    } catch (error) {
      handleQueryError(error);
      throw error;
    } finally {
      connection.release();
    }
  }

export function handleQueryError(error: any): void {
    if (error.code === 'ER_DUP_ENTRY') {
      console.error(errorMessages.DUPLICATE_ENTRY_ERROR, error);
      // Handle duplicate entry error
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      console.error(errorMessages.REFERENCED_ROW_NOT_FOUND_ERROR, error);
      // Handle referenced row not found error
    } else if (error.code === 'ER_SP_DOES_NOT_EXIST') {
        console.error(errorMessages.STORED_PRO_NOT_EXIST, error);
        // Handle stored procedure not found error
    } else if (error.code === 'ER_VIEW_DOES_NOT_EXIST') {
        console.error(errorMessages.VIEW_NOT_EXIST, error);
        // Handle view not found error
    } else {
      console.error(errorMessages.UNHANDLED_QUERY_ERROR, error);
      // Handle other errors
    }
}