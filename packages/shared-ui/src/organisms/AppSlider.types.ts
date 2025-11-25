export interface AppItem {
	name: string;
	description: string;
	longDescription: string;
	icon?: string;
	color: string;
	comingSoon?: boolean;
	status: 'published' | 'beta' | 'development' | 'planning';
}
