import { useState, useCallback, useRef } from 'react';
import type { HarmonyConfig } from '../types/harmony';

export interface UseConfigResult {
    config: HarmonyConfig | null;
    originalConfig: HarmonyConfig | null;
    isDirty: boolean;
    changeCount: number;
    canUndo: boolean;
    loadConfig: (config: HarmonyConfig) => void;
    updateConfig: (updater: (prev: HarmonyConfig) => HarmonyConfig) => void;
    undo: () => void;
    cancel: () => void;
    markSaved: () => void;
}

export function useConfig(): UseConfigResult {
    const [original, setOriginal] = useState<HarmonyConfig | null>(null);
    const [current, setCurrent] = useState<HarmonyConfig | null>(null);
    const undoStack = useRef<HarmonyConfig[]>([]);
    const [changeCount, setChangeCount] = useState(0);

    const loadConfig = useCallback((config: HarmonyConfig) => {
        const snapshot = JSON.parse(JSON.stringify(config)) as HarmonyConfig;
        setOriginal(snapshot);
        setCurrent(JSON.parse(JSON.stringify(config)) as HarmonyConfig);
        undoStack.current = [];
        setChangeCount(0);
    }, []);

    const updateConfig = useCallback((updater: (prev: HarmonyConfig) => HarmonyConfig) => {
        setCurrent((prev) => {
            if (!prev) return prev;
            undoStack.current.push(JSON.parse(JSON.stringify(prev)) as HarmonyConfig);
            const next = updater(JSON.parse(JSON.stringify(prev)) as HarmonyConfig);
            setChangeCount((c) => c + 1);
            return next;
        });
    }, []);

    const undo = useCallback(() => {
        const prev = undoStack.current.pop();
        if (prev) {
            setCurrent(prev);
            setChangeCount((c) => Math.max(0, c - 1));
        }
    }, []);

    const cancel = useCallback(() => {
        if (original) {
            setCurrent(JSON.parse(JSON.stringify(original)) as HarmonyConfig);
            undoStack.current = [];
            setChangeCount(0);
        }
    }, [original]);

    const markSaved = useCallback(() => {
        if (current) {
            setOriginal(JSON.parse(JSON.stringify(current)) as HarmonyConfig);
            undoStack.current = [];
            setChangeCount(0);
        }
    }, [current]);

    const isDirty = changeCount > 0;
    const canUndo = undoStack.current.length > 0;

    return { config: current, originalConfig: original, isDirty, changeCount, canUndo, loadConfig, updateConfig, undo, cancel, markSaved };
}
