/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


$(document).on('ready', function() {
    initTest();
})
var TEXT_FILES = [
//    'data/mindwave_data_dump.csv',
    'data/fl-ballot-2000.csv'
//    'data/faa-ontime-sept2001.csv',
//    'data/oakland-budget.csv',
//    'data/plane-crashes.ascii.csv'
//    'data/ufo-sightings.csv'
]
var readers = {};
function initTest()
{
    print(TEXT_FILES)
    console.log(TEXT_FILES)
    _.each(TEXT_FILES, function(filename) {
        var reader = new MetaReader()
//        console.log(filename)
//        print(filename)
        reader.loadFromCSV(filename);
        readers[filename] = reader;
        testBoxChart(reader, 'alpha');
    });
    console.log(readers);

}

function testBoxChart(reader, column)
{
    var MRC = new MetaReaderCharts();
    _.each(reader.statistics, function(col) {
        if (col.type == 'float' || col.type == 'integer')
            box = new MRC.box('#charts', {title:col.title}, col.quartiles, col.mean)
    })
//    console.log(reader.statistics[column])
//    var MRC = new MetaReaderCharts();
//    box = new MRC.box('#charts', null, reader.statistics[column].quartiles, reader.statistics[column].mean)
//    console.log(box);
}

function testBoxChartDC(reader, column)
{
    console.log(dc);
    var chart = dc.boxPlot("#box-test")
    console.log(reader);
//            pie = dc.pieChart("#pie-chart");


    var ndx = crossfilter(reader.columns)
    console.log(ndx);
    var values = ndx.dimension(function(d) {
//        console.log(d);
        return d;
    });

    var group = values.group().reduce
//    console.log(colDimension);
//    var runGroup = colDimension.group(),
//            experimentDimension = ndx.dimension(function(d) {
//                return "exp-" + d.Expt;
//            })

    /*  ,  speedArrayGroup = experimentDimension.group().reduce(
     function(p, v) {
     p.push(v.Speed);
     return p;
     },
     function(p, v) {
     p.splice(p.indexOf(v.Speed), 1);
     return p;
     },
     function() {
     return [];
     }
     );*/

    chart
            .width(768)
            .height(480)
            .margins({top: 10, right: 50, bottom: 30, left: 50})
            .dimension(experimentDimension)
            .group(speedArrayGroup)
            .elasticY(true)
            .elasticX(true);



    dc.renderAll();
    /*
     var i=0;
     setInterval(function() {
     runDimension.filterAll();
     runDimension.filter([i++,21]);
     dc.renderAll();
     }, 2000);
     */

}

function print(str)
{

    if (str && $.isArray(str))
    {
//        console.log(str);
        if (str.length > 0) {
            str = _.reduce(str, function(memo, s, i, l) {
//            console.log(memo+'\t'+s);
                return memo + s + ',';
            });
        } else
            str = '';
//        console.log(str);
    }
    else if (str && $.isPlainObject(str))
    {
        var str2 = '';
        _.each(str, function(value, key) {
            str2 += '(' + key + ',' + value + ')<br>'
        })
        str = str2;

    }
    str = (str) ? str : '';
    $('#console').append('<p>' + str.replace('\n', '<br>').replace('\t', '&nbsp;&nbsp;&nbsp;&nbsp;') + '</p>');
}