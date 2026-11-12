import {
  Alert,
  AlertRootProps,
  Box,
  CloseButton,
  List,
  Text
} from '@chakra-ui/react';

import { useEditorStore } from '$stores/editor-store';

/**
 * Tells the user what to check in the content that was just loaded: code
 * from a link runs in their session, code generated from a UDP may not work,
 * and values the backend doesn't support were left out.
 */
export function LoadNoticeAlert(props: AlertRootProps) {
  const notice = useEditorStore((state) => state.loadNotice);
  const dismiss = useEditorStore((state) => state.dismissLoadNotice);

  if (!notice) return null;
  const { external, generated, incompatibilities } = notice;
  const list = incompatibilities.length > 0 && (
    <List.Root ps={4}>
      {incompatibilities.map((message) => (
        <List.Item key={message}>{message}</List.Item>
      ))}
    </List.Root>
  );

  return (
    <Alert.Root status='warning' size='sm' {...props}>
      <Alert.Indicator />
      <Alert.Content gap={2}>
        {external && (
          <Box>
            <Alert.Title>This code comes from a link</Alert.Title>
            <Alert.Description>
              Read the code before you click Save. Save runs the code in your
              browser, in your session, and saves the project to your account.
            </Alert.Description>
          </Box>
        )}
        {generated && (
          <Box>
            <Alert.Title>This code was generated from a UDP</Alert.Title>
            <Alert.Description>
              <Text mb={1}>
                Studio wrote this code from the process graph of the UDP. Read
                it before you run it: it may not work.
              </Text>
              {list}
            </Alert.Description>
          </Box>
        )}
        {!generated && list && (
          <Box>
            <Alert.Title>
              This project doesn&apos;t fully match the connected backend
            </Alert.Title>
            <Alert.Description>
              {list}
              <Text mt={1}>The code is loaded unchanged and may not work.</Text>
            </Alert.Description>
          </Box>
        )}
      </Alert.Content>
      <CloseButton
        size='2xs'
        alignSelf='flex-start'
        aria-label='Dismiss'
        onClick={dismiss}
      />
    </Alert.Root>
  );
}
