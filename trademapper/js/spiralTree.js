(function() {

// TODO: decide whether to keep this
// no op functions for x/y conversion
// used in drawLineSegment and drawSteinerNode - neither of which are still used ..
var x = function (d) { return d; };
var y = function (d) { return d; };

function BinarySearchArray() {
	this.arrayData = [];
	this.bsStart = 0;
	this.bsEnd = this.arrayData.length - 1;
	this.bsCurrent = 0;
}

BinarySearchArray.prototype.search = function (value, start, end) {
	if (arguments.length < 3) {
		this.bsStart = 0;
		this.bsEnd = this.arrayData.length - 1;
	}
	else {
		this.bsStart = start;
		this.bsEnd = end;
	}
	while (this.bsStart <= this.bsEnd) {
		this.bsCurrent = parseInt((this.bsStart + this.bsEnd) / 2);
		if (value === this.arrayData[this.bsCurrent].theta) {
			return this.bsCurrent;
		} else if (value < this.arrayData[this.bsCurrent].theta) {
			this.bsEnd = this.bsCurrent - 1;
		} else {
			this.bsStart = this.bsCurrent + 1;
		}
	}
	return this.bsStart;
};
BinarySearchArray.prototype.add = function (value) {
	var pos = this.search(value.theta);
	Array.prototype.splice.call(this.arrayData, pos, 0, value);
	return pos;
};
// TODO: this never appears to be called with arguments.length 1, so maybe
// we can remove the first argument and refactor the calls ...
BinarySearchArray.prototype.remove = function (value, index1, index2) {
	if (arguments.length === 1) {
		index1 = this.search(value.theta);
	}
	if (arguments.length === 2) {
		Array.prototype.splice.call(this.arrayData, index1, 1);
	} else {
		if (index1 > index2) {
			var tempIndex = index2;
			index2 = index1;
			index1 = tempIndex;
		}
		Array.prototype.splice.call(this.arrayData, index1, 1);
		Array.prototype.splice.call(this.arrayData, index2 - 1, 1);
	}
};
//end of the class for sorted array

// TODO: these two vars are currently unused
//var symbol = d3.scale.ordinal().range(d3.svg.symbolTypes),
//	color = d3.scale.category10();

//This is the class for spiral tree, need parameters for layer which should be svg type and the projection
function SpiralTree(layerId_, projection_) {
	this.layerId = layerId_;
	this.terminals = [];
	this.center = {};

	this.alpha = Math.PI / 12;	//spiral angle
	this.projection = projection_;
	if (this.projection === undefined) {
		this.projection = d3.geo.mercator()
			.scale(1000)
			.translate([480, 400]);
	}

	this.spiralTreeLayer = this.layerId.append("g").attr("class", "flowmap");

	this.varyStrokeWidth = true;	//spiral line width
	this.strokeWidth = 1;	//spiral line width
	this.opacity = 0.8;		//spiral node opacity
	this.quantity = 1;		// default quantity for terminal node
	this.extraSpiralClass = "";
	this.extraLineClass = "";
	this.centerColor='red'; //spiral center node color
	this.terminalColor = 'steelblue';	//spiral terminal color
	this.infoFields = [];	//the index of fields for displaying in the tooltips
	this.nodeDrawable = true;	//indicator of whether showing the node or not
	this.maxQuantity = 200;  // the maximum quantity anywhere, scale quantity against this
	                         // and then convert to strokewidth using:
	this.maxStrokeWidth = 30;
	this.minStrokeWidth = 0.5;
	this.narrowWideStrokeThreshold = 3;  // used for deciding whether to use arrows inside or outside line
	
	this.markerStart = {narrow: null, wide: null};
	this.markerMid = {narrow: null, wide: null};
	this.markerEnd = {narrow: null, wide: null};

	this.mouseOverFunc = null;
	this.mouseOutFunc = null;
}

//below is a bunch of configuration functions
SpiralTree.prototype.setProjection = function (projection_) {
	this.projection = projection_;
};

SpiralTree.prototype.setAlpha = function (alpha_) {
	if (alpha_ === undefined) {
		this.alpha = Math.PI / 12;
	} else {
		this.alpha = alpha_;
	}
};

SpiralTree.prototype.setColor = function (className, color) {
	if (className === 'spiralSegment') {
		this.spiralColor = color;
	} else if (className === 'lineSegment') {
		this.lineColor = color;
	} else if (className === 'center') {
		this.centerColor = color;
	} else if (className === 'terminal') {
		this.terminalColor = color;
	} else {
		this.SteinerColor = color;
	}
};

SpiralTree.prototype.setVaryStrokeWidth = function (varyStrokeWidth) {
	if (varyStrokeWidth === undefined) { varyStrokeWidth = true; }
	this.varyStrokeWidth = varyStrokeWidth;
};

SpiralTree.prototype.setWidth = function (width) {
	if (width === undefined) { width = 1; }
	this.strokeWidth = width;
};

SpiralTree.prototype.setMaxWidth = function (width) {
	if (width === undefined) { width = 50; }
	this.maxStrokeWidth = width;
};

SpiralTree.prototype.setMinWidth = function (width) {
	if (width === undefined) { width = 0.5; }
	this.minStrokeWidth = width;
};

SpiralTree.prototype.setMaxQuantity = function (quantity) {
	if (quantity === undefined) { quantity = 200; }
	this.maxQuantity = quantity;
};

SpiralTree.prototype.setOpacity = function (opacity) {
	if (opacity === undefined) { opacity = 0.8; }
	this.opacity = opacity;
};

//this is used for setting up a threshold of detecting the overlapping nodes
SpiralTree.prototype.setThreshold = function (zoomLevel) {
	if (zoomLevel === undefined) { zoomLevel = 3; }
	this.threshold = Math.pow(2, (zoomLevel - 3));
};

SpiralTree.prototype.setInfoFields = function (fields) {
	this.infoFields = fields;
};

SpiralTree.prototype.setNodeDrawable = function (flag) {
	this.nodeDrawable = flag;
};

SpiralTree.prototype.convertGeoToPoint = function (geo) {
	var tempPixelPoint = this.projection([geo.lng, geo.lat]);
	var point = {
		x: tempPixelPoint[0],
		y: tempPixelPoint[1],
		opacity: geo.opacity === undefined ? this.opacity : geo.opacity,
		quantity: geo.quantity === undefined ? this.quantity : geo.quantity
	};
	for (var field in this.infoFields) {
		if (this.infoFields.hasOwnProperty(field)) {
			point[this.infoFields[field]] = geo[this.infoFields[field]];
		}
	}
	return point;
};

//this is a function for adapting the data to the internal data used by spiraltree
SpiralTree.prototype.preprocess = function (Geodata, Geocenter) {
	// first save the origin/center
	this.center = this.convertGeoToPoint(Geocenter);
	var minX = this.center.x, minY = this.center.y, maxX = this.center.x, maxY = this.center.y;

	this.terminals = [];
	this.center.quantity = 0;
	for (var i = 0; i < Geodata.length; i++) {
		var newTerminal = this.convertGeoToPoint(Geodata[i]);
		this.center.quantity += newTerminal.quantity;

		newTerminal.r = Math.sqrt(
			(newTerminal.x - this.center.x) * (newTerminal.x - this.center.x) +
			(newTerminal.y - this.center.y) * (newTerminal.y - this.center.y)
		);
		//r could be possibly 0 when the terminal are totally overlapped with the center which will result the NaN in theta
		//and then it would cause the last segment of the spiral tree disappear, so we need to add a conditional statement for that situation
		var theta;
		if (newTerminal.r === 0) {
			theta = 0;
		} else {
			theta = Math.acos((newTerminal.x - this.center.x) / newTerminal.r);
		}
		newTerminal.theta = (newTerminal.y - this.center.y) < 0 ? 2 * Math.PI - theta : theta;

		if (newTerminal.x > maxX) { maxX = newTerminal.x; }
		if (newTerminal.x < minX) { minX = newTerminal.x; }
		if (newTerminal.y > maxY) { maxY = newTerminal.y; }
		if (newTerminal.y < minY) { minY = newTerminal.y; }

		this.terminals.push(newTerminal);
	}

	if (this.center.quantity <= 0) {
		this.center.quantity = 1;
	}

	//sort the array of terminals
	Array.prototype.sort.call(this.terminals, function (a, b) { return b.r - a.r; });

	// and return the min/max stuff
	return {
		xMin: minX,
		yMin: minY,
		xMax: maxX,
		yMax: maxY,
		width: maxX - minX,
		height: maxY - minY
	};
};

//this is a function of calculating and storing the spiral segments
SpiralTree.prototype.spiralPath = function (point, tValue, sign) {
	var currentTheta;
	var spiralLine = d3.svg.line()
		.x(function (d) { return x(d.x); })
		.y(function (d) { return y(d.y); });
	var adjustAlpha;
	if (sign === "-") {
		adjustAlpha = -this.alpha;
	} else {
		adjustAlpha = this.alpha;
	}
	var r = Math.sqrt(
		(point.x - this.center.x) * (point.x - this.center.x) +
		(point.y - this.center.y) * (point.y - this.center.y)
	);
	var initialTheta = Math.acos((point.x - this.center.x) / r);
	var theta = (point.y - this.center.y) < 0 ? 2 * Math.PI - initialTheta : initialTheta;
	var step;
	var ncount = 60;
	if (tValue === undefined) {
		tValue = (Math.PI / Math.tan(this.alpha));
	}
	step = tValue / ncount;
	var spiral = [];
	for (var i = 0; i < ncount; i++) {
		currentTheta = theta + Math.tan(adjustAlpha) * i * step;
		spiral.push({
			x: r * Math.exp(-i * step) * Math.cos(currentTheta) + this.center.x,
			y: r * Math.exp(-i * step) * Math.sin(currentTheta) + this.center.y
		});
	}
	//need to push the last point of the spiral path to make sure that it is theoretically closed
	currentTheta = theta + Math.tan(adjustAlpha) * tValue;
	spiral.push({
		x: r * Math.exp(-tValue) * Math.cos(currentTheta) + this.center.x,
		y: r * Math.exp(-tValue) * Math.sin(currentTheta) + this.center.y
	});
	return spiralLine(spiral);
};

SpiralTree.prototype.quantityToStrokeWidth = function (quantity, point) {
	if (this.varyStrokeWidth) {
		quantity = this.getQuantity(quantity, point);
		var strokeWidth = (quantity / this.maxQuantity) * this.maxStrokeWidth;
		if (strokeWidth < this.minStrokeWidth) {
			return this.minStrokeWidth;
		} else {
			return strokeWidth;
		}
	} else {
		return this.strokeWidth;
	}
};

SpiralTree.prototype.getValueFromValuePointOrThis = function (value, key, point) {
	if (value !== undefined) {
		return value;
	} else if (point[key] !== undefined) {
		return point[key];
	} else {
		return this[key];
	}
};

SpiralTree.prototype.getOpacity = function (opacity, point) {
	return this.getValueFromValuePointOrThis(opacity, "opacity", point);
};

SpiralTree.prototype.getQuantity = function (quantity, point) {
	return this.getValueFromValuePointOrThis(quantity, "quantity", point);
};

// TODO: draw a circle rather than this thing
SpiralTree.prototype.drawNode = function (point, color, opacity) {
	// TODO: add quantity?  bigger circle??
	var node = this.spiralTreeLayer.append("svg:path")
		.attr("class", "dot")
		.attr("transform", "translate(" + x(point.x) + "," + y(point.y) + ")")
		.attr("d", d3.svg.symbol().size(36).type("circle"))
		.attr('fill', color)
	//.attr('stroke-width', this.strokeWidth)
		.attr('opacity', this.getOpacity(opacity, point))
		.attr('onmouseover', "this.setAttribute('style', 'cursor:pointer');");
	var content = "";
	for (var fieldId in this.infoFields) {
		var value = isNaN(point[this.infoFields[fieldId]]) ? point[this.infoFields[fieldId]] : point[this.infoFields[fieldId]].toFixed(5);
		content += this.infoFields[fieldId] + ": " + value + '<br>';
	}
	var testmore = node.append("svg:title").append("xhtml:div").html(content);
};

// TODO: currently unused
SpiralTree.prototype.drawLineSegment = function (point1, point2, opacity, quantity) {
	var line = this.spiralTreeLayer.append("svg:line")
		.attr("x1", x(point1.x))
		.attr("y1", y(point1.y))
		.attr("x2", x(point2.x))
		.attr("y2", y(point2.y))
		.attr("class", "lineSegment " + this.extraLineClass)
		.attr('fill', 'none')
		.attr('stroke-width', this.strokeWidth)
		.attr('opacity', this.getOpacity(opacity, point));
	if (this.lineColor !== undefined) {
		line.attr("fill", this.lineColor);
	}
};

SpiralTree.prototype.drawSpiralSegment = function (point, tValue, sign, opacity, quantity) {
	//special situation need to take care
	if (point.r === 0) {
		return;
	}
	var strokeWidth = this.quantityToStrokeWidth(quantity, point);
	var strokeType = strokeWidth < this.narrowWideStrokeThreshold ? "narrow" : "wide";
	
	var segment = this.spiralTreeLayer.append("svg:path")
		.attr("d", this.spiralPath(point, tValue, sign))
		.attr("class", "spiral " + this.extraSpiralClass)
		.attr('fill', 'none')
		.attr('stroke-linecap', "round")
		.attr('stroke-width', strokeWidth)
		.attr("data-origwidth", strokeWidth)
		.attr('opacity', this.getOpacity(opacity, point));
	if (this.markerStart[strokeType]) {
		segment.attr("marker-start", this.markerStart[strokeType]);
	}
	if (this.markerMid[strokeType]) {
		segment.attr("marker-mid", this.markerMid[strokeType]);
	}
	if (this.markerEnd[strokeType]) {
		segment.attr("marker-end", this.markerEnd[strokeType]);
	}
	if (this.spiralColor !== undefined) {
		segment.attr("fill", this.spiralColor);
	}
	if (this.mouseOverFunc && this.mouseOutFunc) {
		segment.on('mouseover', this.mouseOverFunc);
		segment.on('mouseout', this.mouseOutFunc);
	}
};

// TODO: currently unused
SpiralTree.prototype.drawSteinerNode = function (point) {
	this.spiralTreeLayer.append("svg:path")
		.attr("class", "steiner")
		.attr("transform", "translate(" + x(point.x) + "," + y(point.y) + ")")
		.attr("d", d3.svg.symbol().type("circle"));
};

//this function is newly added to force terminal points to be leaves rather than becoming interior points
SpiralTree.prototype.auxCircleJoinPoint = function (point, r, sign) {
	//special situation need to take care
	if (point.r === 0) {
		return null;
	}
	if (r === 0) {
		return {
			ti: undefined,
			x: this.center.x,
			y: this.center.y,
			r: 0,
			theta: 0,
			opacity: point.opacity,
			quantity: point.quantity
		};
	}
	var ti = Math.log(point.r / r);
	var tempTheta;
	if (sign === '+') {
		tempTheta = point.theta + Math.tan(this.alpha) * ti;
	} else {
		tempTheta = point.theta + Math.tan(-this.alpha) * ti;
	}
	if (r <= point.r) {
		return {
			ti: ti,
			x: r * Math.cos(tempTheta) + this.center.x,
			y: r * Math.sin(tempTheta) + this.center.y,
			r: r,
			theta: tempTheta,
			opacity: point.opacity,
			quantity: point.quantity
		};
	} else {
		return null;
	}
};

//this function is used to try to avoid overlapping of the steiner node and the terminals
SpiralTree.prototype.overlapArea = function (joinPoint, terminal, threshold) {
	if (threshold === undefined) {
		threshold = this.threshold;
	}
	var dis = (joinPoint.x - terminal.x) * (joinPoint.x - terminal.x) +
			(joinPoint.y - terminal.y) * (joinPoint.y - terminal.y);
	dis = Math.sqrt(dis);
	return (Math.sqrt(dis) <= threshold);
};


//function to find the intersection point of the point1 plus spiral and the point2 minus spiral
SpiralTree.prototype.spiralJoinPoint = function (point1, point2) {
	var angleDifference, radiusDifference, t1, t2, tempR, tempTheta;

	//special situation need to take care
	if (point1.r === 0 || point2.r === 0) {
		return {
			tPlus: undefined,
			tMinus: undefined,
			x: this.center.x,
			y: this.center.y,
			r: 0,
			theta: 0,
			opacity: Math.max(point1.opacity, point2.opacity),
			quantity: point1.quantity + point2.quantity
		};
	}

	//because of the angle problem, we need to add 2*Pi sometime, not proved but tested
	angleDifference = point2.theta - point1.theta;
	if (angleDifference < 0) {
		angleDifference = angleDifference + 2 * Math.PI;
	}
	radiusDifference = Math.log(point1.r) - Math.log(point2.r);
	angleDifference = angleDifference / Math.tan(this.alpha);
	t1 = (angleDifference + radiusDifference) / 2;
	t2 = (angleDifference - radiusDifference) / 2;
	if (t1 * t2 >= 0 && t1 < (Math.PI / Math.tan(this.alpha)) && t2 < (Math.PI / Math.tan(this.alpha))) {
		tempR = point1.r * Math.exp(-t1);
		tempTheta = point1.theta + Math.tan(this.alpha) * t1;
		//opacity attribute added for controlling the spiral segment opacity
		return {
			tPlus: t1,
			tMinus: t2,
			x: tempR * Math.cos(tempTheta) + this.center.x,
			y: tempR * Math.sin(tempTheta) + this.center.y,
			r: tempR,
			theta: tempTheta,
			opacity: Math.max(point1.opacity, point2.opacity),
			quantity: point1.quantity + point2.quantity
		};
	} else {
		return null;
	}
};

SpiralTree.prototype.calculateJoinPoint = function (waveFront) {
	var neighborCCW, currentJoinPoint,
		tempJoinPoint = null,
		arrayData = waveFront.arrayData;

	for (var loopk = 0; loopk < arrayData.length; loopk++) {
		neighborCCW = (loopk + 1) > (arrayData.length - 1) ? (loopk + 1 - arrayData.length) : (loopk + 1);
		if (neighborCCW === loopk) {
			continue;
		} else {
			currentJoinPoint = this.spiralJoinPoint(arrayData[loopk], arrayData[neighborCCW]);
			if ((currentJoinPoint !== null) && ((tempJoinPoint === null) || (tempJoinPoint.r < currentJoinPoint.r))) {
				tempJoinPoint = currentJoinPoint;
				tempJoinPoint.parentPlus = loopk;
				tempJoinPoint.parentMinus = neighborCCW;
			}
		}
	}
	return tempJoinPoint;
};

//the main procedure of calculating and drawing the spiral tree
SpiralTree.prototype.drawTree = function () {
	//Start the greedy spiral tree algorithm
	var newJoinPoint, currentEvent, position,
		loopi = 0,
		joinPoint = null,
		waveFront = new BinarySearchArray();

	while (loopi < this.terminals.length || joinPoint !== null || waveFront.arrayData.length !== 0) {
		if (loopi >= this.terminals.length && joinPoint === null) {
			this.drawSpiralSegment(waveFront.arrayData[waveFront.arrayData.length - 1]);
			waveFront.remove(waveFront.arrayData[waveFront.arrayData.length - 1], waveFront.arrayData.length - 1);
			break;
		}

		if (joinPoint === null) {
			//This is the terminal event
			currentEvent = this.terminals[loopi];
			loopi++;
			//first step add the terminal to W
			position = waveFront.add(currentEvent);
			//second step check the neighbor of that terminal
			var neighborRight = (position + 1) > (waveFront.arrayData.length - 1) ? (position + 1 - waveFront.arrayData.length) : (position + 1);
			var neighborLeft = (position - 1) < 0 ? (position - 1 + waveFront.arrayData.length) : (position - 1);
			if (neighborRight === position && neighborLeft === position) {
				continue;
			}
			if (this.spiralJoinPoint(waveFront.arrayData[position], waveFront.arrayData[neighborRight]) === null) {
				//this.drawLineSegment(waveFront.arrayData[position], waveFront.arrayData[neighborRight]);
				joinPoint = this.auxCircleJoinPoint(waveFront.arrayData[neighborRight], waveFront.arrayData[position].r, "+");
				this.drawSpiralSegment(waveFront.arrayData[neighborRight], joinPoint.ti, "+");
				waveFront.remove(waveFront.arrayData[neighborRight], neighborRight);
				position = waveFront.add(joinPoint);

			} else if (this.spiralJoinPoint(waveFront.arrayData[neighborLeft], waveFront.arrayData[position]) === null) {
				//this.drawLineSegment(waveFront.arrayData[neighborLeft], waveFront.arrayData[position]);
				joinPoint = this.auxCircleJoinPoint(waveFront.arrayData[neighborLeft], waveFront.arrayData[position].r, "-");
				this.drawSpiralSegment(waveFront.arrayData[neighborLeft], joinPoint.ti, "-");
				waveFront.remove(waveFront.arrayData[neighborLeft], neighborLeft);
				position = waveFront.add(joinPoint);
			}
			joinPoint = this.calculateJoinPoint(waveFront);
			if (joinPoint !== null && loopi < this.terminals.length && joinPoint.r < this.terminals[loopi].r) {
				joinPoint = null;
			}
		} else {
			//This is the join point event
			//pre-step for processing if the steiner node overlaps with the terminals
			if (this.overlapArea(waveFront.arrayData[joinPoint.parentMinus], waveFront.arrayData[joinPoint.parentPlus], this.threshold*3)) {
				//first step we need to draw out the two spiral segments and the steiner node
				this.drawSpiralSegment(waveFront.arrayData[joinPoint.parentPlus], joinPoint.tPlus, "+");
				this.drawSpiralSegment(waveFront.arrayData[joinPoint.parentMinus], joinPoint.tMinus, "-");
				//this.drawSteinerNode(joinPoint);
				//second step we need to remove the terminals from W
				waveFront.remove(waveFront.arrayData[joinPoint.parentPlus], joinPoint.parentPlus, joinPoint.parentMinus);
				//third step we need to insert the steiner node into W
				position = waveFront.add(joinPoint);

			} else if (this.overlapArea(joinPoint, waveFront.arrayData[joinPoint.parentPlus])) {
				newJoinPoint = this.auxCircleJoinPoint(waveFront.arrayData[joinPoint.parentMinus], waveFront.arrayData[joinPoint.parentPlus].r, "+");
				this.drawSpiralSegment(waveFront.arrayData[joinPoint.parentMinus], newJoinPoint.ti, "+");
				waveFront.remove(waveFront.arrayData[joinPoint.parentMinus], joinPoint.parentMinus);
				position = waveFront.add(newJoinPoint);

			} else if (this.overlapArea(joinPoint, waveFront.arrayData[joinPoint.parentMinus])) {
				newJoinPoint = this.auxCircleJoinPoint(waveFront.arrayData[joinPoint.parentPlus], waveFront.arrayData[joinPoint.parentMinus].r, "-");
				this.drawSpiralSegment(waveFront.arrayData[joinPoint.parentPlus], newJoinPoint.ti, "-");
				waveFront.remove(waveFront.arrayData[joinPoint.parentPlus], joinPoint.parentPlus);
				position = waveFront.add(newJoinPoint);

			} else {
				//first step we need to draw out the two spiral segments and the steiner node
				this.drawSpiralSegment(waveFront.arrayData[joinPoint.parentPlus], joinPoint.tPlus, "+");
				this.drawSpiralSegment(waveFront.arrayData[joinPoint.parentMinus], joinPoint.tMinus, "-");
				//this.drawSteinerNode(joinPoint);
				//second step we need to remove the terminals from W
				waveFront.remove(waveFront.arrayData[joinPoint.parentPlus], joinPoint.parentPlus, joinPoint.parentMinus);
				//third step we need to insert the steiner node into W
				position = waveFront.add(joinPoint);
			}
			joinPoint = this.calculateJoinPoint(waveFront);
			if (joinPoint !== null && loopi < this.terminals.length && joinPoint.r < this.terminals[loopi].r) {
				joinPoint = null;
			}
		}
	}

	if (this.nodeDrawable) {
		this.drawNode(this.center, this.centerColor);

		for (var i = 0; i < this.terminals.length; i++) {
			this.drawNode(this.terminals[i], this.terminalColor);
		}
	}
};

SpiralTree.prototype.clearSpiralPaths = function() {
	d3.selectAll('.spiral').remove();
};

var flowmap = {
	SpiralTree: SpiralTree
};

// play nice with or without require.js etc
if (typeof define === "function" && define.amd) {
	define(flowmap); 
} else if (typeof module === "object" && module.exports) {
	module.exports = flowmap;
}
this.flowmap = flowmap;

})();
