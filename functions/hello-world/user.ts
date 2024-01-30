export interface User {
    id?: number;
    cognito_user_id: string;
    first_name: string;
    last_name: string;
    mobile_number: string;
    country_code: string;
    email: string;
    gender: 'MALE' | 'FEMALE' | 'TRANSGENDER' | 'NOT_DEFINED';
    date_of_birth: Date;
    status: boolean;
    created_at?: Date;
    updated_at?: Date;
  }