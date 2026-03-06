import { Text, Linking } from 'react-native';

const URL_REGEX = /(https?:\/\/[^\s<>[\]{}|\\^`"]+)/g;
const MENTION_REGEX = /(@[\w.-]+:[\w.-]+)/g;

interface Segment {
	text: string;
	type: 'text' | 'url' | 'mention';
}

function parseSegments(body: string): Segment[] {
	const segments: Segment[] = [];
	// Split on URLs first, then handle mentions
	const parts = body.split(URL_REGEX);
	for (const part of parts) {
		if (URL_REGEX.test(part)) {
			segments.push({ text: part, type: 'url' });
			URL_REGEX.lastIndex = 0;
		} else {
			// Split on @mentions
			const mentionParts = part.split(MENTION_REGEX);
			for (const mp of mentionParts) {
				if (MENTION_REGEX.test(mp)) {
					segments.push({ text: mp, type: 'mention' });
					MENTION_REGEX.lastIndex = 0;
				} else if (mp) {
					segments.push({ text: mp, type: 'text' });
				}
			}
		}
	}
	return segments;
}

interface Props {
	body: string;
	isOwn: boolean;
	className?: string;
}

export default function MessageText({ body, isOwn, className }: Props) {
	const segments = parseSegments(body);
	const baseColor = isOwn ? 'rgba(255,255,255,0.95)' : undefined;

	return (
		<Text
			selectable
			className={`text-sm leading-5 px-3 py-2 ${isOwn ? 'text-white' : 'text-foreground'} ${className ?? ''}`}
		>
			{segments.map((seg, i) => {
				if (seg.type === 'url') {
					return (
						<Text
							key={i}
							style={{ color: isOwn ? 'rgba(200,190,255,1)' : '#7c6bff', textDecorationLine: 'underline' }}
							onPress={() => Linking.openURL(seg.text).catch(() => {})}
						>
							{seg.text}
						</Text>
					);
				}
				if (seg.type === 'mention') {
					return (
						<Text
							key={i}
							style={{ color: isOwn ? 'rgba(200,255,200,1)' : '#22c55e', fontWeight: '600' }}
						>
							{seg.text}
						</Text>
					);
				}
				return (
					<Text key={i} style={baseColor ? { color: baseColor } : undefined}>
						{seg.text}
					</Text>
				);
			})}
		</Text>
	);
}
