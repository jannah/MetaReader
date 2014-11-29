/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var MetaReaderCharts = function ()
{
    var MRC = {};
    var TOOLTIP_LIMIT = 1500;
    MRC.options = function ()
    {
        return {
            width: $('#content').width() - 60,
            height: 200,
            margin:
                    {
                        top: 10,
                        bottom: 10,
                        left: 20,
                        right: 20
                    },
            axisHeight: 30,
            axisWidth: 30,
            title: '',
            id: '',
            xAxisLimit: 40
        };
    };
    function loadOptions(options)
    {
        var opts = new MRC.options();
        _.each(options, function (value, key)
        {
            opts[key] = value
        });
        //        console.log(opts);
        return opts;
    }
    MRC.box = function (target, options, quartiles, mean, outliers)
    {
        var chart = {};
        var min = quartiles[0],
                max = quartiles[4],
                median = quartiles[2],
                iqr = quartiles[3] - quartiles[1]
                ,
                lowerOutliers = _.filter(outliers, function (d, i) {
                    return +d > quartiles[3];
                }),
                higherOutliers = _.filter(outliers, function (d, i) {
                    return +d < quartiles[3];
                });
        //        console.log(target);
        chart.options = loadOptions(options);
        addChartFrame(target, chart.options.title, chart.options.id);
        var new_target = '#' + chart.options.id + '-frame';
        var w = chart.options.width - chart.options.margin.left - chart.options.margin.right,
                h = chart.options.height - chart.options.margin.top - chart.options.margin.bottom,
                ah = h - chart.options.axisHeight,
                ch = ah - 2.5 * chart.options.axisHeight;
        //        console.log(w+'\t'+h)
        var svg = d3.select(new_target).append('svg').attr(
                {
                    id: chart.options.id,
                    class: 'mrc-chart mrc-box',
                    width: chart.options.width,
                    height: chart.options.height
                }).append('g').attr("transform", "translate(" + chart.options.margin.left + "," + chart.options.margin.top + ")");
        /* var chartTitle = svg.append('text').text(chart.options.title).attr(
         {
         class: 'box-title',
         'text-anchor': 'middle',
         x: w / 2,
         y: 0,
         dy: '1em'
         });*/
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
        var plot = svg.append("g").attr(
                {
                    'class': 'plot',
                    "transform": "translate(0," + (chart.options.axisHeight) + ")"
                });
        var center = plot.append("line", "rect").attr(
                {
                    class: "center",
                    x1: xScale(min),
                    y1: ch / 2,
                    x2: xScale(max),
                    y2: ch / 2
                });
        var whiskers = plot.selectAll('.whisker').data([min, max]).enter().append("line").attr(
                {
                    class: "whisker",
                    x1: function (d)
                    {
                        //                        console.log(xScale(d));
                        return xScale(d);
                    },
                    y1: 0,
                    x2: function (d)
                    {
                        return xScale(d);
                    },
                    y2: ch
                });
        var irqBox = plot.append('rect').attr(
                {
                    class: "irq-box",
                    width: xScale(quartiles[3]) - xScale(quartiles[1]),
                    height: ch - .2 * ch,
                    x: xScale(quartiles[1]),
                    y: .1 * ch
                });
        var medianLine = plot.append('line').attr(
                {
                    class: 'median-line',
                    x1: xScale(median),
                    y1: 0,
                    x2: xScale(median),
                    y2: ch
                });
        var meanLine = plot.append('line').attr(
                {
                    class: 'mean-line',
                    x1: xScale(mean),
                    y1: 0,
                    x2: xScale(mean),
                    y2: ch
                });
        //        format =  d3.format("04d"   )
        var labels = plot.selectAll('text').data([min, quartiles[1], median, quartiles[3], max]).enter().append('text').text(function (d, i)
        {
            return d;
        }).attr(
                {
                    class: 'chart-label',
                    'text-anchor': 'middle',
                    x: function (d)
                    {
                        return xScale(d);
                    },
                    y: function (d, i)
                    {
                        return i % 2 * ch;
                    },
                    dy: function (d, i)
                    {
                        return ((i % 2 === 0) ? -1 : 1) + 'em';
                    }
                }).classed('mean-label', function (d, i)
        {
            return i == 5;
        });
        var meanLabel = plot.append('text').text('mean=' + mean).attr(
                {
                    class: 'chart-label mean-label',
                    x: xScale(mean),
                    y: ch,
                    dy: "2em",
                    'text-anchor': 'middle'
                });
        var outlierText = plot.append('g');
        if (lowerOutliers.length > 0)
            outlierText.append('text')
                    .attr({
                        class: 'outlier-text',
                        x: 0, y: ch,
                        dy: "2em",
                        'text-anchor': 'start'
                    }).text('<<<' + lowerOutliers.length + ' outlier' + ((lowerOutliers.length > 1) ? 's' : ''))
        if (higherOutliers.length > 0)
            outlierText.append('text')
                    .attr({
                        class: 'outlier-text',
                        x: w, y: ch,
                        dy: "2em",
                        'text-anchor': 'end'
                    }).text(higherOutliers.length + ' outlier' + ((higherOutliers.length > 1) ? 's' : '') + ' >>>')

        addImage(new_target);
        return chart;
        ;
    };
    MRC.lollipop = function (target, options, data)
    {
        return MRC.histogram(target, options, data, true);
    }
    MRC.histogram = function (target, options, data, use_lollipop)
    {


        // console.log(target)
        var chart = {};
        chart.options = loadOptions(options);
        var w = chart.options.width - chart.options.margin.left - chart.options.margin.right,
                h = chart.options.height - chart.options.margin.top - chart.options.margin.bottom,
                ah = h - 2 * chart.options.axisHeight,
                aw = w - chart.options.axisWidth,
                ch = ah,
                cw = aw;
        addChartFrame(target, chart.options.title, chart.options.id);
        var new_target = '#' + chart.options.id + '-frame';
        var max = d3.max(data, function (d)
        {
            //            console.log(d);
            return d.values;
        });
        var min = d3.min(data, function (d)
        {
            return d.values;
        });
        min = (min < 0) ? min : 0;
        //        console.log(min + '\t' + max)
        var svg = d3.select(new_target).append('svg').attr(
                {
                    id: chart.options.id,
                    class: 'mrc-chart mrc-histogram',
                    width: chart.options.width,
                    height: chart.options.height
                }).append('g').attr("transform", "translate(" + chart.options.margin.left + "," + chart.options.margin.top + ")");
        var averageKeyLength = d3.sum(data, function (d, i) {
//                console.log(d.key);
            return (d.key + '').length;
        }) / data.length;
        var xScale = d3.scale.ordinal().rangeBands([0, cw], .1, 1)
                .domain(data.map(function (d)
                {
                    return d.key;
                }));
        var yScale = d3.scale.linear().domain([min, max]).range([ch, 0]);
        var xLabels = _.map(data, function (d, i)
        {
            return d.key;
        });
        var xAxis = d3.svg.axis().scale(xScale).orient('bottom')
                .tickValues(xLabels);
        var yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(5);
        var xAxisGroup = svg.append('g').attr(
                {
                    class: "x axis",
                    width: w,
                    height: chart.options.axisHeight
                }).append("g").attr("transform", "translate(" + chart.options.axisWidth + "," + (ah) + ")").call(xAxis)
                .selectAll("text")
                .style("text-anchor", "start")
                .attr("dx", ".5em")
                .attr("dy", ".15em")
                .attr("transform", function (d) {
                    return "rotate(45)";
                });
        xAxisGroup.append('text').attr(
                {
                    class: 'x axis-title',
                    'text-anchor': 'middle',
                    x: w / 2,
                    y: 35
                }).text('');
        //        console.log(ch);
        var yAxisGroup = svg.append('g').attr(
                {
                    class: "y axis",
                    width: chart.options.axisWidth,
                    height: ch
                }).append("g").attr("transform", "translate(" + chart.options.axisWidth + "," + 0 + ")").call(yAxis);
        ;
        var bw = aw / data.length;
        var spacing = (bw > 10) ? 2 : 0;
        if (use_lollipop)
        {
            var lolli = svg.append("g")
                    .attr("transform", "translate(" + chart.options.axisWidth + "," + 0 + ")").selectAll('lollipop')
                    .data(data).enter().append('g')
            lolli.append('line')
                    .attr(
                            {
                                class: 'lollipop line',
                                width: function ()
                                {
                                    return xScale.rangeBand();
                                },
                                height: function (d)
                                {
                                    var v = ah - yScale(d.values);
                                    return v;
                                },
                                x1: function (d, i)
                                {
                                    return xScale(d.key) + xScale.rangeBand() / 2;
                                },
                                x2: function (d, i)
                                {
                                    return xScale(d.key) + xScale.rangeBand() / 2;
                                },
                                y1: function (d, i)
                                {
                                    return yScale(d.values);
                                },
                                y2: function (d, i)
                                {
                                    return ah;
                                },
                                'data-key': function (d)
                                {
                                    return d.key;
                                },
                                'data-value': function (d)
                                {
                                    return d.values;
                                }
                            })
            lolli.append('circle')
                    .attr({
                        class: 'lollipop circle',
                        cx: function (d, i)
                        {
                            return xScale(d.key) + xScale.rangeBand() / 2;
                        },
                        cy: function (d, i)
                        {
                            return yScale(d.values);
                        },
                        r: (xScale.rangeBand() / 2 < 10) ? xScale.rangeBand() / 2 : 10,
                        'data-key': function (d)
                        {
                            return d.key;
                        },
                        'data-value': function (d)
                        {
                            return d.values;
                        }
                    });
            if (data.length < TOOLTIP_LIMIT)
            {
                lolli.selectAll('.lollipop.line')
                        .classed('svg-tooltip', true)
                        .attr({
                            'data-toggle': "tooltip",
                            'data-placement': "top",
                            'title': function (d, i)
                            {
                                return ('<span class="chart-tooltip-key"><span class="tooltip-caption">' + chart.options.title + '</span>' + '<span class="tooltip-value"> ' + d.key + '</span><br>' + '<span class="tooltip-caption">Frequency</span>' + '<span class="tooltip-value"> ' + d.values + '</span>');
                            }
                        })
                lolli.selectAll('.lollipop.circle')
                        .classed('svg-tooltip', true)
                        .attr({
                            'data-toggle': "tooltip",
                            'data-placement': "top",
                            'title': function (d, i)
                            {
                                return ('<span class="chart-tooltip-key"><span class="tooltip-caption">' + chart.options.title + '</span>' + '<span class="tooltip-value"> ' + d.key + '</span><br>' + '<span class="tooltip-caption">Frequency</span>' + '<span class="tooltip-value"> ' + d.values + '</span>');
                            }
                        })
            }

        }
        else
        {
            var bars = svg.append('g')
                    .attr("transform", "translate(" + chart.options.axisWidth + "," + 0 + ")").selectAll('bars')
                    .data(data).enter().append('rect')
                    .attr(
                            {
                                class: 'bar histogram svg-tooltip',
                                width: function ()
                                {
                                    return xScale.rangeBand();
                                },
                                height: function (d)
                                {
                                    var v = ah - yScale(d.values);
                                    return v;
                                },
                                x: function (d, i)
                                {
                                    return xScale(d.key);
                                },
                                y: function (d, i)
                                {
                                    return yScale(d.values);
                                },
                                'data-key': function (d)
                                {
                                    return d.key;
                                },
                                'data-value': function (d)
                                {
                                    return d.values;
                                }
                            });
            if (data.length < TOOLTIP_LIMIT)
            {
                bars.classed('svg-tooltip', true)
                        .attr({
                            'data-toggle': "tooltip",
                            'data-placement': "top",
                            'title': function (d, i)
                            {
                                return ('<span class="chart-tooltip-key"><span class="tooltip-caption">' + chart.options.title + '</span>' + '<span class="tooltip-value"> ' + d.key + '</span><br>' + '<span class="tooltip-caption">Frequency</span>' + '<span class="tooltip-value"> ' + d.values + '</span>');
                            }
                        });
            }
        }
        svg.select('.x.axis g').selectAll('.tick.major').style('display', function (d, i)
        {
//             console.log(d);
            return (data.length < chart.options.xAxisLimit) ? 'block' : (i % Math.ceil(data.length / chart.options.xAxisLimit) === 0) ? 'block' : 'None';
        });
        /* Sorting actions        */
        var frame = $('#' + chart.options.id + '-frame');
        frame.prepend(getSortButton(chart.options.id + '-sort'));
        $('#' + chart.options.id + '-sort li').on('click', function (d)
        {

            // console.log(d);
            var self = $(this),
                    order = self.attr('data-order');
            // console.log(self.attr('class'))
            $('#' + chart.options.id + '-btn .glyphicon').attr('class', self.attr('class'))
            // console.log(self);
            change(order);
            // var sortTimeout = setTimeout(function()
            // {
            //     d3.select("input").property("checked", true).each(change);
            // }, 2000);

            function change(order)
            {
                // clearTimeout(sortTimeout);

                // Copy-on-write since tweens are evaluated after a delay.
                data = data.sort(function (a, b)
                {
                    if (order === 'a1')
                        return d3.ascending(a.key, b.key);
                    else if (order === 'a2')
                        return d3.descending(a.key, b.key);
                    else if (order === 'n1')
                        return d3.ascending(a.values, b.values);
                    else
                        return d3.descending(a.values, b.values);
                });
                var x0 = xScale.domain(data.map(function (d) {
                    return d.key;
                }))
                        .copy();
//                xAxis.tickValues(xLabels);
                var transition = svg.transition().duration(500),
                        delay = function (d, i)
                        {
                            return i * 10;
                        };
                if (use_lollipop)
                {
                    transition.selectAll(".lollipop.line").delay(delay)
                            .attr({
                                x1: function (d) {
                                    return xScale(d.key) + xScale.rangeBand() / 2;
                                },
                                x2: function (d) {
                                    return xScale(d.key) + xScale.rangeBand() / 2;
                                }
                            });
                    transition.selectAll('.lollipop.circle').delay(delay)
                            .attr('cx', function (d) {
                                return xScale(d.key) + xScale.rangeBand() / 2;
                            });
                }
                else
                {
                    transition.selectAll(".bar")
                            .delay(delay)
                            .attr("x", function (d)
                            {
                                // if (order === 'a1' || order === 'a2')
                                return x0(d.key);
                                // else return x0(d.values);
                            });
                }

                transition.select(".x.axis")
                        .call(xAxis)
                        .selectAll("g")
                        .delay(delay);
                var displayValues = {}
                _.forEach(data, function (d, i) {
                    var val = (data.length < chart.options.xAxisLimit) ? 'block' : (i % Math.ceil(data.length / chart.options.xAxisLimit) === 0) ? 'block' : 'None';
                    displayValues[d.key] = val;
                })
//            console.log(displayValues);
                transition.select('.x.axis g').selectAll('.tick.major').style('display', function (d, i)
                {
                    return displayValues[d];
                }).delay(delay);
                ;
            }

        });
        addImage(new_target);
        return chart;
    };
    MRC.spectrum = function (target, options, data)
    {
        //        var MRC = new MetaReader();
        data = getSequence(data);
        var chart = {};
        chart.options = loadOptions(options);
        addChartFrame(target, chart.options.title, chart.options.id);
        var new_target = '#' + chart.options.id + '-frame';
        var w = chart.options.width - chart.options.margin.left - chart.options.margin.right,
                h = chart.options.height - chart.options.margin.top - chart.options.margin.bottom,
                ah = h - 2 * chart.options.axisHeight,
                aw = w - chart.options.axisWidth,
                ch = ah,
                cw = aw;
        var max = d3.max(data, function (d)
        {
            //            console.log(d);
            return d.end;
        });
        var min = d3.min(data, function (d)
        {
            return d.start;
        });
        var min_value = d3.min(data, function (d)
        {
            return d.value;
        });
        var max_value = d3.max(data, function (d)
        {
            return d.value;
        });
        //        console.log(min + '\t' + max)
        var svg = d3.select(new_target).append('svg').attr(
                {
                    id: chart.options.id,
                    class: 'mrc-chart mrc-spectrum',
                    width: chart.options.width,
                    height: chart.options.height
                }).append('g').attr("transform", "translate(" + chart.options.margin.left + "," + chart.options.margin.top + ")");
        /* var chartTitle = svg.append('text').text(chart.options.title).attr(
         {
         class: 'chart-title',
         'text-anchor': 'middle',
         x: w / 2,
         y: 0,
         dy: '1em'
         });*/
        var xScale = d3.scale.linear().domain([min, max]).range([0, cw]);
        var colors = d3.scale.category20();
        //        var yScale = d3.scale.linear().domain([0, max]).range([ch, 0]);
        var xLabels = _.map(data, function (d)
        {
            return d.start;
        });
        //        console.log(xLabels);
        var xAxis = d3.svg.axis().scale(xScale).orient('bottom');
        //        var yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(5);
        var xAxisGroup = svg.append('g').attr(
                {
                    class: "x axis",
                    width: w,
                    height: chart.options.axisHeight
                }).append("g").attr("transform", "translate(" + chart.options.axisWidth + "," + (ah + chart.options.axisHeight) + ")").call(xAxis).append('text').attr(
                {
                    class: 'x axis-title svg-tooltip',
                    'text-anchor': 'middle',
                    x: w / 2,
                    y: 35,
                    'data-toggle': "tooltip",
                    'data-placement': "top",
                    'title': function (d, i)
                    {
                        return ('<span class="chart-tooltip-value">Original order of elements in dataset</span>');
                    }
                }).text('index');
        //        console.log(ch);
        var rects = svg.append('g').attr("transform", "translate(" + chart.options.axisWidth + "," + (chart.options.axisHeight) + ")").selectAll('bars').data(data).enter().append('rect').attr(
                {
                    class: 'bar spectrum-sqaure svg-tooltip',
                    width: function (d)
                    {
                        return xScale(d.frequency);
                    },
                    height: function (d)
                    {
                        return ah;
                    },
                    x: function (d, i)
                    {
                        return xScale(d.start);
                    },
                    y: function (d, i)
                    {
                        return 0;
                    },
                    'data-key': function (d)
                    {
                        return d.value;
                    },
                    'data-value': function (d)
                    {
                        return d.frequency;
                    },
                    'data-toggle': "tooltip",
                    'data-placement': "top",
                    'title': function (d, i)
                    {
                        return ('<span class="chart-tooltip-key"><span class="tooltip-caption">' + chart.options.title + '</span>' + '<span class="tooltip-value"> ' + d.value + '</span><br>' + '<span class="tooltip-caption">Frequency</span>' + '<span class="tooltip-value"> ' + d.frequency + '</span>');
                    }
                })
                .style(
                        {
                            fill: function (d, i)
                            {
                                return getColorGradient(min_value, max_value, d.value, colors, chart.options.colorRange);
                                //                        return color;
                            }
                        });
        var lw = aw * .25;
        var legend_count = 20;
        var legend_data = [];
        for (var i = 0; i < legend_count; i++)
            legend_data.push(i);
        var legend = svg.append('g').attr(
                {
                    class: 'spectrum-legend',
                    transform: "translate(" + (chart.options.margin.left + aw * .75) + "," + (h) + ")"
                });
        legend.selectAll('rect').data(legend_data).enter()
                .append('rect')
                .attr({
                    class: 'legend-rect',
                    x: function (d, i) {
                        return 10 + (lw - 20) * i / legend_count;
                    }, y: 0, height: ah / 5, width: lw / legend_count
                })
                .style({
                    fill: function (d, i) {
                        return getColorGradient(0, legend_count, i, colors, chart.options.colorRange);
                    }
                });
        legend.append('text').text(min_value).attr({x: 8, y: 5, 'text-anchor': 'end'});
        legend.append('text').text(max_value).attr({x: lw - 8, y: 5});
        addImage(new_target);
        return chart;
    };
    MRC.spectrumLine = function (target, options, data, drawLine)
    {
        var chart = {};
        chart.options = loadOptions(options);
        var w = chart.options.width - chart.options.margin.left - chart.options.margin.right,
                h = chart.options.height - chart.options.margin.top - chart.options.margin.bottom,
                ah = h - 2 * chart.options.axisHeight,
                aw = w - chart.options.axisWidth,
                ch = ah,
                cw = aw;
        addChartFrame(target, chart.options.title, chart.options.id);
        var new_target = '#' + chart.options.id + '-frame';
        var max = d3.max(data, function (d)
        {
            //            console.log(d);
            return d;
        });
        var min = d3.min(data, function (d)
        {
            return d;
        });
        min = (min < 0) ? min : 0;
        var svg = d3.select(new_target).append('svg').attr(
                {
                    id: chart.options.id,
                    class: 'mrc-chart mrc-spectrum',
                    width: chart.options.width,
                    height: chart.options.height
                }).append('g').attr("transform", "translate(" + chart.options.margin.left + "," + chart.options.margin.top + ")");
        var pattern = addColorPattern(svg);
        /*var chartTitle = svg.append('text').text(chart.options.title).attr(
         {
         class: 'chart-title',
         'text-anchor': 'middle',
         x: w / 2,
         y: 0,
         dy: '1em'
         });*/
        var xScale = d3.scale.linear().domain([0, data.length]).range([0, cw]);
        var colors = d3.scale.category20();
        var yScale = d3.scale.linear().domain([min, max]).range([ch, 0]);
        //        var xLabels = _.map(data, function(d) {
        //            return d;
        //        });
        //        console.log(xLabels);
        var xAxis = d3.svg.axis().scale(xScale).orient('bottom');
        var yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(5);
        var xAxisGroup = svg.append('g').attr(
                {
                    class: "x axis",
                    width: w,
                    height: chart.options.axisHeight
                }).append("g").attr("transform", "translate(" + chart.options.axisWidth + "," + (ah + chart.options.axisHeight) + ")").call(xAxis).append('text').attr(
                {
                    class: 'x axis-title svg-tooltip',
                    'text-anchor': 'middle',
                    x: w / 2,
                    y: 35,
                    'data-toggle': "tooltip",
                    'data-placement': "top",
                    'title': function (d, i)
                    {
                        return ('<span class="chart-tooltip-value">Original order of elements in dataset</span>');
                    }
                }).text('index');
        //        console.log(ch);
        var yAxisGroup = svg.append('g').attr(
                {
                    class: "y axis",
                    width: chart.options.axisWidth,
                    height: ch
                }).append("g").attr("transform", "translate(" + chart.options.axisWidth + "," + (chart.options.axisHeight) + ")").call(yAxis).append('text').attr(
                {
                    class: 'x axis-title',
                    'text-anchor': 'middle',
                    x: 10,
                    y: -10,
                    'text-anchor': 'middle'
                }).text('value');
        var dataMap = _.map(data, function (d, i)
        {
            return {
                index: i,
                value: d
            };
        });
        //        console.log(dataMap)
        var validValues = [],
                currentList = [];
        _.forEach(dataMap, function (d)
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
        // console.log(validValues);
        var missingValuesFlat = _.filter(dataMap, function (d)
        {
            return _.isNull(d.value) | _.isUndefined(d.value);
        });
        // console.log(missingValuesFlat);

        var missingValues = [];
        if (missingValuesFlat.length > 0)
        {
            var currentIndex = startIndex = missingValuesFlat[0].index;
            _.forEach(missingValuesFlat, function (d, i)
            {
                if (i > 0 && (d.index - currentIndex) > 1)
                {
                    // console.log(d.index + '\t' + currentIndex)
                    missingValues.push(
                            {
                                start: startIndex,
                                run: currentIndex - startIndex
                            });
                    startIndex = d.index;
                }
                currentIndex = d.index;
            })

            missingValues.push(
                    {
                        start: startIndex,
                        run: currentIndex - startIndex
                    });
            // console.log(missingValues);
        }


        var line = d3.svg.line().x(function (d, i)
        {
            return xScale(d.index);
        }).y(function (d, i)
        {
            return yScale(d.value);
        });
        var dataLine = svg.append('g')
                .attr("transform", "translate(" + chart.options.axisWidth + "," + (chart.options.axisHeight) + ")");
        if (drawLine)
        {
            _.forEach(validValues, function (d, i)
            {
                dataLine.append("path").datum(d).attr(
                        {
                            "class": "line spectrum-line",
                            "d": line
                        });
            });
        }

        var markers = dataLine.append('g').attr('class', 'markers').selectAll('.line-markers').data(data).enter().append('circle').attr(
                {
                    cx: function (d, i)
                    {
                        return xScale(i);
                    },
                    cy: function (d, i)
                    {
                        return yScale(d);
                    },
                    r: function (d, i)
                    {
                        max = data.length / aw;
                        max = (max > 2) ? max : 2;
                        return (20 > max) ? max : 20;
                    },
                    'class': 'marker line-marker svg-tooltip',
                    'data-toggle': "tooltip",
                    'data-placement': "top",
                    'title': function (d, i)
                    {
                        return ('<span class="chart-tooltip-value">' + d + '</span>');
                    }
                });
        var bh = aw / data.length;
        var missing = dataLine.append('g').attr('class', 'missing-values').selectAll('.missing-bar')
                .data(missingValues).enter().append('rect')
                .attr(
                        {
                            class: 'bar missing-bar svg-tooltip',
                            x: function (d)
                            {
                                return xScale(d.start);
                            },
                            y: 0,
                            height: ah,
                            width: function (d)
                            {
                                return d.run * bh
                            },
                            fill: pattern,
                            'data-toggle': "tooltip",
                            'data-placement': "top",
                            'title': function (d, i)
                            {
                                return ('<span class="chart-tooltip-value">' + 'Missing' + '</span>');
                            },
                        });
        addImage(new_target);
        return chart;
    };
    MRC.timeSeries = function (target, options, data) {
//        console.log('draing timeseries')
        var chart = {};
        chart.options = loadOptions(options);
        var w = chart.options.width - chart.options.margin.left - chart.options.margin.right,
                h = chart.options.height - chart.options.margin.top - chart.options.margin.bottom;
        addChartFrame(target, chart.options.title, chart.options.id);
        var new_target = '#' + chart.options.id + '-frame';
        $(new_target).addClass('mrc-rickshaw')
//                .width(chart.options.width).height(chart.options.height);
        var rschart = new Rickshaw.Graph({
            element: document.querySelector(new_target),
            renderer: 'line',
            width: w,
            height: h,
            series: [{
                    data: data,
                    color: 'steelblue',
                    name: 'Records'
                }]
        });
        var axes = new Rickshaw.Graph.Axis.Time({graph: rschart});
        var y_axis = new Rickshaw.Graph.Axis.Y({
            graph: rschart,
            orientation: 'left',
            tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
            element: document.getElementById('y_axis'),
        });
        var hoverDetail = new Rickshaw.Graph.HoverDetail({
            graph: rschart,
        });
        rschart.render();
//        addImage(new_target);
        return chart;
    };
    function getColorGradient(min, max, value, colors, colorRange)
    {
        if (typeof (value) == 'undefined' || value == null || value === '')
        {

            //            console.log(value);
            return '#000';
        }
        else if (isNaN(Number(value)))
        {
            colors = (colors) ? colors : d3.scale.category20();
            return colors(value);
        }
        else
        {
            value = Number(value);
            if (!colorRange)
                colorRange = ["rgb(201,222,150)", "rgb(138,182,107)", "rgb(46,127,50)"]
            var inner_scale = d3.scale.linear().domain([min, max]).range([0, 1]);
            // var outer_scale = d3.scale.linear().domain([0, 0.5, 1]).interpolate(d3.interpolateRgb).range(["red", "yellow", "green"]);
            var outer_scale = d3.scale.linear().domain([0, .44, 1]).interpolate(d3.interpolateRgb).range(colorRange);
            var color = outer_scale(inner_scale(value));
            //            console.log(min + '\t' + max + '\t' + value + '\t' + color);
            return color;
        }
    }
    ;
    function addColorPattern(svg)
    {
        // console.log(svg.select('defs'))
        var defs = (svg.select('defs').empty()) ? svg.append('defs') : svg.select('defs');
        // console.log(defs)
        defs.append('pattern').attr(
                {
                    id: 'pattern-stripe',
                    width: 6,
                    height: 6,
                    patternUnits: 'userSpaceOnUse',
                    patternTransform: 'rotate(45)',
                }).append('rect').attr(
                {
                    id: 'pattern-fill',
                    width: 2,
                    height: 6,
                    transform: "translate(0,0)"
                });
        defs.append('pattern').attr(
                {
                    id: 'pattern-stripe-hover',
                    width: 6,
                    height: 6,
                    patternUnits: 'userSpaceOnUse',
                    patternTransform: 'rotate(45)',
                }).append('rect').attr(
                {
                    id: 'pattern-fill',
                    width: 2,
                    height: 6,
                    transform: "translate(0,0)"
                });
        return 'url(#mask-stripe)';
    }

    function addChartFrame(target, title, id)
    {
        var frame = '<div id="' + id + '-frame" class="chart-frame"><div class="chart-title" contenteditable="True">' + title + '</div></div>'
        $(target).append(frame)
    }

    function getSortButton(id)
    {
        var b = '<div class="dropdown sort-dropdown hidden-print" id="' + id + '">' +
                '<button class="btn btn-default dropdown-toggle sort-button-dropdown" type="button" id="' + id + '-btn" data-toggle="dropdown" aria-expanded="true">' + '<span class="glyphicon glyphicon-sort-by-alphabet" aria-hidden="true"></span>' + '<span class="caret"></span></button>'
        b += '<ul class="dropdown-menu" role="menu" aria-labelledby="' + id + '-btn">';
        b += '<li data-order="a1" role="presentation">' + '<span class="glyphicon glyphicon-sort-by-alphabet" aria-hidden="true"></span></li>';
        b += '<li data-order="a2" role="presentation">' + '<span class="glyphicon glyphicon-sort-by-alphabet-alt" aria-hidden="true"></span></li>';
        b += '<li data-order="n1" role="presentation">' + '<span class="glyphicon glyphicon glyphicon-sort-by-attributes" aria-hidden="true"></span></li>';
        b += '<li data-order="n2" role="presentation">' + '<span class="glyphicon glyphicon glyphicon-sort-by-attributes-alt" aria-hidden="true"></span></li>';
        b += '</ul></div>';
        return b;
    }
    function addImage(target)
    {
        var svg = $(target).children('svg')[0];
        var chart = $(svg).clone()[0];
        var titles = $(chart).find('*[title]').each(function (d) {
            $(this).attr('title', '');
            $(this).attr('data-original-title', '');
//                    console.log($(this))
        });
        svgAsDataUri(chart, 1, function (uri) {
            d3.select(target).append('img').attr({'src': uri, class: 'print-image'});
        })
    }
    return MRC;
}
;
