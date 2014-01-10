window.dataPoints = null;

COMPANIES_INPUT_ID = "input#companiesInput";
JOBTITLES_INPUT_ID = "input#jobTitlesInput";
RESEARCH_BUTTON_ID = "button#researchButton";
COMPANIES_LIST_ID = "ul#companiesList";
JOBTITLES_LIST_ID = "ul#jobTitlesList";

SPECIAL_ALL_COMPANIES = "ALL_COMPANIES";
SPECIAL_ALL_JOBTITLES = "ALL_JOBTITLES";

ARRAY_ENTRIES_DELIMITER = ",";
INTERNAL_CLAUSES_DELIMITER = "/";

LOGGER_URL = "logger.php";

DEFAULT_MINIMAL_WAGE = 80000;
DEFAULT_MAXIMAL_WAGE = 200000;

DATA_FILE_SIZE = 26431268;

companies = [
    {value: "ALL_COMPANIES", view: "All"},
    {value: "MICROSOFT", view: "Microsoft"},
    {value: "GOOGLE", view: "Google"},
    {value: "FACEBOOK", view: "Facebook"},
    {value: "TWITTER", view: "Twitter"},
    {value: "APPLE", view: "Apple"},
    {value: "CISCO SYSTEMS", view: "Cisco"},
    {value: "INTEL CORPORATION", view: "Intel"},
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
    {value: "SOFTWARE/ENGINEER/DEVELOPER/PROGRAMMER/ENG/ROCKET SCIENTIST", view: "Engineers"},
    {value: "SENIOR SOFTWARE/SENIOR ENGINEER/SENIOR DEVELOPER/SENIOR PROGRAMMER/SR. SOFTWARE/SR. ENGINEER/SR. DEVELOPER/SR. PROGRAMMER/SENIOR ROCKET SCIENTIST", view: "Senior engineers"},
    {value: "SCIENTIST", view: "Scientists"},
    {value: "MANAGER", view: "Managers"},
    {value: "CONSULTANT", view: "Consultants"},
    {value: "CEO/CHIEF EXECUTIVE OFFICER", view: "CEOs"},
];

loadCSV = function() {
    var formatPercent = d3.format(".0%");

    var objects = d3.csv("data/H-1B_FY13_Q4_filtered.csv")
        .row(function(entry) {
                 return {
                     employer: entry.Employer,
                     jobTitle: entry.JobTitle,
                     wage: +entry.Wage,
                     city: entry.City,
                     state: entry.State,
                     //jobField: entry.JobField
                 };
             })
        .on("progress",
            function() {
                var progress = d3.event.loaded / DATA_FILE_SIZE;
                var meter = $(".progress-meter");
                meter.text("Loading data (" + formatPercent(progress) + ")...");
                console.log(d3.event.loaded, DATA_FILE_SIZE, progress, formatPercent(progress)); 
            })
        .get(function(error, objects) {
                window.dataPoints = objects;
                $(".progress-meter").hide();
                $(RESEARCH_BUTTON_ID).show();
             });
};

sortByWage = function(objects) {
    var compareWage = function(a, b) {
        return a.wage - b.wage;
    };
    
    return objects.sort(compareWage);
}

