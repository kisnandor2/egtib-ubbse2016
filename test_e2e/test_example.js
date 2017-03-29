import { Selector } from 'testcafe';
import { ClientFunction } from 'testcafe';

const getCurrentURL = ClientFunction(() => window.location.pathname);

fixture `Greet screen test`
		.page `localhost:3001`;

test('Greet screen has start button', async t => {
	const btnStart = Selector('#start-simulating');

	await t
		.expect(btnStart.textContent).eql('Start simulating!', 'Start simulation button does not exist')
})

test
	.page('localhost:3001')
	('Greet screen start button redirects to index', async t => {

		await t
			.click('#start-simulating')
			.expect(getCurrentURL()).eql('/index', 'Not redirected to index page')

		console.log(await getCurrentURL())
});