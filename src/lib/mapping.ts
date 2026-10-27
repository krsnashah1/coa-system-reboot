// src/lib/mapping.ts
import { CacheMappingMode } from '@/store/gameStore';

export interface CacheLineState {
  lineIndex: number;
  valid: boolean;
  tag: string;
  blockNumber: number | null;
  dataHex: string | null;
  lastUsedStep: number;
}

export interface AddressBreakdown {
  binaryAddress: string;
  tagBits: string;
  indexBits: string;
  offsetBits: string;
  tagLength: number;
  indexLength: number;
  offsetLength: number;
}

export function getAddressBreakdown(
  blockNumber: number,
  mode: CacheMappingMode,
  totalLines: number = 4,
  waysPerSet: number = 2
): AddressBreakdown {
  const offsetBits = '00';
  const blockBin = blockNumber.toString(2).padStart(4, '0');
  const binaryAddress = `${blockBin}${offsetBits}`;

  if (mode === 'DIRECT') {
    const indexLength = Math.log2(totalLines);
    const tagLength = 4 - indexLength;
    return {
      binaryAddress,
      tagBits: blockBin.slice(0, tagLength),
      indexBits: blockBin.slice(tagLength),
      offsetBits,
      tagLength,
      indexLength,
      offsetLength: 2,
    };
  }

  if (mode === 'ASSOCIATIVE') {
    return {
      binaryAddress,
      tagBits: blockBin,
      indexBits: '—',
      offsetBits,
      tagLength: 4,
      indexLength: 0,
      offsetLength: 2,
    };
  }

  const totalSets = totalLines / waysPerSet;
  const indexLength = Math.log2(totalSets);
  const tagLength = 4 - indexLength;
  return {
    binaryAddress,
    tagBits: blockBin.slice(0, tagLength),
    indexBits: blockBin.slice(tagLength),
    offsetBits,
    tagLength,
    indexLength,
    offsetLength: 2,
  };
}

export function validateCachePlacement(
  blockNumber: number,
  targetLineIndex: number,
  lines: CacheLineState[],
  mode: CacheMappingMode,
  waysPerSet: number = 2
): {
  valid: boolean;
  isCacheHit: boolean;
  missType?: 'COLD' | 'CONFLICT' | 'CAPACITY';
  errorReason?: string;
  formula?: string;
} {
  const totalLines = lines.length;
  const targetLine = lines[targetLineIndex];

  const existingLine = lines.find((l) => l.valid && l.blockNumber === blockNumber);
  if (existingLine) {
    if (existingLine.lineIndex === targetLineIndex) {
      return { valid: true, isCacheHit: true };
    } else {
      return {
        valid: false,
        isCacheHit: false,
        errorReason: `Block ${blockNumber} is ALREADY in Cache Line ${existingLine.lineIndex}! Click Line ${existingLine.lineIndex} directly to score a Cache Hit.`,
        formula: `Hit Detected at Line ${existingLine.lineIndex}`,
      };
    }
  }

  if (mode === 'DIRECT') {
    const expectedLine = blockNumber % totalLines;
    if (targetLineIndex !== expectedLine) {
      return {
        valid: false,
        isCacheHit: false,
        errorReason: `Direct Mapping Violation! Block ${blockNumber} can ONLY map to Line ${expectedLine}.`,
        formula: `i = ${blockNumber} mod ${totalLines} = Line ${expectedLine}`,
      };
    }
    return {
      valid: true,
      isCacheHit: false,
      missType: targetLine.valid ? 'CONFLICT' : 'COLD',
    };
  }

  if (mode === 'ASSOCIATIVE') {
    const emptyLines = lines.filter((l) => !l.valid);
    if (emptyLines.length > 0) {
      if (targetLine.valid) {
        return {
          valid: false,
          isCacheHit: false,
          errorReason: `Do not overwrite an occupied line while empty cache lines are still available!`,
          formula: `Empty Lines: ${emptyLines.map((l) => l.lineIndex).join(', ')}`,
        };
      }
      return { valid: true, isCacheHit: false, missType: 'COLD' };
    }

    const lruLine = lines.reduce((oldest, curr) =>
      curr.lastUsedStep < oldest.lastUsedStep ? curr : oldest
    );

    if (targetLineIndex !== lruLine.lineIndex) {
      return {
        valid: false,
        isCacheHit: false,
        errorReason: `LRU Replacement Fault! Cache is full. Evict the Least Recently Used block in Line ${lruLine.lineIndex} (Block ${lruLine.blockNumber}).`,
        formula: `LRU Target = Line ${lruLine.lineIndex}`,
      };
    }

    return { valid: true, isCacheHit: false, missType: 'CAPACITY' };
  }

  const totalSets = totalLines / waysPerSet;
  const expectedSet = blockNumber % totalSets;
  const targetSet = Math.floor(targetLineIndex / waysPerSet);

  if (targetSet !== expectedSet) {
    return {
      valid: false,
      isCacheHit: false,
      errorReason: `Set-Associative Violation! Block ${blockNumber} maps to Set ${expectedSet} (Lines ${expectedSet * waysPerSet}–${expectedSet * waysPerSet + waysPerSet - 1}).`,
      formula: `Set = ${blockNumber} mod ${totalSets} = Set ${expectedSet}`,
    };
  }

  const setLines = lines.filter(
    (l) => Math.floor(l.lineIndex / waysPerSet) === expectedSet
  );
  const emptySetLines = setLines.filter((l) => !l.valid);

  if (emptySetLines.length > 0) {
    if (targetLine.valid) {
      return {
        valid: false,
        isCacheHit: false,
        errorReason: `Set ${expectedSet} still has an empty Way! Use Line ${emptySetLines[0].lineIndex} first.`,
        formula: `Free Way in Set ${expectedSet}: Line ${emptySetLines[0].lineIndex}`,
      };
    }
    return { valid: true, isCacheHit: false, missType: 'COLD' };
  }

  const lruSetLine = setLines.reduce((oldest, curr) =>
    curr.lastUsedStep < oldest.lastUsedStep ? curr : oldest
  );

  if (targetLineIndex !== lruSetLine.lineIndex) {
    return {
      valid: false,
      isCacheHit: false,
      errorReason: `Set LRU Fault! Set ${expectedSet} is full. Evict the oldest block in Set ${expectedSet}: Line ${lruSetLine.lineIndex}.`,
      formula: `Set ${expectedSet} LRU = Line ${lruSetLine.lineIndex}`,
    };
  }

  return { valid: true, isCacheHit: false, missType: 'CONFLICT' };
}