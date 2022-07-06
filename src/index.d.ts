import type { LookupFunction } from 'net';
export declare function lookupWrapper(maxCacheItemCount: number, cacheTTL: number): LookupFunction;
export declare function patchGlobal(maxCacheItemCount: number, cacheTTL: number): void;
