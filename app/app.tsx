import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Button,
  Flex,
  Heading,
  Text,
  Collapsible,
  Table
} from '@chakra-ui/react';
import Map, { Layer, MapRef, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAuth } from 'react-oidc-context';
import { useItem } from 'stac-react';

import { EXAMPLE_CODE, processScript, usePyodide } from '$utils/code-runner';
import { UserInfo } from '$components/auth/user-info';
import { CodeEditor } from '$components/code-editor';

const MAP_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`;

export default function App() {
  const [content] = useState(EXAMPLE_CODE);
  const mapRef = useRef<MapRef>(null);
  const [tileUrl, setTileUrl] = useState();
  const [showProperties, setShowProperties] = useState(false);
  const { item, isLoading, error } = useItem(
    'https://api.explorer.eopf.copernicus.eu/stac/collections/sentinel-2-l2a/items/S2A_MSIL2A_20250922T112131_N0511_R037_T29SMD_20250922T160420'
  );

  const { pyodide, log } = usePyodide();
  const { user, isAuthenticated } = useAuth();

  // Update map view when item loads and has a bbox
  useEffect(() => {
    if (item && item.bbox && mapRef.current) {
      mapRef.current.fitBounds(item.bbox, {
        padding: 50,
        duration: 1000
      });
    }
  }, [item]);

  const executeCode = useCallback(async () => {
    if (!pyodide) return;
    const url = await processScript(pyodide, user?.access_token ?? '', content);
    setTileUrl(url);
  }, [pyodide, user?.access_token, content]);

  return (
    <Flex height='100vh'>
      <Flex flexDirection='column' p={8} zIndex={100}>
        <Flex alignItems='center' justifyContent='space-between'>
          <Heading size='2xl'>EOPF Code Editor</Heading>
          <Flex ml='auto' alignItems='center'>
            <UserInfo />
          </Flex>
        </Flex>
        <Flex
          flexDir='column'
          gap={2}
          mt={8}
          flexGrow={1}
          minHeight={0}
          maxW='sm'
        >
          <>
            {item ? (
              <>
                <Heading fontSize='sm'>Scene: {item.id}</Heading>
                {item.bbox && (
                  <Text textWrap='pretty' fontSize='sm' color='base.600' mt={1}>
                    Bbox: [
                    {item.bbox
                      .map((coord: number) => coord.toFixed(4))
                      .join(', ')}
                    ]
                  </Text>
                )}

                {item.properties?.datetime && (
                  <Text textWrap='pretty' fontSize='sm' color='base.600' mt={1}>
                    Datetime:{' '}
                    {new Date(item.properties.datetime).toLocaleString()}
                  </Text>
                )}

                <Collapsible.Root
                  mt={2}
                  layerStyle='handDrawn'
                  open={showProperties}
                  onOpenChange={(e) => setShowProperties(e.open)}
                >
                  <Collapsible.Trigger asChild>
                    <Button
                      variant='outline'
                      size='xs'
                      width='full'
                      justifyContent='space-between'
                    >
                      {showProperties ? '▼' : '▶'} All properties (
                      {Object.keys(item.properties || {}).length})
                    </Button>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <Flex maxH='200px' overflowY='auto'>
                      <Table.Root
                        size='sm'
                        variant='outline'
                        backgroundColor='bg.subtle'
                      >
                        <Table.Body>
                          {item.properties &&
                            Object.entries(item.properties).map(
                              ([key, value]) => (
                                <Table.Row key={key}>
                                  <Table.Cell
                                    fontWeight='medium'
                                    fontSize='xs'
                                    maxW='150px'
                                    minW='100px'
                                    wordBreak='break-word'
                                  >
                                    {key}
                                  </Table.Cell>
                                  <Table.Cell
                                    fontSize='xs'
                                    wordBreak='break-all'
                                  >
                                    {typeof value === 'object'
                                      ? JSON.stringify(value)
                                      : String(value)}
                                  </Table.Cell>
                                </Table.Row>
                              )
                            )}
                        </Table.Body>
                      </Table.Root>
                    </Flex>
                  </Collapsible.Content>
                </Collapsible.Root>
              </>
            ) : (
              <Text textWrap='pretty'>
                {isLoading
                  ? 'Loading STAC item...'
                  : `Error: ${JSON.stringify(error)}`}
              </Text>
            )}
          </>
          {pyodide ? (
            <CodeEditor.Root>
              <CodeEditor.View />
            </CodeEditor.Root>
          ) : (
            <Flex gap={2} flexDirection='column' flexGrow={1} minHeight={0}>
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

          <Button
            colorPalette='blue'
            size='sm'
            disabled={!isAuthenticated || !pyodide}
            layerStyle='handDrawn'
            onClick={executeCode}
          >
            Run
          </Button>
        </Flex>
      </Flex>
      <Flex flexGrow={1} h='100%'>
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
            {item && (
              <Source id='geometry' type='geojson' data={item}>
                <Layer
                  id='geometry-outline'
                  type='line'
                  paint={{
                    'line-color': '#FF0000',
                    'line-width': 2,
                    'line-opacity': 0.8
                  }}
                />
              </Source>
            )}
          </Map>
        </Flex>
      </Flex>
    </Flex>
  );
}
