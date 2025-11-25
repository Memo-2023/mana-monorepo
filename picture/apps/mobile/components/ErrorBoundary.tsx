import React, { Component, ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme, useTheme } from '~/contexts/ThemeContext';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  theme: Theme;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { theme } = this.props;

      // Default error UI
      return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />

          <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text.primary, marginTop: 24, marginBottom: 8 }}>
            Oops! Etwas ist schiefgelaufen
          </Text>

          <Text style={{ color: theme.colors.text.tertiary, textAlign: 'center', marginBottom: 24 }}>
            Die App ist auf einen unerwarteten Fehler gestoßen.
          </Text>

          {this.state.error && (
            <ScrollView
              style={{ width: '100%', maxHeight: 160, backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16, marginBottom: 24 }}
              showsVerticalScrollIndicator={true}
            >
              <Text style={{ color: theme.colors.error, fontSize: 14, fontFamily: 'monospace' }}>
                {this.state.error.toString()}
              </Text>
              {__DEV__ && this.state.errorInfo && (
                <Text style={{ color: theme.colors.text.tertiary, fontSize: 12, fontFamily: 'monospace', marginTop: 8 }}>
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </ScrollView>
          )}

          <Pressable
            onPress={this.handleReset}
            style={{ backgroundColor: theme.colors.primary.default, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Erneut versuchen
            </Text>
          </Pressable>

          {__DEV__ && (
            <Text style={{ color: theme.colors.text.tertiary, fontSize: 12, marginTop: 16 }}>
              Im Development-Modus werden detaillierte Fehlermeldungen angezeigt
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component to provide theme to ErrorBoundary
 */
export function ErrorBoundary({
  children,
  fallback,
  onError
}: {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}) {
  const { theme } = useTheme();
  return (
    <ErrorBoundaryClass theme={theme} fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryClass>
  );
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
