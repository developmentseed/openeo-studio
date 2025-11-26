import { useState, useRef, useCallback } from 'react';
import {
  Button,
  Flex,
  Heading,
  Separator,
  Text,
  Textarea
} from '@chakra-ui/react';
import Map, { Layer, MapRef, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAuth } from 'react-oidc-context';

import { EXAMPLE_CODE, processScript, usePyodide } from '$utils/code-runner';
import { UserInfo } from '$components/auth/user-info';
import { CodeEditor } from '$components/code-editor';

const MAP_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`;

export default function App() {
  const [content, setContent] = useState(EXAMPLE_CODE);
  const mapRef = useRef<MapRef>(null);
  const [tileUrl, setTileUrl] = useState();

  const { pyodide, log } = usePyodide();
  const { user } = useAuth();

  const executeCode = useCallback(async () => {
    if (!pyodide) return;
    const url = await processScript(pyodide, user?.access_token ?? '', content);
    setTileUrl(url);
  }, [pyodide, user?.access_token, content]);

  return (
    <Flex height='100vh'>
      <Flex flexGrow={1} flexDirection='column' p={8} zIndex={100}>
        <Flex alignItems='center' justifyContent='space-between'>
          <Heading size='2xl'>EOPF Code Editor</Heading>
          <Flex ml='auto' alignItems='center'>
            <Button
              colorPalette='blue'
              size='sm'
              disabled={!pyodide}
              layerStyle='handDrawn'
              onClick={executeCode}
            >
              Run
            </Button>
            <Separator orientation='vertical' mx={4} height='40px' />
            <UserInfo />
          </Flex>
        </Flex>
        <Flex flexDir='column' gap={8} mt={8}>
          {pyodide ? (
            <CodeEditor.Root>
              <CodeEditor.View />
            </CodeEditor.Root>
            // <Textarea
            //   minH='15rem'
            //   resize='vertical'
            //   value={content}
            //   onChange={(e) => setContent(e.target.value)}
            //   mt={2}
            //   fontFamily='monospace'
            //   layerStyle='handDrawn'
            // />
          ) : (
            <Flex gap={2} flexDirection='column'>
              {log.map((l, index) => (
                <Text
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  fontFamily='monospace'
                  color={
                    l.type === 'info'
                      ? 'base.500'
                      : l.type === 'success'
                        ? 'green.500'
                        : 'red.500'
                  }
                  m={0}
                >
                  {l.message}
                </Text>
              ))}
            </Flex>
          )}
        </Flex>
      </Flex>
      <Flex w='50%' h='100%'>
        <Flex
          m={4}
          flexGrow={1}
          layerStyle='handDrawn'
          overflow='hidden'
          border='2px solid {colors.base.300a}'
        >
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: 0,
              latitude: 0,
              zoom: 2
            }}
            style={{ flexGrow: 1 }}
            mapStyle={MAP_STYLE}
          >
            {tileUrl && (
              <Source
                type='raster'
                tiles={[decodeURIComponent(tileUrl)]}
                tileSize={256}
              >
                <Layer type='raster' />
              </Source>
            )}
          </Map>
        </Flex>
      </Flex>
    </Flex>
  );
}
