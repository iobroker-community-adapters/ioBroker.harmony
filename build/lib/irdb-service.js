"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRDBService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class IRDBService {
    constructor(adapterDir) {
        this.index = [];
        this.loaded = false;
        this.dataPath = path.join(adapterDir, 'data', 'irdb');
    }
    async ensureLoaded() {
        if (this.loaded)
            return;
        const indexPath = path.join(this.dataPath, 'index.json');
        try {
            if (fs.existsSync(indexPath)) {
                this.index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
            }
        }
        catch { /* empty */ }
        this.loaded = true;
    }
    async searchManufacturers(query) {
        await this.ensureLoaded();
        if (!query || query.length < 2)
            return [];
        const q = query.toLowerCase();
        return this.index.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 50);
    }
    async getDeviceTypes(manufacturer) {
        var _a;
        await this.ensureLoaded();
        return ((_a = this.index.find((m) => m.name.toLowerCase() === manufacturer.toLowerCase())) === null || _a === void 0 ? void 0 : _a.deviceTypes) || [];
    }
    async getCodeSets(manufacturer, deviceType) {
        const filePath = path.join(this.dataPath, manufacturer.toLowerCase(), deviceType.toLowerCase() + '.json');
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            }
        }
        catch { /* empty */ }
        return [];
    }
}
exports.IRDBService = IRDBService;
//# sourceMappingURL=irdb-service.js.map