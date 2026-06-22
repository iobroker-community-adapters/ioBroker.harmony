import { expect } from 'chai';
import {
    broadcastFromCidr,
    broadcastForInterface,
    buildDiscoveryPlan,
    clampDiscoverInterval,
    isValidIPv4,
} from './discovery-config';

describe('discovery-config', () => {
    describe('isValidIPv4', () => {
        it('accepts well-formed addresses', () => {
            expect(isValidIPv4('192.168.1.1')).to.be.true;
            expect(isValidIPv4('0.0.0.0')).to.be.true;
            expect(isValidIPv4('255.255.255.255')).to.be.true;
        });

        it('rejects malformed input', () => {
            expect(isValidIPv4('192.168.1')).to.be.false;
            expect(isValidIPv4('192.168.1.256')).to.be.false;
            expect(isValidIPv4('hub.local')).to.be.false;
            expect(isValidIPv4('')).to.be.false;
            expect(isValidIPv4('192.168.1.1.5')).to.be.false;
        });
    });

    describe('broadcastFromCidr', () => {
        it('computes /24 broadcasts', () => {
            expect(broadcastFromCidr('192.168.1.5/24')).to.equal('192.168.1.255');
            expect(broadcastFromCidr('10.0.0.1/24')).to.equal('10.0.0.255');
        });

        it('computes /23 broadcasts (T-S-Garp setup, issue #331)', () => {
            expect(broadcastFromCidr('192.168.0.50/23')).to.equal('192.168.1.255');
        });

        it('computes /16 broadcasts', () => {
            expect(broadcastFromCidr('172.16.5.10/16')).to.equal('172.16.255.255');
        });

        it('returns null for invalid input', () => {
            expect(broadcastFromCidr('not-a-cidr')).to.be.null;
            expect(broadcastFromCidr('192.168.1.1')).to.be.null;
            expect(broadcastFromCidr('192.168.1.1/33')).to.be.null;
            expect(broadcastFromCidr('192.168.1.999/24')).to.be.null;
        });
    });

    describe('broadcastForInterface', () => {
        const fakeInterfaces = {
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

        it('finds the broadcast for a known interface', () => {
            expect(broadcastForInterface('192.168.1.10', fakeInterfaces)).to.equal('192.168.1.255');
        });

        it('returns null for an unknown IP', () => {
            expect(broadcastForInterface('10.0.0.5', fakeInterfaces)).to.be.null;
        });
    });

    describe('buildDiscoveryPlan', () => {
        const oneInterface = {
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
        };

        it('uses unicast when manual hub IPs are configured', () => {
            const plan = buildDiscoveryPlan(
                { networkInterface: '', devices: [{ ip: '192.168.5.10' }, { ip: '192.168.5.11' }] },
                oneInterface,
            );
            expect(plan.mode).to.equal('unicast');
            expect(plan.targets).to.deep.equal(['192.168.5.10', '192.168.5.11']);
            expect(plan.bindAddress).to.be.undefined;
        });

        it('skips empty/invalid manual IPs', () => {
            const plan = buildDiscoveryPlan(
                { networkInterface: '', devices: [{ ip: '' }, { ip: 'not-an-ip' }, { ip: '192.168.5.10' }] },
                oneInterface,
            );
            expect(plan.mode).to.equal('unicast');
            expect(plan.targets).to.deep.equal(['192.168.5.10']);
        });

        it('falls back to broadcast when manual list is empty', () => {
            const plan = buildDiscoveryPlan({ networkInterface: '', devices: [] }, oneInterface);
            expect(plan.mode).to.equal('broadcast');
            expect(plan.targets).to.deep.equal(['255.255.255.255']);
            expect(plan.bindAddress).to.be.undefined;
        });

        it('derives broadcast from selected interface', () => {
            const plan = buildDiscoveryPlan({ networkInterface: '192.168.1.10', devices: [] }, oneInterface);
            expect(plan.mode).to.equal('broadcast');
            expect(plan.targets).to.deep.equal(['192.168.1.255']);
            expect(plan.bindAddress).to.equal('192.168.1.10');
        });

        it('treats 0.0.0.0 as no interface', () => {
            const plan = buildDiscoveryPlan({ networkInterface: '0.0.0.0', devices: [] }, oneInterface);
            expect(plan.mode).to.equal('broadcast');
            expect(plan.bindAddress).to.be.undefined;
            expect(plan.targets).to.deep.equal(['255.255.255.255']);
        });

        it('handles missing devices array', () => {
            const plan = buildDiscoveryPlan({ networkInterface: '' }, oneInterface);
            expect(plan.mode).to.equal('broadcast');
            expect(plan.targets).to.deep.equal(['255.255.255.255']);
        });

        it('manual IPs win over interface broadcast (no broadcast leaked)', () => {
            const plan = buildDiscoveryPlan(
                { networkInterface: '192.168.1.10', devices: [{ ip: '10.0.0.5' }] },
                oneInterface,
            );
            expect(plan.mode).to.equal('unicast');
            expect(plan.targets).to.deep.equal(['10.0.0.5']);
            expect(plan.bindAddress).to.equal('192.168.1.10');
        });

        it('drops a stale interface IP (no longer a local interface) and falls back to OS-pick broadcast', () => {
            const plan = buildDiscoveryPlan({ networkInterface: '10.99.99.99', devices: [] }, oneInterface);
            expect(plan.mode).to.equal('broadcast');
            expect(plan.bindAddress).to.be.undefined;
            expect(plan.targets).to.deep.equal(['255.255.255.255']);
        });

        it('drops a stale interface IP in unicast mode too (never binds a dead address)', () => {
            const plan = buildDiscoveryPlan(
                { networkInterface: '10.99.99.99', devices: [{ ip: '192.168.5.10' }] },
                oneInterface,
            );
            expect(plan.mode).to.equal('unicast');
            expect(plan.bindAddress).to.be.undefined;
            expect(plan.targets).to.deep.equal(['192.168.5.10']);
        });
    });

    describe('clampDiscoverInterval', () => {
        it('returns the configured value when valid', () => {
            expect(clampDiscoverInterval(5000)).to.equal(5000);
            expect(clampDiscoverInterval('3000')).to.equal(3000);
        });

        it('clamps below the floor to the default', () => {
            expect(clampDiscoverInterval(10)).to.equal(2000);
            expect(clampDiscoverInterval(0)).to.equal(2000);
        });

        it('falls back on invalid input', () => {
            expect(clampDiscoverInterval(undefined)).to.equal(2000);
            expect(clampDiscoverInterval('garbage')).to.equal(2000);
        });
    });
});
