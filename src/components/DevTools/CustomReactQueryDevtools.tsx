import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * React Query DevTools component with proper positioning
 * Uses the built-in button positioning to avoid empty space issues
 */
const CustomReactQueryDevtools = () => {
  return (
    <ReactQueryDevtools
      initialIsOpen={false}
      buttonPosition="bottom-right"
      position="bottom"
    />
  );
};

export default CustomReactQueryDevtools;
