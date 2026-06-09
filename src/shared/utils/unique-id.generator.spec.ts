import { UniqueIDGenerator } from './unique-id.generator';

describe('UniqueIDGenerator', () => {
    it('generates relationship manager IDs from state, city, year, and series codes', () => {
        const id = UniqueIDGenerator.generateUserUniqueID('regional_manager', {
            city: 'Mumbai',
            date: new Date('2026-06-07T00:00:00Z'),
            series: 1,
            state: 'Maharashtra',
        });

        expect(id).toBe('RMMHMUM260001');
    });

    it('pads relationship manager series numbers to four digits', () => {
        const id = UniqueIDGenerator.generateUserUniqueID('regional_manager', {
            city: 'Mumbai',
            date: new Date('2026-06-07T00:00:00Z'),
            series: 12,
            state: 'Maharashtra',
        });

        expect(id).toBe('RMMHMUM260012');
    });

    it('keeps accountant IDs in the existing format', () => {
        const id = UniqueIDGenerator.generateUserUniqueID('accountant');

        expect(id).toMatch(/^ACC\d{6}$/);
    });
});
