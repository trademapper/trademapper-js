var width = 800,
    height = 800,
    margin = 20;

//Below is for the balanced binary search tree, if the data being processed is small, we can use a sorted array instead 
var node = function () {
    var node = {
        value: null,
        left: null,
        right: null
    };
    return node;
};
function BinarySearchTree() {
    this._root = null;
};

BinarySearchTree.prototype = {
    //restore constructor
    constructor: BinarySearchTree,
    add: function (value) {
    },
    contains: function (value) {
    },
    remove: function (value) {
    },
    size: function () {
    },
    toArray: function () {
    },
    toString: function () {
    }
};
//end of the balanced binary tree

//Below is the sorted array with binary search
//Defined with the spiral elements
var arrayElement = function () {
    var arrayElement = {
        r: null,    //radius
        theta: null,    //spiral angle from the center to the node
        plusJoinPoint: null,    //left spiral
        minusJoinPoint: null    //right spiral
    };
    return arrayElement;
};
function BinarySearchArray() {
    this.arrayData = [];
    this.bsStart = 0;
    this.bsEnd = this.arrayData.length - 1;
    this.bsCurrent = 0;
};

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
        if (value == this.arrayData[this.bsCurrent].theta)
            return this.bsCurrent;
        else if (value < this.arrayData[this.bsCurrent].theta)
            this.bsEnd = this.bsCurrent - 1;
        else
            this.bsStart = this.bsCurrent + 1;
    }
    return this.bsStart;
}
BinarySearchArray.prototype.add = function (value) {
    var pos = this.search(value.theta);
    Array.prototype.splice.call(this.arrayData, pos, 0, value);
    return pos;
}
BinarySearchArray.prototype.remove = function (value, index1, index2) {
    switch (arguments.length) {
        case 1: index1 = this.search(value.theta);
        case 2: Array.prototype.splice.call(this.arrayData, index1, 1); break;
        case 3: if (index1 > index2) {
                var tempIndex = index2;
                index2 = index1;
                index1 = tempIndex;
            }
            Array.prototype.splice.call(this.arrayData, index1, 1);
            Array.prototype.splice.call(this.arrayData, index2 - 1, 1);
            break;
    }
}
//end of the class for sorted array

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

x = function (d) {
    return d;
}
y = function (d) {
    return d;
}

var symbol = d3.scale.ordinal().range(d3.svg.symbolTypes),
    color = d3.scale.category10();
//This is the class for spiral tree, need parameters for layer which should be svg type and the projection
function SpiralTree(layerId_, projection_) {
    this.layerId = layerId_;
    this.terminals = [];
    this.center = {};
    this.alpha = Math.PI / 12;  //spiral angle
    this.projection = null;
    if (projection_ == undefined)
        this.projection = d3.geo.mercator()
        .scale(1000)
        .translate([480, 400]);
    else this.projection = projection_;
    this.spiralTreeLayer = this.layerId
        .append("g");
    this.strokeWidth = 1;   //spiral line width
    this.opacity = 0.8;     //spiral node opacity
    this.centerColor='red'; //spiral center node color
    this.terminalColor = 'steelblue';   //spiral terminal color
    this.infoFields = [];   //the index of fields for displaying in the tooltips
    this.nodeDrawable = true;   //indicator of whether showing the node or not
    //.attr("transform", "translate(" + margin + "," + margin + ")");
}

//below is a bunch of configuration functions
SpiralTree.prototype.setProjection = function (projection_) {
    this.projection = projection_;
}

SpiralTree.prototype.setAlpha = function (alpha_) {
    if (alpha_ == undefined)
        this.alpha = Math.PI / 12;
    else this.alpha = alpha_;
}

SpiralTree.prototype.setColor = function (className, color) {
    if (className == 'spiralSegment')
        this.spiralColor = color;
    else if (className == 'lineSegment')
        this.lineColor = color;
    else if (className == 'center')
        this.centerColor = color;
    else if (className == 'terminal')
        this.terminalColor = color;
    else
        this.SteinerColor = color;
}

SpiralTree.prototype.setWidth = function (width) {
    if (width == undefined) width = 1;
    this.strokeWidth = width;
}

