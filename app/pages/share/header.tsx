import { Flex, Heading } from '@chakra-ui/react';

import { ServiceOptionsMenu } from '$components/services/service-options-menu';
import {
  ServiceScopeBadge,
  type ServiceScope
} from '$components/services/service-scope-badge';
import type { BackendService } from '$types';

interface ShareHeaderProps {
  title: string;
  scope: ServiceScope;
  service: BackendService | null;
  onScopeChanged?: (scope: ServiceScope) => void;
  onDeleted?: () => void;
  actions?: React.ReactNode;
  /** Pass false when rendering inside a Dialog (avoids focus-trap dismiss). */
  portalled?: boolean;
}

export function ShareHeader({
  title,
  scope,
  service,
  onScopeChanged,
  onDeleted,
  actions,
  portalled = true
}: ShareHeaderProps) {
  return (
    <Flex
      gap={4}
      justifyContent='space-between'
      alignItems='center'
      px={2}
      py={4}
    >
      <Flex align='center' gap={2} minW={0}>
        <Heading size='md' truncate>
          {title}
        </Heading>
        <ServiceScopeBadge scope={scope} />
      </Flex>
      <Flex align='center' gap={2} minW={0} flex={1} justify='flex-end'>
        {service && (
          <ServiceOptionsMenu
            service={service}
            onScopeChanged={onScopeChanged}
            onDeleted={onDeleted}
            triggerProps={{ variant: 'outline' }}
            portalled={portalled}
          />
        )}
        {actions}
      </Flex>
    </Flex>
  );
}
