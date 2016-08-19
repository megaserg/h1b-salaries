/*
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * "The Beer-ware License":                                                    *
 * <sergey@serebryakov.info> wrote this stuff. As long as you retain this      *
 * notice you can do whatever you want with this stuff. If we meet some day,   *
 * and you think this stuff is worth it, you can buy me a beer in return.      *
 *                                                             -- megaserg     *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */


COMPANIES_LIST_ID = "ul#companiesList";
COMPANIES_INPUT_ID = "input#companiesInput";
JOBTITLES_LIST_ID = "ul#jobTitlesList";
JOBTITLES_INPUT_ID = "input#jobTitlesInput";
MINWAGE_INPUT_ID = "input#minimalWageInput";
MAXWAGE_INPUT_ID = "input#maximalWageInput";
RESEARCH_BUTTON_ID = "button#researchButton";
RESEARCH_FORM_ID = "form#researchForm";
SHORTEN_BUTTON_ID = "button#shortenButton";
SHORT_URL_DIV_ID = "div#shortUrlContainer";
SHORT_URL_INPUT_ID = "input#shortUrlInput";

SPECIAL_ALL_COMPANIES = "ALL_COMPANIES";
SPECIAL_ALL_JOBTITLES = "ALL_JOBTITLES";

ARRAY_ENTRIES_DELIMITER = ";";
SYNONYMS_DELIMITER = "/";
HASH_DELIMITER = "*";

LOGGER_URL = "logger.php";

SHORTENER_API_KEY = "AIzaSyCBCTkImCptskPomcBMJgnvb-fbcLK5YM0";
SHORTENER_API_URL = "https://www.googleapis.com/urlshortener/v1/url?key=";

DEFAULT_MINIMAL_WAGE = 50000;
DEFAULT_MAXIMAL_WAGE = 250000;

DATA_FILE_SIZE = 26431268;

companies = [
    {value: "ALL_COMPANIES", view: "All"},
    {value: "MICROSOFT", view: "Microsoft"},
    {value: "GOOGLE", view: "Google"},
    {value: "FACEBOOK", view: "Facebook"},
    {value: "TWITTER", view: "Twitter"},
    {value: "APPLE INC", view: "Apple"},
    {value: "CISCO SYSTEMS", view: "Cisco"},
    {value: "INTEL CORPORATION", view: "Intel"},
    {value: "ORACLE AMERICA", view: "Oracle"},
    {value: "ROCKET FUEL", view: "Rocket Fuel"},
    {value: "EVERNOTE", view: "Evernote"},
    {value: "YELP", view: "Yelp"},
    {value: "AMAZON", view: "Amazon"},
    {value: "DROPBOX", view: "Dropbox"},
    {value: "FOURSQUARE", view: "Foursquare"},
    {value: "JETBRAINS", view: "JetBrains"},
];

jobTitles = [
    {value: "ALL_JOBTITLES", view: "All"},
    {value: "SOFTWARE/ENGINEER/DEVELOPER/PROGRAMMER/ROCKET SCIENTIST", view: "Engineers"},
    {value: "SENIOR SOFTWARE/SENIOR ENGINEER/SENIOR DEVELOPER/SENIOR PROGRAMMER/SR. SOFTWARE/SR. ENGINEER/SR. DEVELOPER/SR. PROGRAMMER/SENIOR ROCKET SCIENTIST", view: "Senior engineers"},
    {value: "SCIENTIST", view: "Scientists"},
    {value: "MANAGER", view: "Managers"},
    {value: "ACCOUNTANT", view: "Accountants"},
    {value: "CONSULTANT", view: "Consultants"},
    {value: "CEO/CHIEF EXECUTIVE OFFICER", view: "CEOs"},
];

DICTIONARY_FILE_NAME = "h1b_2013-2016.dict";

COMPRESSED_DATA_FILES = 
    { 2013: "h1b_2013_filtered.csv.compressed"
    , 2014: "h1b_2014_filtered.csv.compressed"
    , 2015: "h1b_2015_filtered.csv.compressed"
    , 2016: "h1b_2016_filtered.csv.compressed"
    };


