import Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  API_HOST: Joi.string().hostname().default('0.0.0.0'),
  API_PORT: Joi.number().port().default(4000),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
});
