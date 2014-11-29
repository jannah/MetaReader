/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function Suggestion()
{
    var suggestion = {};
    suggestion.show = true;
    suggestion.text = '';
    suggestion.importance = 0;
    suggestion.scope = ''; //General, Number, String, ..etc
    suggestion.class = '';
    suggestion.category = '';
    return suggestion;
}

function getSuggestions(d)
{
    var suggestions = [];
    suggestions = suggestions.concat(getGeneralSuggestions(d));
    if (d.type === 'string')
        suggestions = suggestions.concat(getStringSuggestions(d));
    if (d.type === 'float')
        suggestions = suggestions.concat(getFloatSuggestions(d));
    if (d.type === 'integer')
        suggestions = suggestions.concat(getIntegerSuggestions(d));
//    console.log(suggestions)
    return suggestions;
}

function getGeneralSuggestions(d)
{
    var suggestions = [];
    if (d.invalidValues > 0)
    {

        var ratio = (d.invalidValues / d.count * 100).toPrecision(3);
//        console.log(ratio)
        var s = new Suggestion();
        s.text = 'The data contains ' + ratio + '% missing or invalid values (Null, NaN, None, empty..etc).';
        s.importance = 2;
        s.scope = 'General';
        s.class = 'warning';
        s.category = 'missing-values';
        suggestions.push(s);
//        console.log(s);
    }
    var uniqueRatio = d.countUnique / d.count * 100;

//    console.log(d.countUnique, uniqueRatio)
    if (d.countUnique < 10 || uniqueRatio < 20)
    {
        var s = new Suggestion();
        s.text = 'The data contains ' + d.countUnique + ' unique values out of ' + d.count + '. This column might contain categorical data.';
        s.importance = 2;
        s.scope = 'General';
        s.class = 'tip';
        s.category = 'categorical-values';
        suggestions.push(s);
//        console.log(s);
    }

    if (d.count === (d.countUnique + d.invalidValues))
    {
        var s = new Suggestion();
        s.text = 'All values  in this column are unique. This column could be the primary key.';
        s.importance = 2;
        s.scope = 'General';
        s.class = 'tip';
        s.category = 'primary-key';
        suggestions.push(s);
//        console.log(s);

    }
    if (d.countUnique === 2)
    {
        var s = new Suggestion();
        s.text = 'The data contains only 2 unique values. It might be refereing to boolean values.';
        s.importance = 2;
        s.scope = 'General';
        s.class = 'tip';
        s.category = 'boolean-values';
        suggestions.push(s);
    }

//    is sorted
    var sorted = isSorted(d.data);
    if (sorted !== 0)
    {
        var msg = 'The data is sorted ' + ((sorted === 1) ? 'ascendingly' : 'descendingly')
                + (d.invalidValues > 0 ? '(Excluding invalid vlaues)' : '')
                + '.'
        var s = new Suggestion();
        s.text = msg;
        s.importance = 2;
        s.scope = 'General';
        s.class = 'tip';
        s.category = 'sorted-values';
        suggestions.push(s);
        suggestions = suggestions.concat(checkInterval(d))
    }

// contiguous values
    return suggestions;

}

function getNumberSuggestions(d)
{
    var suggestions = [];
    var uniqueRatio = d.countUnique / d.count * 100;

    if (d.countUnique < 10 && uniqueRatio < 20)
    {
        var s = new Suggestion();
        s.text = 'The data contains ' + d.countUnique + ' unique values. Although the data is numerical, it might be refereing to categorical data.';
        s.importance = 2;
        s.scope = 'Number';
        s.class = 'tip';
        s.category = 'categorical-values';
        suggestions.push(s);
//        console.log(s);
    }
    if (d.outliers.length > 0)
    {
        var s = new Suggestion();
        s.text = 'The data contains ' + d.outliers.length + ' statistical outlier' + ((d.outliers.length > 1) ? 's' : '') + ' (&plusmn;1.5 * InterQuartileRange).';
        s.importance = 2;
        s.scope = 'Number';
        s.class = 'tip';
        s.category = 'outliers';
        suggestions.push(s);
//        console.log(s);
    }
    return suggestions;
}

function getIntegerSuggestions(d)
{
    var suggestions = getNumberSuggestions(d);




    return suggestions;
}

function getFloatSuggestions(d)
{
    var suggestions = getNumberSuggestions(d);
    if (d.metrics.integer > 0)
    {
        var s = new Suggestion();
        s.text = 'The data contains ' + (d.metrics.integer / d.count * 100).toPrecision(3) + '% integer values. Investigate whether the column should be treated as an integer';
        s.importance = 2;
        s.scope = 'Float';
        s.class = 'tip';
        s.category = 'missing-values';
        suggestions.push(s);
//        console.log(s);
    }

    return suggestions;
}


function getStringSuggestions(d)
{
    var suggestions = [];
    var number_count = d.metrics.number;
//    console.log(number_count)
    if (number_count)
    {
        var s = new Suggestion();
        s.text = 'The data contains ' + (number_count / d.count * 100).toPrecision(3) + '% pure numerical values. Consider cleaning up the text values to convert it to numbers.';
        s.importance = 2;
        s.scope = 'String';
        s.class = 'tip';
        s.category = 'mixed-values';
        suggestions.push(s);
//        console.log(s);
    }

    return suggestions;
}

function isSorted(data)
{
//    console.log(data);
    var ascending = _.every(data, function (value, index, array) {

        var c = compare(array[index - 1], value);

        return index === 0 || c >= 0;
    });
    var descending = _.every(data, function (value, index, array) {
        var c = compare(array[index - 1], value);
        return index === 0 || c <= 0;
    });

    var result = ascending ? 1 : descending ? -1 : 0;
//    console.log(ascending + '\t' + descending + '\t' + result);
    return result;
}

function compare(v1, v2)
{
    var c;
    if (v1 == null || v2 == null) {
        c = 0
    }
    else if (typeof (v2) === 'number' && typeof (v1) === 'number')
    {
        c = v2 - v1;
        c = c < 0 ? -1 : c > 0 ? 1 : 0;
    }

    else if (typeof (v2) === 'string' && typeof (v1) === 'string')
        c = String(v1).localeCompare(String(v2));
    else if (moment.isMoment(v2) && moment.isMoment(v1))
        c = v2.isAfter(v1) ? 1 : v2.isBefore(v1) ? -1 : 0;
    else {
//        console.log(typeof (v1));
//        console.log(v1);
        c = 0;

    }
    return c;
}

function checkInterval(data)
{
    console.log('checking intervals')
    var interval, equalInterval, isContiguous;
    var suggestions = []
    if (data.type === 'date')
    {

    }
    else if (data.type === 'integer' || data.type === 'float')
    {
        console.log('checking number intervals')
        var cleanData = data.cleanData;
        if (cleanData.length > 1) {
            interval = cleanData[1] - cleanData[0];
            equalInterval = _.every(cleanData, function (v, i, a) {
                return i === 0 || (v - a[i - 1] === interval);

            });
            isContiguous = interval === 1;
        }
    }
    console.log(interval)
    if (equalInterval)
    {
        var s = new Suggestion();
        s.text = 'The data values change in equal intervals of ' + interval + '.';
        s.importance = 2;
        s.scope = 'General';
        s.class = 'tip';
        s.category = 'equal-intervals';
        suggestions.push(s);
    }
    if (isContiguous)
    {
        var s = new Suggestion();
        s.text = 'The data values are contiguous.';
        s.importance = 2;
        s.scope = 'General';
        s.class = 'tip';
        s.category = 'contiguous values';
        suggestions.push(s);
    }
    console.log(suggestions)
    return suggestions
}