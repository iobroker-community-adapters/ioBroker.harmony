import * as fs from 'fs';
import * as path from 'path';

export interface IRDBManufacturer {
    name: string;
    deviceTypes: string[];
}

export interface IRDBCodeSet {
    manufacturer: string;
    deviceType: string;
    model: string;
    protocol: string;
    functions: Array<{ name: string; functionCode: string }>;
}

export class IRDBService {
    private dataPath: string;
    private index: IRDBManufacturer[] = [];
    private loaded = false;

    constructor(adapterDir: string) {
        this.dataPath = path.join(adapterDir, 'data', 'irdb');
    }

    async ensureLoaded(): Promise<void> {
        if (this.loaded) return;
        const indexPath = path.join(this.dataPath, 'index.json');
        try {
            if (fs.existsSync(indexPath)) {
                this.index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
            }
        } catch { /* empty */ }
        this.loaded = true;
    }

    async searchManufacturers(query: string): Promise<IRDBManufacturer[]> {
        await this.ensureLoaded();
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase();
        return this.index.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 50);
    }

    async getDeviceTypes(manufacturer: string): Promise<string[]> {
        await this.ensureLoaded();
        return this.index.find((m) => m.name.toLowerCase() === manufacturer.toLowerCase())?.deviceTypes || [];
    }

    async getCodeSets(manufacturer: string, deviceType: string): Promise<IRDBCodeSet[]> {
        const filePath = path.join(this.dataPath, manufacturer.toLowerCase(), deviceType.toLowerCase() + '.json');
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            }
        } catch { /* empty */ }
        return [];
    }
}
