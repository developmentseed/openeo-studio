import { Component, ReactNode } from 'react';
import { Flex } from '@chakra-ui/react';
import { useLocation } from 'react-router';

import { AppHeader } from '$components/layout/app-header';
import { useEffectAfterMount } from '$utils/use-effect-after-mount';
import { NotFound } from './error';
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

  // componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
  //   console.error('ErrorBoundary caught an error', error, errorInfo);
  // }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorWrapper resetError={this.resetError.bind(this)}>
          {this.state.error instanceof NotFound ? <UhOh404 /> : <UhOh500 />}
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

  const loc = useLocation().pathname;

  useEffectAfterMount(() => {
    resetError();
  }, [loc]);

  return (
    <Flex minH='100vh' direction='column'>
      <AppHeader />
      {children}
    </Flex>
  );
}
