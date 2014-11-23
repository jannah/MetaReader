jQuery.fn.redraw = function() {
    return this.hide(0, function() {
        $(this).show();
    });
};


$(document).on('ready', function() {
    init();
    activateTooltips();
});

var TEXT_FILES = [
    'data/test.csv',
    'data/NC-EST2013-AGESEX-RES.csv',
    'data/SCPRC-EST2013-18+POP-RES.csv',
    'data/calories.csv',
    'data/dma.csv',
    'data/elements.csv',
    'data/fortune500.csv',
    'data/migraine_i290_8.csv',
//    'data/test.xlsx',
    'data/mindwave_data_dump.csv',
    'data/titanic_raw.csv',
    'data/fl-ballot-2000.csv',
    'data/fl2000_flat.csv',
//    'data/faa-ontime-sept2001.csv',
    'data/oakland-budget.csv'
//    'data/plane-crashes.ascii.csv'
//    'data/ufo-sightings.csv'
];
var TEMPLATES = {
    CARD: {filename: 'templates/card.html', target: '#cards'},
    SAMPLES: {filename: 'templates/samples.html', target: '#side-menu>ul'},
    NUMBERS: {filename: 'templates/numbers.html', target: ''},
    TEXT: {filename: 'templates/text.html', target: ''},
    DATE: {filename: 'templates/date.html', target: ''},
    NAV_ITEMS: {filename: 'templates/nav_items.html', target: '#side-menu>ul'},
    NAV_ITEM: {filename: 'templates/nav_item.html', target: '#navigation'},
    QUESTIONS: {filename: 'templates/questions.html', target: ''},
    SUGGESTIONS: {filename: 'templates/suggestions.html', target: ''}
//    EXPERIMENT_INTRO: {filename: 'templtes.html', target: '#experiment-content'},
//    EXPERIMENT_UPLOAD: {filename: 'experiment_upload_data.html', target: '#experiment-content'}

};
var TEMPLATES_MAP = {'integer': 'NUMBERS', 'float': 'NUMBERS', 'string': 'TEXT', 'date': 'DATE'};
var data = [];

function init() {

    TEAMPLATES = loadTemplates(TEMPLATES, '/MetaReader');
    loadUploadForm();
    loadSamples();
//    load(TEXT_FILES[0]);

}

function loadUploadForm()
{


    $('.btn-file :file').on('fileselect', function(event, file, numFiles, label) {
        /*    console.log(file);
         console.log(numFiles);
         console.log(label);*/
//        console.log(file.getAsText('utf-8'))
        if (label.endsWith('.csv'))
        {
            var fs = loadFileStream(file, loadFromUpload);
        }
    });
    $(document).on('change', '.btn-file :file', function() {
        var input = $(this),
                numFiles = input.get(0).files ? input.get(0).files.length : 1,
                label = input.val().replace(/\\/g, '/').replace(/.*\//, ''),
                file = input.get(0).files[0];

        input.trigger('fileselect', [file, numFiles, label]);
    });

}

function loadSamples()
{
    renderTemplate(TEMPLATES.SAMPLES, {files: TEXT_FILES});
    $('#samples').siblings('a').collapse();
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
function loadSample(filename)
{
    data = loadFile(filename);
      $('#samples').collapse();
    console.log(data);
    render(data);
}
function loadFromUpload(file)
{
    data = loadFile(file);
    render(data);
}
function loadFile(file)
{
    
    resetPage();

    var reader = new MetaReader();
    reader.loadFile(file);
    return reader;
}
function resetPage()
{
    $('#cards').empty();
    data = {};
}
function render(data)
{
    showCards(data);

}
function showCards(data)
{
    $('#processing-progress-bar').show().attr('aria-valuenow', 0).attr('aria-valuemax', data.length);
    
    $('#page-title').text(data.title);
    $('#page-description').text(data.description);
    
    
    $('#header').show();
    _.each(data.statistics, function(d, i) {
//        console.log(d);
//        d = data.statistics['attention']

        $('#progress-name').text(d.name);
        $('#processing-progress-bar').attr('aria-valuenow', i);
        renderTemplate(TEMPLATES.CARD, {data: d}, null, false, false);
        var target = '#card-' + d.id + ' .card-charts';
//        console.log(target);
        if (TEMPLATES_MAP[d.type])
        {

            var template = TEMPLATES[TEMPLATES_MAP[d.type]];
//            console.log(template);
            renderTemplate(template, {target: target, data: d}, target, false, false);
            loadQuestions(d);
//            loadSuggestions(d);

        }

    });
    $('#progress-name').text('Completed');
    $('#processing-progress-bar').attr('aria-valuenow', data.length).hide();
    refreshNavigation();
    activateTooltips();
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

}

function removeQuestion(column, index)
{
//    console.log(index);
//    console.log(data.statistics[column].questions)
    data.statistics[column].questions.splice(index, 1);
//    console.log(data.statistics[column].questions)
    loadQuestions(data.statistics[column]);
}

function updateQuestion(column, index)
{
    var id = '#' + column + '-question-' + index + ' .question-text'
//    console.log($(id));
    var question = $(id).val();

//    console.log(question);
    data.statistics[column].questions[index] = question;
}


function refreshNavigation()
{
//    console.log('refreshing');
    var cards = $('.mrc-card');
    $('#nav-items').remove();
    renderTemplate(TEMPLATES.NAV_ITEMS, {cards:cards}, TEMPLATES.NAV_ITEMS.target, false, false)
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
function activateTooltips()
{

    $('.mr-tooltip').tooltip({html: true,
        'container': 'body',
        'placement': 'top'});

    $('.svg-tooltip').tooltip({html: true,
        'container': 'body',
        'placement': 'top'});
}
