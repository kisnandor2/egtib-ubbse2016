import { Selector } from 'testcafe';
import { ClientFunction } from 'testcafe';

const getCurrentURL = ClientFunction(() => window.location.pathname);


fixture `Index tests`
    .page `localhost:3001`;

test('Frontend loads bootstrap correctly (has carousel)', async t => {
	const carouselExists = Selector('#carousel').exists;
    
	await t
		.expect(carouselExists).ok();
});

test('Navigate to index using the team name/logo', async t => {
    await t
        .click('#team-name')
        .navigateTo('http://localhost:3001/index');
});

test('Navigate to index using the navbar', async t => {
    await t
        .click('#home-nav')
        .navigateTo('http://localhost:3001/index');
});


test('Navigate to simulation without diagram using the navbar', async t => {
    await t
        .click('#no-dia-nav')
        .navigateTo('http://localhost:3001/simulateWithoutDiagram');
});

test('Navigate to simulation with diagram using the dropdown/navbar', async t => {
    await t
        .click('#visualize-dropdown')
        .click('#voronoi-nav')
        .navigateTo('http://localhost:3001/simulateWithDiagram');
});

