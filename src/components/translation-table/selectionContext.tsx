import { createContext, useContext, type ReactNode } from 'react'

const SelectedKeysContext = createContext<ReadonlySet<string>>(new Set())

export function SelectedKeysProvider({
  selectedKeys,
  children,
}: {
  selectedKeys: ReadonlySet<string>
  children: ReactNode
}) {
  return (
    <SelectedKeysContext.Provider value={selectedKeys}>
      {children}
    </SelectedKeysContext.Provider>
  )
}

export function useIsKeySelected(keyName: string): boolean {
  return useContext(SelectedKeysContext).has(keyName)
}
