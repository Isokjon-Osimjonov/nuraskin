import type { Request, Response } from 'express';
import * as service from './storefront-contact.service';
import { contactFormSchema } from '@nuraskin/shared-types';

export async function send(req: Request, res: Response) {
  const input = contactFormSchema.parse(req.body);
  const result = await service.sendContactMessage(input);
  res.json(result);
}
