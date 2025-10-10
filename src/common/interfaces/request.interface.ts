import { Request } from 'express';
import { AuthenticatedUser } from './auth.interface';

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
