import { Platform } from 'react-native';

export const createMarkdownStyles = (theme: {
	isDark: boolean;
	textColor: string;
	secondaryTextColor: string;
	backgroundColor: string;
	accentColor?: string;
}) => ({
	body: {
		color: theme.textColor,
		fontSize: 16,
		backgroundColor: theme.backgroundColor,
	},
	paragraph: {
		marginBottom: 8,
		marginTop: 0,
		lineHeight: 24,
		color: theme.textColor,
	},
	heading1: {
		fontSize: 24,
		fontWeight: 'bold' as const,
		marginBottom: 20, // Erhöht von 12 auf 20
		marginTop: 16,
		color: theme.textColor,
	},
	heading2: {
		fontSize: 20,
		fontWeight: 'bold' as const,
		marginBottom: 18, // Erhöht von 10 auf 18
		marginTop: 14,
		color: theme.textColor,
	},
	heading3: {
		fontSize: 18,
		fontWeight: 'bold' as const,
		marginBottom: 16, // Erhöht von 8 auf 16
		marginTop: 12,
		color: theme.textColor,
	},
	heading4: {
		fontSize: 16,
		fontWeight: 'bold' as const,
		marginBottom: 14, // Erhöht von 6 auf 14
		marginTop: 10,
		color: theme.textColor,
	},
	heading5: {
		fontSize: 14,
		fontWeight: 'bold' as const,
		marginBottom: 12, // Erhöht von 4 auf 12
		marginTop: 8,
		color: theme.textColor,
	},
	heading6: {
		fontSize: 12,
		fontWeight: 'bold' as const,
		marginBottom: 10, // Erhöht von 4 auf 10
		marginTop: 6,
		color: theme.textColor,
	},
	strong: {
		fontWeight: 'bold' as const,
		color: theme.textColor,
	},
	em: {
		fontStyle: 'italic' as const,
		color: theme.textColor,
	},
	s: {
		textDecorationLine: 'line-through' as const,
		color: theme.secondaryTextColor,
	},
	link: {
		color: theme.isDark ? '#4A9EFF' : '#0066CC',
		textDecorationLine: 'underline' as const,
	},
	code_inline: {
		backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
		paddingHorizontal: 4,
		paddingVertical: 2,
		borderRadius: 4,
		fontFamily: Platform.select({
			ios: 'Menlo',
			android: 'monospace',
			default: 'monospace',
		}),
		fontSize: 14,
		color: theme.textColor,
	},
	code_block: {
		backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
		padding: 12,
		borderRadius: 8,
		marginVertical: 8,
		fontFamily: Platform.select({
			ios: 'Menlo',
			android: 'monospace',
			default: 'monospace',
		}),
		fontSize: 14,
		color: theme.textColor,
	},
	list_item: {
		flexDirection: 'row' as const,
		marginBottom: 12, // Erhöht von 4 auf 12 für mehr Abstand zwischen Einträgen
		paddingVertical: 2, // Zusätzlicher vertikaler Innenabstand
	},
	// Spezieller Style für verschachtelte list_items (2. Ebene)
	list_item_list_item: {
		flexDirection: 'row' as const,
		marginBottom: 10, // Mittlerer Abstand zwischen Unterpunkten
		paddingVertical: 2,
		marginTop: 6, // Erhöhter Abstand nach oben
	},
	// Style für tief verschachtelte list_items (3. Ebene)
	list_item_list_item_list_item: {
		flexDirection: 'row' as const,
		marginBottom: 8, // Weniger Abstand auf tieferen Ebenen
		paddingVertical: 2,
		marginTop: 4,
	},
	bullet_list: {
		marginLeft: 0, // Keine Einrückung
		marginBottom: 16, // Erhöht von 8 auf 16 für mehr Abstand nach Listen
	},
	ordered_list: {
		marginLeft: 0, // Keine Einrückung
		marginBottom: 16, // Erhöht von 8 auf 16 für mehr Abstand nach Listen
	},
	// Verschachtelte Listen (Unterpunkte)
	bullet_list_list: {
		marginLeft: 20, // Einrückung für Unterpunkte
		marginTop: 16, // Erhöht von 8 auf 16 für mehr Abstand
		marginBottom: 16, // Abstand nach verschachtelten Listen
	},
	ordered_list_list: {
		marginLeft: 20, // Einrückung für Unterpunkte
		marginTop: 16, // Erhöht von 8 auf 16 für mehr Abstand
		marginBottom: 16, // Abstand nach verschachtelten Listen
	},
	// Noch tiefer verschachtelte Listen (3. Ebene)
	bullet_list_list_list: {
		marginLeft: 40, // Weitere Einrückung
		marginTop: 12, // Abstand zur Zwischenüberschrift
	},
	ordered_list_list_list: {
		marginLeft: 40, // Weitere Einrückung
		marginTop: 12, // Abstand zur Zwischenüberschrift
	},
	blockquote: {
		borderLeftWidth: 3,
		borderLeftColor:
			theme.accentColor || (theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
		paddingLeft: 12,
		paddingVertical: 8,
		marginVertical: 8,
		backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
		borderRadius: 4,
		overflow: 'hidden' as const,
	},
	hr: {
		backgroundColor: theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
		height: 1,
		marginVertical: 16,
	},
	table: {
		borderWidth: 1,
		borderColor: theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
		marginVertical: 8,
	},
	thead: {
		backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
	},
	th: {
		padding: 8,
		borderWidth: 1,
		borderColor: theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
		fontWeight: 'bold' as const,
	},
	td: {
		padding: 8,
		borderWidth: 1,
		borderColor: theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
	},
});

// Kompakte Styles für Titel
export const createCompactMarkdownStyles = (
	baseStyles: ReturnType<typeof createMarkdownStyles>
) => ({
	...baseStyles,
	body: {
		...baseStyles.body,
		fontSize: 16,
		fontWeight: 'bold' as const,
	},
	paragraph: {
		...baseStyles.paragraph,
		marginBottom: 0,
		fontWeight: 'bold' as const,
	},
	heading1: {
		...baseStyles.heading1,
		fontSize: 18,
		marginTop: 0,
		marginBottom: 0,
	},
	heading2: {
		...baseStyles.heading2,
		fontSize: 17,
		marginTop: 0,
		marginBottom: 0,
	},
});
