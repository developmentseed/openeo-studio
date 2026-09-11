import { Portal, Tooltip, type TooltipRootProps } from '@chakra-ui/react';

export interface TipProps extends Omit<TooltipRootProps, 'children'> {
  children: React.ReactNode;
  content: string;
  placement?: NonNullable<TooltipRootProps['positioning']>['placement'];
}

export function Tip(props: TipProps) {
  const { children, content, placement = 'top', positioning, ...rest } = props;

  const { placement: _, ...positioningProps } = positioning || {};

  return (
    <Tooltip.Root
      positioning={{ placement, ...positioningProps }}
      openDelay={100}
      {...rest}
    >
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content>
            <Tooltip.Arrow />
            {content}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  );
}
