jQuery.fn.redraw = function() {
    return this.hide(0, function() {
        $(this).show();
    });
};


$(document).on('ready', function() {
    initMetaReader();
    activateTooltips();
});
var ROOT = document.URL.replace('index.html', '').replace('#', '');
var TEXT_FILES = {};
var TIMEWAIT = 100;
var TEMPLATES = {
    CARD: {filename: 'templates/card.html', target: '#cards'},
    SAMPLES: {filename: 'templates/samples.html', target: '#samples-items'},
    NUMBERS: {filename: 'templates/numbers.html', target: ''},
    TEXT: {filename: 'templates/text.html', target: ''},
    DATE: {filename: 'templates/date.html', target: ''},
    NAV_ITEMS: {filename: 'templates/nav_items.html', target: '#affix-nav'},
    NAV_ITEM: {filename: 'templates/nav_item.html', target: '#navigation'},
    QUESTIONS: {filename: 'templates/questions.html', target: ''},
    SUGGESTIONS: {filename: 'templates/suggestions.html', target: ''},
    INTRO: {filename: 'templates/intro.html', target: '#intro'}
//    EXPERIMENT_INTRO: {filename: 'templtes.html', target: '#experiment-content'},
//    EXPERIMENT_UPLOAD: {filename: 'experiment_upload_data.html', target: '#experiment-content'}

};
var TEMPLATES_MAP = {'integer': 'NUMBERS', 'float': 'NUMBERS', 'string': 'TEXT', 'date': 'DATE'};
var data = [];

