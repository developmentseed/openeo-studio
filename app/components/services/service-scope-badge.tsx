import { Badge } from '@chakra-ui/react';
import { LuGlobe, LuLock } from 'react-icons/lu';

export type ServiceScope = 'public' | 'private';

interface ServiceScopeBadgeProps {
  scope: ServiceScope;
}

export function ServiceScopeBadge({ scope }: ServiceScopeBadgeProps) {
  const isPublic = scope === 'public';

  return (
    <Badge
      size='sm'
      colorPalette={isPublic ? 'success' : 'quaternary'}
      flexShrink={0}
      display='inline-flex'
      alignItems='center'
      gap={1}
    >
      {isPublic ? <LuGlobe /> : <LuLock />}
      {isPublic ? 'PUBLIC' : 'PRIVATE'}
    </Badge>
  );
}

export function getServiceScope(
  configuration: Record<string, unknown> | undefined
): ServiceScope {
  return configuration?.scope === 'private' ? 'private' : 'public';
}
