const { z } = require('zod');
const { step3Schema } = require('./src/modules/onboarding/onboarding.schema');
const validate = require('./src/middleware/validate');

const req = { body: { insurance_provider: "Star Health", preferred_time_slot: "Morning" } };
const res = {
  status: (code) => ({
    json: (body) => console.log('Response:', code, body)
  })
};
const next = (err) => console.log('Next called with:', err);

try {
  const mw = validate(step3Schema);
  mw(req, res, next);
} catch (e) {
  console.error("Caught error:", e);
}
