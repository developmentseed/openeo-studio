import { forwardRef } from 'react';
import { Link as ChLink, LinkProps } from '@chakra-ui/react';
import { Link, To } from 'react-router';

export interface SmartLinkProps extends LinkProps {
  to: To;
}

export default forwardRef<HTMLAnchorElement, SmartLinkProps>(
  function SmartLink(props, ref) {
    const { to, children, ...rest } = props;

    const isExternal =
      typeof to === 'string' &&
      (to.match(/^(https?:)?\/\//) || to.match(/^(mailto|tel):/));

    return isExternal ? (
      <ChLink ref={ref} href={to} {...rest}>
        {children}
      </ChLink>
    ) : (
      <ChLink ref={ref} asChild {...rest}>
        <Link to={to}>{children}</Link>
      </ChLink>
    );
  }
);
