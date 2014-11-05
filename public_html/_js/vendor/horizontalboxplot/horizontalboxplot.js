/* global d3 */
/* jshint bitwise: false */

// Inspired by http://informationandvisualization.de/blog/box-plot
d3.box = function() {
    var width = 1,
        height = 1,
        duration = 0,
        domain = null,
        value = Number,
        whiskers = boxWhiskers,
        quartiles = boxQuartiles,
        outlierData = null,
        tickFormat = null;

    function box(g) {
        g.each(function(d, i) {
            // sort the data objects by the value function
            d = d.sort(function(a, b) {
                if (value(a) > value(b)) {
                    return 1;
                }
                if (value(a) < value(b)) {
                    return -1;
                }
                if (value(a) === value(b)) {
                    return 0;
                }
            });

            var g = d3.select(this).attr('class', 'boxplot'),
                justVals = d.map(value),
                n = d.length,
                min = justVals[0],
                max = justVals[n - 1];

            // Compute quartiles. Must return exactly 3 elements.
            var quartileVals = justVals.quartiles = quartiles(justVals);

            // Compute whiskers. Must return exactly 2 elements, or null.
            var whiskerIndices = whiskers && whiskers.call(this, justVals, i),
                whiskerData = whiskerIndices && whiskerIndices.map(function(i) {
                    return d[i];
                });

            // Compute outliers. If no whiskers are specified, all data are 'outliers'.
            // The outliers are actual data objects, because I'm not concerned with transitions.
            outlierData = whiskerIndices ?
                d.filter(function(d, idx) {
                    return idx < whiskerIndices[0] || idx > whiskerIndices[1];
                }) : d.filter(function() {
                    return true;
                });

            // Compute the new x-scale.
            var xScale = d3.scale.linear()
                .domain(domain && domain.call(this, justVals, i) || [min, max])
                .range([0, width]);

            // Note: the box, median, and box tick elements are fixed in number,
            // so we only have to handle enter and update. In contrast, the outliers
            // and other elements are variable, so we need to exit them!
            // (Except this is a static chart, so no transitions, so no exiting)

            // Update center line: the horizontal line spanning the whiskers.
            var center = g.selectAll('line.center')
                .data(whiskerData ? [whiskerData] : []);

            center.enter().insert('line', 'rect')
                .attr('class', 'center-line')
                .attr('x1', function(d) {
                    return xScale(value(d[0]));
                })
                .attr('y1', height / 2)
                .attr('x2', function(d) {
                    return xScale(value(d[1]));
                })
                .attr('y2', height / 2);

            // whole innerquartile box. data attached is just quartile values.
            var q1q3Box = g.selectAll('rect.q1q3box')
                .data([quartileVals]);

            q1q3Box.enter().append('rect')
                .attr('class', 'box whole-box')
                .attr('y', 0)
                .attr('x', function(d) {
                    return xScale(d[0]);
                })
                .attr('height', height)
                .attr('width', function(d) {
                    return xScale(d[2]) - xScale(d[0]);
                });

            // add a median line median line.
            var medianLine = g.selectAll('line.median')
                .data([quartileVals[1]]);

            medianLine.enter().append('line')
                .attr('class', 'median')
                .attr('x1', xScale)
                .attr('y1', 0)
                .attr('x2', xScale)
                .attr('y2', height);

            // q1-q2 and q2-q3 boxes. attach actual data to these.
            var q1q2Data = d.filter(function(d) {
                return value(d) >= quartileVals[0] && value(d) <= quartileVals[1];
            });

            var q1q2Box = g.selectAll('rect.q1q2box')
                .data([q1q2Data]);

            q1q2Box.enter().append('rect')
                .attr('class', 'box half-box')
                .attr('y', 0)
                .attr('x', function(d) {
                    return xScale(value(d[0]));
                })
                .attr('width', function(d) {
                    return xScale(value(d[d.length - 1])) - xScale(value(d[0]));
                })
                .attr('height', height);

            var q2q3Data = d.filter(function(d) {
                return value(d) > quartileVals[1] && value(d) <= quartileVals[2];
            });

            var q2q3Box = g.selectAll('rect.q2q3box')
                .data([q2q3Data]);

            q2q3Box.enter().append('rect')
                .attr('class', 'box half-box')
                .attr('y', 0)
                .attr('x', function(d) {
                    return xScale(value(d[0]));
                })
                .attr('width', function(d) {
                    return xScale(value(d[d.length - 1])) - xScale(value(d[0]));
                })
                .attr('height', height);


            // Whiskers. Attach actual data object
            var whiskerG = g.selectAll('line.whisker')
                .data(whiskerData || [])
                .enter().append('g')
                .attr('class', 'whisker');

            whiskerG.append('line')
                .attr('class', 'whisker')
                .attr('x1', function(d) {
                    return xScale(value(d));
                })
                .attr('y1', height / 6)
                .attr('x2', function(d) {
                    return xScale(value(d));
                })
                .attr('y2', height * 5 / 6);

            whiskerG.append('text')
                .attr('class', 'label')
                .text(function(d) {
                    return Math.round(value(d));
                })
                .attr('x', function(d) {
                    return xScale(value(d));
                });

            whiskerG.append('circle')
                .attr('class', 'whisker')
                .attr('cx', function(d) {
                    return xScale(value(d));
                })
                .attr('cy', height / 2)
                .attr('r', 3);

            // Update outliers.
            var outlierG = g.selectAll('g.outlier')
                .data(outlierData)
                .enter().append('g')
                .attr('class', 'outlier');

            outlierG.append('circle')
                .attr('class', 'outlier')
                .attr('r', 5)
                .attr('cx', function(d) {
                    return xScale(value(d));
                })
                .attr('cy', height / 2);

            outlierG.append('text')
                .attr('class', 'label')
                .text(function(d) {
                    return value(d);
                })
                .attr('x', function(d) {
                    return xScale(value(d));
                });
        });
    }

    box.width = function(x) {
        if (!arguments.length) {
            return width;
        }
        width = x;
        return box;
    };

    box.height = function(x) {
        if (!arguments.length) {
            return height;
        }
        height = x;
        return box;
    };

    box.tickFormat = function(x) {
        if (!arguments.length) {
            return tickFormat;
        }
        tickFormat = x;
        return box;
    };

    box.duration = function(x) {
        if (!arguments.length) {
            return duration;
        }
        duration = x;
        return box;
    };

    box.domain = function(x) {
        if (!arguments.length) {
            return domain;
        }
        domain = x == null ? x : d3.functor(x);
        return box;
    };

    box.value = function(x) {
        if (!arguments.length) {
            return value;
        }
        value = x;
        return box;
    };

    box.whiskers = function(x) {
        if (!arguments.length) {
            return whiskers;
        }
        whiskers = x;
        return box;
    };

    box.quartiles = function(x) {
        if (!arguments.length) {
            return quartiles;
        }
        quartiles = x;
        return box;
    };

    // just a getter. no setting outliers.
    box.outliers = function() {
        return outlierData;
    };

    return box;
};

function boxWhiskers(d) {
    var q1 = d.quartiles[0],
        q3 = d.quartiles[2],
        iqr = (q3 - q1) * 1.5,
        i = -1,
        j = d.length;
    while (d[++i] < q1 - iqr);
    while (d[--j] > q3 + iqr);
    return [i, j];
}

function boxQuartiles(d) {
    return [
        d3.quantile(d, 0.25),
        d3.quantile(d, 0.5),
        d3.quantile(d, 0.75)
    ];
}