getScales = function(series, dims, padding) {
    var getWage = function(o) { return o.wage; };
    var minWageInRow = function(row) { return d3.min(row.objects, getWage); };
    var maxWageInRow = function(row) { return d3.max(row.objects, getWage); };
    var minWage = d3.min(series, minWageInRow),
        maxWage = d3.max(series, maxWageInRow);
    var wageMargin = (maxWage - minWage) * 0.03;
    var xDomain = [minWage - wageMargin, maxWage + wageMargin];
    var yDomain = [-0.01, 1.01];
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
        //.tickFormat(function(d) { return Math.floor(d * 100) + "%"; })
        .tickFormat(function(d) { return formatWage(d); })
        .scale(scales.x)
        .orient("bottom");
    var yAxis = d3.svg.axis()
        .ticks(10)
        .tickSize(dims.width - padding.hori)
        //.tickFormat(function(d) { return formatWage(d); })
        .tickFormat(function(d) { return Math.floor(d * 100) + "%"; })
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
        .text(function(d) { return abbreviate(d.jobTitle) + " at " + d.company; });
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

    var circ = where.selectAll("circle")
        .data(objects);
    
    circ.enter().insert("svg:circle")
        .attr("class", "dataPoint")
        .attr("cx", function(d) { return scales.x(d.wage); }) // modified here
        .attr("cy", function(d, i) { return scales.y((i+1) / n); })
        .attr("fill", color)
        .attr("r", 3)
        .style("cursor", "pointer")
        .on("mouseover", function(d) {
            d3.select("svg #employerLabel").text(d.employer);
            d3.select("svg #jobTitleLabel").text(d.jobTitle);
            d3.select("svg #cityStateLabel").text(d.city + ", " + d.state);
            d3.select("svg #wageLabel").text(formatWage(d.wage));
            d3.select("svg #infoLabel")
                .transition()
                .duration(50)
                .style("opacity", 1);
            d3.select(this)
                .attr("r", 5);
        })
        .on("mouseout", function(d) {
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
    var padding = { left: 40, right: 10, top: 10, bottom: 25 };
    padding.hori = padding.left + padding.right;
    padding.vert = padding.top + padding.bottom;
    return padding;
};

plotSvg = function(dims) {
    var svg = d3.select("#svgContainer")
        .append("svg:svg")
        .attr("width", dims.width)
        .attr("height", dims.height)
        .append("svg:g");
    return svg;
}

plotArea = function(svg) {
    var area = svg
        .append("svg:g")
        .classed("area", true);
    return area;
}

plot = function(series) {
    //d3.select("svg").remove();
    if (window.svg) {
        d3.selectAll(".axis").remove();
        d3.selectAll(".legend").remove();
        d3.selectAll(".frame").remove();
        d3.selectAll("#infoLabel").remove();
        d3.selectAll(".area").remove();
        // not needed as we remove area: d3.selectAll(".dataPoint").remove();
    }

    var dims = getDimensions();
    var padding = getPadding();
    window.svg = window.svg || plotSvg(dims);
    scales = getScales(series, dims, padding);
    
    plotAxis(svg, dims, padding, scales);
    plotFrame(svg, dims, padding);
    plotInfoLabel(svg);
    plotLegend(svg, dims, scales, series);
    //plotBrush(svg);
    for (var i in series) {
        area = plotArea(svg);
        plotPoints(area, scales, series[i].objects, scales.color(i));
    }
};

readArrayFromInputField = function(id) {
    var value = $(id).val();
    var array = value.split(ARRAY_ENTRIES_DELIMITER);
    return array
        .map(function(s) {return s.trim().toUpperCase();})
        .filter(function(s) {return s.length > 0;});
};

writeArrayToInputField = function(id, value) {
    $(id).val(value.join(ARRAY_ENTRIES_DELIMITER));
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
    var minWage = parseInt($("#minimalWageInput").val(), 10);
    if (isNaN(minWage)) minWage = DEFAULT_MINIMAL_WAGE;
    var maxWage = parseInt($("#maximalWageInput").val(), 10);
    if (isNaN(maxWage)) maxWage = DEFAULT_MAXIMAL_WAGE;
    
    return {
        "companies": companies,
        "jobTitles": jobTitles,
        "minWage": minWage,
        "maxWage": maxWage,
    };
};

generateSeries = function(objects) {
    var createNewSeries = function(company, jobTitle, minWage, maxWage) {
        var isQualifying = function(obj, company, jobTitle, minWage, maxWage) {
            // check wages first
            if (minWage <= obj.wage && obj.wage <= maxWage) {
                // now check company
                if (company == SPECIAL_ALL_COMPANIES || obj.employer.indexOf(company) != -1) {
                    // now check titles
                    if (jobTitle == SPECIAL_ALL_JOBTITLES) {
                        return true;
                    }
                    var titles = jobTitle.split(INTERNAL_CLAUSES_DELIMITER);
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

firePixel = function() {
    // sample url: logger.php?companies=test4&jobTitles=test5&minWage=test6&maxWage=test7
    var data = readInputs();
    data.companies = data.companies.join(ARRAY_ENTRIES_DELIMITER);
    data.jobTitles = data.jobTitles.join(ARRAY_ENTRIES_DELIMITER);
    $.get(LOGGER_URL, data);
};

onResearchClick = function(event) {
    if (window.dataPoints) {
        //plot(filter(window.dataPoints)
        //var filtered = filter(window.dataPoints);
        //var sorted = sortByWage(filtered);
        //var indexed = index(sorted);
        
        firePixel();
        
        var series = generateSeries(window.dataPoints);
        for (var i in series) {
            var objects = series[i].objects;
            var sorted = sortByWage(objects);
            //var indexed = index(sorted);
            series[i].objects = sorted;
        }
        
        //indexed.reverse().slice(0,10).map(function(x) { console.log(x.wage, x.index); });
        plot(series);
    }
    else {
        alert("Data is not loaded yet!");
    }
};

insertTwitterButton = function() {
    $("div#twitterButtonContainer").html(
        '<a href="https://twitter.com/share" class="twitter-share-button" data-via="megaserg" data-size="large" data-count="none" data-dnt="true">Tweet</a>' +
        "<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>"
    );
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

onCompanyClick = function(event) {
    var index = event.data.index;
    updateArrayValue(companies[index].value, COMPANIES_INPUT_ID);
};

onJobTitleClick = function(event) {
    var index = event.data.index;
    updateArrayValue(jobTitles[index].value, JOBTITLES_INPUT_ID);
};

onPageLoad = function(event) {
    var companiesList = $(COMPANIES_LIST_ID);
    for (var i in companies) {
        var company = companies[i];
        var link = $("<a/>")
            .text(company.view)
            .attr("class", "pointy-link")
            .click({index: i}, onCompanyClick);
        var item = $("<li/>");
        item.append(link);
        companiesList.append(item);
    }
    
    var jobTitlesList = $(JOBTITLES_LIST_ID);
    for (var i in jobTitles) {
        var jobTitle = jobTitles[i];
        var link = $("<a/>")
            .text(jobTitle.view)
            .attr("class", "pointy-link")
           .click({index: i}, onJobTitleClick);
        var item = $("<li/>");
        item.append(link);
        jobTitlesList.append(item);
    }
    
    $(RESEARCH_BUTTON_ID).click(onResearchClick);
    wireClearButtons();
    loadCSV();
    insertTwitterButton();
};

$(window).load(onPageLoad);