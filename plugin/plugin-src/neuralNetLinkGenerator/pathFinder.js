"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPaths = void 0;
function findPaths(text) {
    let paths = [];
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkers(text, '^', '/', '\\s;')));
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkers(text, '\\s', '/', '\\s;').map(path => path.trim())));
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkers(text, "'", '/', '', "'")));
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkers(text, '"', '/', '', '"')));
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkersAndNormalize(text, '^', '\\', '\\s;')));
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkersAndNormalize(text, '\\s', '\\', '\\s;').map(path => path.trim())));
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkersAndNormalize(text, "'", '\\', '', "'")));
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkersAndNormalize(text, '"', '\\', '', '"')));
    concatToPathsIfNotIncluded(paths, postProcessPaths(findPathsWithMarkersAndNormalize(text, 'import ', '.', '\\s\\*;')));
    return paths;
}
exports.findPaths = findPaths;
function postProcessPaths(paths) {
    paths = paths.filter(path => !path.startsWith('https://') && !path.startsWith('http://'));
    return paths.map(path => {
        if (path.startsWith('package:')) {
            path = path.substring('package:'.length);
        }
        return path.trim();
    });
}
function concatToPathsIfNotIncluded(paths, otherPaths) {
    for (const otherPath of otherPaths) {
        if (!paths.includes(otherPath)) {
            paths.push(otherPath);
        }
    }
}
function findPathsWithMarkersAndNormalize(text, start, separator, additionalForbiddings, end) {
    return findPathsWithMarkers(text, start, separator, additionalForbiddings, end).map(path => path.replaceAll(separator, '/'));
}
function findPathsWithMarkers(text, start, separator, additionalForbiddings = '', end) {
    // there is no neural net yet, for now the name just stays as buzzword xD
    const paths = [];
    const forbiddings = `'"/\\\\\n${additionalForbiddings}`;
    const pathElement = `[^${forbiddings}]*[\\${separator}][^${forbiddings}]*`;
    const suffixCaptor = '(.|\\s|$)'; // using capturing group that matches everything to avoid catastrophic backtracking
    const pathMatches = text.matchAll(new RegExp(`${start}(?:${pathElement})+${suffixCaptor}`, 'g'));
    for (const pathMatch of pathMatches) {
        let path = pathMatch[0];
        let suffix = pathMatch[1];
        if (end && end !== suffix) {
            continue;
        }
        if (path.startsWith(start)) {
            path = path.substring(start.length);
        }
        if (path.endsWith(suffix)) {
            path = path.substring(0, path.length - suffix.length);
        }
        if (path.length > 1) {
            paths.push(path);
        }
    }
    return paths;
}