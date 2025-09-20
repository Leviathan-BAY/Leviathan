import { Link, LinkProps } from 'react-router-dom';
import { scrollToTop } from '../hooks/useScrollToTop';

interface ScrollToTopLinkProps extends LinkProps {
  children: React.ReactNode;
}

/**
 * A Link component that automatically scrolls to top when clicked
 */
export function ScrollToTopLink({ onClick, ...props }: ScrollToTopLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    scrollToTop();
    if (onClick) {
      onClick(event);
    }
  };

  return <Link {...props} onClick={handleClick} />;
}