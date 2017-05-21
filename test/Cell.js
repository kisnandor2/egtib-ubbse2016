const chai = require('chai');
const assert = chai.assert;

const Cell = require('../routes/Cell');
const logger = require('../routes/logger');
const myRandomGenerator = new (require('../routes/MyRandomGenerator'))();
logger.setLevel('OFF');

describe('Cell', function() {

	describe('changeColor()', function() {
		it('should return true when the two color are different', function() {
            let cell = new Cell({
				x: 1,
				y: 1,
				attrib: 'c',
				cost: 0.3,
				bbox: {}
			});

            let cellOldColor = cell.attrib;
            cell.changeColor(cellOldColor);

            if(cellOldColor != cell.attrib)
			    assert.isTrue(true);
            else
                assert.isTrue(false);
        });
    //-------------------------------------------------------------------------------------
		it('should return true when the two Cell are the same', function(){
		    let cell1 = new Cell({
				x: 4,
				y: 4,
				attrib: 'c',
				cost: 0.1,
				bbox: {}
			}); 
            let divideCell=cell1.divideCell([],0, myRandomGenerator);
            if(cell1 == divideCell[0]){
                assert.isTrue(true);
            }
            else{
                assert.isTrue(false);
            }
	    });
    //-------------------------------------------------------------------------------------
        it('should return true when the cell1 is divided nr.1', function(){
		    let cell1 = new Cell({
				x: 4,
				y: 4,
				attrib: 'c',
				cost: 0.1,
				bbox: [2,2]
			});
            let cell2 =new Cell({
				x: 6,
				y: 5,
				attrib: 'd',
				cost: 0.4,
				bbox: [4,5]
			});
            let divideCell=cell1.divideCell([cell2],1, myRandomGenerator);
            
            if(divideCell[0].x == 3.5 && divideCell[1].x==4.5 && divideCell[0].y==4 && divideCell[1].y==4)
                assert.isTrue(true);
            else
                assert.isTrue(false);

	    });
        it('should return true when the cell1 is divided nr.2', function(){
		    let cell1 = new Cell({
				x: 2,
				y: 6,
				attrib: 'c',
				cost: 0.1,
				bbox: [2,2]
			});
            let cell2 =new Cell({
				x: 1,
				y: 8,
				attrib: 'd',
				cost: 0.4,
				bbox: [4,5]
			});
            let divideCell=cell1.divideCell([cell2],1, myRandomGenerator);
          
            if(divideCell[0].x == 1.75 && divideCell[1].x==2.25 && divideCell[0].y==6 && divideCell[1].y==6)
                assert.isTrue(true);
            else
                assert.isTrue(false);

	    });
 it('should return true when the cell1 is divided check cost nr.1', function(){
		    let cell1 = new Cell({
				x: 2,
				y: 6,
				attrib: 'c',
				cost: 0.1,
				bbox: [2,2]
			});
            let cell2 =new Cell({
				x: 1,
				y: 8,
				attrib: 'd',
				cost: 0.4,
				bbox: [4,5]
			});
            let divideCell=cell1.divideCell([cell2],1, myRandomGenerator);
          
            if(divideCell[0].cost == 0.1 && divideCell[1].cost == 0.1)
                assert.isTrue(true);
            else
                assert.isTrue(false);

	    });
 it('should return true when the cell1 is divided check cost nr.2', function(){
		    let cell1 = new Cell({
				x: 2,
				y: 6,
				attrib: 'c',
				cost: 0.6,
				bbox: [2,2]
			});
            let cell2 =new Cell({
				x: 1,
				y: 8,
				attrib: 'd',
				cost: 0.8,
				bbox: [4,5]
			});
            let divideCell=cell1.divideCell([cell2],1, myRandomGenerator);
          
            if(divideCell[0].cost == 0.6 && divideCell[1].cost == 0.6)
                assert.isTrue(true);
            else
                assert.isTrue(false);

	    });
    });

	// describe('other functions');
});