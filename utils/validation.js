const Joi = require('joi');

// Validation schema for admin actions
const adminSchema = Joi.object({
  action: Joi.string().valid('promote', 'deleteUser').required(),
  email: Joi.when('action', { is: 'promote', then: Joi.string().email().required(), otherwise: Joi.forbidden() }),
  userId: Joi.when('action', { is: 'deleteUser', then: Joi.string().required(), otherwise: Joi.forbidden() }),
});

// Validation schema for collect endpoint (currently no payload expected)
const collectSchema = Joi.object({});

// Validation schema for chat endpoint
const chatSchema = Joi.object({
  prompt: Joi.string().min(1).required(),
  context: Joi.object().default({})
});

function validateAdminAction(payload) {
  return adminSchema.validate(payload, { abortEarly: false });
}

function validateCollect(payload) {
  return collectSchema.validate(payload, { abortEarly: false });
}

module.exports = {
  validateAdminAction,
  validateCollect,
  validateChat,
};