window.dataPoints = {};
window.dataFilesToLoad = 4; //COMPRESSED_DATA_FILES.length;


loadDictionary = function loadDictionary(callback) {
    $.get("/data/" + DICTIONARY_FILE_NAME)
        .done(function saveDictionary(dictionary) {
            window.dictionary = dictionary.split("\n");
            console.log(window.dictionary);
            callback(window.dictionary);
        });
};

receivedDictionary = function receivedDictionary(dict) {

    var loadCSV = function loadCSV(year, filename, drawAfterLoad) {
        var formatPercent = d3.format(".0%");

        d3.csv("/data/" + filename)
        // var objects = d3.csv("data/H-1B_FY13_Q4_filtered.csv")
            .row(function(entry) {
                     return {
                         employer: dict[entry.Employer],
                         jobTitle: dict[entry.JobTitle],
                         wageFrom: +dict[entry.WageFrom],
                         wageTo: +dict[entry.WageTo],
                         city: dict[entry.City],
                         state: dict[entry.State],
                         //jobField: entry.JobField
                     };
                 })
            .on("progress",
                function() {
                    var progress = d3.event.loaded / DATA_FILE_SIZE;
                    var meter = $(".progress-meter");
                    meter.text("Loading data (" + formatPercent(progress) + ")...");
                    //console.log(d3.event.loaded, DATA_FILE_SIZE, progress, formatPercent(progress));
                })
            .get(function(error, objects) {
                    console.log("Loaded year " + year);
                    window.dataPoints[year] = objects;
                    window.dataFilesToLoad--;
                    $(".progress-meter").hide();
                    $(RESEARCH_BUTTON_ID).show();
                    if (drawAfterLoad) {
                        initiateDraw();
                    }
                 });
    };

    for (var year in COMPRESSED_DATA_FILES) {
        var filename = COMPRESSED_DATA_FILES[year];
        loadCSV(year, filename, false);
    }
}



sortByWage = function(objects) {
    var compareWage = function(a, b) {
        return (a.wageFrom + a.wageTo) - (b.wageFrom + b.wageTo);
    };

    return objects.sort(compareWage);
}

getScales = function(series, dims, padding) {
    var getWage = function(o) { return (o.wageFrom + o.wageTo) / 2; };
    var minWageInRow = function(row) { return d3.min(row.objects, getWage); };
    var maxWageInRow = function(row) { return d3.max(row.objects, getWage); };
    var minWage = d3.min(series, minWageInRow),
        maxWage = d3.max(series, maxWageInRow);
    //var getNumber = function(o) {};
    //var maxNumberInRow = function(row) { return d3.max(row.objects, getNumber); };
    //var maxNumber = d3.max(series, maxNumberInRow);
    var wageMargin = (maxWage - minWage) * 0.03;
    var yDomain = [minWage - wageMargin, maxWage + wageMargin];
    var xDomain = [-0.01, 1.01];
    //var xDomain = [minWage - wageMargin, maxWage + wageMargin];
    //var yDomain = [0, maxNumber];
    var xRange = [padding.left, dims.width - padding.right];
    var yRange = [padding.top, dims.height - padding.bottom];
    var x = d3.scale.linear().domain(xDomain).range(xRange);
    var y = d3.scale.linear().domain(yDomain).range(yRange.reverse());
    var color = d3.scale.category20();
    return {"x": x, "y": y, "color": color};
};

plotAxis = function(svg, dims, padding, scales) {
    var formatWage = d3.format("$,d");
    var xAxis = d3.svg.axis()
        .ticks(10)
        .tickSize(dims.height - padding.vert)
        .tickFormat(function(d) { return Math.floor(d * 100) + "%"; })
        //.tickFormat(function(d) { return formatWage(d); })
        .scale(scales.x)
        .orient("bottom");
    var yAxis = d3.svg.axis()
        .ticks(10)
        .tickSize(dims.width - padding.hori)
        .tickFormat(function(d) { return formatWage(d); })
        //.tickFormat(function(d) { return Math.floor(d * 100) + "%"; })
        .scale(scales.y)
        .orient("left");
    svg.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + padding.top + ")")
        .call(xAxis);
    svg.append("svg:g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (dims.width - padding.right) + ",0)")
        .call(yAxis);
};

