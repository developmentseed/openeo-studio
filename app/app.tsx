import { useEffect } from 'react';
import { Flex } from '@chakra-ui/react';
import { Route, Routes } from 'react-router';
import { AppHeader } from '$components/layout/app-header';
import { LandingPage } from '$pages/landing-page';
import { EditorPage } from '$pages/editor-page';
import UhOh404 from '$pages/uhoh/404';
import { useSceneValues } from './stores/scene/selectors';

export default function App() {
  const [, reset] = useSceneValues();

  useEffect(() => {
    reset();
  }, []);

  return (
    <Flex flexDirection='column' height='100vh'>
      <AppHeader />
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/editor/:sceneId' element={<EditorPage />} />
        <Route path='*' element={<UhOh404 />} />
      </Routes>
    </Flex>
  );
}
