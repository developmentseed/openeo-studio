import { ReactNode } from 'react';
import {
  Box,
  Button,
  Code,
  Flex,
  Heading,
  Link,
  Separator,
  Stack,
  Text
} from '@chakra-ui/react';
import { LuGithub, LuRotateCw } from 'react-icons/lu';

const REPO_URL = 'https://github.com/developmentseed/openeo-studio';

export interface ErrorStateDetail {
  label: string;
  /** One line of text per item. */
  value: string | string[];
  /** Show the value in a monospace font, for URLs and error messages. */
  code?: boolean;
}

export interface ErrorStateProps {
  /** Short label above the title, for example "Configuration error". */
  label: string;
  title: string;
  message: ReactNode;
  details?: ErrorStateDetail[];
  /** Content above the label, for example the app brand. */
  header?: ReactNode;
  /** More buttons between "Try again" and "View on GitHub". */
  actions?: ReactNode;
}

/**
 * Error layout with a title, a message, a details card and recovery actions.
 * It uses Chakra only, so it works without the router and the auth provider.
 */
export function ErrorState(props: ErrorStateProps) {
  const { label, title, message, details, header, actions } = props;

  const visibleDetails = details?.filter((d) => d.value.length) ?? [];

  return (
    <Stack w='100%' maxW='40rem' gap={10}>
      {header}

      <Stack gap={4}>
        <Flex
          align='center'
          gap={2}
          color='error.fg'
          fontSize='xs'
          fontWeight='semibold'
          letterSpacing='wider'
          textTransform='uppercase'
        >
          {label}
        </Flex>
        <Heading
          as='h1'
          fontSize={{ base: '3xl', md: '4xl' }}
          lineHeight='shorter'
          letterSpacing='tight'
          textWrap='balance'
        >
          {title}
        </Heading>
        <Text fontSize='lg' lineHeight='tall' color='fg.muted'>
          {message}
        </Text>
      </Stack>

      {!!visibleDetails.length && (
        <Box
          bg='bg'
          borderWidth='1px'
          borderColor='border'
          borderRadius='uni'
          p={5}
        >
          <Stack gap={4} separator={<Separator />}>
            {visibleDetails.map((detail) => (
              <DetailRow key={detail.label} {...detail} />
            ))}
          </Stack>
        </Box>
      )}

      <Stack gap={6}>
        <Flex gap={3} wrap='wrap'>
          <Button
            colorPalette='primary'
            onClick={() => window.location.reload()}
          >
            <LuRotateCw />
            Try again
          </Button>
          {actions}
          <Button variant='outline' asChild>
            <a href={REPO_URL} target='_blank' rel='noopener noreferrer'>
              <LuGithub />
              View on GitHub
            </a>
          </Button>
        </Flex>
        <Text fontSize='sm' color='fg.muted'>
          If the problem continues, contact the administrator of this deployment
          or{' '}
          <Link
            href={`${REPO_URL}/issues`}
            target='_blank'
            rel='noopener noreferrer'
            color='fg'
            textDecoration='underline'
            textUnderlineOffset='3px'
          >
            open an issue
          </Link>
          .
        </Text>
      </Stack>
    </Stack>
  );
}

function DetailRow(props: ErrorStateDetail) {
  const { label, value, code } = props;
  const lines = Array.isArray(value) ? value : [value];

  return (
    <Stack gap={1.5}>
      <Text
        fontSize='xs'
        fontWeight='semibold'
        letterSpacing='wider'
        textTransform='uppercase'
        color='fg.muted'
      >
        {label}
      </Text>
      {lines.map((line) =>
        code ? (
          <Code
            key={line}
            alignSelf='flex-start'
            fontSize='sm'
            whiteSpace='pre-wrap'
            wordBreak='break-all'
          >
            {line}
          </Code>
        ) : (
          <Text
            key={line}
            fontSize='sm'
            lineHeight='tall'
            wordBreak='break-word'
          >
            {line}
          </Text>
        )
      )}
    </Stack>
  );
}
