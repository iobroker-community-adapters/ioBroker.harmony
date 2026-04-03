// src-admin/src/hooks/useHarmonyApi.ts
import { useCallback } from 'react';
import type { HarmonyHubInfo, HarmonyConfig } from '../types/harmony';

declare function sendTo(
    namespace: string, command: string, payload: unknown,
    callback: (response: { success: boolean; data?: unknown; error?: string }) => void,
): void;

const NAMESPACE = 'harmony.0';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

function apiCall<T>(command: string, payload: unknown = {}): Promise<ApiResponse<T>> {
    return new Promise((resolve) => {
        if (typeof sendTo !== 'function') {
            resolve({ success: false, error: 'sendTo not available' });
            return;
        }
        sendTo(NAMESPACE, command, payload, (response) => {
            resolve(response as ApiResponse<T>);
        });
    });
}

export function useHarmonyApi() {
    const getHubs = useCallback((): Promise<ApiResponse<HarmonyHubInfo[]>> => {
        return apiCall<HarmonyHubInfo[]>('getHubs');
    }, []);

    const getConfig = useCallback((hubName: string): Promise<ApiResponse<HarmonyConfig>> => {
        return apiCall<HarmonyConfig>('getConfig', { hubName });
    }, []);

    const getStateDigest = useCallback((hubName: string): Promise<ApiResponse<unknown>> => {
        return apiCall<unknown>('getStateDigest', { hubName });
    }, []);

    const testCommand = useCallback((hubName: string, deviceId: string, command: string, type: string = 'IRCommand'): Promise<ApiResponse<unknown>> => {
        return apiCall<unknown>('testCommand', { hubName, deviceId, command, type });
    }, []);

    const writeConfig = useCallback((hubName: string, changes: unknown): Promise<ApiResponse<unknown>> => {
        return apiCall<unknown>('writeConfig', { hubName, changes });
    }, []);

    const addDevice = useCallback((hubName: string, device: unknown): Promise<ApiResponse<unknown>> => {
        return apiCall<unknown>('addDevice', { hubName, device });
    }, []);

    const deleteDevice = useCallback((hubName: string, deviceId: string): Promise<ApiResponse<unknown>> => {
        return apiCall<unknown>('deleteDevice', { hubName, deviceId });
    }, []);

    const generateActivity = useCallback((hubName: string, activityDef: unknown): Promise<ApiResponse<unknown>> => {
        return apiCall<unknown>('generateActivity', { hubName, activityDef });
    }, []);

    const searchIRDB = useCallback((query: string): Promise<ApiResponse<unknown>> => {
        return apiCall<unknown>('searchIRDB', { query });
    }, []);

    const getIRDBDeviceTypes = useCallback((manufacturer: string): Promise<ApiResponse<string[]>> => {
        return apiCall<string[]>('getIRDBDeviceTypes', { manufacturer });
    }, []);

    const getIRDBCodeSets = useCallback((manufacturer: string, deviceType: string): Promise<ApiResponse<unknown>> => {
        return apiCall<unknown>('getIRDBCodeSets', { manufacturer, deviceType });
    }, []);

    return { getHubs, getConfig, getStateDigest, testCommand, writeConfig, addDevice, deleteDevice, generateActivity, searchIRDB, getIRDBDeviceTypes, getIRDBCodeSets };
}
