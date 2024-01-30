export const EXCEPTION_EXC_WRITE = "Error executing write query:";
export const EXCEPTION_EXC_READ = "Error executing read query:";



export enum UserPoolStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    COMPLETED = 'COMPLETED',
    NOT_FOUND = 'NOT_FOUND', // NOT_FOUND will be return if db return 0 result Query
}