SpiralTree.prototype.setOpacity = function (opacity) {
    if (opacity == undefined) opacity = 0.8;
    this.opacity = opacity;
}

//this is used for setting up a threshold of detecting the overlapping nodes
SpiralTree.prototype.setThreshold = function (zoomLevel) {
    if (zoomLevel == undefined) zoomLevel = 3;
    this.threshold = Math.pow(2, (zoomLevel - 3));
}

SpiralTree.prototype.setInfoFields = function (fields) {
    this.infoFields = fields;
}

SpiralTree.prototype.setNodeDrawable = function (flag) {
    this.nodeDrawable = flag;
}

//this is a function for adapting the data to the internal data used by spiraltree
SpiralTree.prototype.preprocess = function (Geodata, Geocenter) {
    this.terminals = [];
    this.center = {};
    for (var noArrayI = 0; noArrayI < Geodata.length; noArrayI++) {
        var tempPixelPoint = this.projection([Geodata[noArrayI].lng, Geodata[noArrayI].lat]);
        this.terminals.push({ x: tempPixelPoint[0], y: tempPixelPoint[1],
            opacity: Geodata[noArrayI].opacity == undefined ? this.opacity : Geodata[noArrayI].opacity
        });
        for (var fieldId in this.infoFields) {
            this.terminals[noArrayI][this.infoFields[fieldId]] = Geodata[noArrayI][this.infoFields[fieldId]];
        }
    }
    this.center = { x: this.projection([Geocenter.lng, Geocenter.lat])[0], y: this.projection([Geocenter.lng, Geocenter.lat])[1],
        opacity: Geocenter.opacity == undefined ? this.opacity : Geocenter.opacity
    };
    for (var fieldId in this.infoFields) {
        this.center[this.infoFields[fieldId]] = Geocenter[this.infoFields[fieldId]];
    }
    var minX = this.center.x, minY = this.center.y, maxX = this.center.x, maxY = this.center.y;
    for (var loopi = 0; loopi < this.terminals.length; loopi++) {
        this.terminals[loopi].r = Math.sqrt((this.terminals[loopi].x - this.center.x) * (this.terminals[loopi].x - this.center.x) + (this.terminals[loopi].y - this.center.y) * (this.terminals[loopi].y - this.center.y));
        //r could be possibly 0 when the terminal are totally overlapped with the center which will result the NaN in theta
        //and then it would cause the last segment of the spiral tree disappear, so we need to add a conditional statement for that situation
        var theta;
        if (this.terminals[loopi].r == 0) {
            theta = 0;
        }
        else
            theta = Math.acos((this.terminals[loopi].x - this.center.x) / this.terminals[loopi].r);
        this.terminals[loopi].theta = (this.terminals[loopi].y - this.center.y) < 0 ? 2 * Math.PI - theta : theta;
        if (this.terminals[loopi].x > maxX) maxX = this.terminals[loopi].x;
        if (this.terminals[loopi].x < minX) minX = this.terminals[loopi].x;
        if (this.terminals[loopi].y > maxY) maxY = this.terminals[loopi].y;
        if (this.terminals[loopi].y < minY) minY = this.terminals[loopi].y;
    }
    //sort the array of terminals
    Array.prototype.sort.call(this.terminals, function (a, b) { return b.r - a.r; });
    return { xMin: minX, yMin: minY, xMax: maxX, yMax: maxY, width: maxX - minX, height: maxY - minY };
}

//this is a function of calculating and storing the spiral segments
SpiralTree.prototype.spiralPath = function (point, tValue, sign) {
    var spiralLine = d3.svg.line()
    .x(function (d) { return x(d.x) })
    .y(function (d) { return y(d.y) });
    var adjustAlpha;
    if (sign == "-") adjustAlpha = -this.alpha;
    else adjustAlpha = this.alpha;
    var r = Math.sqrt((point.x - this.center.x) * (point.x - this.center.x) + (point.y - this.center.y) * (point.y - this.center.y));
    var initialTheta = Math.acos((point.x - this.center.x) / r);
    var theta = (point.y - this.center.y) < 0 ? 2 * Math.PI - initialTheta : initialTheta;
    var step;
    var ncount = 60;
    if (tValue == undefined)
        step = (Math.PI / Math.tan(this.alpha)) / ncount; //0.05;
    else step = tValue / ncount;
    var spiral = [];
    for (var i = 0; i < ncount; i++) {
        var currentTheta = theta + Math.tan(adjustAlpha) * i * step;
        spiral.push({ x: r * Math.exp(-i * step) * Math.cos(currentTheta) + this.center.x, y: r * Math.exp(-i * step) * Math.sin(currentTheta) + this.center.y });
    }
    //need to push the last point of the spiral path to make sure that it is theoretically closed
    currentTheta = theta + Math.tan(adjustAlpha) * tValue;
    spiral.push({ x: r * Math.exp(-tValue) * Math.cos(currentTheta) + this.center.x, y: r * Math.exp(-tValue) * Math.sin(currentTheta) + this.center.y });
    return spiralLine(spiral);
}

