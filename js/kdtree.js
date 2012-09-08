/**
 * Implements a K-dimensional tree in Javascript to easily find the closest point to any given point, and to allow removing of a point from the
 *
 * Ported from my MP6 code from CS 225 @ UIUC
 */
function KDTree(dim, points) {
    this.dim = dim;
    // Make a copy of the array
    this.points = new Array();
    this.pointIndex = new Array();

    for (var a = 0; a < points.length; a++) {
        this.points.push(points[a]);
        this.pointIndex.push(a);
    }

    this.construct(0, this.points.length - 1, 0);

}

KDTree.prototype.construct = function(left, right, d) {

    if (left >= right) {
        return;
    }

    var mid = Math.floor((left + right) / 2);

    if (mid < 0) {
        mid = 0;
    }

    var rotateIndex = this.select(this.points, left, right, mid + 1 - left, d);
    var storeIndex = this.partition(this.points, left, right, rotateIndex, d);

    var newD = (d + 1) % this.dim;

    if (storeIndex != -1) {
        this.construct(left, storeIndex -1, newD);
        this.construct(storeIndex+1, right, newD);
    }
}

KDTree.prototype.partition = function(list, left, right, pivotIndex, d) {
    if (left >= right) {
        return -1;
    }

    // Get the pivot value
    var pivotValue = list[this.pointIndex[pivotIndex]];

    // Move the pivot to the end
    this.swap(pivotIndex, right);

    var storeIndex = left;

    for (var i = left; i < right; i++) {
        // If the value in the given dimension is less, or in the event of a tie, if the point itself is less
        if (this.smallerDimVal(list[this.pointIndex[i]], pivotValue, d)) {
            this.swap(storeIndex, i);
            storeIndex++;
        }
    }

    // Move the pivot to its final place
    this.swap(right, storeIndex);

    return storeIndex;
}

/**
 * Selects the kth smallest element in the list
 */
KDTree.prototype.select = function(list, left, right, k, d) {
    // The list only contains 1 element
    if (left == right) {
        return left; // Return that element
    }

    // Select pivotIndex between left and right
    var pivotIndex = Math.floor((left + right) / 2);

    if (pivotIndex < 0) {
        pivotIndex = 0;
    }

    var pivotNewIndex = this.partition(list, left, right, pivotIndex, d);

    var pivotDist = pivotNewIndex - left + 1;

    // The pivot is in its final sorted position, so pivotDist reflects it's l-based position if the list were sorted
    if (pivotDist == k) {
        return pivotNewIndex;
    } else if (k < pivotDist) {
        return this.select(list, left, pivotNewIndex - 1, k, d);
    } else {
        return this.select(list, pivotNewIndex + 1, right, k - pivotDist, d);
    }
};

KDTree.prototype.swap = function(one, two) {
    var temp = this.pointIndex[one];
    this.pointIndex[one] = this.pointIndex[two];
    this.pointIndex[two] = temp;
}

/**
 * Finds the closest point on the tree to a given point
 * @param  {Point} a The point to find the closest point to
 */
KDTree.prototype.findNearestNeighbor = function(target) {
    return this.fnn(new Point(target), 0, this.points.length-1, 0);
}

KDTree.prototype.fnn = function(target, low, high, d) {
    var tVal = target.get(d);
    var mid = Math.floor((low+high) / 2);

    if (mid < 0) {
        mid = 0;
    }

    var median = this.points[this.pointIndex[mid]];

    // Check for leafness
    if (low >= high) {
        return median;
    }

    var mVal = median.get(d);

    var newD = (d + 1) % this.dim;

    var potential;
    var currentBest = median;

    var wentLeft = false;

    // target < median, so search the left {
    if (this.smallerDimVal(target, median, d)) {
        potential = this.fnn(target, low, mid-1, newD);
        wentLeft = true;
    }
    // target > median, so search the right
    else if (this.smallerDimVal(median, target, d)) {
        potential = this.fnn(target, mid+1, high, newD);
        wentLeft = false;
    }

    // Second part of the method, so the potential is the best option we have right now

    if (this.shouldReplace(target, currentBest, potential)) {
        currentBest = potential;
    }

    // Third part of the method, check if the integer in the dimensoin given indicates that there could be another possibility

    var dist = 0;

    for (var a = 0; a < this.dim; a++) {
        dist += Math.pow(currentBest.get(a) - target.get(a), 2);
    }

    if (Math.pow(median.get(d) - target.get(d), 2) <= dist) {
        console.log("Checking the other side for ", median);
        // There could potentially be a better node in the other substree
        var newPotential;
        if (wentLeft) {
            newPotential = this.fnn(target, mid+1, high, newD);
        } else {
            newPotential = this.fnn(target, low, mid-1, newD);
        }

        // If the new one is better, replcae it
        if (this.shouldReplace(target, currentBest, newPotential)) {
            currentBest = newPotential;
        }
    } else {
        console.log("Median ", median);
        console.log("target", target);
    }

    return currentBest;
}

/**
 * Determines if a given point has a smaller dimension value than another point
 * @param  {Point} a The first point
 * @param  {Point} b The second point
 * @param  {int} d The dimension to use
 * @return {Boolean}   Whether the value in the current dimension of the first point is less than that of the second
 */
