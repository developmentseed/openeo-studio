import { Box, Card, Heading, Stack } from '@chakra-ui/react';

import { ServiceOptionsMenu } from './service-options-menu';
import { getServiceScope, ServiceScopeBadge } from './service-scope-badge';
import SmartLink from '$components/common/smart-link';
import type { BackendService } from '$types';

interface ServiceCardProps {
  service: BackendService;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const scope = getServiceScope(service.configuration);
  const title =
    (typeof service.configuration?.layerName === 'string' &&
      service.configuration.layerName) ||
    service.title;

  return (
    <Box position='relative'>
      <Card.Root rounded='uni' cursor='pointer' asChild>
        <SmartLink to={`/share/${service.id}`} unstyled>
          <Card.Body gap={4} p={4} pe={10}>
            <Stack gap={2}>
              <Stack align='start' gap={2} minW={0}>
                <Heading size='md' truncate>
                  {title}
                </Heading>
                <ServiceScopeBadge scope={scope} />
              </Stack>
            </Stack>
          </Card.Body>
        </SmartLink>
      </Card.Root>
      <Box position='absolute' top={3} right={3} zIndex={1}>
        <ServiceOptionsMenu service={service} />
      </Box>
    </Box>
  );
}
