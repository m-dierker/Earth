/*
Implements a N-D point
 */
function Point(points) {
    this.points = new Array();
    for (var a = 0; a < points.length; a++) {
        this.points.push(points[a]);
    }
}

/**
 * Returns the value in the given dimension
 * @param  {int} dim the dimension
 * @return {int} the value
 */
Point.prototype.get = function(dim) {
    return this.points[dim];
};

/**
 * Returns the dimension of this point
 * @return {[type]} [description]
 */
Point.prototype.dim = function() {
    return this.points.length;
}
