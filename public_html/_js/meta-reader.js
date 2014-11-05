/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



function MetaReader() {

    var mr = {};
    var DEFAULT_PRECISION = 2;
    mr.columns = {};
    mr.statistics = {};
    mr.filename = '';
    mr.loadFromCSV = function(csvFilePath)
    {
        mr.filename = csvFilePath;
        var csv = loadCSVFile(csvFilePath);
//        console.log(csv);
        mr.columns = csvToColumns(csv);
        mr.statistics = process_columns(mr.columns);
    };
    mr.sort = {ascending: function(a, b) {
            var n1 = Number(a), n2 = Number(b);
//            console.log(a + '\t' + n1 + '\t' + b + '\t' + n2)
            if (checkNull(n1) || checkNull(n2))
            {
                console.log(a + '\t' + n1 + '\t' + b + '\t' + n2)
                return d3.ascending(a, b);
            } else
                return n1 - n2;
        }, descending: function(a, b) {
            var n1 = Number(a), n2 = Number(b);
//            console.log(a + '\t' + n1 + '\t' + b + '\t' + n2)
            if (checkNull(n1) || checkNull(n2))
                return d3.descending(a, b);
            else
                return n2 - n1;
        }};
    mr.reload = function(previous)
    {
        mr.columns = previous.columns;
        mr.statistics = previous.statistics;
    };


    var ObjectList = function(data, title) {
        var self = {};
        self.title = title;
        self.id = title.replace(' ', '-');
        self.notes = '';
        self.description = '';
        self.questions = [];
        self.suggestions = [];
        data = cleanData(data);
        self.data = data;
        self.uniqueValues = d3.set(self.data).values();
//    console.log(self.uniqueValues);
        self.countUnique = self.uniqueValues.length;

        self.count = data.length;
        self.data = data;


        self.prepData = function() {
            self.sortedData = self.data.sort(d3.ascending);
            self.cleanData = _.filter(self.sortedData, function(d) {
                return !checkNull(d);
            });
            self.frequencyDistribution = getFreqDist(self.cleanData);
        };
        self.prepData();
        return self;
    };
    var BIN_LIMIT = 10;
    var NumberList = function(data, title, precision) {
        precision = (precision) ? precision : DEFAULT_PRECISION;
//        console.log('precision = ' + precision)
        var self = ObjectList(data, title);
        _.each(self.data, function(d, i) {
            var n = Number(d), x;
            self.data[i] = (checkNull(n)) ? x : round(n, precision);
        });

        self.prepData();
        self.type = 'integer';
        self.precision = precision;
        var statPrecision = precision + 2;
        var stats = getStats(self.cleanData);
        self.sum = round(stats.sum, precision);
        self.mean = round(stats.mean, statPrecision);
        self.variance = round(stats.variance, statPrecision);
        self.stddev = round(stats.deviation, statPrecision);
        self.median = d3.median(self.sortedData);
        self.min = round(Number(d3.min(self.data)), precision);
        self.max = round(Number(d3.max(self.data)), precision);
        self.range = round(self.max - self.min, precision);
        self.quantiles = [];
        for (var i = 0, j = 1; i <= j; i += .1)
            self.quantiles.push(d3.quantile(self.cleanData, i));
        self.quartiles = [];
        for (var i = 0, j = 1; i <= j; i += .25)
            self.quartiles.push(d3.quantile(self.cleanData, i));
        self.interQuartileRange = self.quartiles[3] - self.quartiles[1];
        self.bins = (self.countUnique > BIN_LIMIT) ? BIN_LIMIT : self.countUnique;
        self.bins += 1;
        self.frequencyDistribution = getFreqDist(self.cleanData);
        self.frequencyDistributionBins = getFreqDistBins(self.cleanData, self.bins, self.min, self.range);
        self.zeros = d3.sum(self.data, function(item) {
            return (!item || item === 0) ? 1 : 0;
        });
        self.invalidValues = self.data.length - self.cleanData.length;
        self.frequencyDistributionSorted = _.sortBy(self.frequencyDistribution, function(d) {
            return d.values;
        });
        self.frequencyDistributionSorted.reverse();
        self.mode = getMode(self.frequencyDistributionSorted);

        return self;
    };
    var IntList = function(data, title) {
        var self = NumberList(data, title, 0);
        self.type = 'integer';
        return self;
    };
    var FloatList = function(data, title, precision) {
        var self = NumberList(data, title, precision);
        self.type = 'float';

        return self;
    };
    var StringList = function(data, title) {
        var self = {};
        var self = ObjectList(data, title);
        self.type = 'string';
        self.tokens = $.map(self.data, function(d) {
            return (!checkNull(d)) ? d.split(' ') : '';
        });
        self.word_count = d3.sum(self.tokens, function(d) {
            return (!checkNull(d)) ? d.length : 0;
        });

        self.average_word_count = self.word_count / self.count;
        self.average_word_length = d3.sum(self.data, function(d) {
            return (!checkNull(d)) ? d.replace(' ', '').length : 0;
        });

        return self;
    };
    var DateList = function(data, title) {
        var self = ObjectList(data, title);
        self.type = 'date';
        return self;
    };

    var DATA_TYPES = {'string': StringList, 'integer': IntList, 'float': FloatList, date: DateList};


    function detectDataType(items)
    {
//        var sample_limit = items;
        var new_items = _.filter(items, function(item, index) {
            return !checkNull(item);
        });
        var sample_limit = new_items.length;
        var sample = _.sample(new_items, sample_limit);
        var counts = {integer: 0, float: 0, date: 0, number: 0};
        _.each(new_items, function(item)
        {
            var n = Number(item);
            if (!isNaN(n))
            {
                counts.number += 1;
                if (item.indexOf('.') > -1)
                {
                    var f = parseFloat(item);
                    counts.float += 1;
                } else {
                    var integer = parseInt(item);
                    counts.integer += 1;
                }
            }
            if (item.length > 6)
            {

                var d = new Date(Date.parse(item));
//                console.log(d);
                counts['date'] += (!_.isDate(d)) ? 0 : 1;
            }
            /*else
             {
             console.log(n);
             var d = new Date(Date.parse(item));
             counts['date'] += (!_.isDate(d)) ? 0 : 1;
             }*/
        });

        var metrics = _.map(counts, function(value, key) {
            return {name: key, value: value};
        });
        var max = _.max(metrics, function(metric) {
            return metric.value;
        });
//        console.log(metrics);
//        console.log(max);
        if (max.value > new_items.length / 2)
        {
            if (max.name === 'number' || max.name === 'integer')
            {
                if (counts.float > 0)
                    return 'float';
                else
                    return 'integer';
            }
            else
                return max.name;
        }
        else
            return 'string';
    }

    function getFreqDist(data, precision)
    {
        precision = (precision) ? precision : DEFAULT_PRECISION;

        return d3.nest()
                .key(function(d) {
                    if (isNaN(Number(d)))
                        return d;
                    else
                        return round(Number(d), precision);
                }).sortKeys(mr.sort.ascending)
                .rollup(function(leaves) {
                    return leaves.length;
                })
                .entries(data);
    }
    function getFreqDistBins(sortedData, bins, min, range, precision)
    {
        precision = (precision) ? precision : DEFAULT_PRECISION;

        min = (min) ? min : Number(d3.min(sortedData));

        range = (range) ? range : Number(d3.max(sortedData)) - min;
        var binSize = range / bins;
        return d3.nest()
                .key(function(d) {
                    var key = parseInt((d - min) / binSize),
                            start = (min + key * binSize),
                            end = (min + (key + 1) * binSize);
                    
                    return round(start, precision);
                }).sortKeys(mr.sort.ascending)
                .rollup(function(leaves) {
                    return leaves.length;
                })
                .entries(sortedData);
    }

    function getStats(a)
    {
        var r = {sum: 0, count: 0, mean: 0, variance: 0, deviation: 0};
        r.count = a.length;
        r.sum = d3.sum(a);
        r.mean = r.sum / r.count;
        r.variance = d3.sum(a, function(d) {
            return Math.pow(d - r.mean, 2);
        }) / r.count;

        r.deviation = Math.sqrt(r.variance);
        return r;
    }

    function getMode(sortedFD)
    {
        var mode = [];
        var start = 0;
        while (checkNull(sortedFD[start].key))
        {
            start++;
        }
        for (var i = start, j = sortedFD.length; i < j
                && sortedFD[i].values === sortedFD[0].values;
                i++)
        {
//        console.log(sortedFD[i])
            if (!checkNull(sortedFD[i].key))
                mode.push({key: sortedFD[i].key, frequency: sortedFD[i].values});
        }
        return mode;
    }
    function loadCSVFile(csvFilePath)
    {
        var jqxhr = $.ajax({
            url: csvFilePath,
            async: false,
            dataType: "text",
            complete: function() {
                // call a function on complete 
            }
        });
        var csvd = jqxhr.responseText;
        var data = $.csv.toObjects(csvd);
//        console.log(data);
        return data;
    }

    function csvToColumns(csv)
    {
        var columns = {};
        for (var header in csv[0])
        {
            columns[header] = $.map(csv, function(item) {
                return item[header];
            });
        }
//        console.log(columns);
        return columns;
    }
    function process_columns(dataColumns)
    {
        console.log(dataColumns);
        var columns = {};
        _.each(dataColumns, function(items, header) {

            var dataType = detectDataType(items);
            var listType = DATA_TYPES[dataType];
//            console.log(listType);
            var column = listType(items, header);
//            console.log(column);
            columns[header] = column;
        });
        return columns;
    }

    function cleanData(data)
    {
        _.each(data, function(d, i) {
            var x;
            data[i] = (!checkNull(d)) ? d : x;
        });
        return data;
    }

    function checkNull(value)
    {
        return _.isUndefined(value) || isNaN(value) || _.isNull(value) || value === '' || value === 'None' || value === 'null';
    }

    return mr;


}
;

function round(n, p)
{
    return Math.round(n * Math.pow(10, p)) / Math.pow(10, p);
}
