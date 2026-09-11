import { Link as ChLink, LinkProps } from '@chakra-ui/react';
import { MouseEvent, useMemo } from 'react';
import { Link } from 'react-router';

export interface SmartLinkProps extends LinkProps {
  to: string;
  ref?: React.Ref<HTMLAnchorElement>;
  noLinkTrigger?: boolean;
}

export default function SmartLink(props: SmartLinkProps) {
  const { to, ref, children, noLinkTrigger, onClick, ...rest } = props;

  const isExternal = to.match(/^(https?:)?\/\//) || to.match(/^(mailto|tel):/);

  const css = {
    '&[type="button"]:hover': {
      textDecoration: 'none'
    }
  };

  const onClickHandler = useMemo(() => {
    if (noLinkTrigger) {
      return (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        e.defaultPrevented = false;
        onClick?.(e);
      };
    }

    return onClick;
  }, [noLinkTrigger, onClick]);

  return isExternal ? (
    <ChLink ref={ref} href={to} css={css} onClick={onClickHandler} {...rest}>
      {children}
    </ChLink>
  ) : (
    <ChLink ref={ref} asChild css={css} onClick={onClickHandler} {...rest}>
      <Link to={to}>{children}</Link>
    </ChLink>
  );
}
