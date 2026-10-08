import { Box, Flex, FlexProps, Heading, Image, Text } from '@chakra-ui/react';

import { appConfig } from '$config/runtime';

import logoImg from '../../media/openeo_navbar_logo.png';

function Logo(props: FlexProps & { src: string }) {
  const { src, ...rest } = props;

  return (
    <Flex
      boxSize='2rem'
      borderWidth='1px'
      borderColor='border'
      borderRadius='uni'
      justifyContent='center'
      bg='bg'
      p={0.5}
      overflow='hidden'
      position='relative'
      zIndex={1}
      {...rest}
    >
      <Image src={src} borderRadius='uni' overflow='hidden' h='100%' />
    </Flex>
  );
}

export function LogoComposition() {
  const hasPartner = !!appConfig.partnerLogoUrl && !!appConfig.partnerName;

  return (
    <Box className='logo-comp'>
      <Logo src={logoImg} />
      {hasPartner && <Logo mt={-4} src={appConfig.partnerLogoUrl} />}
    </Box>
  );
}

export function NameComposition() {
  const hasPartner = !!appConfig.partnerLogoUrl && !!appConfig.partnerName;

  if (!hasPartner) {
    return <Heading size='sm'>OpenEo Studio</Heading>;
  }

  return (
    <Heading size='sm'>
      <Text as='span' fontSize='2xs' lineHeight='0.875rem' color='fg.muted'>
        OpenEo Studio{' '}
        <Text as='span' fontWeight='normal'>
          for
        </Text>
      </Text>
      <Text>{appConfig.partnerName}</Text>
    </Heading>
  );
}
