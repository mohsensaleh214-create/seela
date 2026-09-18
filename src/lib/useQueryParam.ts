import { useSearchParams } from 'react-router-dom';

/** A single filter value kept in sync with the URL, so a filtered view can be
 * shared with a colleague by copying the link (per the brief's own
 * requirement for list-screen filters). */
export function useQueryParam(key: string): [string, (v: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? '';
  const setValue = (v: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (v) next.set(key, v);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  };
  return [value, setValue];
}
