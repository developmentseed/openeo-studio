import { Flex, Image } from '@chakra-ui/react';

import { appConfig } from '$config/runtime';

// Width other top-right page toolbars (landing header, editor results
// panel) must reserve so their content never sits under the fixed logo.
export const PARTNER_LOGO_RESERVED_SPACE = '9rem';

export function PartnerLogo() {
  if (!appConfig.partnerLogoUrl) return null;

  return (
    <Flex
      position='fixed'
      top='1.625rem'
      right={4}
      h='2rem'
      maxW='7rem'
      alignItems='center'
      justifyContent='flex-end'
      overflow='hidden'
      zIndex={1000}
    >
      <Image
        src={appConfig.partnerLogoUrl}
        alt='Partner logo'
        maxH='100%'
        maxW='100%'
        objectFit='contain'
      />
    </Flex>
  );
}
