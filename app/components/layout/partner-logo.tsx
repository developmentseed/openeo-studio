import { Flex, Image } from '@chakra-ui/react';

import { appConfig } from '$config/runtime';

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
