export interface Establishment {
	id: string;
	name: string;
	grid_size: number;
	created_at: Date;
}

export type AdminRole = 'establishment_admin' | 'superuser';

export interface AdminUser {
	id: string;
	email: string;
	password_hash: string;
	role: AdminRole;
	establishment_id: string | null;
	created_at: Date;
}

export interface Session {
	id: string;
	user_id: string;
	expires_at: Date;
	created_at: Date;
}

export interface Transaction {
	id: string;
	token: string;
	establishment_id: string;
	customer_guid: string | null;
	used: boolean;
	created_at: Date;
	used_at: Date | null;
}

export interface TokenRedemption {
	id: string;
	transaction_id: string;
	customer_guid: string;
	redeemed_at: Date;
}
