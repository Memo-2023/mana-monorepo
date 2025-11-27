import React, { memo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface ManaIconProps {
	color?: string;
	size?: number;
	style?: any;
}

/**
 * ManaIcon-Komponente
 *
 * Das Mana-Icon als SVG-Komponente.
 */
function ManaIcon({ color = '#0099FF', size = 24, style = {} }: ManaIconProps) {
	return (
		<View style={[{ width: size, height: size }, style]}>
			<Svg width={size} height={size} viewBox="0 0 24 24">
				<Path
					d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z"
					fill={color}
				/>
			</Svg>
		</View>
	);
}

// Verwende React.memo, um unnötige Neuzeichnungen zu vermeiden
export default memo(ManaIcon);
