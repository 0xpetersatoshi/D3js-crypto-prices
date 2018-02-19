// dimensions
var margin = { top: 50, right: 210, bottom: 65, left: 50 };
var height = 1000 - margin.top - margin.bottom;
var width = 1700 - margin.left - margin.right;

// parse the date and format time
var parseTime = d3.timeParse("%d-%b-%y");
var formatTime = d3.timeFormat("%e %B");

// define radius for scatter dots
var radius = 3.5;

// create color scale
var colorScale = d3.scaleOrdinal()
                    .domain(["BTC", "ETH", "LTC", "NEO", "XRP"])
                    .range(["#F68819", "#2E2F2F", "#B6B6B6", "#4EB607", "#0084C2"])


var dataViz = function(err, data, data2) {
    if (err) {
        console.log(err)
    } else {
        data.forEach(d => {
            d.Day = parseTime(d.Day)
            d.Price = +d.Price
        })

        
        // find min and max price
        var maxPrice = d3.max(data, d => d.Price)
        var minPrice = d3.min(data, d => d.Price)
        
        // build y scale
        var yScale = d3.scaleLog()
        .domain([minPrice, maxPrice])
        .range([height, 0])
        
        // build x scale
        var xScale = d3.scaleTime()
        .range([0, width])
        .domain(d3.extent(data, d => d.Day))
        
        // build axis
        var xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat("%Y-%m-%d"))
        
        var yAxis = d3.axisLeft(yScale)
        .tickFormat(d3.format("$.2f"))
        
        
        // define svg variable
        var svg = d3.select(".viz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        
        // zoom function
        var zoom = d3.zoom()
        .scaleExtent([1, 8])
        // .translateExtent([[0, 0], [width + 100, height + 100]])
        .extent([0, 0], [width, height])
        .on("zoom", zoomFunc)
        
        // append inner space for plot
        var svgZoom = svg.append("g")
        .attr("class", "inner-space")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        
        // add tooltip
        var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        
        // add scatter plot
        var scatter = svgZoom.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("r", radius)
        .attr("cx", d => xScale(d.Day))
        .attr("cy", d => yScale(d.Price))
        .style("fill", d => colorScale(d.Coin))
        .style("opacity", .55)
        .on("mouseover", function(d) {
            d3.select(this)
            .transition()
            .duration(200)
            .attr("r", (radius * 4.5))
            .style("opacity", 1)
            .transition()
            .duration(200)
            .attr("r", (radius * 2.5))
            .style("opacity", 1)
            tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
            tooltip.html("<b>" + d.Coin + "<b/>" + "<br/> (" + formatTime(d.Day) + ", $" + d.Price + ")")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 65) + "px")
        })
        .on("mouseout", function(d) {
            d3.select(this)
            .transition()
            .duration(200)
            .attr("r", radius)
            .style("opacity", .5)
            tooltip.transition()
            .duration(500)
            .style("opacity", 0)
        })
        
        // append xAxis
        var gX = svgZoom.append("g")
        .attr("class", "x axis grid")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxis)
        
        // append yAxis
        var gY = svgZoom.append("g")
        .attr("class", "y axis grid")
        .call(yAxis)
        
        // call zoom
        svg.call(zoom)
        
        
        // define zoomFunc
        function zoomFunc(){
            // create new scale objects based on event
            var new_xScale = d3.event.transform.rescaleX(xScale)
            var new_yScale = d3.event.transform.rescaleY(yScale)
            
            // update axes
            gX.call(xAxis.scale(new_xScale));
            gY.call(yAxis.scale(new_yScale));
            
            // update scatter plot
            scatter.attr("transform", d3.event.transform)
        };
        
        // add reset zoom button
        function resetted() {
            svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
        }
        
        // add reset button
        d3.select("#reset")
            .on("click", resetted)
        
        // Provide a plot title.
        svgZoom.append("text").classed("title", true)
        .attr("x", (width / 2)).attr("y", 0 - (margin.top / 2))
        .text("Cryptocurrency Log Prices");
        svgZoom.append("text").classed("title", true)
        .attr("x", (width / 2)).attr("y", 40 - (margin.top / 2))
        .text("(Oct 2016 - Oct 2017)");
        
        // extract coins
        var coins = d3.map(data, function(d) {return d.Coin}).keys()

        var m = Object.keys(data[0]).filter(d => d)
        console.log(typeof m)
        console.log(typeof coins)

        // add filters
        d3.select("#controls")
            .selectAll("button.coins")
            .data(coins)
            .enter()
            .append("button")
            .attr("class", "btn btn-default controls")
            // .on("click", buttonClick)
            .html(d => d);

        // add legend
        var legend = svgZoom.append("g")
                        .selectAll("g")
                        .data(colorScale.domain())
                        .enter()
                        .append("g")
                            .attr("class", "legend")
                            .attr("transform", function(d, i) {
                                return "translate(10," + i * 20 + ")"
                            })

        // circles for legend
        legend.append("circle")
            .attr("cx", width + 20)
            .attr("cy", (height / 2))
            .attr("r", radius * 2)
            .style("fill", colorScale)
            .style("stroke", "black")

        // legend text
        legend.append('text')
            .attr("class", "legend-text")
            .attr('x', width + 35)
            .attr("y", (height/ 2))
            .attr("dy", ".3em")
            .text(function(d) { return d; });	
    }
}

d3.queue()
    .defer(d3.csv, "./data/coins.csv")
    .defer(d3.csv, "./data/dataset.csv")
    .await(dataViz);