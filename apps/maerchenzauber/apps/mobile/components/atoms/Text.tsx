import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

interface TextProps extends RNTextProps {
	variant?: 'header' | 'subheader' | 'body' | 'caption';
	color?: string;
}

const Text: React.FC<TextProps> = ({
	children,
	variant = 'body',
	color = '#000000',
	style,
	...props
}) => {
	const textStyle = [styles.text, styles[variant], { color }, style];

	return (
		<RNText style={textStyle} {...props}>
			{children}
		</RNText>
	);
};

const styles = StyleSheet.create({
	text: {
		fontFamily: 'System',
	},
	header: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	subheader: {
		fontSize: 18,
		fontWeight: '600',
	},
	body: {
		fontSize: 16,
	},
	caption: {
		fontSize: 14,
		fontStyle: 'italic',
	},
});

export default Text;
