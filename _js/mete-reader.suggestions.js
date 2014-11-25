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
        s.text = 'The data contains ' + d.countUnique + ' unique values out of ' + d.count+'. This column might contain categorical data.';
        s.importance = 2;
        s.scope = 'General';
        s.class = 'tip';
        s.category = 'categorical-values';
        suggestions.push(s);
//        console.log(s);
    }

    if (d.count === (d.countUnique+d.invalidValues))
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
    if(d.countUnique===2)
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
    if (d.outliers.length>0)
    {
        var s = new Suggestion();
        s.text = 'The data contains ' + d.outliers.length + ' statistical outliers (+-1.5 * InnerQuartileRange).';
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