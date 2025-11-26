import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import * as Updates from 'expo-updates';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRestart = async () => {
    if (Updates.isEnabled) {
      await Updates.reloadAsync();
    } else {
      // In development, just reset the error state
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-background p-6">
          <ScrollView>
            <Text className="mb-4 text-2xl font-bold text-destructive">
              Ein Fehler ist aufgetreten
            </Text>

            <View className="mb-4 rounded-lg bg-destructive/10 p-4">
              <Text className="text-sm font-semibold text-destructive">
                {this.state.error?.message || 'Unbekannter Fehler'}
              </Text>
            </View>

            {__DEV__ && this.state.errorInfo && (
              <View className="mb-4 rounded-lg bg-muted p-4">
                <Text className="mb-2 text-sm font-semibold text-foreground">Stack Trace:</Text>
                <Text className="font-mono text-xs text-muted-foreground">
                  {this.state.errorInfo.componentStack}
                </Text>
              </View>
            )}

            <Pressable
              onPress={this.handleRestart}
              className="rounded-lg bg-primary px-4 py-3"
              style={({ pressed }) => pressed && { opacity: 0.7 }}>
              <Text className="text-center font-semibold text-primary-foreground">
                App neu starten
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
