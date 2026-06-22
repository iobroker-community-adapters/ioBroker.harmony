import { expect } from 'chai';
import { fixId } from './sanitize-id';

describe('sanitize-id', () => {
    describe('fixId', () => {
        it('replaces the historic blocklist characters', () => {
            expect(fixId('a[b]c')).to.equal('a_b_c');
            expect(fixId('a*b,c;d')).to.equal('a_b_c_d');
            expect(fixId(`a'b"c\`d`)).to.equal('a_b_c_d');
            expect(fixId('a<b>c?d')).to.equal('a_b_c_d');
            expect(fixId('a\\b')).to.equal('a_b');
        });

        it('replaces all whitespace including tab and newline (issue #98)', () => {
            expect(fixId('Microsoft-Media_Player\t')).to.equal('Microsoft-Media_Player_');
            expect(fixId('foo bar')).to.equal('foo_bar');
            expect(fixId('foo\nbar')).to.equal('foo_bar');
            expect(fixId('foo\rbar')).to.equal('foo_bar');
            expect(fixId('foo\vbar')).to.equal('foo_bar');
        });

        it('replaces dots so they cannot split the ID into path segments', () => {
            expect(fixId('1.2.3')).to.equal('1_2_3');
            expect(fixId('Living Room v1.2')).to.equal('Living_Room_v1_2');
        });

        it('returns "unnamed" for empty or all-forbidden input', () => {
            expect(fixId('')).to.equal('unnamed');
            expect(fixId('   ')).to.equal('___');
            expect(fixId('...')).to.equal('___');
        });

        it('returns "unnamed" for non-string input', () => {
            expect(fixId(undefined as unknown as string)).to.equal('unnamed');
            expect(fixId(null as unknown as string)).to.equal('unnamed');
            expect(fixId(42 as unknown as string)).to.equal('unnamed');
        });

        it('keeps allowed characters untouched', () => {
            expect(fixId('Hub_Name-1')).to.equal('Hub_Name-1');
            expect(fixId('Living-Room')).to.equal('Living-Room');
        });

        it('handles real-world hub friendly names', () => {
            expect(fixId('Wohnzimmer Hub')).to.equal('Wohnzimmer_Hub');
            expect(fixId('Mike\'s "Den"')).to.equal('Mike_s__Den_');
        });
    });
});
