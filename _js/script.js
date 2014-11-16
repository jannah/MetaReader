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
    UPLOAD: {filename: 'templates/upload.html', target: '#upload'},
    NUMBERS: {filename: 'templates/numbers.html', target: ''},
    TEXT: {filename: 'templates/text.html', target: ''},
    DATE: {filename: 'templates/date.html', target: ''},
    NAV_ITEM: {filename: 'templates/nav_item.html', target: '#navigation>ul'},
    QUESTIONS: {filename: 'templates/questions.html', target: ''}
//    EXPERIMENT_INTRO: {filename: 'templtes.html', target: '#experiment-content'},
//    EXPERIMENT_UPLOAD: {filename: 'experiment_upload_data.html', target: '#experiment-content'}

};
var TEMPLATES_MAP = {'integer': 'NUMBERS', 'float': 'NUMBERS', 'string': 'TEXT', 'date': 'DATE'};
var data = [];
function init() {

    TEAMPLATES = loadTemplates(TEMPLATES, '/MetaReader');
    renderTemplate(TEMPLATES.UPLOAD, {files:TEXT_FILES})
//    load(TEXT_FILES[0]);

}
function load(filename)
{
    data = loadFile(filename);
    // console.log(data);
    showCards(data);
}
function loadFile(filename)
{

    var reader = new MetaReader();
    reader.loadFile(filename);

    return reader;
}


function showCards(data)
{
    _.each(data.statistics, function(d) {
//        console.log(d);
//        d = data.statistics['attention']
        renderTemplate(TEMPLATES.CARD, {data: d}, null, false, false);
        var target = '#card-' + d.id + ' .card-charts';
//        console.log(target);
        if (TEMPLATES_MAP[d.type])
        {

            var template = TEMPLATES[TEMPLATES_MAP[d.type]];
//            console.log(template);
            renderTemplate(template, {target: target, data: d}, target, false, false);
            loadQuestions(d);

        }

    });
    refreshNavigation();
    activateTooltips();
}

function loadQuestions(d)
{
    renderTemplate(TEMPLATES.QUESTIONS, {data: d}, '#' + d.id + '-questions', true, false);
    $('#' + d.id + '-questions .mr-tooltip').tooltip('hide');
    activateTooltips();
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
    $('#navigation>ul').empty();
//    var nav = $('#navigation ul');
    _.each(cards, function(card) {
        var id = $(card).attr('id');
        var title = $('#' + id + ' .card-title-text').text().trim();

        renderTemplate(TEMPLATES.NAV_ITEM, {target: '#' + id, title: title}, null, false, false);

    });
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
        $(target).append(template.render(args));
    }
//    $(target).trigger(BODY_CHANGE_EVENT);
}

function renameColumn(id, column)
{
 var title = $('#'+id).text();
 data.statistics[column].title = title;
// console.log(data.statistics[column].title);
 refreshNavigation()
}
function activateTooltips()
{

    $('.mr-tooltip').tooltip({html: true,
        'container': 'body',
        'placement': 'top'});
}
