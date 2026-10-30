import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type Role = 'showcase' | 'passenger' | 'driver' | 'admin'

interface RoleState {
  role: Role
  setRole: (r: Role) => void
}

const RoleCtx = createContext<RoleState>(null as unknown as RoleState)

/**
 * Which experience is on screen. Separate from the ride store so the prototype shell
 * (top bar, role switcher, story panel) does not re-render on every simulation tick.
 */
export const useRole = () => useContext(RoleCtx)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>('showcase')
  const setRole = useCallback((r: Role) => { setRoleState(r); window.scrollTo({ top: 0 }) }, [])
  const value = useMemo(() => ({ role, setRole }), [role, setRole])
  return <RoleCtx.Provider value={value}>{children}</RoleCtx.Provider>
}
