import { Joi } from '../../index';

export interface AddAspectInput {
  aspectId: string;
  configJSON: object;
}

export const addAspectInputSchema = Joi.object<AddAspectInput>({
  aspectId: Joi.string().required(),
  configJSON: Joi.object().required(),
});