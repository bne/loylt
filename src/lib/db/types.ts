export interface Establishment {
	id: string;
	name: string;
	password_hash: string;
	grid_size: number;
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