plotLegend = function(svg, dims, scales, series) {
    var n = series.length;

    var legend = svg.selectAll("g.legend")
        .data(series)
        .enter()
        .append("svg:g")
        .classed("legend", true)
        .attr("transform", function(d, i) {
            return "translate(" + (dims.width - 380) + "," + (dims.height - n * 20 - 30 + i * 20) + ")";
        });

    legend.append("svg:circle")
        //.attr("class", String)
        .attr("r", 5)
        .attr("fill", function(d, i) { return scales.color(i); });

    var abbreviate = function(str) {
        var MAX_LENGTH = 13;
        if (str.length > MAX_LENGTH) {
            return str.substr(0, MAX_LENGTH) + "…";
        }
        return str;
    };

    legend.append("svg:text")
        .attr("x", 12)
        .attr("dy", ".31em")
        .text(function(d) { return abbreviate(d.jobTitle) + " at " + d.company + " " + d.year; });
};

plotInfoLabel = function(svg) {
    var label = svg
        .append("svg:text")
        .attr({"id": "infoLabel", "x": 100, "y": 50})
        .style({"font-size": "24px", "font-weight": "bold", "fill": "#bbb"});

    label.append("svg:tspan")
        .attr({"id": "employerLabel", "x": 100, "dy": 27});
    label.append("svg:tspan")
        .attr({"id": "jobTitleLabel", "x": 100, "dy": 27});
    label.append("svg:tspan")
        .attr({"id": "cityStateLabel", "x": 100, "dy": 27});
    label.append("svg:tspan")
        .attr({"id": "wageLabel", "x": 100, "dy": 27});
};

plotFrame = function(where, dims, padding) {
    where.append("svg:rect")
        .classed("frame", true)
        .attr("x", padding.left)
        .attr("y", padding.top)
        .attr("width", dims.width - padding.hori)
        .attr("height", dims.height - padding.vert);
};

plotBrush = function(where) {
    // plot brush
    //where.call(brush.x(x[p.x]).y(y[p.y]));
};

plotPoints = function(where, scales, objects, color) {
    var n = objects.length;
    var formatWage = d3.format("$,d");

    var circ1 = where.selectAll("circle")
        .data(objects);

    circ1.enter().insert("svg:line")
        .attr("x1", function(d, i) { return scales.x((i+1) / n); })
        .attr("y1", function(d) { return scales.y(d.wageFrom); })
        .attr("x2", function(d, i) { return scales.x((i+1) / n); })
        .attr("y2", function(d) { return scales.y(d.wageTo); })
        .attr("stroke-width", 1)
        .attr("stroke", d3.rgb(color).brighter(0.5));

    var circ = where.selectAll("circle")
            .data(objects);

    circ.enter().insert("svg:circle")
        .attr("class", "dataPoint")
        //.attr("cx", function(d) { return scales.x(d.wage); })
        //.attr("cy", function(d, i) { return scales.y((i+1) / n); })
        .attr("cx", function(d, i) { return scales.x((i+1) / n); })
        .attr("cy", function(d) { return scales.y((d.wageFrom + d.wageTo) / 2); })
        .attr("fill", color)
        .attr("r", 3)
        .style("cursor", "pointer")
        .on("mouseover", function showInfoLabel(d) {
            d3.select("svg #employerLabel").text(d.employer);
            d3.select("svg #jobTitleLabel").text(d.jobTitle);
            d3.select("svg #cityStateLabel").text(d.city + ", " + d.state);
            d3.select("svg #wageLabel").text(formatWage((d.wageFrom + d.wageTo) / 2));
            d3.select("svg #infoLabel")
                .transition()
                .duration(50)
                .style("opacity", 1);
            d3.select(this)
                .attr("r", 5);
        })
        .on("mouseout", function hideInfoLabel(d) {
            d3.select("svg #infoLabel")
                .transition()
                .duration(200)
                .style("opacity", 0);
            d3.select(this)
                .attr("r", 3);
        });

    /*circ.transition()
        .duration(1000)
        .attr("cx", function(d) { return scales.x(d.index); })
        .attr("cy", function(d) { return scales.y(d.wage); })
        .style("cursor", "pointer")
        .on("mouseover", function(d) {
            d3.select("svg #employerLabel").text(d.employer);
            d3.select("svg #jobTitleLabel").text(d.jobTitle);
            d3.select("svg #wageLabel").text(formatWage(d.wage));
            d3.select("svg #infoLabel")
                .transition()
                .duration(50)
                .style("opacity", 1);
        })
        .on("mouseout", function(d) {
            d3.select("svg #infoLabel")
                .transition()
                .duration(200)
                .style("opacity", 0);
        });*/

    circ.exit()
        .remove();
};

