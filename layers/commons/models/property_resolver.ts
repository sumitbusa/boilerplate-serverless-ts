// export db connections details

    // Write connection

        export const DB_WRITE_HOST = process.env.DB_WRITE_HOST || '65.1.205.67';
        export const DB_WRITE_PORT = process.env.DB_WRITE_PORT ? parseInt(process.env.DB_WRITE_PORT, 10) : 3306;
        export const DB_WRITE_NAME = process.env.DB_WRITE_NAME || 'oku_dev';
        export const DB_WRITE_USER = process.env.DB_WRITE_USER || 'root';
        export const DB_WRITE_PASSWORD = process.env.DB_WRITE_PASSWORD || '0FZWSK7C#9';
        export const DB_WRITE_CONNECTION_LIMIT = process.env.DB_WRITE_CONNECTION_LIMIT ? parseInt(process.env.DB_WRITE_CONNECTION_LIMIT, 10) : 10;
        export const DB_WRITE_QUEUE_LIMIT = process.env.DB_WRITE_QUEUE_LIMIT ? parseInt(process.env.DB_WRITE_QUEUE_LIMIT, 10) : 10;

        
    // Read Connection

        export const DB_READ_HOST = process.env.DB_READ_HOST || '65.1.205.67';
        export const DB_READ_PORT = process.env.DB_READ_PORT ? parseInt(process.env.DB_READ_PORT, 10) : 3306;
        export const DB_READ_NAME = process.env.DB_READ_NAME || 'oku_dev';
        export const DB_READ_USER = process.env.DB_READ_USER || 'root';
        export const DB_READ_PASSWORD = process.env.DB_READ_PASSWORD || '0FZWSK7C#9';
        export const DB_READ_CONNECTION_LIMIT = process.env.DB_READ_CONNECTION_LIMIT ? parseInt(process.env.DB_READ_CONNECTION_LIMIT, 10) : 20;
        export const DB_READ_QUEUE_LIMIT = process.env.DB_READ_QUEUE_LIMIT ? parseInt(process.env.DB_READ_QUEUE_LIMIT, 10) : 20;

// Cognito 

    export const USER_POOL_ID = process.env.USER_POOL_ID || "ap-south-1_HWil8K31i";
    export const CLIENT_ID = process.env.CLIENT_ID || "44lrf054id8d04vgud38gajoc4";
    export const COGNITO_CONFIG_KEY = process.env.COGNITO_CONFIG_KEY || "";
    export const JWT_PUB_KEY = process.env.JWT_PUB_KEY || 'efc6539e-fb1e-4e8b-bdda-807381da15a3';
    export const JWT_REFRESH_KEY = process.env.JWT_REFRESH_KEY || "oku-re-test";
