import { afterEach } from 'vitest'
import { resetTranslationStore } from '@/store/translationStore'

afterEach(() => {
  resetTranslationStore()
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
})

if (typeof window !== 'undefined') {
  await import('./setup.dom')
}