KDTree.prototype.smallerDimVal = function(a, b, d) {
    if (a.get(d) == b.get(d)) {
        return this.pointLess(a,b);
    } else {
        return a.get(d) < b.get(d);
    }
};

/**
 * Determins if a given "best" point should be replaced
 */
KDTree.prototype.shouldReplace = function(target, currentBest, potential) {
    var dist1 = 0, dist2 = 0;

    for (var d = 0; d < currentBest.dim(); d++) {
        dist1 += Math.pow(currentBest.get(d) - target.get(d), 2);
        dist2 += Math.pow(potential.get(d) - target.get(d), 2);
    }

    if (dist1 == dist2) {
        return this.pointLess(potential, currentBest);
    }

    return dist2 < dist1;
};

/**
 * Returns if a < b point wise (used in tiebreakers generally)
 * @param  {Point} a the first point
 * @param  {Point} b the second point
 * @return {Boolean}   Whether the first point < the second
 */
KDTree.prototype.pointLess = function(a, b) {
    var less = false;
    for (var i = 0; i < a.dim(); ++i) {
        less = a.get(i) < b.get(i);
        if (a.get(i) != b.get(i)) {
            break;
        }
    }
    return less;
}

// /**
//  * Removes a node from the tree
//  * @param  {Array} point the point to remove
//  * @return {Boolean} if the point was removed or not
//  */
// KDTree.prototype.remove = function(point) {
//     return this.rm(new Point(point), 0, this.points.length - 1, 0);
// }

// KDTree.prototype.rm = function(target, low, high, d) {
//     // If the node doesn't exist
//     if (low > high) {
//         return false;
//     }

//     var newD = (d + 1) % this.dim;
//     var mid = Math.floor((low+high) / 2);

//     if (mid < 0) {
//         mid = 0;
//     }

//     var median = this.points[this.pointIndex[mid]];

//     if (!median.visible) {
//         return false;
//     }

//     if (this.smallerDimVal(target, median, d)) {
//         // target < median on D, so go left
//         this.rm(target, low, mid-1, newD);
//     } else if (this.smallerDimVal(median, target, d)) {
//         // median < target on D, so go right
//         this.rm(target, mid+1, high, newD);
//     } else {
//         // The median is the target! Now for the fun part

//         var hasLeft = mid - 1 - low >= 0;
//         var hasRight = high - mid - 1 >= 0;

//         if (!hasLeft && !hasRight) {
//             // remove the node itself
//             this.removeNodeAtPoint(mid);
//             return;
//         }

//         var toRemove;
//         if (hasRight) {
//             var replacementObj = this.findMin(mid + 1, high, d, newD);
//             var replacement = replacementObj['obj'];
//             var replacementIndex = replacementObj['index'];

//             this.swap(replacementIndex, median);

//             // var point = new Point(replacement.points);
//             // point.data = replacement.data.slice(0);
//             // this.points[this.pointIndex[mid]] = point;

//             toRemove = median;
//         } else {
//             var replacementObj = this.findMin(mid + 1, high, d, newD);
//             var replacement = replacementObj['obj'];
//             var replacementIndex = replacementObj['index'];

//             this.swap(replacementIndex, median);

//             // var point = new Point(replacement.points);
//             // point.data = replacement.data.slice(0);
//             // this.points[this.pointIndex[mid]] = point;

//             toRemove = median;
//         }

//         this.rm(toRemove, mid+1, high, newD);
//     }
// }

// KDTree.prototype.removeNodeAtPoint = function(pointIndex) {
//     // this.points.remove(pointIndexInList);
//     // for (var a = 0; a < this.pointIndex.length; a++) {
//     //     if (this.pointIndex[a] > pointIndexInList) {
//     //         this.pointIndex[a]--;
//     //     } else if (this.pointIndex[a] == pointIndexInList) {
//     //         this.pointIndex.remove(a);
//     //         a--;
//     //     }
//     // }
//     this.points[this.pointIndex[pointIndex]].visible = false;
// }

// KDTree.prototype.findMin = function(low, high, whichAxis, d) {
//     // If the node doesn't exist
//     if (low > high) {
//         return null;
//     }

//     var newD = (d + 1) % this.dim;
//     var mid = Math.floor((low+high) / 2);

//     if (mid < 0) {
//         mid = 0;
//     }

//     var median = this.points[this.pointIndex[mid]];

//     if (whichAxis == d) {
//         // if the left node doesn't exist
//         if (mid - 1 - low < 0) {
//             // return this point
//             return {obj: median, index: mid};
//         } else {
//             return this.findMin(low, mid-1, whichAxis, newD);
//         }
//     } else {
//         var currentBest = median;

//         var leftBest = this.findMin(low, mid-1, whichAxis, newD);
//         var rightBest = this.findMin(mid+1, high, whichAxis, newD);

//         if (leftBest && this.smallerDimVal(leftBest, currentBest, whichAxis)) {
//             currentBest = leftBest;
//         }
//         if (rightBest && this.smallerDimVal(rightBest, currentBest, whichAxis)) {
//             currentBest = rightBest;
//         }

//         return {obj: currentBest, index: mid};
//     }
// }

/**
 * Override to truncate a number
 * @param  {int} digits the number of digits to keep
 * @return {int} The truncated number
 */
Number.prototype.toFixedDown = function(digits) {
  var n = this - Math.pow(10, -digits)/2;
  return n.toFixed(digits);
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};


