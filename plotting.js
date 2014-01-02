window.dataPoints = null;

loadCSV = function() {
    var objects = d3.csv(
        "data/H-1B_FY13_Q4_filtered.csv",
        function(entry) {
            return {
                employer: entry.Employer,
                jobTitle: entry.JobTitle,
                wage: +entry.Wage,
                city: entry.City,
                state: entry.State,
            };
        },
        function(error, objects) {
            window.dataPoints = objects;
            //research button make active
        }
    );
};

filter = function(objects) {
    var currentCompany = $("#companiesSelect").val();
    var currentJobTitle = $("#jobtitlesSelect").val();
    var minimalWage = parseInt($("#minimalWageInput").val()) || 0;
    var maximalWage = parseInt($("#maximalWageInput").val()) || 300000;
                   
    var criteria = function(obj) {
        // check company first
        if (currentCompany == "SPECIAL_ALL_COMPANIES" || obj.employer.indexOf(currentCompany) != -1) {
            // now check wages
            if (minimalWage <= obj.wage && obj.wage <= maximalWage) {
                // now check titles
                if (currentJobTitle == "SPECIAL_ALL_JOBTITLES") {
                    return true;
                }
                var titles = currentJobTitle.split(",");
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
};

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

getScales = function(objects, dims, padding) {
    var getIndex = function(o) { return o.index; };
    var getWage = function(o) { return o.wage; };
    var minWage = d3.min(objects, getWage),
        maxWage = d3.max(objects, getWage);
    var wageMargin = (maxWage - minWage) * 0.03;
    var xDomain = [-0.01, 1.01];
    var yDomain = [minWage - wageMargin, maxWage + wageMargin];
    var xRange = [padding.left, dims.width - padding.right];
    var yRange = [padding.top, dims.height - padding.bottom];
    var x = d3.scale.linear().domain(xDomain).range(xRange);
    var y = d3.scale.linear().domain(yDomain).range(yRange.reverse());
    return {"x": x, "y": y};
};

plotAxis = function(svg, dims, padding, scales) {
    var formatWage = d3.format("$,d");
    var xAxis = d3.svg.axis()
        .ticks(10)
        .tickSize(dims.height - padding.vert)
        .tickFormat(function(d) { return Math.floor(d * 100) + "%"; })
        .scale(scales.x)
        .orient("bottom");
    var yAxis = d3.svg.axis()
        .ticks(10)
        .tickSize(dims.width - padding.hori)
        .tickFormat(function(d) { return formatWage(d); })
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
                    
plotLegend = function(svg) {
    var legend = svg.selectAll("g.legend")
        .data(["field 1", "field 2", "field 3"])
        .enter()
        .append("svg:g")
        .classed("legend", true)
        .attr("transform", function(d, i) { return "translate(10," + (i * 20 + 594) + ")"; });

    legend.append("svg:circle")
        .attr("class", String)
        .attr("r", 3);

    legend.append("svg:text")
        .attr("x", 12)
        .attr("dy", ".31em")
        .text(function(d) { return d; });
};

plotInfoLabel = function(svg) {
    var label = svg
        .append("svg:text")
        .attr({"id": "infoLabel", "x": 100, "y": 100})
        .style({"font-size": "24px", "font-weight": "bold", "fill": "#ddd"});
        
    label.append("svg:tspan")
        .attr({"id": "employerLabel", "x": 100, "dy": 27});
    label.append("svg:tspan")
        .attr({"id": "jobTitleLabel", "x": 100, "dy": 27});
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

plotPoints = function(where, scales, objects) {
    var formatWage = d3.format("$,d");

    var circ = where.selectAll("circle")
        .data(objects);
    
    circ.enter().insert("svg:circle")
        .attr("class", "dataPoint")
        .attr("cx", function(d) { return scales.x(d.index); })
        .attr("cy", function(d) { return scales.y(d.wage); })
        .attr("r", 3)
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
            
redraw = function() {
    //erase axis
    //draw new axis
    //erase points
    //draw new points
};

plot = function(objects) {
    //d3.select("svg").remove();
    if (window.svg) {
        d3.selectAll(".axis").remove();
        d3.selectAll(".frame").remove();
        d3.selectAll("#infoLabel").remove();
        d3.selectAll(".area").remove();
        //d3.selectAll(".dataPoint").remove();
    }

    var dims = getDimensions();
    var padding = getPadding();
    window.svg = window.svg || plotSvg(dims);
    scales = getScales(objects, dims, padding);
    
    plotAxis(svg, dims, padding, scales);
    //plotLegend(svg);
    plotFrame(svg, dims, padding);
    plotInfoLabel(svg);
    area = plotArea(svg);
    //plotBrush(svg);
    plotPoints(area, scales, objects);
};

parseCompaniesInputField = function() {
    var value = $("companiesInput").text();
    return value.split(",");
};

parseJobTitlesInputField = function() {
    var value = $("jobTitlesInput").text();
    return value.split(",");
};

onCompanySelect = function(event) {
    company = optionValue;
    array = companyInput.text();
    if (company == "ALL") {
        array = [];
    }
    else {
        array.push(company);
    }
    companyInput.text("array");
};

onJobTitleSelect = function(event) {
    //...
};

generateSeries = function(objects) {
    var createNewSeries = function(company, jobTitle, minWage, maxWage) {
        var isQualifying = function(obj, company, jobTitle, minWage, maxWage) {
            // check wages first
            if (minWage <= obj.wage && obj.wage <= maxWage) {
                // now check company
                if (company == "SPECIAL_ALL_COMPANIES" || obj.employer.indexOf(company) != -1) {
                    // now check titles
                    if (jobTitle == "SPECIAL_ALL_JOBTITLES") {
                        return true;
                    }
                    var titles = jobTitle.split(",");
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
        return objects.filter(filterCriteria);
    };
    
    var generateSeriesForJobTitles = function(company, jobTitles, minWage, maxWage, series) {
        if (jobTitles.length > 0) {
            for (var j in jobTitles) {
                var jobTitle = jobTitles[j];
                series.push(createNewSeries(company, jobTitle, minWage, maxWage));
            }
        }
        else {
            series.push(createNewSeries(company, "SPECIAL_ALL_JOBTITLES", minWage, maxWage));
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
            generateSeriesForJobTitles("SPECIAL_ALL_COMPANIES", jobTitles, minWage, maxWage, series);
        }
    }
    
    var companies = parseCompaniesInputField(); // may be empty
    var jobTitles = parseJobTitlesInputField(); // may be empty
    var minWage = parseInt($("#minimalWageInput").val()) || 0;
    var maxWage = parseInt($("#maximalWageInput").val()) || 300000;
    
    var series = [];
    generateSeriesForCompanies(companies, jobTitles, minWage, maxWage, series);
    return series;
};

onResearchClick = function(event) {
    if (window.dataPoints) {
        //plot(filter(window.dataPoints)
        var filtered = filter(window.dataPoints);
        var sorted = sortByWage(filtered);
        var indexed = index(sorted);
        indexed.reverse().slice(0,10).map(function(x) { console.log(x.wage, x.index); });
        plot(indexed);
    }
    else {
        alert("Data is not loaded yet!");
    }
};


onPageLoad = function(event) {
    loadCSV();
    $("#researchButton").click(onResearchClick);    
}

$(window).load(onPageLoad);