/**
 * Example React Native Component Test
 *
 * This demonstrates best practices for testing React Native components:
 * - Render testing
 * - User interaction testing
 * - State changes
 * - Props validation
 * - Accessibility testing
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { ExampleComponent } from '../ExampleComponent';

describe('ExampleComponent', () => {
	// Mock data
	const mockOnPress = jest.fn();
	const mockOnLongPress = jest.fn();
	const defaultProps = {
		title: 'Test Title',
		description: 'Test Description',
		onPress: mockOnPress,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render with required props', () => {
			const { getByText } = render(<ExampleComponent {...defaultProps} />);

			expect(getByText('Test Title')).toBeTruthy();
			expect(getByText('Test Description')).toBeTruthy();
		});

		it('should render with testID for automation', () => {
			const { getByTestId } = render(<ExampleComponent {...defaultProps} testID="example-component" />);

			expect(getByTestId('example-component')).toBeTruthy();
		});

		it('should render loading state', () => {
			const { getByTestId, queryByText } = render(<ExampleComponent {...defaultProps} loading />);

			expect(getByTestId('loading-indicator')).toBeTruthy();
			expect(queryByText('Test Title')).toBeNull(); // Content hidden when loading
		});

		it('should render error state', () => {
			const errorMessage = 'Something went wrong';
			const { getByText } = render(<ExampleComponent {...defaultProps} error={errorMessage} />);

			expect(getByText(errorMessage)).toBeTruthy();
		});

		it('should render optional icon when provided', () => {
			const { getByTestId } = render(<ExampleComponent {...defaultProps} icon="star" />);

			expect(getByTestId('icon-star')).toBeTruthy();
		});

		it('should not render description when not provided', () => {
			const { queryByText } = render(<ExampleComponent title="Title Only" onPress={mockOnPress} />);

			expect(queryByText('Test Description')).toBeNull();
		});
	});

	describe('User Interactions', () => {
		it('should call onPress when pressed', () => {
			const { getByText } = render(<ExampleComponent {...defaultProps} />);

			fireEvent.press(getByText('Test Title'));

			expect(mockOnPress).toHaveBeenCalledTimes(1);
		});

		it('should call onLongPress when long pressed', () => {
			const { getByText } = render(<ExampleComponent {...defaultProps} onLongPress={mockOnLongPress} />);

			fireEvent(getByText('Test Title'), 'onLongPress');

			expect(mockOnLongPress).toHaveBeenCalledTimes(1);
		});

		it('should not call onPress when disabled', () => {
			const { getByText } = render(<ExampleComponent {...defaultProps} disabled />);

			fireEvent.press(getByText('Test Title'));

			expect(mockOnPress).not.toHaveBeenCalled();
		});

		it('should not call onPress when loading', () => {
			const { getByTestId } = render(
				<ExampleComponent {...defaultProps} loading testID="example-component" />
			);

			fireEvent.press(getByTestId('example-component'));

			expect(mockOnPress).not.toHaveBeenCalled();
		});

		it('should show feedback on press (opacity change)', async () => {
			const { getByText } = render(<ExampleComponent {...defaultProps} />);
			const touchable = getByText('Test Title').parent;

			fireEvent(touchable, 'onPressIn');
			await waitFor(() => {
				expect(touchable.props.style).toMatchObject({
					opacity: 0.6, // Active opacity
				});
			});

			fireEvent(touchable, 'onPressOut');
			await waitFor(() => {
				expect(touchable.props.style).toMatchObject({
					opacity: 1,
				});
			});
		});
	});

	describe('State Management', () => {
		it('should toggle favorite state on icon press', async () => {
			const { getByTestId, rerender } = render(<ExampleComponent {...defaultProps} favoritable />);

			const favoriteIcon = getByTestId('favorite-icon');
			expect(favoriteIcon.props.name).toBe('heart-outline'); // Initial state

			fireEvent.press(favoriteIcon);

			await waitFor(() => {
				expect(favoriteIcon.props.name).toBe('heart'); // Toggled state
			});
		});

		it('should maintain expanded state across re-renders', async () => {
			const { getByTestId, rerender } = render(<ExampleComponent {...defaultProps} expandable />);

			const expandButton = getByTestId('expand-button');
			fireEvent.press(expandButton);

			await waitFor(() => {
				expect(getByTestId('expanded-content')).toBeTruthy();
			});

			// Re-render with updated props
			rerender(<ExampleComponent {...defaultProps} description="Updated Description" expandable />);

			// Expanded state should persist
			expect(getByTestId('expanded-content')).toBeTruthy();
		});
	});

	describe('Props Validation', () => {
		it('should handle empty title gracefully', () => {
			const { queryByText } = render(<ExampleComponent title="" onPress={mockOnPress} />);

			expect(queryByText('')).toBeNull();
		});

		it('should truncate long titles', () => {
			const longTitle = 'This is a very long title that should be truncated at some point';
			const { getByText } = render(<ExampleComponent title={longTitle} onPress={mockOnPress} />);

			const titleElement = getByText(/This is a very long/);
			expect(titleElement.props.numberOfLines).toBe(1);
			expect(titleElement.props.ellipsizeMode).toBe('tail');
		});

		it('should apply custom styles', () => {
			const customStyle = { backgroundColor: 'red', padding: 20 };
			const { getByTestId } = render(
				<ExampleComponent {...defaultProps} style={customStyle} testID="example-component" />
			);

			const component = getByTestId('example-component');
			expect(component.props.style).toMatchObject(customStyle);
		});
	});

	describe('Accessibility', () => {
		it('should have accessible label', () => {
			const { getByLabelText } = render(<ExampleComponent {...defaultProps} />);

			expect(getByLabelText('Test Title')).toBeTruthy();
		});

		it('should have accessible role', () => {
			const { getByRole } = render(<ExampleComponent {...defaultProps} />);

			expect(getByRole('button')).toBeTruthy();
		});

		it('should have accessible hint', () => {
			const { getByA11yHint } = render(
				<ExampleComponent {...defaultProps} accessibilityHint="Double tap to open details" />
			);

			expect(getByA11yHint('Double tap to open details')).toBeTruthy();
		});

		it('should be disabled for screen readers when disabled', () => {
			const { getByTestId } = render(
				<ExampleComponent {...defaultProps} disabled testID="example-component" />
			);

			const component = getByTestId('example-component');
			expect(component.props.accessibilityState).toMatchObject({
				disabled: true,
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle rapid taps (debouncing)', async () => {
			jest.useFakeTimers();
			const { getByText } = render(<ExampleComponent {...defaultProps} />);

			const button = getByText('Test Title');

			// Rapid taps
			fireEvent.press(button);
			fireEvent.press(button);
			fireEvent.press(button);

			jest.runAllTimers();

			// Should only call once due to debouncing
			expect(mockOnPress).toHaveBeenCalledTimes(1);

			jest.useRealTimers();
		});

		it('should handle null children gracefully', () => {
			const { container } = render(<ExampleComponent {...defaultProps}>{null}</ExampleComponent>);

			expect(container).toBeTruthy();
		});

		it('should handle undefined props gracefully', () => {
			const { getByText } = render(<ExampleComponent title="Test" onPress={mockOnPress} description={undefined} />);

			expect(getByText('Test')).toBeTruthy();
		});
	});

	describe('Performance', () => {
		it('should not re-render unnecessarily', () => {
			const renderSpy = jest.fn();
			const ComponentWithSpy = (props) => {
				renderSpy();
				return <ExampleComponent {...props} />;
			};

			const { rerender } = render(<ComponentWithSpy {...defaultProps} />);

			expect(renderSpy).toHaveBeenCalledTimes(1);

			// Re-render with same props
			rerender(<ComponentWithSpy {...defaultProps} />);

			// Should use memo and not re-render
			expect(renderSpy).toHaveBeenCalledTimes(1);
		});

		it('should only re-render when relevant props change', () => {
			const renderSpy = jest.fn();
			const ComponentWithSpy = (props) => {
				renderSpy();
				return <ExampleComponent {...props} />;
			};

			const { rerender } = render(<ComponentWithSpy {...defaultProps} />);

			expect(renderSpy).toHaveBeenCalledTimes(1);

			// Re-render with different title
			rerender(<ComponentWithSpy {...defaultProps} title="New Title" />);

			// Should re-render
			expect(renderSpy).toHaveBeenCalledTimes(2);
		});
	});

	describe('Snapshot Testing', () => {
		it('should match snapshot for default state', () => {
			const { toJSON } = render(<ExampleComponent {...defaultProps} />);

			expect(toJSON()).toMatchSnapshot();
		});

		it('should match snapshot for loading state', () => {
			const { toJSON } = render(<ExampleComponent {...defaultProps} loading />);

			expect(toJSON()).toMatchSnapshot();
		});

		it('should match snapshot for error state', () => {
			const { toJSON } = render(<ExampleComponent {...defaultProps} error="Error message" />);

			expect(toJSON()).toMatchSnapshot();
		});
	});
});
