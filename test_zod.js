const { z } = require('zod');
const schema = z.object({
  status: z.string(),
  isPromotional: z.boolean().default(false)
}).partial();

console.log('Result:', schema.parse({ status: 'PAUSED' }));
console.log('Keys:', Object.keys(schema.parse({ status: 'PAUSED' })));