SpiralTree.prototype.drawNode = function (point, color, opacity) {
    if (opacity == undefined) {
        if (point.opacity == undefined)
            opacity = this.opacity;
        else opacity = point.opacity;
    };
    var node = this.spiralTreeLayer.append("svg:path")
        .attr("class", "dot")
        .attr("transform", "translate(" + x(point.x) + "," + y(point.y) + ")")
        .attr("d", d3.svg.symbol().size(36).type("circle"))
        .attr('fill', color)
    //.attr('stroke-width', this.strokeWidth)
        .attr('opacity', opacity)
        .attr('onmouseover', "this.setAttribute('style', 'cursor:pointer');");
    var content = "";
    for (var fieldId in this.infoFields) {
        var value = isNaN(point[this.infoFields[fieldId]]) ? point[this.infoFields[fieldId]] : point[this.infoFields[fieldId]].toFixed(5);
        content += this.infoFields[fieldId] + ": " + value + '<br>';
    }
    var testmore = node.append("svg:title").append("xhtml:div").html(content);
}

SpiralTree.prototype.drawLineSegment = function (point1, point2, opacity) {
    if (opacity == undefined) {
        if (point1.opacity == undefined)
            opacity = this.opacity;
        else opacity = point1.opacity;
    };
    if (this.lineColor == undefined)
        this.lineColor = 'green';
    this.spiralTreeLayer.append("svg:line")
        .attr("x1", x(point1.x))
        .attr("y1", y(point1.y))
        .attr("x2", x(point2.x))
        .attr("y2", y(point2.y))
        .attr("class", "lineSegment")
        .attr('stroke', this.lineColor)
        .attr('fill', 'none')
        .attr('stroke-width', this.strokeWidth)
        .attr('opacity', opacity);
}

SpiralTree.prototype.drawSpiralSegment = function (point, tValue, sign, opacity) {
    if (opacity == undefined) {
        if (point.opacity == undefined)
            opacity = this.opacity;
        else opacity = point.opacity;
    };
    //special situation need to take care
    if (point.r == 0) return;
    if (this.spiralColor == undefined)
        this.spiralColor = 'black';
    this.spiralTreeLayer.append("svg:path")
        .attr("d", this.spiralPath(point, tValue, sign))
        .attr("class", "spiral")
        .attr('stroke', this.spiralColor)
        .attr('fill', 'none')
        .attr('stroke-width', this.strokeWidth)
        .attr('opacity', opacity);
}

SpiralTree.prototype.drawSteinerNode = function (point) {
    this.spiralTreeLayer.append("svg:path")
        .attr("class", "steiner")
        .attr("transform", "translate(" + x(point.x) + "," + y(point.y) + ")")
        .attr("d", d3.svg.symbol().type("circle"));
}

//this function is newly added to force terminal points to be leaves rather than becoming interior points
SpiralTree.prototype.auxCircleJoinPoint = function (point, r, sign) {
    //special situation need to take care
    if (point.r == 0)
        return null;
    if (r == 0)
        return { ti: undefined, x: this.center.x, y: this.center.y, r: 0, theta: 0, opacity: point.opacity };
    var ti = Math.log(point.r / r);
    var tempTheta;
    if (sign == '+')
        tempTheta = point.theta + Math.tan(this.alpha) * ti;
    else
        tempTheta = point.theta + Math.tan(-this.alpha) * ti;
    if (r <= point.r)
        return { ti: ti, x: r * Math.cos(tempTheta) + this.center.x, y: r * Math.sin(tempTheta) + this.center.y, r: r, theta: tempTheta, opacity: point.opacity };
    else return null;
}

