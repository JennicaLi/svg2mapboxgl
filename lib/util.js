/**
 * Created by lj on 16-9-21.
 */
exports.merge=function merge(destination, source) {
    if (destination && source) {
        var result={};
        for (var property in destination) {
            result[property] = destination[property];
        }
        for (var property in source) {
            result[property] = source[property];
        }
        return result;
    } else if (source && (!destination)) {
        var result={};
        for (var property in source) {
            result[property] = source[property];
        }
        return result;
    } else if (destination && (!source)) {
        var result={};
        for (var property in destination) {
            result[property] = destination[property];
        }
        return result;
    }
};
exports.isEmptyObject = function(e) {
    var t
    for (t in e)
        return !1
    return !0
};