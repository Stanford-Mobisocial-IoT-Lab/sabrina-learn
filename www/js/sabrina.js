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
});