//this function is used to try to avoid overlapping of the steiner node and the terminals
SpiralTree.prototype.overlapArea = function (joinPoint, terminal, threshold) {
    if (threshold == undefined) threshold = this.threshold;
    var dis = (joinPoint.x - terminal.x) * (joinPoint.x - terminal.x) + (joinPoint.y - terminal.y) * (joinPoint.y - terminal.y);
    dis = Math.sqrt(dis);
    if (dis <= threshold) return true;
    else return false;
}


//function to find the intersection point of the point1 plus spiral and the point2 minus spiral
SpiralTree.prototype.spiralJoinPoint = function (point1, point2) {
    //special situation need to take care
    if (point1.r == 0 || point2.r == 0) {
        return { tPlus: undefined, tMinus: undefined, x: this.center.x, y: this.center.y,
            r: 0, theta: 0, opacity: Math.max(point1.opacity, point2.opacity)
        };
    }

    //because of the angle problem, we need to add 2*Pi sometime, not proved but tested
    var angleDifference = point2.theta - point1.theta;
    if (angleDifference < 0) angleDifference = angleDifference + 2 * Math.PI;
    var radiusDifference = Math.log(point1.r) - Math.log(point2.r);
    angleDifference = angleDifference / Math.tan(this.alpha);
    var t1 = (angleDifference + radiusDifference) / 2;
    var t2 = (angleDifference - radiusDifference) / 2;
    if (t1 * t2 >= 0 && t1 < (Math.PI / Math.tan(this.alpha)) && t2 < (Math.PI / Math.tan(this.alpha))) {
        var tempR = point1.r * Math.exp(-t1);
        var tempTheta = point1.theta + Math.tan(this.alpha) * t1;
        //opacity attribute added for controlling the spiral segment opacity
        return { tPlus: t1, tMinus: t2, x: tempR * Math.cos(tempTheta) + this.center.x, y: tempR * Math.sin(tempTheta) + this.center.y,
            r: tempR, theta: tempTheta, opacity: Math.max(point1.opacity, point2.opacity)
        };
    }
    else return null;
}

SpiralTree.prototype.calculateJP = function (waveF) {
    var tempJoinPoint = null;
    for (var loopk = 0; loopk < waveF.arrayData.length; loopk++) {
        var neighborCCW = (loopk + 1) > (waveF.arrayData.length - 1) ? (loopk + 1 - waveF.arrayData.length) : (loopk + 1);
        if (neighborCCW == loopk) continue;
        else {
            var currentJoinPoint = this.spiralJoinPoint(waveF.arrayData[loopk], waveF.arrayData[neighborCCW]);
            if ((currentJoinPoint != null) && ((tempJoinPoint == null) || (tempJoinPoint.r < currentJoinPoint.r))) {
                tempJoinPoint = currentJoinPoint;
                tempJoinPoint.parentPlus = loopk;
                tempJoinPoint.parentMinus = neighborCCW;
            }
        }
    }
    return tempJoinPoint;
}

