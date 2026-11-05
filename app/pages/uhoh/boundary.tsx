import { Component, ReactNode, useEffect } from 'react';
import { Flex } from '@chakra-ui/react';
import { useLocation } from 'react-router';

import { AppHeader } from '$components/layout/app-header';
import { useEffectAfterMount } from '$utils/use-effect-after-mount';
import { NotFound } from '$utils/errors';
import UhOh404 from './404';
import UhOh500 from './500';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  resetError() {
    this.setState({ hasError: false, error: undefined });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorWrapper resetError={this.resetError.bind(this)}>
          {this.state.error instanceof NotFound ? (
            <UhOh404 message={this.state.error.message} />
          ) : (
            <UhOh500 error={this.state.error} />
          )}
        </ErrorWrapper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

interface ErrorWrapperProps {
  children: ReactNode;
  resetError: () => void;
}

function ErrorWrapper(props: ErrorWrapperProps) {
  const { children, resetError } = props;

  // Every navigation gets a new key, so navigating to the same path (e.g.
  // "New project" from a failed /editor) still clears the error.
  const loc = useLocation().key;

  useEffectAfterMount(() => {
    resetError();
  }, [loc]);

  // A not-found message travels in history state, which survives a reload;
  // drop it once shown so a reload opens the editor again.
  useEffect(() => {
    const state = window.history.state;
    if (state?.usr?.notFound) {
      window.history.replaceState({ ...state, usr: null }, '');
    }
  }, [loc]);

  return (
    <Flex minH='100vh' p={2} gap={2} bg='bg.subtle'>
      <AppHeader />
      {children}
    </Flex>
  );
}
