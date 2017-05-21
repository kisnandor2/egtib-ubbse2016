import { Selector } from 'testcafe';
import { ClientFunction } from 'testcafe';


fixture `No Diagram tests`
    .page `http://localhost:3001/simulateWithoutDiagram`;


test('Check generation count', async t => {
    
    
    const generationCount = Selector('#generationCount');

    await t.typeText(generationCount, '100', { replace: true })
    await t.click('#start')

    
    const voronoiFunc = ClientFunction(() => voronoiAccessibleFromOutside2);
    const voronoiJSON = await voronoiFunc();
    const voronoi = JSON.parse(voronoiJSON);
    await t.
        expect(voronoi.gen_count).eql('100', "this test will pass");
});


test('Check total number of cells', async t => {
    
    
    const totalNumberOfCells = Selector('#totalNumberOfCells');

    await t.typeText(totalNumberOfCells, '100', { replace: true })
    await t.click('#start')

    
    const voronoiFunc = ClientFunction(() => voronoiAccessibleFromOutside2);
    const voronoiJSON = await voronoiFunc();
    const voronoi = JSON.parse(voronoiJSON);


    await t.
        expect(voronoi.sites.length).eql(100, "this test will pass");
});


test('Check cost of cooperation', async t => {
    
    
    const cooperatingCost = Selector('#cooperatingCost');

    await t.typeText(cooperatingCost, '0.4', { replace: true })
    await t.click('#start')

    
    const voronoiFunc = ClientFunction(() => voronoiAccessibleFromOutside2);
    const voronoiJSON = await voronoiFunc();
    const voronoi = JSON.parse(voronoiJSON);


    await t.
        expect(voronoi.coop_cost).eql('0.4', "this test will pass");
});

test('Check distance of interaction', async t => {
    
    
    const distanceOfInteraction = Selector('#distanceOfInteraction');

    await t.typeText(distanceOfInteraction, '2', { replace: true })
    await t.click('#start')

    
    const voronoiFunc = ClientFunction(() => voronoiAccessibleFromOutside2);
    const voronoiJSON = await voronoiFunc();
    const voronoi = JSON.parse(voronoiJSON);


    await t.
        expect(voronoi.dist).eql('2', "this test will pass");
});

test('Check percent of defecting cells', async t => {
    
    
    //setting cell count
    const totalNumberOfCells = Selector('#totalNumberOfCells');
    await t.typeText(totalNumberOfCells, '100', { replace: true });

    //setting defecting percent
    const percentOfDefectingCells = Selector('#percentOfDefectingCells');
    await t.typeText(percentOfDefectingCells, '100', { replace: true })
    await t.click('#start')

    
    const voronoiFunc = ClientFunction(() => voronoiAccessibleFromOutside2);
    const voronoiJSON = await voronoiFunc();
    const voronoi = JSON.parse(voronoiJSON);

    var j = 0;
    for (var i = 0; i < voronoi.sites.length; i++) {
        if (voronoi.sites[i][3]=="d") {
            j++; 
        }
    }


    await t.
        expect(j).eql(100, "this test will pass");
});

test('Check cell division', async t => {
    
    
    const itShouldDivide = Selector('#itShouldDivide');

    await t.click(itShouldDivide)
    await t.click('#start')

    
    const voronoiFunc = ClientFunction(() => voronoiAccessibleFromOutside2);
    const voronoiJSON = await voronoiFunc();
    const voronoi = JSON.parse(voronoiJSON);

    await t.
        expect(voronoi.itShouldDivide).eql(true, "this test will pass");
});

test('Check steepness of the funtion', async t => {
    
    
    const steepness = Selector('#steepness');

    await t.typeText(steepness, '2', { replace: true })
    await t.click('#start')

    
    const voronoiFunc = ClientFunction(() => voronoiAccessibleFromOutside2);
    const voronoiJSON = await voronoiFunc();
    const voronoi = JSON.parse(voronoiJSON);


    await t.
        expect(voronoi.steepness).eql(2, "this test will pass");
});


test('Check inflection point position', async t => {
    
    
    const inflectionPoint = Selector('#inflectionPoint');

    await t.typeText(inflectionPoint, '0.1', { replace: true })
    await t.click('#start')

    
    const voronoiFunc = ClientFunction(() => voronoiAccessibleFromOutside2);
    const voronoiJSON = await voronoiFunc();
    const voronoi = JSON.parse(voronoiJSON);


    await t.
        expect(voronoi.inflectionPoint).eql(0.1, "this test will pass");
});


test('Check shape of diffusion gradient', async t => {
    
    
    const shapeOfDif = Selector('#shapeOfDif');

    await t.typeText(shapeOfDif, '0.1', { replace: true })
    await t.click('#start')

    
    const voronoiFunc = ClientFunction(() => voronoiAccessibleFromOutside2);
    const voronoiJSON = await voronoiFunc();
    const voronoi = JSON.parse(voronoiJSON);


    await t.
        expect(voronoi.shapeOfDif).eql(0.1, "this test will pass");
});


test('Check steepness of gradient', async t => {
    
    
    const steepnessOfGrad = Selector('#steepnessOfGrad');

    await t.typeText(steepnessOfGrad, '4', { replace: true })
    await t.click('#start')

    
    const voronoiFunc = ClientFunction(() => voronoiAccessibleFromOutside2);
    const voronoiJSON = await voronoiFunc();
    const voronoi = JSON.parse(voronoiJSON);


    await t.
        expect(voronoi.z).eql(4, "this test will pass");
});