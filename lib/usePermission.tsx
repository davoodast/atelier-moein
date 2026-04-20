'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasAnyPermission } from '@/lib/clientPermissions';
import AccessDeniedModal from '@/components/ui/AccessDeniedModal';

/**
 * Returns:
 * - `check(keys, message?)` — call before a guarded action; if user lacks
 *   the permission, shows the AccessDeniedModal and returns false.
 * - `AccessDenied` — a React element (or null) to render in your JSX.
 */
export function usePermission() {
  const { user } = useAuth();
  const [denied, setDenied] = useState<string | null>(null);

  const check = useCallback(
    (requiredKeys: string[], message?: string): boolean => {
      const perms = user?.permissions ?? [];
      const isSystem = user?.isSystem === true;
      if (isSystem || hasAnyPermission(perms, requiredKeys)) return true;
      setDenied(message ?? null);
      return false;
    },
    [user]
  );

  const AccessDenied =
    denied !== null ? (
      <AccessDeniedModal
        onClose={() => setDenied(null)}
        message={denied || undefined}
      />
    ) : null;

  return { check, AccessDenied };
}