getDimensions = function() {
    return { width: 1200, height: 500 };
};

getPadding = function() {
    var padding = { left: 70, right: 10, top: 10, bottom: 25 };
    padding.hori = padding.left + padding.right;
    padding.vert = padding.top + padding.bottom;
    return padding;
};

plotSvg = function(documentFragment, dims) {
    var svg = d3.select(documentFragment)
        .append("svg:svg")
        .attr("width", dims.width)
        .attr("height", dims.height)
        .append("svg:g");
    return svg;
};

plotArea = function(svg) {
    var area = svg
        .append("svg:g")
        .classed("area", true);
    return area;
};

clearPlot = function() {
    d3.select("svg").remove();
    /*if (window.svg) {
        d3.selectAll(".axis").remove();
        d3.selectAll(".frame").remove();
        d3.selectAll("#infoLabel").remove();
        d3.selectAll(".legend").remove();
        d3.selectAll(".area").remove();
        // not needed as we remove area: d3.selectAll(".dataPoint").remove();
    }*/
};

plot = function(series) {
    clearPlot();

    var dims = getDimensions();
    var padding = getPadding();

    var documentFragment = document.createDocumentFragment();
    var svg = plotSvg(documentFragment, dims);
    var scales = getScales(series, dims, padding);

    plotAxis(svg, dims, padding, scales);
    plotFrame(svg, dims, padding);
    plotInfoLabel(svg);
    plotLegend(svg, dims, scales, series);
    //plotBrush(svg);
    for (var i in series) {
        area = plotArea(svg);
        plotPoints(area, scales, series[i].objects, scales.color(i));
    }
    $("#svgContainer").append(documentFragment);
};

readArrayFromInputField = function(id) {
    var value = $(id).val();
    var array = value.split(ARRAY_ENTRIES_DELIMITER);
    return array
        .map(function(s) {return s.trim().toUpperCase();})
        .filter(function(s) {return s.length > 0;});
};

writeArrayToInputField = function(id, value) {
    $(id).val(value.join(ARRAY_ENTRIES_DELIMITER + " "));
};

updateArrayValue = function(currentValue, inputID) {
    var array = readArrayFromInputField(inputID);
    if (array.indexOf(currentValue) == -1) {
        array.push(currentValue);
    }
    writeArrayToInputField(inputID, array);
};

readInputs = function() {
    var companies = readArrayFromInputField(COMPANIES_INPUT_ID); // may be empty
    var jobTitles = readArrayFromInputField(JOBTITLES_INPUT_ID); // may be empty
    var minWage = parseInt($(MINWAGE_INPUT_ID).val(), 10);
    if (isNaN(minWage)) minWage = DEFAULT_MINIMAL_WAGE;
    var maxWage = parseInt($(MAXWAGE_INPUT_ID).val(), 10);
    if (isNaN(maxWage)) maxWage = DEFAULT_MAXIMAL_WAGE;

    return {
        "companies": companies,
        "jobTitles": jobTitles,
        "minWage": minWage,
        "maxWage": maxWage,
    };
};

