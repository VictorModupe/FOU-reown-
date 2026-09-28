import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useRef } from "react";

export default function useEnsureSignedOut() {
  const { isSignedIn, signOut } = useAuth();
  const pending = useRef<Promise<void> | null>(null);

  return useCallback(async () => {
    if (!isSignedIn) return;
    if (!pending.current) {
      pending.current = signOut().finally(() => {
        pending.current = null;
      });
    }
    await pending.current;
  }, [isSignedIn, signOut]);
}
