import {executeReadQuery} from '../service/connection'
 
export interface symptom_questions {
    id?: string;
    symptom_id: string;
    config: string;
    version: number;
    created_at?: Date;
    updated_at?: Date;
}