function initMetaReader() {

    TEAMPLATES = loadTemplates(TEMPLATES, '/MetaReader');
    loadUploadForm();
    loadSamples();
    loadIntro();
    loadSpinner();
//    load(TEXT_FILES[0]);

}
function loadSpinner() {
    var spinner = new Spinner({color: 'white'}).spin();
    $('#loading').append(spinner.el);
}
function loadIntro()
{
    renderTemplate(TEAMPLATES.INTRO, {})
}
function hideIntro()
{
    $('#intro').hide();
}
function loadUploadForm()
{

    var counter = 0;
    var data = [];
    $('.btn-file :file').on('fileselect', function(event, file, numFiles, label) {
//           console.log(file);
//         console.log(numFiles);
//         console.log(label);
//        console.log(file.getAsText('utf-8'))
        console.log('loading file ' + file.name);
        Papa.parse(file, {
            // base config to use for each file
            header: true,
            step: function(results, handle) {
                counter++;
                $('#row-counter').text(counter);
//                if(counter<10) console.log(results);
                data.push.apply(data, results.data)
//                console.log(handle);
//                console.log(counter)
//                
//                console.log("Row data:", results.data);
//                console.log("Row errors:", results.errors);

            }
            ,
            error: function(err, file, inputElem, reason)
            {
                console.log('upload error')
                // executed if an error occurs while loading the file,
                // or if before callback aborted for some reason
            }
            ,
            complete: function(results, f)
            {
                counter = 0;
                results.data = data;
//                console.log(data);
                loadFileData(results, file)
            }
        });
        /* if (label.endsWith('.csv'))
         {
         var fs = loadFileStream(file, loadFromUpload);
         */
    });
    $(document).on('change', '.btn-file :file', function() {
        var input = $(this),
                numFiles = input.get(0).files ? input.get(0).files.length : 1,
                label = input.val().replace(/\\/g, '/').replace(/.*\//, ''),
                file = input.get(0).files[0];
        showLoading('Loading ' + file.name)
        window.setTimeout(function() {
            input.trigger('fileselect', [file, numFiles, label]);
        }, TIMEWAIT);

    });
}
function pausecomp(millis)
{
    console.log('pausing')
    var date = new Date();
    var curDate = null;

    do {
        curDate = new Date();
    }
    while (curDate - date < millis);
    console.log('resuming')
}
function showLoading(text)
{
//console.log('SHOW INDICATOR')
    changeLoadingText(text)
    $('#loading').show();

}
function changeLoadingText(text)
{
    $('#loading label').text(text);
}
function hideLoading()
{
    $('#loading').slideUp(1000);
}
function loadSamples()
{
    $.getJSON("config/samples.json", function(data) {
//        console.log(data);
        TEXT_FILES = data;
        renderTemplate(TEMPLATES.SAMPLES, {files: TEXT_FILES});
    });

//    $('#samples').siblings('a').collapse();
//    $('.dropdown-toggle').dropdown();
}
function loadFileData(results, file)
{

    console.log('upload completed');
//    console.log(results)
//    console.log(file)
    data = loadFile(file, results);
    render(data);

}
function loadFileStream(file, cb)
{
//    var reader = new FileReader();
    console.log('reading file ' + file.name);
    var reader = new FileReader();
    reader.onload = function(event) {
        var contents = event.target.result;
        file['contents'] = contents;
//        console.log(file);
        cb(file);
    };
    reader.onerror = function(event) {
        console.error("File could not be read! Code " + event.target.error.code);
    };
    reader.readAsText(file);
}
function loadSample(filename, configFileName)
{
    showLoading('Loading Sample')

    window.setTimeout(function() {
        var config = loadJSONFile(configFileName)
        data = loadFile(filename, null, config);

        $('#samples').collapse();

        render(data);
    }, TIMEWAIT);

}
function loadFromUpload(file)
{
    data = loadFile(file);

    render(data);
}
function loadJSONFile(filename)
{

    var jqxhr = $.ajax({
        url: filename,
        type: 'get',
        dataType: 'json',
//        cache: false,
        async: false
    });
//    console.log(jqxhr);
//    console.log(jqxhr.responseJSON);
    return jqxhr.responseJSON;
}
function loadFile(file, results, config)
{

    resetPage();
    hideIntro();
    var reader = new MetaReader();
    reader.loadFile(file, results, config);
    return reader;
}
function resetPage()
{
    $('#cards').empty();
    data = {};
}
function render(data)
{
    changeLoadingText('Rendering')
    window.setTimeout(function(){
        showCards(data);
    }, 100)
    
}
function showCards(data)
{
    var objectLimit = 200000;
    $('#processing-progress-bar').show().attr('aria-valuenow', 0).attr('aria-valuemax', data.length);
    $('#page-title').text(data.title);
    $('#page-description').text(data.description);
    $('#header').show();
    var imageMode = data.columnCount * data.columnLength > objectLimit;
    console.log('est. object count =' + data.columnCount + ' *' + data.columnLength
            + '=' + data.columnCount * data.columnLength)
    if (imageMode)
        alert('using image mode because there are too many objects')
    var i = 1
    _.forEach(data.statistics, function(d) {
        console.log('rendering ' + d.title + '(' + (i++) + '/' + data.columnCount + ')');
//        d = data.statistics['attention']

        $('#progress-name').text(d.title);
        $('#processing-progress-bar').attr('aria-valuenow', i);
        renderTemplate(TEMPLATES.CARD, {data: d, imageMode: imageMode}, null, false, false);
        var target = '#card-' + d.id + ' .card-charts';
//        console.log(target);
        if (TEMPLATES_MAP[d.type])
        {

            var template = TEMPLATES[TEMPLATES_MAP[d.type]];
//            console.log(template);
            renderTemplate(template, {target: target, data: d, imageMode: imageMode}, target, false, false);
            loadQuestions(d);
//            loadSuggestions(d);

        }

    });
    $('#progress-name').text('Completed');
    $('#processing-progress-bar').attr('aria-valuenow', data.length).hide();
    refreshNavigation();
    activateModal();
    activateTooltips();
    hideLoading();

}
function loadSuggestions(d)
{
//    console.log(d.suggestions)
    console.log($('#' + d.id + '-suggestions').text())
    renderTemplate(TEMPLATES.SUGGESTIONS, {suggestions: d.suggestions}, +'#' + d.id + '-suggestions', true, false);
}
function loadQuestions(d)
{
    renderTemplate(TEMPLATES.QUESTIONS, {data: d}, '#' + d.id + '-questions', true, false);
    var badge = '#' + d.id + '-tabs>.questions-tab>a>.label-as-badge';
//    console.log($(badge));
    $(badge).text(d.questions.length);
    $('#' + d.id + '-questions .mr-tooltip').tooltip('hide');
//    activateTooltips();
}


function addQuestion(column)
{
//    console.log(column);

    data.statistics[column].questions.push('');
//    console.log(data.statistics[column])
    loadQuestions(data.statistics[column]);
    refreshPrintQuestions(column);

}

function removeQuestion(column, index)
{
//    console.log(index);
//    console.log(data.statistics[column].questions)
    data.statistics[column].questions.splice(index, 1);
//    console.log(data.statistics[column].questions)
    loadQuestions(data.statistics[column]);
    refreshPrintQuestions(column);

}

function updateQuestion(column, index)
{

    var id = '#' + data.statistics[column].id + '-question-' + index + ' .question-text'
//    console.log($(id));
    var question = $(id).val();
//    console.log(question);
    data.statistics[column].questions[index] = question;
    refreshPrintQuestions(column);
}
function refreshPrintQuestions(column)
{
    var id = '#' + data.statistics[column].id + '-questions-print';
    var qlist = $(id);
    qlist.empty();
    _.forEach(data.statistics[column].questions, function(q) {
        var qli = '<li class="print-question">' + q + '</li>'
        qlist.append(qli);

    })
}
function showData(columnName)
{

}
function renameDocument()
{
    var title = $('#page-title').text();
//    console.log(title);
    data.title = title;
}
function updatePageDescription()
{
    var desc = $('#page-description').val();
//    console.log(desc);
    $('#page-description-print').text(desc);
    data.description = desc;
}

function updateField(element, field, id)
{
    var val = $(element).val();
    data.statistics[id][field] = val;
}

function updateNotes(element, field, id, otherId)
{
    var val = $(element).val();
    data.statistics[id][field] = val;
    $(otherId).val(val);
}

function updateDescription(element, field, id, otherId)
{

    var val = $(element).val();
    data.statistics[id][field] = val;
    $(otherId).val(val);
}
function hideSuggestion(column, id, i, otherId)
{

    $(id).hide();
    $(otherId).hide();
    console.log('hiding suggestion ' + id)
    data.statistics[column].suggestions[i].show = false;
    var suggestionCount = _.filter(data.statistics[column].suggestions, function(d) {
        return d.show
    }).length;
    console.log(suggestionCount)
    $('#' + data.statistics[column].id + '-nav-suggestion-count').text(suggestionCount)
    $('#' + data.statistics[column].id + '-suggestion-count').text(suggestionCount)



}

function saveAsMarkdown()
{
    var md = data.toMarkdown();
    var blob = new Blob([md], {type: "text/plain;charset=utf-8"});
    saveAs(blob, data.filename + "README.md");
}

function saveConfigFile()
{
    var j = data.toJSON();
    console.log(j);
    var blob = new Blob([JSON.stringify(j)], {type: "text/plain;charset=utf-8"});
    saveAs(blob, data.filename + "_MRSESSION.json");
}
function saveAsPDF()
{
    var cards = $('.mrc-card');
    _.forEach(cards, function(card, i)
    {
        var chartFrames = $(card).find('.chart-frame')
        console.log(chartFrames);
        var images = _.forEach(chartFrames, function(frame, i) {
//            console.log(frame);
            var chart = $(frame).children('svg')[0];
            if (chart)
            {

//                   console.log($(chart).select('*'))
//                saveSvgAsPng(chart, 'chart.png', 1)
//                console.log(chart);
                var chart2 = $(chart).clone()[0];
//                console.log(chart2)
                var titles = $(chart2).find('*[title]').each(function(d) {
                    $(this).attr('titie', '');
                    $(this).attr('data-original-title', '');
//                    console.log($(this))
                })
//                console.log(chart2)
//                console.log(titles);
//                var chart2 = encodeURIComponent(chart)
//                var src = 'data:image/svg+xml;base64,' + window.btoa(chart);

//                console.log(src);
                svgAsDataUri(chart2, 1, function(uri) {
                    d3.select('#print-page').append('img').attr('src', uri);
                });
//                    console.log(uri);
//                    
//                    
//                    var canvas = document.querySelector("canvas"),
//                            context = canvas.getContext("2d");
                /*
                 var image = new Image;
                 image.src = uri;
                 image.onload = function() {
                 context.drawImage(image, 0, 0);
                 
                 //                        var a = document.createElement("a");
                 //                        a.download = "fallback.png";
                 //                        a.href = canvas.toDataURL("image/png");
                 //                        a.click();
                 };
                 });*/
            }
//            console.log(chart);
//            canvag('canvas', chart);
//            var canvas = document.getElementById('canvas');
//            var ctx = canvas.getContext('2d');
//            ctx.drawSvg(chart);
//            canvas.toDataURL('image/png');
        })
//       console.log(card)
    })
}

function refreshNavigation()
{
//    console.log('refreshing');
    var cards = $('.mrc-card');
    $('#navigation').remove();
    renderTemplate(TEMPLATES.NAV_ITEMS, {cards: cards}, TEMPLATES.NAV_ITEMS.target, false, false)
//    $("#navigation").on('affixed.bs.affix', function () {
//        alert("The navigation menu has been affixed. Now it doesn't scroll with the page.");
//    });
    var offset = $('#header-navigation').height() + 100;
//    console.log(offset);
    $('body').scrollspy({target: '#affix-nav', offset: offset});
//    $(window).off('.affix')
    $("#navigation").affix({
        offset: {
            top: offset,
            bottom: 0
        }});


//    var nav = $('#navigation ul');

}



function loadTemplates(templates, templatesURL)
{
//    console.log('loading templates ' + templates.length)
    templatesURL = (templatesURL) ? templatesURL : '';
    for (var template in templates)
    {
        // console.log(template);
        templates[template]['url'] = templatesURL + '/' + templates[template].filename;
        templates[template]['html'] = loadTemplate(templates[template].url);
        templates[template]['render'] = _.template(templates[template]['html']);
    }
    return templates;
}


function loadTemplate(filename)
{
    var jqxhr = $.ajax({url: filename, async: false});
    return jqxhr.responseText;
}

/*
 * Render a specific HTML template
 * @param {string} target target HTML element ID to render the template under
 * @param {Object} template template  from TEMPLATES
 * @param {Object} args arguments to pass to the templates
 * @param {boolean} replace whether to replace the existing contents of the target
 * @param {string} id the id to give the rendered template
 * @returns {undefined}
 */
function renderTemplate(template, args, target, replaceContent, replaceParent)
{
    target = (target) ? target : template.target;
    if (replaceContent)
    {
        $(target).empty().append(template.render(args));
    }
    else if (replaceParent)
    {
        console.log('replacing');
        if ($(target).length > 0)
        {
            $(target).replaceWith(template.render(args));
        }
        else
        {
            $(target).append(template.render(args));
        }
    }
    else
    {
        $(target).append(template.render(args)).redraw();
        /*$(target).queue(function() {
         $(this).append(template.render(args));
         $(this).dequeue();
         })*/
    }
//    console.log($(document.body).find(target));
    /*    while($(document.body).find(target).length===0)
     {
     continue;
     }
     */
//    while(!($(document.body).find(target)[0]))
//    $(target).flush();
//    $(target).trigger(BODY_CHANGE_EVENT);
}

function renameColumn(id, column)
{
    var title = $('#' + id).text();
    data.statistics[column].title = title;
// console.log(data.statistics[column].title);
    refreshNavigation()
}
function activateModal()
{
    $('#data-modal').on('show.bs.modal', function(event) {
        var button = $(event.relatedTarget) // Button that triggered the modal
        var column = button.data('column') // Extract info from data-* attributes
        // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
        // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
        var modal = $(this)
        console.log(column)
        modal.find('.modal-title').text('Showing raw data for [' + column + ']');
        var content = '<table class="table table-striped">' +
                '<tr><td>#</td><td>' + column + '</td></tr>' +
                _.map(data.statistics[column].data, function(d, i) {
                    return '<tr><td>' + (i + 1) + '</td><td>' + d + '</td></tr>';
                }).join('') + '</table>'
        modal.find('.modal-body').html(content)
    })
}
function activateTooltips()
{

    $('.mr-tooltip').tooltip({html: true,
        'container': 'body',
        'placement': 'top'});
    $('.mr-tooltip-np').tooltip({html: true,
        'container': 'body'});
    $('.svg-tooltip').tooltip({html: true,
        'container': 'body',
        'placement': 'top'});
}