//the main procedure of calculating and drawing the spiral tree
SpiralTree.prototype.drawTree = function () {

    //Start the greedy spiral tree algorithm
    var loopi = 0;
    var joinPoint = null;
    var waveFront = new BinarySearchArray();

    while (loopi < this.terminals.length || joinPoint != null || waveFront.arrayData.length != 0) {
        var currentEvent;
        if (loopi >= this.terminals.length && joinPoint == null) {
            this.drawSpiralSegment(waveFront.arrayData[waveFront.arrayData.length - 1]);
            waveFront.remove(waveFront.arrayData[waveFront.arrayData.length - 1], waveFront.arrayData.length - 1);
            break;
        }

        if (joinPoint == null) {
            //This is the terminal event
            currentEvent = this.terminals[loopi];
            loopi++;
            //first step add the terminal to W
            var position = waveFront.add(currentEvent);
            //second step check the neighbor of that terminal
            var neighborRight = (position + 1) > (waveFront.arrayData.length - 1) ? (position + 1 - waveFront.arrayData.length) : (position + 1);
            var neighborLeft = (position - 1) < 0 ? (position - 1 + waveFront.arrayData.length) : (position - 1);
            if (neighborRight == position && neighborLeft == position) continue;
            if (this.spiralJoinPoint(waveFront.arrayData[position], waveFront.arrayData[neighborRight]) == null) {
                //this.drawLineSegment(waveFront.arrayData[position], waveFront.arrayData[neighborRight]);
                joinPoint = this.auxCircleJoinPoint(waveFront.arrayData[neighborRight], waveFront.arrayData[position].r, "+");
                this.drawSpiralSegment(waveFront.arrayData[neighborRight], joinPoint.ti, "+");
                waveFront.remove(waveFront.arrayData[neighborRight], neighborRight);
                position = waveFront.add(joinPoint);
            }
            else if (this.spiralJoinPoint(waveFront.arrayData[neighborLeft], waveFront.arrayData[position]) == null) {
                //this.drawLineSegment(waveFront.arrayData[neighborLeft], waveFront.arrayData[position]);
                joinPoint = this.auxCircleJoinPoint(waveFront.arrayData[neighborLeft], waveFront.arrayData[position].r, "-");
                this.drawSpiralSegment(waveFront.arrayData[neighborLeft], joinPoint.ti, "-");
                waveFront.remove(waveFront.arrayData[neighborLeft], neighborLeft);
                position = waveFront.add(joinPoint);
            }
            joinPoint = this.calculateJP(waveFront);
            if (joinPoint != null && loopi < this.terminals.length && joinPoint.r < this.terminals[loopi].r)
                joinPoint = null;
        }
        else {
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
            }
            else if (this.overlapArea(joinPoint, waveFront.arrayData[joinPoint.parentPlus])) {
                var newJoinPoint = this.auxCircleJoinPoint(waveFront.arrayData[joinPoint.parentMinus], waveFront.arrayData[joinPoint.parentPlus].r, "+");
                this.drawSpiralSegment(waveFront.arrayData[joinPoint.parentMinus], newJoinPoint.ti, "+");
                waveFront.remove(waveFront.arrayData[joinPoint.parentMinus], joinPoint.parentMinus);
                position = waveFront.add(newJoinPoint);
            }
            else if (this.overlapArea(joinPoint, waveFront.arrayData[joinPoint.parentMinus])) {
                var newJoinPoint = this.auxCircleJoinPoint(waveFront.arrayData[joinPoint.parentPlus], waveFront.arrayData[joinPoint.parentMinus].r, "-");
                this.drawSpiralSegment(waveFront.arrayData[joinPoint.parentPlus], newJoinPoint.ti, "-");
                waveFront.remove(waveFront.arrayData[joinPoint.parentPlus], joinPoint.parentPlus);
                position = waveFront.add(newJoinPoint);
            }
            else {
                //first step we need to draw out the two spiral segments and the steiner node
                this.drawSpiralSegment(waveFront.arrayData[joinPoint.parentPlus], joinPoint.tPlus, "+");
                this.drawSpiralSegment(waveFront.arrayData[joinPoint.parentMinus], joinPoint.tMinus, "-");
                //this.drawSteinerNode(joinPoint);
                //second step we need to remove the terminals from W
                waveFront.remove(waveFront.arrayData[joinPoint.parentPlus], joinPoint.parentPlus, joinPoint.parentMinus);
                //third step we need to insert the steiner node into W
                position = waveFront.add(joinPoint);
            }
            joinPoint = this.calculateJP(waveFront);
            if (joinPoint != null && loopi < this.terminals.length && joinPoint.r < this.terminals[loopi].r)
                joinPoint = null;
        }
    }

    if (this.nodeDrawable) {
        Array.prototype.unshift.call(this.terminals, this.center);
        var tempCenterColor = this.centerColor;
        var tempTerminalColor = this.terminalColor;
        for (tI in this.terminals) {
            if (tI == 0) this.drawNode(this.terminals[tI], tempCenterColor);
            else this.drawNode(this.terminals[tI], tempTerminalColor);
        }
        Array.prototype.shift.call(this.terminals, this.center);
    }
}