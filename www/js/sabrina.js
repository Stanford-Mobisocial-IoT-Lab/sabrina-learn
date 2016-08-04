$(function() {
    function invocationFromJson(json) {
        var parsed = JSON.parse(json);
        if (parsed.action)
            return parsed.action.name.id;
        else if (parsed.trigger)
            return parsed.trigger.name.id;
        else if (parsed.query)
            return parsed.query.name.id;
        else
            return 'unknown';
    }
    function loadSuggestions() {
        // choose 5 kinds at random
        var chosen = [];
        for (var i = 0; i < 5; i++)
            chosen.push(THINGPEDIA_KINDS[Math.floor(Math.random() * THINGPEDIA_KINDS.length)]);

        // query the server for the examples
        $.getJSON('https://thingengine.stanford.edu/thingpedia/api/examples?base=0&key=' + chosen.join('+'), function(data) {
            var filtered = [];
            var invocations = {};

            console.log('data', data);

            if (data.length < 5) {
                filtered = data;
            } else {
                // pick 5 different examples
                var attempts = 0;
                while (filtered.length < 5 && attempts < 1000) {
                    attempts++;
                    var next = data[Math.floor(Math.random() * data.length)];
                    var invocation = invocationFromJson(next.target_json);
                    if (invocation in invocations)
                        continue;
                    invocations[invocation] = true;
                    filtered.push(next);
                }
            }

            var placeholder = $('#suggestions-placeholder');
            console.log('placeholder', placeholder);
            placeholder.empty();
            filtered.forEach(function(f) {
                placeholder.append($('<li>').text(f.utterance));
            });
        });
    }

    $('#more-suggestions').click(loadSuggestions);
    loadSuggestions();

    var sessionId = undefined;
    var utterance = undefined;
    var counter = 0;

    function accept(event) {
        event.preventDefault();

        var a = $(this);
        var url = 'http://pepperjack.stanford.edu:8400/learn?locale=en';
        url += '&sessionId=' + sessionId;
        url += '&q=' + encodeURIComponent(utterance);
        url += '&target=' + encodeURIComponent(a.attr('data-target-json'));

        $.getJSON(url, function(data) {
            $('#results').empty();
            if (data.error)
                console.log('Error in learning', data.error);
            else
                $('#counter').text(String(++counter));
        });
    }

    var FILTERED_STUFF = new Set(["yes", "debug", "never mind", "hello", "thanks", "cool", "no", "sorry", "list", "here",
        "at work", "at home", "false", "true"]);

    $('#form').submit(function(event) {
        event.preventDefault();

        utterance = $('#utterance').val();

        var url = 'http://pepperjack.stanford.edu:8400/query?locale=en&long=1';
        if (sessionId)
            url += '&sessionId=' + sessionId;
        url += '&q=' + encodeURIComponent(utterance);
        $.getJSON(url, function(data) {
            sessionId = data.sessionId;
            var results = $('#results');
            results.empty();
            data.candidates.forEach(function(result) {
                if (FILTERED_STUFF.has(result.canonical))
                    return;
                var link = $('<a href="#">')
                    .text(result.canonical.replace('`` ', '“').replace(' \'\'', '”'))
                    .addClass('result')
                    .attr('data-target-json', result.answer)
                    .click(accept);
                results.append($('<li>').append(link));
            });
        });
    });
});
