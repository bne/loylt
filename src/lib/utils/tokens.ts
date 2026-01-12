import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export function generateGuid(): string {
	return uuidv4();
}

export function generateToken(): string {
	return crypto.randomBytes(32).toString('hex');
}
