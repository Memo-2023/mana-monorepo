import { Share, Platform, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system/next';
import type { FigureResponse, FigureRarity } from '@figgos/shared';

const RARITY_EMOJI: Record<FigureRarity, string> = {
	common: '⚪',
	rare: '🔵',
	epic: '🟣',
	legendary: '🔥',
};

const RARITY_DROP_RATE: Record<FigureRarity, string> = {
	common: '60%',
	rare: '25%',
	epic: '12%',
	legendary: '3%',
};

let sharing = false;

export async function shareFigure(figure: FigureResponse): Promise<void> {
	if (!figure.imageUrl || sharing) return;
	sharing = true;

	try {
		const ext = figure.imageUrl.endsWith('.webp') ? 'webp' : 'png';
		const destination = new File(Paths.cache, `figgos-share-${figure.id}.${ext}`);

		if (!destination.exists) {
			await File.downloadFileAsync(figure.imageUrl, destination);
		}

		if (Platform.OS === 'ios') {
			await Share.share({
				message: buildShareMessage(figure),
				url: destination.uri,
			});
		} else {
			await Sharing.shareAsync(destination.uri, {
				mimeType: ext === 'webp' ? 'image/webp' : 'image/png',
				dialogTitle: `Share ${figure.name}`,
			});
		}
	} catch {
		Alert.alert('Share failed', 'Could not share this figure. Please try again.');
	} finally {
		sharing = false;
	}
}

// Unicode Mathematical Bold map for A-Z, 0-9
const BOLD_UPPER: Record<string, string> = {
	A: '𝗔', B: '𝗕', C: '𝗖', D: '𝗗', E: '𝗘', F: '𝗙', G: '𝗚', H: '𝗛', I: '𝗜',
	J: '𝗝', K: '𝗞', L: '𝗟', M: '𝗠', N: '𝗡', O: '𝗢', P: '𝗣', Q: '𝗤', R: '𝗥',
	S: '𝗦', T: '𝗧', U: '𝗨', V: '𝗩', W: '𝗪', X: '𝗫', Y: '𝗬', Z: '𝗭',
	'0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰',
	'5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵',
};

function toBold(text: string): string {
	return [...text].map((c) => BOLD_UPPER[c] ?? c).join('');
}

function statBar(value: number): string {
	const filled = Math.round(value / 10);
	return '▰'.repeat(filled) + '▱'.repeat(10 - filled);
}

function buildShareMessage(figure: FigureResponse): string {
	const emoji = RARITY_EMOJI[figure.rarity];
	const rate = RARITY_DROP_RATE[figure.rarity];
	const stats = figure.generatedProfile?.stats;
	const serial = figure.id.split('-').pop()?.toUpperCase();
	const line = '━━━━━━━━━━━━━';

	let msg = line;
	msg += `\n${emoji} ${toBold(figure.rarity.toUpperCase() + ' PULL')}`;
	msg += `\n${line}`;
	msg += `\n"${figure.name}"`;

	if (stats) {
		msg += `\nATK ${statBar(stats.attack)} ${stats.attack}`;
		msg += `\nDEF ${statBar(stats.defense)} ${stats.defense}`;
		msg += `\nSPL ${statBar(stats.special)} ${stats.special}`;
	}

	msg += `\n${serial ? `#${serial} · ` : ''}${rate} drop rate`;
	msg += `\n${line}`;
	msg += `\nThink you can pull better? ✨`;
	msg += `\nMade with Figgos`;

	return msg;
}
