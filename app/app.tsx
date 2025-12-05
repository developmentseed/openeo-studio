import { useState } from 'react';
import { Flex } from '@chakra-ui/react';
import { useItem } from 'stac-react';
import { AppHeader } from '$components/layout/app-header';
import { EditorPanel } from '$components/layout/editor-panel';
import { MapPanel } from '$components/layout/map-panel';

const STAC_ITEM_URL =
  'https://api.explorer.eopf.copernicus.eu/stac/collections/sentinel-2-l2a/items/S2A_MSIL2A_20250922T112131_N0511_R037_T29SMD_20250922T160420';

export default function App() {
  const [tileUrl, setTileUrl] = useState<string | undefined>();
  const { item, isLoading, error } = useItem(STAC_ITEM_URL);

  return (
    <Flex flexDirection='column' height='100vh'>
      <AppHeader />
      <Flex flexGrow={1} minHeight={0}>
        <EditorPanel
          item={item}
          isLoading={isLoading}
          error={error}
          setTileUrl={setTileUrl}
        />
        <MapPanel item={item} tileUrl={tileUrl} />
      </Flex>
    </Flex>
  );
}
