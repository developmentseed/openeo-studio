import { Fragment } from 'react';
import { Breadcrumb } from '@chakra-ui/react';

import type { ProcessGraph } from '$types/openeo-process';

export interface GraphPathEntry {
  nodeId: string;
  /** Argument name, plus the dotted path to the subgraph when it was nested. */
  argPath: string;
  graph: ProcessGraph;
}

interface GraphBreadcrumbProps {
  path: GraphPathEntry[];
  /** Truncates the path to `depth` entries; 0 returns to the root graph. */
  onNavigate: (depth: number) => void;
}

export function GraphBreadcrumb({ path, onNavigate }: GraphBreadcrumbProps) {
  if (path.length === 0) return null;

  return (
    <Breadcrumb.Root
      size='md'
      position='absolute'
      top={4}
      left={4}
      zIndex={5}
      bg='bg.panel'
      borderWidth='1px'
      borderColor='border'
      borderRadius='uni'
      px={3}
      py={1}
    >
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Link as='button' onClick={() => onNavigate(0)}>
            Graph
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        {path.map((entry, index) => {
          const label = `#${entry.nodeId} · ${entry.argPath}`;
          const isLast = index === path.length - 1;
          return (
            <Fragment key={`${entry.nodeId}:${entry.argPath}`}>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                {isLast ? (
                  <Breadcrumb.CurrentLink>{label}</Breadcrumb.CurrentLink>
                ) : (
                  <Breadcrumb.Link
                    as='button'
                    onClick={() => onNavigate(index + 1)}
                  >
                    {label}
                  </Breadcrumb.Link>
                )}
              </Breadcrumb.Item>
            </Fragment>
          );
        })}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}
