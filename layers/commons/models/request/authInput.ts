import { Joi } from './../../index';

export interface AuthInput {
  mobileNumber: string;
  countryCode: string;
  email?: string;
  otpCode: string;
}

export const authInputSchema = Joi.object<AuthInput>({
  mobileNumber: Joi.string().required(),
  countryCode: Joi.string().required(),
  email: Joi.string().email().when('mobileNumber', {
    is: Joi.string().required(),
    then: Joi.optional(),
    otherwise: Joi.optional().allow(null),
  }),
  otpCode: Joi.string().optional(),
});
