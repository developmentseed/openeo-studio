import { Flex } from '@chakra-ui/react';
import { Route, Routes } from 'react-router';

import Callback from '$components/auth/callback';
import { AppHeader } from '$components/layout/app-header';
import { LandingPage } from '$pages/landing-page';
import { EditorPage } from '$pages/editor-page';
import { DocsPage } from '$pages/docs-page';

export default function App() {
  return (
    <Flex flexDirection='column' height='100vh'>
      <AppHeader />
      <Routes>
        <Route path='/auth/callback' element={<Callback />} />
        <Route path='/' element={<LandingPage />} />
        <Route path='/docs' element={<DocsPage />} />
        <Route path='/editor/:sceneId' element={<EditorPage />} />
      </Routes>
    </Flex>
  );
}
