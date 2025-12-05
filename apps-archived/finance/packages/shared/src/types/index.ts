// Account Types
export type AccountType =
	| 'checking'
	| 'savings'
	| 'credit_card'
	| 'cash'
	| 'investment'
	| 'loan'
	| 'other';

export interface Account {
	id: string;
	userId: string;
	name: string;
	type: AccountType;
	balance: string;
	currency: string;
	color: string;
	icon: string;
	isArchived: boolean;
	includeInTotal: boolean;
	order: number;
	description?: string;
	institutionName?: string;
	accountNumber?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateAccountInput {
	name: string;
	type: AccountType;
	balance?: string;
	currency?: string;
	color?: string;
	icon?: string;
	description?: string;
	institutionName?: string;
	accountNumber?: string;
	includeInTotal?: boolean;
}

export interface UpdateAccountInput extends Partial<CreateAccountInput> {
	isArchived?: boolean;
	order?: number;
}

// Category Types
export type CategoryType = 'income' | 'expense';

export interface Category {
	id: string;
	userId: string;
	name: string;
	type: CategoryType;
	parentId?: string;
	color: string;
	icon: string;
	order: number;
	isSystem: boolean;
	isArchived: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateCategoryInput {
	name: string;
	type: CategoryType;
	parentId?: string;
	color?: string;
	icon?: string;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
	isArchived?: boolean;
	order?: number;
}

// Transaction Types
export type TransactionType = 'income' | 'expense';

export interface RecurrenceRule {
	frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
	interval: number;
	endDate?: string;
	dayOfMonth?: number;
	dayOfWeek?: number;
}

export interface Transaction {
	id: string;
	userId: string;
	accountId: string;
	categoryId?: string;
	type: TransactionType;
	amount: string;
	currency: string;
	date: string;
	description?: string;
	notes?: string;
	payee?: string;
	isRecurring: boolean;
	recurrenceRule?: RecurrenceRule;
	parentTransactionId?: string;
	isPending: boolean;
	isReconciled: boolean;
	tags: string[];
	attachments: string[];
	createdAt: Date;
	updatedAt: Date;
	// Joined data
	account?: Account;
	category?: Category;
}

export interface CreateTransactionInput {
	accountId: string;
	categoryId?: string;
	type: TransactionType;
	amount: string;
	currency?: string;
	date: string;
	description?: string;
	notes?: string;
	payee?: string;
	isRecurring?: boolean;
	recurrenceRule?: RecurrenceRule;
	isPending?: boolean;
	tags?: string[];
}

export interface UpdateTransactionInput extends Partial<CreateTransactionInput> {
	isReconciled?: boolean;
}

export interface TransactionFilters {
	accountId?: string;
	categoryId?: string;
	type?: TransactionType;
	startDate?: string;
	endDate?: string;
	minAmount?: string;
	maxAmount?: string;
	search?: string;
	isPending?: boolean;
	isRecurring?: boolean;
	limit?: number;
	offset?: number;
}

// Budget Types
export interface Budget {
	id: string;
	userId: string;
	categoryId?: string;
	month: number;
	year: number;
	amount: string;
	currency: string;
	alertThreshold: string;
	alertEnabled: boolean;
	rolloverEnabled: boolean;
	rolloverAmount: string;
	createdAt: Date;
	updatedAt: Date;
	// Computed
	spent?: string;
	remaining?: string;
	percentage?: number;
	category?: Category;
}

export interface CreateBudgetInput {
	categoryId?: string;
	month: number;
	year: number;
	amount: string;
	currency?: string;
	alertThreshold?: string;
	alertEnabled?: boolean;
	rolloverEnabled?: boolean;
}

export interface UpdateBudgetInput extends Partial<CreateBudgetInput> {}

// Transfer Types
export interface Transfer {
	id: string;
	userId: string;
	fromAccountId: string;
	toAccountId: string;
	amount: string;
	date: string;
	description?: string;
	createdAt: Date;
	updatedAt: Date;
	// Joined data
	fromAccount?: Account;
	toAccount?: Account;
}

export interface CreateTransferInput {
	fromAccountId: string;
	toAccountId: string;
	amount: string;
	date: string;
	description?: string;
}

export interface UpdateTransferInput extends Partial<CreateTransferInput> {}

// Exchange Rate Types
export interface ExchangeRate {
	id: string;
	fromCurrency: string;
	toCurrency: string;
	rate: string;
	date: string;
}

// User Settings Types
export interface UserSettings {
	id: string;
	userId: string;
	defaultCurrency: string;
	locale: string;
	dateFormat: string;
	weekStartsOn: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface UpdateUserSettingsInput {
	defaultCurrency?: string;
	locale?: string;
	dateFormat?: string;
	weekStartsOn?: number;
}

// Report Types
export interface DashboardData {
	totalBalance: number;
	totalBalanceByCurrency: Record<string, number>;
	monthlyIncome: number;
	monthlyExpenses: number;
	monthlyNet: number;
	budgetProgress: BudgetProgress[];
	recentTransactions: Transaction[];
	accountBalances: AccountBalance[];
}

export interface BudgetProgress {
	categoryId: string;
	categoryName: string;
	categoryColor: string;
	budgeted: number;
	spent: number;
	remaining: number;
	percentage: number;
}

export interface AccountBalance {
	accountId: string;
	accountName: string;
	accountType: AccountType;
	accountColor: string;
	balance: number;
	currency: string;
}

export interface MonthlySummary {
	month: number;
	year: number;
	income: number;
	expenses: number;
	net: number;
	byCategory: CategoryBreakdown[];
}

export interface CategoryBreakdown {
	categoryId: string;
	categoryName: string;
	categoryColor: string;
	categoryIcon: string;
	amount: number;
	percentage: number;
	transactionCount: number;
}

export interface TrendData {
	date: string;
	income: number;
	expenses: number;
	net: number;
}

// Connected Account Types (Bank Sync Preparation)
export type ConnectionStatus = 'active' | 'disconnected' | 'error';

export interface ConnectedAccount {
	id: string;
	userId: string;
	accountId: string;
	provider: string;
	externalId: string;
	status: ConnectionStatus;
	lastSyncAt?: Date;
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}
