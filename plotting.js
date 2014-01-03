window.dataPoints = null;

COMPANIES_SELECT_ID = "select#companiesSelect";
COMPANIES_INPUT_ID = "input#companiesInput";
JOBTITLES_SELECT_ID = "select#jobTitlesSelect";
JOBTITLES_INPUT_ID = "input#jobTitlesInput";
RESEARCH_BUTTON_ID = "button#researchButton";

SPECIAL_ALL_COMPANIES = "ALL_COMPANIES";
SPECIAL_ALL_JOBTITLES = "ALL_JOBTITLES";

ARRAY_ENTRIES_DELIMITER = ",";
INTERNAL_CLAUSES_DELIMITER = "/";

DEFAULT_MINIMAL_WAGE = 80000;
DEFAULT_MAXIMAL_WAGE = 200000;

DATA_FILE_SIZE = 24224476;

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

/*filter = function(objects) {
    var currentCompany = $(COMPANIES_SELECT_ID).val();
    var currentJobTitle = $(JOBTITLES_SELECT_ID).val();
    var minimalWage = parseInt($("#minimalWageInput").val()) || DEFAULT_MINIMAL_WAGE;
    var maximalWage = parseInt($("#maximalWageInput").val()) || DEFAULT_MAXIMAL_WAGE;
                   
    var criteria = function(obj) {
        // check company first
        if (currentCompany == SPECIAL_ALL_COMPANIES || obj.employer.indexOf(currentCompany) != -1) {
            // now check wages
            if (minimalWage <= obj.wage && obj.wage <= maximalWage) {
                // now check titles
                if (currentJobTitle == SPECIAL_ALL_JOBTITLES) {
                    return true;
                }
                var titles = currentJobTitle.split(INTERNAL_CLAUSES_DELIMITER);
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
    
    return objects.filter(criteria);
};*/

sortByWage = function(objects) {
    var compareWage = function(a, b) {
        return a.wage - b.wage;
    };
    
    return objects.sort(compareWage);
}

index = function(objects) {
    var n = objects.length;
    var counter = 0;
    var assignIndex = function(object) {
        object.index = (++counter) / n;
    };
    
    objects.forEach(assignIndex);
    return objects;
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
            return "translate(" + (dims.width - 350) + "," + (dims.height - n * 20 - 30 + i * 20) + ")"; 
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
    var formatWage = d3.format("$,d");

    var circ = where.selectAll("circle")
        .data(objects);
    
    circ.enter().insert("svg:circle")
        .attr("class", "dataPoint")
        .attr("cx", function(d) { return scales.x(d.wage); }) // modified here
        .attr("cy", function(d) { return scales.y(d.index); }) // modified here
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
        })
        .on("mouseout", function(d) {
            d3.select("svg #infoLabel")
                .transition()
                .duration(200)
                .style("opacity", 0);
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
    return array.filter(function(s) {return s.length > 0;});
};

writeArrayToInputField = function(id, value) {
    $(id).val(value.join(ARRAY_ENTRIES_DELIMITER));
};

updateArrayValue = function(selectID, inputID, specialAll) {
    var currentValue = $(selectID).val();
    if (currentValue == specialAll) {
        array = [];
    }
    else {
        var array = readArrayFromInputField(inputID);
        if (array.indexOf(currentValue) == -1) {
            array.push(currentValue);
        }
    }
    writeArrayToInputField(inputID, array);
};

onCompaniesSelectChange = function(event) {
    updateArrayValue(COMPANIES_SELECT_ID, COMPANIES_INPUT_ID, SPECIAL_ALL_COMPANIES);
}

onJobTitlesSelectChange = function(event) {
    updateArrayValue(JOBTITLES_SELECT_ID, JOBTITLES_INPUT_ID, SPECIAL_ALL_JOBTITLES);
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
    
    var companies = readArrayFromInputField(COMPANIES_INPUT_ID); // may be empty
    var jobTitles = readArrayFromInputField(JOBTITLES_INPUT_ID); // may be empty
    var minWage = parseInt($("#minimalWageInput").val()) || DEFAULT_MINIMAL_WAGE;
    var maxWage = parseInt($("#maximalWageInput").val()) || DEFAULT_MAXIMAL_WAGE;
    
    var series = [];
    generateSeriesForCompanies(companies, jobTitles, minWage, maxWage, series);
    return series;
};

onResearchClick = function(event) {
    if (window.dataPoints) {
        //plot(filter(window.dataPoints)
        //var filtered = filter(window.dataPoints);
        //var sorted = sortByWage(filtered);
        //var indexed = index(sorted);
        
        var series = generateSeries(window.dataPoints);
        for (var i in series) {
            var objects = series[i].objects;
            var sorted = sortByWage(objects);
            var indexed = index(sorted);
            series[i].objects = indexed;
        }
        
        //indexed.reverse().slice(0,10).map(function(x) { console.log(x.wage, x.index); });
        plot(series);
    }
    else {
        alert("Data is not loaded yet!");
    }
};

onPageLoad = function(event) {
    $(RESEARCH_BUTTON_ID).click(onResearchClick);
    $(COMPANIES_SELECT_ID).change(onCompaniesSelectChange);
    $(JOBTITLES_SELECT_ID).change(onJobTitlesSelectChange);
    loadCSV();
};

$(window).load(onPageLoad);