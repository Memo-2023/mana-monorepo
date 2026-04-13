import type { ModuleTool } from '$lib/data/tools/types';
import { skillStore } from './stores/skills.svelte';

export const skilltreeTools: ModuleTool[] = [
	{
		name: 'add_skill_xp',
		module: 'skilltree',
		description: 'Fuegt XP zu einem Skill hinzu (z.B. nach einer Uebung)',
		parameters: [
			{ name: 'skillId', type: 'string', description: 'ID des Skills', required: true },
			{ name: 'xp', type: 'number', description: 'XP-Punkte', required: true },
			{ name: 'description', type: 'string', description: 'Was wurde gemacht', required: true },
			{ name: 'duration', type: 'number', description: 'Dauer in Minuten', required: false },
		],
		async execute(params) {
			const result = await skillStore.addXp(
				params.skillId as string,
				params.xp as number,
				params.description as string,
				params.duration as number | undefined
			);
			return {
				success: true,
				data: result,
				message: `+${params.xp} XP${result.leveledUp ? ` — Level Up! (${result.newLevel})` : ''}`,
			};
		},
	},
	{
		name: 'create_skill',
		module: 'skilltree',
		description: 'Erstellt einen neuen Skill im Skilltree',
		parameters: [
			{ name: 'name', type: 'string', description: 'Name des Skills', required: true },
			{ name: 'description', type: 'string', description: 'Beschreibung', required: false },
		],
		async execute(params) {
			const skill = await skillStore.addSkill({
				name: params.name as string,
				description: params.description as string | undefined,
			});
			return { success: true, data: skill, message: `Skill "${skill.name}" erstellt` };
		},
	},
];
