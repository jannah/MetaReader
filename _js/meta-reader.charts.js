/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var MetaReaderCharts = function() {
    var MRC = {};
    MRC.options = function() {
        return {
            width: 800,
            height: 200,
            margin: {
                top: 10,
                bottom: 10,
                left: 20,
                right: 20
            },
            axisHeight: 30,
            axisWidth: 30,
            title: '',
            id: ''
        };
    };

    function loadOptions(options) {
        var opts = new MRC.options();
        _.each(options, function(value, key) {
            opts[key] = value
        });
        //        console.log(opts);
        return opts;
    }
    MRC.box = function(target, options, quartiles, mean, title, outliers) {
        var chart = {};
        var min = quartiles[0],
                max = quartiles[4],
                median = quartiles[2],
                iqr = quartiles[3] - quartiles[1];
        //        console.log(target);
        chart.options = loadOptions(options);
        var w = chart.options.width - chart.options.margin.left - chart.options.margin.right,
                h = chart.options.height - chart.options.margin.top - chart.options.margin.bottom,
                ah = h - chart.options.axisHeight,
                ch = ah - 4 * chart.options.axisHeight;
        //        console.log(w+'\t'+h)
        var svg = d3.select(target).append('svg').attr({
            id: chart.options.id,
            class: 'mrc-chart mrc-box',
            width: chart.options.width,
            height: chart.options.height
        }).append('g').attr("transform", "translate(" + chart.options.margin.left + "," + chart.options.margin.top + ")");
        var chartTitle = svg.append('text').text(chart.options.title).attr({
            class: 'box-title',
            'text-anchor': 'middle',
            x: w / 2,
            y: 0,
            dy: '1em'
        });
        var range = max - min,
                min_chart = min - range / 10,
                //                min_chart = (min_chart <= 0 && min >= 0) ? 0 : min_chart,
                max_chart = max + range / 10;
        //                max_chart = (max_chart > 0 && max <= 0) ? 0 : max_chart;
        //        console.log(w);
        var xScale = d3.scale.linear().domain([min_chart, max_chart]).range([0, w]);
        var xAxis = d3.svg.axis().scale(xScale).orient('bottom');
        //        console.log(chart.options.title + '\t' + iqr + '\t' + xScale(iqr) + '\t' + min_chart + '\t' + max_chart)
        var axisGroup = svg.append('g').attr("class", "axis").attr("width", w).attr("height", 30).append("g").attr("transform", "translate(0," + ah + ")").call(xAxis);
        //        var center = svg.selectAll("line.center")
        //                .data([min,max]);
        var plot = svg.append("g").attr({
            'class': 'plot',
            "transform": "translate(0," + (2 * chart.options.axisHeight) + ")"
        });
        var center = plot.append("line", "rect").attr({
            class: "center",
            x1: xScale(min),
            y1: ch / 2,
            x2: xScale(max),
            y2: ch / 2
        });
        var whiskers = plot.selectAll('.whisker').data([min, max]).enter().append("line").attr({
            class: "whisker",
            x1: function(d) {
                //                        console.log(xScale(d));
                return xScale(d);
            },
            y1: 0,
            x2: function(d) {
                return xScale(d);
            },
            y2: ch
        })
        var irqBox = plot.append('rect').attr({
            class: "irq-box",
            width: xScale(quartiles[3]) - xScale(quartiles[1]),
            height: ch - .2 * ch,
            x: xScale(quartiles[1]),
            y: .1 * ch
        });
        var medianLine = plot.append('line').attr({
            class: 'median-line',
            x1: xScale(median),
            y1: 0,
            x2: xScale(median),
            y2: ch
        });
        var meanLine = plot.append('line').attr({
            class: 'mean-line',
            x1: xScale(mean),
            y1: 0,
            x2: xScale(mean),
            y2: ch
        });
        //        format =  d3.format("04d"   )
        var labels = plot.selectAll('text').data([min, quartiles[1], median, quartiles[3], max]).enter().append('text').text(function(d, i) {
            return d;
        }).attr({
            class: 'chart-label',
            'text-anchor': 'middle',
            x: function(d) {
                return xScale(d);
            },
            y: function(d, i) {
                return i % 2 * ch;
            },
            dy: function(d, i) {
                return ((i % 2 == 0) ? -1 : 1) + 'em';
            }
        }).classed('mean-label', function(d, i) {
            return i == 5
        });
        var meanLabel = plot.append('text').text('mean=' + mean).attr({
            class: 'chart-label mean-label',
            x: xScale(mean),
            y: ch,
            dy: "2em",
            'text-anchor': 'middle'
        });
        return chart;
        ;
    };
    MRC.histogram = function(target, options, data, title) {
        var chart = {};
        chart.options = loadOptions(options);
        var w = chart.options.width - chart.options.margin.left - chart.options.margin.right,
                h = chart.options.height - chart.options.margin.top - chart.options.margin.bottom,
                ah = h - 2 * chart.options.axisHeight,
                aw = w - chart.options.axisWidth,
                ch = ah,
                cw = aw;
        var max = d3.max(data, function(d) {
            //            console.log(d);
            return d.values;
        });
        var min = d3.min(data, function(d) {
            return d.values;
        });
        min = (min < 0) ? min : 0;
        //        console.log(min + '\t' + max)
        var svg = d3.select(target).append('svg').attr({
            id: chart.options.id,
            class: 'mrc-chart mrc-histogram',
            width: chart.options.width,
            height: chart.options.height
        }).append('g').attr("transform", "translate(" + chart.options.margin.left + "," + chart.options.margin.top + ")");
        var chartTitle = svg.append('text').text(chart.options.title).attr({
            class: 'chart-title',
            'text-anchor': 'middle',
            x: w / 2,
            y: 0,
            dy: '1em'
        });
        var xScale = d3.scale.linear().domain([0, data.length]).range([0, cw]);
        var yScale = d3.scale.linear().domain([min, max]).range([ch, 0]);
        var xLabels = _.map(data, function(d) {
            return d.key;
        });
        //        console.log(xLabels);
        var xAxis = d3.svg.axis().scale(xScale).orient('bottom').tickValues(xLabels).ticks(20);
        var yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(5);
        var xAxisGroup = svg.append('g').attr({
            class: "x axis",
            width: w,
            height: chart.options.axisHeight
        }).append("g").attr("transform", "translate(" + chart.options.axisWidth + "," + (ah + chart.options.axisHeight) + ")").call(xAxis).append('text').attr({
            class: 'x axis-title',
            'text-anchor': 'middle',
            x: w / 2,
            y: 35
        }).text('');
        //        console.log(ch);
        var yAxisGroup = svg.append('g').attr({
            class: "y axis",
            width: chart.options.axisWidth,
            height: ch
        }).append("g").attr("transform", "translate(" + chart.options.axisWidth + "," + (chart.options.axisHeight) + ")").call(yAxis);
        ;
        var bw = aw / data.length;
        if (bw < 10) {
            /*
             var area = d3.svg.area()
             .x(function(d, i) {
             return xScale(i);
             })
             .y0(function(d,i){
             return ah;
             })
             .y1(function(d) {
             return ah -yScale(d.values);
             });
             var areaChart = svg.append("path")
             .datum(data)
             .attr({
             class: 'area mr-tooltip',
             d: area,
             transform: "translate(" + chart.options.axisWidth + "," + 0 + ")"
             });*/
            /* var markers = svg.append('g').attr('class', 'area-markers').selectAll('.area-marker')
             .data(data).enter().append('rect')
             .attr({
             cx: function(d, i) {
             return xScale(i);
             },
             cy: function(d, i) {
             return yScale(d.values);
             },
             r: 1,
             'class': 'area-marker mr-tooltip',
             'data-toggle': "tooltip",
             'data-placement': "top",
             'title': function(d, i) {
             return '<span class="chart-tooltip-key">' + d.key + '</span><br>'
             + '<span class="chart-tooltip-value">' + d.values + '</span>';
             }
             
             })
             */
        }
        var spacing = (bw > 10) ? 2 : 0;
        var bars = svg.append('g').attr("transform", "translate(" + chart.options.axisWidth + "," + (chart.options.axisHeight) + ")").selectAll('bars').data(data).enter().append('rect').attr({
            class: 'bar histogram mr-tooltip',
            width: function() {
                var t = aw / data.length - spacing;
                return (t > 0) ? t : t + spacing;
            },
            height: function(d) {
                var v = ah - yScale(d.values);
                if (isNaN(v))
                    console.log(d);
                return v;
            },
            x: function(d, i) {
                var t = aw / data.length - spacing;
                var r = xScale(i) + spacing / 2;
                return (t > 0) ? r : r - 1;
            },
            y: function(d, i) {
                return yScale(d.values);
            },
            'data-key': function(d) {
                return d.key;
            },
            'data-value': function(d) {
                return d.values;
            },
            'data-toggle': "tooltip",
            'data-placement': "top",
            'title': function(d, i) {
                return '<span class="chart-tooltip-key"><span class="tooltip-caption">' + title + '</span>' + '<span class="tooltip-value"> ' + d.key + '</span><br>' + '<span class="tooltip-caption">Frequency</span>' + '<span class="tooltip-value"> ' + d.values + '</span>';
            }
        });
        //                .classed('hidden-bars', bw < 10);
        return chart;
    };
    MRC.spectrum = function(target, options, data, title) {
        var chart = {};
        chart.options = loadOptions(options);
        var w = chart.options.width - chart.options.margin.left - chart.options.margin.right,
                h = chart.options.height - chart.options.margin.top - chart.options.margin.bottom,
                ah = h - 2 * chart.options.axisHeight,
                aw = w - chart.options.axisWidth,
                ch = ah,
                cw = aw;
        var max = d3.max(data, function(d) {
            //            console.log(d);
            return d.end;
        });
        var min = d3.min(data, function(d) {
            return d.start;
        });
        var min_value = d3.min(data, function(d) {
            return d.value;
        });
        var max_value = d3.max(data, function(d) {
            return d.value;
        });
        //        console.log(min + '\t' + max)
        var svg = d3.select(target).append('svg').attr({
            id: chart.options.id,
            class: 'mrc-chart mrc-spectrum',
            width: chart.options.width,
            height: chart.options.height
        }).append('g').attr("transform", "translate(" + chart.options.margin.left + "," + chart.options.margin.top + ")");
        var chartTitle = svg.append('text').text(chart.options.title).attr({
            class: 'chart-title',
            'text-anchor': 'middle',
            x: w / 2,
            y: 0,
            dy: '1em'
        });
        var xScale = d3.scale.linear().domain([min, max]).range([0, cw]);
        var colors = d3.scale.category20();
        //        var yScale = d3.scale.linear().domain([0, max]).range([ch, 0]);
        var xLabels = _.map(data, function(d) {
            return d.start;
        });
        //        console.log(xLabels);
        var xAxis = d3.svg.axis().scale(xScale).orient('bottom');
        //        var yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(5);
        var xAxisGroup = svg.append('g').attr({
            class: "x axis",
            width: w,
            height: chart.options.axisHeight
        }).append("g").attr("transform", "translate(" + chart.options.axisWidth + "," + (ah + chart.options.axisHeight) + ")").call(xAxis).append('text').attr({
            class: 'x axis-title',
            'text-anchor': 'middle',
            x: w / 2,
            y: 35
        }).text('index');
        //        console.log(ch);
        var rects = svg.append('g').attr("transform", "translate(" + chart.options.axisWidth + "," + (chart.options.axisHeight) + ")").selectAll('bars').data(data).enter().append('rect').attr({
            class: 'bar spectrum-sqaure mr-tooltip',
            width: function(d) {
                return xScale(d.frequency);
            },
            height: function(d) {
                return ah;
            },
            x: function(d, i) {
                return xScale(d.start);
            },
            y: function(d, i) {
                return 0;
            },
            'data-key': function(d) {
                return d.value;
            },
            'data-value': function(d) {
                return d.frequency;
            },
            'data-toggle': "tooltip",
            'data-placement': "top",
            'title': function(d, i) {
                return '<span class="chart-tooltip-key"><span class="tooltip-caption">' + title + '</span>' + '<span class="tooltip-value"> ' + d.value + '</span><br>' + '<span class="tooltip-caption">Frequency</span>' + '<span class="tooltip-value"> ' + d.frequency + '</span>';
            }
        }).style({
            fill: function(d, i) {
                return getColorGradient(min_value, max_value, d.value, colors);
                //                        return color;
            }
        });
        var lw = aw * .4;
        var legend = svg.append('g').attr({
            class: 'spectrum-legend',
            transform: "translate(" + (chart.options.margin.left + aw * .6) + "," + 0 + ")"
        });
        return chart;
    }
    MRC.spectrumLine = function(target, options, data, title) {
        var chart = {};
        chart.options = loadOptions(options);
        var w = chart.options.width - chart.options.margin.left - chart.options.margin.right,
                h = chart.options.height - chart.options.margin.top - chart.options.margin.bottom,
                ah = h - 2 * chart.options.axisHeight,
                aw = w - chart.options.axisWidth,
                ch = ah,
                cw = aw;
        var max = d3.max(data, function(d) {
            //            console.log(d);
            return d;
        });
        var min = d3.min(data, function(d) {
            return d;
        });
        min = (min < 0) ? min : 0;
        var svg = d3.select(target).append('svg').attr({
            id: chart.options.id,
            class: 'mrc-chart mrc-spectrum',
            width: chart.options.width,
            height: chart.options.height
        }).append('g').attr("transform", "translate(" + chart.options.margin.left + "," + chart.options.margin.top + ")");
        var chartTitle = svg.append('text').text(chart.options.title).attr({
            class: 'chart-title',
            'text-anchor': 'middle',
            x: w / 2,
            y: 0,
            dy: '1em'
        });
        var xScale = d3.scale.linear().domain([0, data.length]).range([0, cw]);
        var colors = d3.scale.category20();
        var yScale = d3.scale.linear().domain([min, max]).range([ch, 0]);
        //        var xLabels = _.map(data, function(d) {
        //            return d;
        //        });
        //        console.log(xLabels);
        var xAxis = d3.svg.axis().scale(xScale).orient('bottom');
        var yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(5);
        var xAxisGroup = svg.append('g')
                .attr({
                    class: "x axis",
                    width: w,
                    height: chart.options.axisHeight
                })
                .append("g").attr("transform", "translate(" + chart.options.axisWidth + "," + (ah + chart.options.axisHeight) + ")")
                .call(xAxis)
                .append('text').attr({
            class: 'x axis-title',
            'text-anchor': 'middle',
            x: w / 2,
            y: 35
        }).text('index');
        //        console.log(ch);
        var yAxisGroup = svg.append('g')
                .attr({
                    class: "y axis",
                    width: chart.options.axisWidth,
                    height: ch
                })
                .append("g").attr("transform", "translate(" + chart.options.axisWidth + "," + (chart.options.axisHeight) + ")")
                .call(yAxis).append('text').attr({
            class: 'x axis-title',
            'text-anchor': 'middle',
            x: 10,
            y: h / 2,
            transform: "rotate(-90)"
        }).text('value');
        var dataMap = _.map(data, function(d, i) {
            return {
                index: i,
                value: d
            };
        });
//        console.log(dataMap)
        var validValues = [], currentList = []
        _.forEach(dataMap, function(d)
        {
            if (_.isNull(d.value) || _.isUndefined(d.value))
            {
                if (currentList.length > 0)
                    validValues.push(_.clone(currentList));
                currentList = [];
            }
            else
            {
                currentList.push(d);
            }
        });
        if (currentList.length > 0)
            validValues.push(_.clone(currentList));

        console.log(validValues);
        var missingValues = _.filter(dataMap, function(d) {
            return _.isNull(d.value) | _.isUndefined(d.value);
        });
        var line = d3.svg.line().x(function(d, i) {
            return xScale(d.index);
        }).y(function(d, i) {
            return yScale(d.value);
        });


        var dataLine = svg.append('g').attr("transform", "translate(" + chart.options.axisWidth + "," + (chart.options.axisHeight) + ")");

        _.forEach(validValues, function(d, i) {
            dataLine.append("path").datum(d).attr({
                "class": "line spectrum-line",
                "d": line
            });
        });

        var markers = dataLine.append('g').attr('class', 'markers').selectAll('.line-markers').data(data).enter().append('circle').attr({
            cx: function(d, i) {
                return xScale(i);
            },
            cy: function(d, i) {
                return yScale(d);
            },
            r: 1,
            'class': 'marker line-marker mr-tooltip',
            'data-toggle': "tooltip",
            'data-placement': "top",
            'title': function(d, i) {
                return '<span class="chart-tooltip-value">' + d + '</span>';
            }
        });

        console.log(missingValues);
        var bh = aw / data.length;
        var missing = dataLine.append('g').attr('class', 'missing-values')
                .selectAll('.missing-bar').data(missingValues)
                .enter().append('rect')
                .attr({
                    class: 'bar missing-bar mr-tooltip',
                    x: function(d) {
                        return xScale(d.index);
                    },
                    y: 0,
                    height: ah,
                    width: bh,
                    'data-toggle': "tooltip",
                    'data-placement': "top",
                    'title': function(d, i) {
                        return '<span class="chart-tooltip-value">' + 'Missing' + '</span>';
                    }
                });
        return chart;
    };

    function getColorGradient(min, max, value, colors) {
        if (_.isUndefined(value) || _.isNull(value) || value === '') {
            //            console.log(value);
            return '#000';
        } else if (isNaN(Number(value))) {
            colors = (colors) ? colors : d3.scale.category20();
            return colors(value);
        } else {
            value = Number(value);
            var inner_scale = d3.scale.linear().domain([min, max]).range([0, 1]);
            var outer_scale = d3.scale.linear().domain([0, 0.5, 1])
                    .interpolate(d3.interpolateRgb).range(["red", "yellow", "green"]);
            var color = outer_scale(inner_scale(value));
            //            console.log(min + '\t' + max + '\t' + value + '\t' + color);
            return color;
        }
    }
    ;
    return MRC;
};