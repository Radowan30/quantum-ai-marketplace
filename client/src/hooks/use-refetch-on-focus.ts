import { useEffect } from 'react';

/**
 * Hook to refetch data when the browser tab regains focus
 * Useful for keeping data fresh across page switches
 *
 * @param refetch - Function to call when tab becomes visible
 */
export function useRefetchOnFocus(refetch: () => void | Promise<void>) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch]);
}
