import { expect } from 'chai';
import { migrateLegacyConfig } from './migrate-config';

const interfaces = {
    eth0: [
        {
            address: '192.168.1.10',
            netmask: '255.255.255.0',
            family: 'IPv4' as const,
            mac: 'aa:bb:cc:dd:ee:ff',
            internal: false,
            cidr: '192.168.1.10/24',
        },
    ],
    lo: [
        {
            address: '127.0.0.1',
            netmask: '255.0.0.0',
            family: 'IPv4' as const,
            mac: '00:00:00:00:00:00',
            internal: true,
            cidr: '127.0.0.1/8',
        },
    ],
};

describe('migrate-config', () => {
    describe('migrateLegacyConfig', () => {
        it('does nothing when subnet is absent (fresh or already migrated install)', () => {
            const result = migrateLegacyConfig({ networkInterface: '', devices: [] }, interfaces);
            expect(result.changed).to.be.false;
            expect(result.networkInterface).to.equal('');
            expect(result.devices).to.deep.equal([]);
        });

        it('drops the old default without carrying anything over', () => {
            const result = migrateLegacyConfig(
                { subnet: '255.255.255.255', networkInterface: '', devices: [] },
                interfaces,
            );
            // changed, because the subnet key itself still has to be removed
            expect(result.changed).to.be.true;
            expect(result.networkInterface).to.equal('');
            expect(result.devices).to.deep.equal([]);
            expect(result.notes).to.deep.equal([]);
        });

        it('turns a local directed broadcast into the matching interface', () => {
            const result = migrateLegacyConfig(
                { subnet: '192.168.1.255', networkInterface: '', devices: [] },
                interfaces,
            );
            expect(result.changed).to.be.true;
            expect(result.networkInterface).to.equal('192.168.1.10');
            expect(result.devices).to.deep.equal([]);
        });

        it('carries hub IPs over into the manual hub list (issue #147 workaround)', () => {
            const result = migrateLegacyConfig(
                { subnet: '192.168.178.5,192.168.178.6', networkInterface: '', devices: [] },
                interfaces,
            );
            expect(result.changed).to.be.true;
            expect(result.networkInterface).to.equal('');
            expect(result.devices).to.deep.equal([{ ip: '192.168.178.5' }, { ip: '192.168.178.6' }]);
        });

        it('keeps a broadcast address for a foreign subnet as a ping target', () => {
            // Not a local interface broadcast, so it stays an explicit target — the socket
            // has SO_BROADCAST enabled, so this keeps working exactly as before.
            const result = migrateLegacyConfig(
                { subnet: '10.20.30.255', networkInterface: '', devices: [] },
                interfaces,
            );
            expect(result.devices).to.deep.equal([{ ip: '10.20.30.255' }]);
            expect(result.networkInterface).to.equal('');
        });

        it('handles whitespace and empty entries in the comma-separated list', () => {
            const result = migrateLegacyConfig(
                { subnet: ' 192.168.178.5 , , 192.168.178.6 ', networkInterface: '', devices: [] },
                interfaces,
            );
            expect(result.devices).to.deep.equal([{ ip: '192.168.178.5' }, { ip: '192.168.178.6' }]);
        });

        it('reports and drops entries that are not IPv4 addresses', () => {
            const result = migrateLegacyConfig(
                { subnet: 'hub.local,192.168.178.5', networkInterface: '', devices: [] },
                interfaces,
            );
            expect(result.devices).to.deep.equal([{ ip: '192.168.178.5' }]);
            expect(result.notes.some(note => note.includes('hub.local'))).to.be.true;
        });

        it('never duplicates an IP that is already in the manual hub list', () => {
            const result = migrateLegacyConfig(
                {
                    subnet: '192.168.178.5',
                    networkInterface: '',
                    devices: [{ ip: '192.168.178.5', name: 'Living room' }],
                },
                interfaces,
            );
            expect(result.devices).to.deep.equal([{ ip: '192.168.178.5', name: 'Living room' }]);
        });

        it('keeps an already selected interface and does not overwrite it', () => {
            const result = migrateLegacyConfig(
                { subnet: '192.168.1.255', networkInterface: '192.168.1.10', devices: [] },
                interfaces,
            );
            expect(result.networkInterface).to.equal('192.168.1.10');
            expect(result.devices).to.deep.equal([]);
        });

        it('mixes both meanings in one list', () => {
            const result = migrateLegacyConfig(
                { subnet: '192.168.1.255,192.168.178.5', networkInterface: '', devices: [] },
                interfaces,
            );
            expect(result.networkInterface).to.equal('192.168.1.10');
            expect(result.devices).to.deep.equal([{ ip: '192.168.178.5' }]);
        });

        it('treats an empty subnet string as "just remove the key"', () => {
            const result = migrateLegacyConfig({ subnet: '', networkInterface: '', devices: [] }, interfaces);
            expect(result.changed).to.be.true;
            expect(result.networkInterface).to.equal('');
            expect(result.devices).to.deep.equal([]);
        });

        it('does not mutate the config it was given', () => {
            const config = { subnet: '192.168.178.5', networkInterface: '', devices: [{ ip: '10.0.0.1' }] };
            migrateLegacyConfig(config, interfaces);
            expect(config.devices).to.deep.equal([{ ip: '10.0.0.1' }]);
        });
    });
});
