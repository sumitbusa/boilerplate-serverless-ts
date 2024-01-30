import { Joi } from './../../index';

// Input interface for getSymptomByCombination function
export interface GetSymptomByCombinationInput {
    body_part: string;
    location: string;
    part?: string;
}

// Joi schema for validating getSymptomByCombinationInput
export const getSymptomByCombinationSchema = Joi.object<GetSymptomByCombinationInput>({
    body_part: Joi.string().optional().allow(null, ""), // Optional string, allowing null and empty string
    location: Joi.string().optional().allow(null, ""), // Optional string, allowing null and empty string
    part: Joi.string().optional().allow(null, ""), // Optional string, allowing null and empty string
});

// Input interface for getSymptomQuestion function
export interface GetSymptomQuestionInput {
    symptom_id: string;
}

// Joi schema for validating getSymptomQuestionInput
export const getSymptomQuestionSchema = Joi.object<GetSymptomQuestionInput>({
    symptom_id: Joi.string().required(), // Required string
});

// Input interface for saveSymptomQueAnswers function
export interface SaveSymptomQueAnswersInput {
    symptom_id: string;
    answer_value: any;
}

// Joi schema for validating saveSymptomQueAnswersInput
export const saveSymptomQueAnswersInputSchema = Joi.object<SaveSymptomQueAnswersInput>({
    symptom_id: Joi.string().required(), // Required string
    answer_value: Joi.object().required(), // Required object
});
