class ColorProvider {

	constructor(){
		this.c = [0.95, 0.38, 0.02];
		this.d = [0.18, 0.10, 0.10];
		this.colorC = new paper.Color(this.c[0], this.c[1], this.c[2]);
		this.colorD = new paper.Color(this.d[0], this.d[1], this.d[2]);

		this.rgbC = new RGBColor('black');
		this.rgbC.r = Math.floor(this.c[0]*255);
		this.rgbC.g = Math.floor(this.c[1]*255);
		this.rgbC.b = Math.floor(this.c[2]*255);

		this.rgbD = new RGBColor('black');
		this.rgbD.r = Math.floor(this.d[0]*255);
		this.rgbD.g = Math.floor(this.d[1]*255);
		this.rgbD.b = Math.floor(this.d[2]*255);
	}

	getColorlist(){
		var list = {
			'c': this.colorC,
			'd': this.colorD,
		}
		return list;
	}

	getRGBColorList(){
		var list = {
			'c': this.rgbC,
			'd': this.rgbD,
		}
		return list;
	}

	getColor(name){
		return this.getColorlist()[name];
	}

	getRGBColor(name){
		return this.getRGBColorList()[name];	
	}

}