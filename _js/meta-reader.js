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
    mr.loadFile = function(csvFilePath)
    {
        mr.filename = csvFilePath;
        var csv = loadFromFile(csvFilePath);
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

    function fixTitle(t)
    {
        var rep = [' ', ',', '#', '.', '$', '(', ')', '_', '[', ']', '{', '{', '\\', '/', '+', '=', '%', '@', '^', '&']
        _.each(rep, function(i)
        {
//            console.log(i);
            t = str.replace(new RegExp(i, '-'), replace);

        });

        console.log(t);
        return t;
    }

    function escapeRegExp(string) {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\\s])/g, "-");
    }
    var ObjectList = function(data, title) {
        var self = {};
        self.title = title;
        self.columnName= title;
        self.id = escapeRegExp(self.columnName);
        console.log(self.id);
        self.notes = '';
        self.description = '';
        self.questions = [];
        self.suggestions = [];
        self.data = _.clone(data);
        self.rawData = _.clone(data);
        data = cleanData(data);
        self.uniqueValues = d3.set(self.data).values();
//    console.log(self.uniqueValues);
        self.countUnique = self.uniqueValues.length;

        self.count = data.length;



        self.prepData = function() {
            self.sortedData = _.clone(self.data).sort(d3.ascending);
            self.cleanData = _.filter(self.sortedData, function(d) {
                return !checkNull(d);
            });
            self.frequencyDistribution = getFreqDist(self.cleanData);
            self.spectrum = getSequence(self.data);
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

    function getSequence(data)
    {
        var spectrum = [];
        var currentItem = {start: 0, end: 0, frequency: 0, value: data[0]};
        _.each(data, function(d, i) {
            if (d !== currentItem.value)
            {
                currentItem.end = i;
                currentItem.frequency = currentItem.end - currentItem.start;
                spectrum.push(_.clone(currentItem));
                currentItem.start = i;
                currentItem.value = d;
            }
        });
        currentItem.end = data.length;
        currentItem.frequency = currentItem.end - currentItem.start;
        spectrum.push(_.clone(currentItem));
        return spectrum;
    }


    function loadFromFile(filePath)
    {
        console.log(filePath);
        if (filePath.slice(-3) === 'csv' || filePath.slice(-3) === 'txt')
            return loadCSVFile(filePath);
        else if (filePath.slice(-3) === 'xls')
        {
            return loadExcelFile(filePath, 'xls');
        }
        else if (filePath.slice(-4) === 'xlsx')
        {
            return loadExcelFile(filePath, 'xlsx');
        }
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
    /*console.log('load from excel');
     var url = "test_files/formula_stress_test_ajax.xlsx";
     var oReq = new XMLHttpRequest();
     oReq.open("GET", url, true);
     oReq.responseType = "arraybuffer";
     oReq.async = false;
     
     oReq.onload = function(e) {
     console.log('runnng excel')
     var arraybuffer = oReq.response;
     
     
     var data = new Uint8Array(arraybuffer);
     var arr = new Array();
     for (var i = 0; i != data.length; ++i)
     arr[i] = String.fromCharCode(data[i]);
     var bstr = arr.join("");
     
     var workbook
     
     if (version === 'xls')
     workbook = XLS.read(bstr, {type: "binary"});
     else
     workbook = XLSX.read(bstr, {type: "binary"});
     console.log(workbook);
     return workbook;
     };
     var workbook = oReq.send();*/


    /*
     * @param {type} excelFilePath
     * @param {type} version
     * @returns {unresolved}
     * 
     */
    function loadExcelFile(excelFilePath, version)
    {
        console.log('load from excel');
        var oReq = new XMLHttpRequest();
//        oReq.responseType = "arraybuffer";
        oReq.open("GET", excelFilePath, false);


        oReq.send(null);
//        console.log(oReq.responseText)
        var resp = oReq.response;
        console.log(typeof (resp))
        console.log('runnng excel')
        var arraybuffer = s2ab(resp);
        console.log(arraybuffer)
        console.log(typeof (arraybuffer))

        var data = new Uint8Array(arraybuffer[0]);
        console.log(data.length);
        var arr = new Array();
        for (var i = 0; i != data.length; ++i)
            arr[i] = String.fromCharCode(data[i]);
        var bstr = arr.join("");



//        var arr = new Array();
//        var bstr = ab2str(data);
        var workbook;

        if (version === 'xls')
            workbook = XLS.read(bstr, {type: "binary"});
        else
            workbook = XLSX.read(bstr, {type: "binary"});
        console.log(workbook);
        return workbook;

        /*
         if (version === 'xls')
         workbook = XLS.read(bstr, {type: "binary"});
         else
         workbook = XLSX.read(bstr, {type: "binary"});*/
        /* DO SOMETHING WITH workbook HERE */
//        console.log(workbook);
//        return workbook;
    }

    function ab2str(data) {
        var o = "", l = 0, w = 10240;
        for (; l < data.byteLength / w; ++l)
            o += String.fromCharCode.apply(null, new Uint16Array(data.slice(l * w, l * w + w)));
        o += String.fromCharCode.apply(null, new Uint16Array(data.slice(l * w)));
        return o;
    }

    function s2ab(s) {
        var b = new ArrayBuffer(s.length * 2), v = new Uint16Array(b);
        for (var i = 0; i != s.length; ++i)
            v[i] = s.charCodeAt(i);
        return [v, b];
    }

    function loadExcelFile4(url)
    {
//        var url = "test_files/formula_stress_test_ajax.xlsx";
        var oReq = new XMLHttpRequest();
        oReq.open("GET", url, true);
        oReq.responseType = "arraybuffer";

        oReq.onload = function(e) {
            var arraybuffer = oReq.response;

            /* convert data to binary string */
            var data = new Uint8Array(arraybuffer);
            console.log(data.length);
            var arr = new Array();
            for (var i = 0; i != data.length; ++i)
                arr[i] = String.fromCharCode(data[i]);
            var bstr = arr.join("");

            /* Call XLSX */
            var workbook = XLSX.read(bstr, {type: "binary"});
            console.log(workbook);

            /* DO SOMETHING WITH workbook HERE */
        }

        oReq.send();
    }
    function loadExcelFile3(excelFilePath, version)
    {
        console.log('load from excel');

        var jqxhr = $.ajax({
            url: excelFilePath,
            method: 'GET',
            responseType: "arraybuffer",
            processData: false,
            async: false
        });

        console.log(jqxhr.responseText);
        var arraybuffer = jqxhr.responseText;
//        console.log(typeof(arraybuffer))
        /* convert data to binary string */
        var data = new Uint8Array(arraybuffer);
        console.log(data);
        var arr = new Array();
        for (var i = 0; i != data.length; ++i)
            arr[i] = String.fromCharCode(data[i]);
        var bstr = arr.join("");
        console.log(bstr);
        var workbook;
        /* Call XLS */
        if (version === 'xls')
            workbook = XLS.read(arraybuffer, {type: "binary"});
        else
            workbook = XLSX.read(arraybuffer, {type: "base64"});
        /* DO SOMETHING WITH workbook HERE */
        console.log(workbook);
        return workbook;
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
