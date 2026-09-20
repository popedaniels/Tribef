const Joi = require('joi');

describe('Joi Validation - Unit', () => {
  it('should validate valid signup data', () => {
    const schema = Joi.object({
      firstName: Joi.string().min(2).required(),
      lastName: Joi.string().min(2).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
    });
    
    const result = schema.validate({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    
    expect(result.error).toBeUndefined();
  });

  it('should reject invalid email', () => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });
    
    const result = schema.validate({ email: 'not-an-email' });
    
    expect(result.error).toBeDefined();
    expect(result.error.details[0].message).toContain('email');
  });

  it('should reject short password', () => {
    const schema = Joi.object({
      password: Joi.string().min(6).required(),
    });
    
    const result = schema.validate({ password: 'short' });

    expect(result.error).toBeDefined();
    expect(result.error.details[0].type).toBe('string.min');
  });
});
