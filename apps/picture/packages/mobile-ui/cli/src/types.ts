export type ComponentRegistry = {
	$schema?: string;
	name: string;
	version: string;
	components: {
		[category: string]: {
			[key: string]: ComponentInfo;
		};
	};
};

export type ComponentInfo = {
	name: string;
	files: string[];
	category: string;
	dependencies: string[];
	description: string;
};

export type Config = {
	componentsPath: string;
	registryPath: string;
};
