import { init } from '@wasmer/sdk';

let _initialized: Promise<void> | null = null;

export function initWasmer(): Promise<void> {
  if (!_initialized) {
    _initialized = init().then(() => {});
  }
  return _initialized;
}
