import {test} from 'supertape';

test('gritty: exports', async (t) => {
    const gritty = await import('#gritty/server');
    t.equal(gritty.default, gritty.gritty);
    t.end();
});
