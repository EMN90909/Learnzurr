import { useEffect, useState } from "react";
import { getPaypalClientId, resolvePaypalClientId } from "@/lib/payments";

export const usePaypalClientId = () => {
  const [clientId, setClientId] = useState(() => getPaypalClientId());
  const [loading, setLoading] = useState(!clientId);

  useEffect(() => {
    if (clientId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    void resolvePaypalClientId()
      .then((resolved) => {
        if (!mounted) return;
        setClientId(resolved);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [clientId]);

  return { clientId, loading };
};
