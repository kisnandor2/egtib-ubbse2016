import { Selector } from 'testcafe';
import { ClientFunction } from 'testcafe';

const getCurrentURL = ClientFunction(function(){debugger});

fixture `Greet screen test`
		.page `localhost:3001/simulateWithDiagram`;

test('Greet screen has start button', async t => {

	const btnRender = Selector('#renderNewDiagram')
	const btnStart = Selector('#startSimulation');

	await getCurrentURL();
	await t.setTestSpeed(0.01);
	await t.click(btnRender).click(btnStart);
})

// test
// 	.page('localhost:3001')
// 	('Greet screen start button redirects to index', async t => {

// 		await t
// 			.click('#start-simulating')
// 			.expect(getCurrentURL()).eql('/index', 'Not redirected to index page')

// 		console.log(await getCurrentURL())
// });