// The values are expected to be strings.
writeInputs = function(inputs) {
    $(COMPANIES_INPUT_ID).val(inputs.companies);
    $(JOBTITLES_INPUT_ID).val(inputs.jobTitles);
    $(MINWAGE_INPUT_ID).val(inputs.minWage);
    $(MAXWAGE_INPUT_ID).val(inputs.maxWage);
};

generateSeriesForYear = function(year, objects) {
    var createNewSeries = function(company, jobTitle, minWage, maxWage) {
        var getWage = function getWage(o) { return (o.wageFrom + o.wageTo) / 2; };

        var isQualifying = function(obj, company, jobTitle, minWage, maxWage) {
            // check wages first
            if (minWage <= getWage(obj) && getWage(obj) <= maxWage) {
                // now check company
                if (company == SPECIAL_ALL_COMPANIES || obj.employer.indexOf(company) != -1) {
                    // now check titles
                    if (jobTitle == SPECIAL_ALL_JOBTITLES) {
                        return true;
                    }
                    var titles = jobTitle.split(SYNONYMS_DELIMITER);
                    for (var i in titles) {
                        var title = titles[i];
                        if (obj.jobTitle.indexOf(title) != -1) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };
        var filterCriteria = function(object) {
            return isQualifying(object, company, jobTitle, minWage, maxWage);
        };

        var serie = {};
        serie.objects = objects.filter(filterCriteria);
        serie.company = company;
        serie.jobTitle = jobTitle;
        serie.year = year;
        return serie;
    };

    var generateSeriesForJobTitles = function(company, jobTitles, minWage, maxWage, series) {
        if (jobTitles.length > 0) {
            for (var j in jobTitles) {
                var jobTitle = jobTitles[j];
                series.push(createNewSeries(company, jobTitle, minWage, maxWage));
            }
        }
        else {
            series.push(createNewSeries(company, SPECIAL_ALL_JOBTITLES, minWage, maxWage));
        }
    };

    var generateSeriesForCompanies = function(companies, jobTitles, minWage, maxWage, series) {
        if (companies.length > 0) {
            for (var i in companies) {
                var company = companies[i];
                generateSeriesForJobTitles(company, jobTitles, minWage, maxWage, series);
            }
        }
        else {
            generateSeriesForJobTitles(SPECIAL_ALL_COMPANIES, jobTitles, minWage, maxWage, series);
        }
    }

    var inputs = readInputs();

    var series = [];
    generateSeriesForCompanies(inputs.companies, inputs.jobTitles, inputs.minWage, inputs.maxWage, series);
    return series;
};

constructHash = function() {
    var inputs = readInputs();

    var flatInputs = [
        inputs.companies.join(ARRAY_ENTRIES_DELIMITER),
        inputs.jobTitles.join(ARRAY_ENTRIES_DELIMITER),
        inputs.minWage,
        inputs.maxWage,
    ];

    return encodeURI(flatInputs.join(HASH_DELIMITER));
};

firePixel = function() {
    // sample url: logger.php?companies=test4&jobTitles=test5&minWage=test6&maxWage=test7
    var data = readInputs();
    data.companies = data.companies.join(ARRAY_ENTRIES_DELIMITER);
    data.jobTitles = data.jobTitles.join(ARRAY_ENTRIES_DELIMITER);
    $.get(LOGGER_URL, data);
};

onResearchClick = function(event) {
    location.hash = constructHash();
}

onHashChange = function() {
    if (isHashEmpty()) {
        writeInputs(generateEmptyInputs());
        clearPlot();
    }
    else {
        writeInputs(parseHashToInputs());
        initiateDraw();
    }
};

isHashEmpty = function() {
    return (location.hash === "" || location.hash === "#");
};

generateEmptyInputs = function() {
    var inputs = {
        "companies": "",
        "jobTitles": "",
        "minWage": DEFAULT_MINIMAL_WAGE,
        "maxWage": DEFAULT_MAXIMAL_WAGE,
    };

    return inputs;
};

// Hash is expected to be non-empty.
parseHashToInputs = function() {
    var hash = decodeURI(location.hash.replace(/^#/, ""));
    var elements = hash.split(HASH_DELIMITER);

    var inputs = {
        "companies": elements[0],
        "jobTitles": elements[1],
        "minWage": elements[2],
        "maxWage": elements[3],
    };

    return inputs;
};

initiateDraw = function() {
    if (window.dataFilesToLoad == 0) {
        $(SHORT_URL_DIV_ID).hide();
        $(RESEARCH_BUTTON_ID).addClass("active");
        //alert('active');
        firePixel();
        
        var series = [];
        for (var year in window.dataPoints) {
            series = series.concat(generateSeriesForYear(year, window.dataPoints[year]));
        }
        console.log(series);

        for (var i in series) {
            var objects = series[i].objects;
            var sorted = sortByWage(objects);
            series[i].objects = sorted;
        }
        //indexed.reverse().slice(0,10).map(function(x) { console.log(x.wage, x.index); });
        plot(series);
        $(RESEARCH_BUTTON_ID).removeClass("active");
    }
    else {
        alert("Data is not loaded yet!");
    }
};

shortenUrl = function(longUrl, callback) {
    var api_url = SHORTENER_API_URL + SHORTENER_API_KEY;
    var data = "{\"longUrl\": \"" + longUrl + "\"}";

    $.ajax({
        type: "POST",
        url: api_url,
        headers: {"Content-Type": "application/json"},
        data: data,
        dataType: "json",
    }).done(callback);
};

onShortenClick = function(event) {
    var url = location.href;
    var callback = function(data) {
        $(SHORT_URL_DIV_ID).show();
        $(SHORT_URL_INPUT_ID).val(data.id);
    };
    shortenUrl(url, callback);
}

onCompanyClick = function(event) {
    var index = event.data.index;
    updateArrayValue(companies[index].value, COMPANIES_INPUT_ID);
};

onJobTitleClick = function(event) {
    var index = event.data.index;
    updateArrayValue(jobTitles[index].value, JOBTITLES_INPUT_ID);
};

populateDropdown = function(dropdownID, objectList, clickCallback) {
    var dropdownElement = $(dropdownID);
    for (var i in objectList) {
        var object = objectList[i];
        var link = $("<a/>")
            .text(object.view)
            .attr("class", "pointy-link")
            .click({index: i}, clickCallback);
        var item = $("<li/>");
        item.append(link);
        dropdownElement.append(item);
    }
};

wireClearButtons = function() {
    $(document)
        .on('mousemove', '.clearable',
            function(e) {
                if (this.offsetWidth - 25 < e.clientX - this.getBoundingClientRect().left) {
                    $(this).addClass('onX');
                }
                else {
                    $(this).removeClass('onX');
                }
            })
        .on('click', '.onX',
            function() {
                $(this).removeClass('onX').val('');
            });
}

onFormKeypress = function(event) {
    var ENTER_KEY = 13;
    if (event.which == ENTER_KEY) {
        $(RESEARCH_BUTTON_ID).click();
    }
};

insertTwitterButton = function() {
    $("div#twitterButtonContainer").html(
        '<a href="https://twitter.com/share" class="twitter-share-button" data-via="megaserg" data-size="large" data-count="none" data-dnt="true">Tweet</a>' +
        "<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>"
    );
};

enableAllTooltips = function() {
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    });
};

onPageLoad = function(event) {
    populateDropdown(COMPANIES_LIST_ID, companies, onCompanyClick);
    populateDropdown(JOBTITLES_LIST_ID, jobTitles, onJobTitleClick);

    if (isHashEmpty()) {
        writeInputs(generateEmptyInputs());
        loadDictionary(receivedDictionary);
        // loadCSV(false);
    }
    else {
        writeInputs(parseHashToInputs());
        loadDictionary(receivedDictionary);
        // loadCSV(true);
    }

    $(window).hashchange(onHashChange);
    $(RESEARCH_FORM_ID).keypress(onFormKeypress);
    $(RESEARCH_BUTTON_ID).click(onResearchClick);
    $(SHORTEN_BUTTON_ID).click(onShortenClick);
    wireClearButtons();
    insertTwitterButton();
    enableAllTooltips();
};

$(window).load(onPageLoad);
