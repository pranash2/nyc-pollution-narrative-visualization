function showScene(index) {
    d3.select("#viz").html("");

    if (index === 0) drawScene1();
    else if (index === 1) drawScene2();
    else if (index === 2) drawScene3();

    const annotation = annotations[index]
    d3.select("#annotation-box").style("display", "block").html(`<h4>${annotation.title}</h4><p>${annotation.text}</p>`);
}

const annotations = {
    0: {
        title: "Scene 1 Observations",
        text: "The overall pollution (NO2) level of New York City has been on a decline since the year 2008. This means that measures to improve air quality have been working."
    },
    1: {
        title: "Scene 2 Observations",
        text: "While the overall pollution (NO2) level of New York City has been on a decline, it's still important to look at the individual boroughs or neighborhoods of New York City. As you can see, Manhattan has the highest amount of pollution compared to the other four popular boroughs. This shows how the center of New York City contributes the most to pollution, which is probably due to all the activity of businesses since it's a city center."
    },
    2: {
        title: "Scene 3 Observations",
        text: "Using the specific filters, you could tell how different boroughs or areas of New York City have different levels of pollutions throughout the years."
    }
}

function drawScene1() {
    d3.csv("data/Air_Quality.csv").then(data=> {
        data = data.filter(d=>d.Name === "Nitrogen dioxide (NO2)");

        data.forEach(d=> {
            d.date = new Date(d.Start_Date);
            d.year = d.date.getFullYear();
            d.value = +d["Data Value"];
        });   

    let yearly = {}
    data.forEach(d=> {
        if (!yearly[d.year]) {
            yearly[d.year] = {sum:0, count:0};
        }
        yearly[d.year].sum += d.value;
        yearly[d.year].count += 1;
    });

    const yearlyAverage = Object.entries(yearly).map(([year,obj])=>({
        year:+year,
        value: obj.sum / obj.count
    })).sort((a,b)=>a.year-b.year);

    const width = 800;
    const height = 500;
    const margin = {top:50, right:50, bottom:50, left:60}

    const svg = d3.select("#viz").append("svg").attr("width", width).attr("height", height);

    const x = d3.scaleLinear().domain(d3.extent(yearlyAverage, d=>d.year)).range([margin.left, width-margin.right]);
    const y = d3.scaleLinear().domain([0,d3.max(yearlyAverage, d=>d.value)]).nice().range([height-margin.bottom, margin.top]);

    svg.append("g").attr("transform", `translate(${margin.left}, 0)`).call(d3.axisLeft(y))
    svg.append("g").attr("transform", `translate(0, ${height - margin.bottom})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
    const line = d3.line().x(d=>x(d.year)).y(d=>y(d.value));

    svg.append("path").datum(yearlyAverage).attr("fill", "none").attr("stroke", "blue").attr("stroke-width", 2).attr("d", line);

    svg.append("text").attr("x", width/2).attr("y", margin.top/2).attr("text-anchor", "middle").style("font-size", "16px").text("Overall NYC NO2 (ppb) vs Time (Years) Trend");
    svg.append("text").attr("text-anchor", "middle").attr("x", width / 2).attr("y", height-margin.bottom/4).text("Time (Years)")
    svg.append("text").attr("text-anchor", "middle").attr("transform", `rotate(-90)`).attr("x", -height/2).attr("y", margin.left/3).text("NO2 (ppb)")
    

    const annotations = [ {
        note: {
            label: "After 2008, there's a sharp decline.",
            title: "Pollution Decline Starts",
            wrap: 200
        }, 
        x: x(2008),
        y: y(28),
        dx: 40,
        dy: -10
    }, {
            note: {
                label: "As you can see, the level here is way lower than it was in 2008. ",
                title: "Pollution Decline",
                wrap: 200
            }, 
            x: x(2023),
            y: y(15),
            dx: -50,
            dy: -75
    }
];

    const applyannotation = d3.annotation().annotations(annotations);

    svg.append("g").attr("class", "annotation-group").call(applyannotation);

    });

}

function drawScene2() {
    d3.csv("data/Air_Quality.csv").then(data => {
        data = data.filter(d=>d.Name === "Nitrogen dioxide (NO2)");

        data.forEach(d=>{
            d.date = new Date(d.Start_Date);
            d.year = d.date.getFullYear();
            d.value = +d["Data Value"];
        });

        const selectedDistricts = [
            "Upper West Side (CD7)", "Flushing and Whitestone (CD7)", "Flatbush and Midwood (CD14)", "Riverdale and Fieldston (CD8)", "St. George and Stapleton (CD1)"
            // Manhattan, Brooklyn, Queens, Bronx, Staten Island
        ];

        data = data.filter(d=>selectedDistricts.includes(d["Geo Place Name"]));

        const grouped = {};

        data.forEach(d=> {
            const key = d["Geo Place Name"];
            const year = d.year;

            if (!grouped[key]){
                grouped[key] = {};
            } 
            if (!grouped[key][year]) {
                grouped[key][year] = {sum:0, count:0};
            }

            grouped[key][year].sum += d.value;
            grouped[key][year].count += 1;
        });

        const a = Object.entries(grouped).map(([district, yearMap])=> {
            const b = Object.entries(yearMap).map(([year, stats])=> ({
                year: +year,
                value: stats.sum / stats.count
            })).sort((c,d) => c.year - d.year);
            return {district, b};
        });

        const width = 1000;
        const height = 500;
        const margin = {
            top:50, 
            right: 300, 
            bottom: 50,
            left: 60
        };

        const svg = d3.select("#viz").append("svg").attr("width", width).attr("height", height);

        const allYears = data.map(d=>d.year);
        const x = d3.scaleLinear().domain([d3.min(allYears), d3.max(allYears)]).range([margin.left, width-margin.right]);
        const allValues = a.flatMap(d=>d.b.map(v=>v.value));
        const y = d3.scaleLinear().domain([0,d3.max(allValues)]).nice().range([height-margin.bottom, margin.top]);

        const color = d3.scaleOrdinal().domain(selectedDistricts).range(["blue","green","orange","red","black"])

        svg.append("g").attr("transform", `translate(0, ${height-margin.bottom})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
        svg.append("g").attr("transform", `translate(${margin.left}, 0)`).call(d3.axisLeft(y));

        const line = d3.line().x(d=>x(d.year)).y(d=>y(d.value));

        svg.selectAll(".line").data(a).enter().append("path").attr("fill", "none").attr("stroke", d=>color(d.district)).attr("stroke-width", 2).attr("d", d=>line(d.b));

        const legend = svg.selectAll(".legend").data(selectedDistricts).enter().append("g").attr("transform", (d, i)=>`translate(${width - margin.right + 10}, ${margin.top + i *20})`);

        const labels = {
            "Upper West Side (CD7)":"Manhattan (Upper West Side)",
            "Flushing and Whitestone (CD7)":"Queens (Flushing and Whitestone)",
            "Flatbush and Midwood (CD14)":"Brooklyn (Flatbush and Midwood)",
            "Riverdale and Fieldston (CD8)":"Bronx (Riverdale and Fieldston)",
            "St. George and Stapleton (CD1)":"Staten Island (St. George and Stapleton)"
        };

        legend.append("rect").attr("width", 10).attr("height", 10).attr("fill", d=>color(d));
        legend.append("text").attr("x", 15).attr("y", 10).text(d=>labels[d]||d).style("font-size", "12px");
        svg.append("text").attr("x", width/2).attr("y", margin.top/2).attr("text-anchor", "middle").style("font-size", "16px").text("5 Most Popular Borough's NO2 Levels (ppb) vs Time (Years) Trend");
        svg.append("text").attr("text-anchor", "middle").attr("x", width / 2).attr("y", height-margin.bottom/4).text("Time (Years)")
        svg.append("text").attr("text-anchor", "middle").attr("transform", `rotate(-90)`).attr("x", -height/2).attr("y", margin.left/3).text("NO2 (ppb)")
        const annotations = [ {
            note: {
                label: "Manhattan has the highest pollution levels of all the popular boroughs.",
                title: "Manhattan's Pollution",
                wrap: 200
            }, 
            x: x(2016),
            y: y(24),
            dx: 40,
            dy: -30
        }];

        const applyannotation = d3.annotation().annotations(annotations);

        svg.append("g").attr("class", "annotation-group").call(applyannotation);
        });

    
}

function drawScene3() {
    d3.csv("data/Air_Quality.csv").then(data=> {
        data = data.filter(d=>d.Name === "Nitrogen dioxide (NO2)");

        data.forEach(d=> {
            d.date = new Date(d.Start_Date);
            d.value = +d["Data Value"];
        });

        const boroughs = Array.from(new Set(data.map(d=>d["Geo Place Name"]))).sort();
        const years = Array.from(new Set(data.map(d=>d.date.getFullYear()))).sort((a,b)=>a-b);


        const margin = {
            top:60, 
            right: 40, 
            bottom: 100,
            left: 60
        };
        const width = 800;
        const height = 500;

        // const svg = d3.select("#viz").append("div").attr("id", "scene3-container").append("svg").attr("width", width).attr("height", height);
        const graph = d3.select("#viz").append("div").attr("id", "scene3-container");
        const dropdowns = graph.append("div").attr("id", "dropdowns").style("margin-bottom", "10px");
        const svg = graph.append("svg").attr("width", width).attr("height", height);

        dropdowns.append("label").text("Select a Borough: ");
        const dropdown = dropdowns.append("select").attr("id", "boroughSelect");
        dropdown.selectAll("option").data(boroughs).enter().append("option").attr("value", d=>d).text(d=>d);

        dropdowns.append("label").text(" Select Years: From ");
        const fromDropdown = dropdowns.append("select").attr("id", "fromYear");
        fromDropdown.selectAll("option").data(years).enter().append("option").attr("value", d=>d).text(d=>d);

        dropdowns.append("label").text(" To ");
        const toDropdown = dropdowns.append("select").attr("id", "toYear");
        toDropdown.selectAll("option").data(years).enter().append("option").attr("value", d=>d).text(d=>d);

        // d3.select("#scene3-container").append("label").text("From");
        // const fromDropdown = d3.select("#scene3-container").append("select").attr("id", "fromYear");
        // fromDropdown.selectAll("option").data(years).enter().append("option").attr("value", d=>d).text(d=>d);

        // d3.select("#scene3-container").append("label").text(" To ");
        // const toDropdown = d3.select("#scene3-container").append("select").attr("id", "toYear");
        // toDropdown.selectAll("option").data(years).enter().append("option").attr("value", d=>d).text(d=>d);

        fromDropdown.property("value", years[0]);
        toDropdown.property("value", years[years.length-1]);

        const x = d3.scaleTime().range([margin.left, width-margin.right]);
        const y = d3.scaleLinear().range([height-margin.bottom, margin.top]);

        const line = d3.line().x(d=>x(d.date)).y(d=>y(d.value));

        svg.append("text").attr("x", width/2).attr("y", margin.top/2).attr("text-anchor", "middle").style("font-size", "16px").text("NO2 Level (ppb) vs Time (Months/Years)");
        svg.append("text").attr("text-anchor", "middle").attr("x", width / 2).attr("y", height-margin.bottom/2).text("Time (Months/Years)")
        svg.append("text").attr("text-anchor", "middle").attr("transform", `rotate(-90)`).attr("x", -height/2).attr("y", margin.left/3).text("NO2 (ppb)")

        function drawChart(selectedBorough) {
            const fromYear = +fromDropdown.property("value");
            const toYear = +toDropdown.property("value");

            const filtered = data.filter(d=>d["Geo Place Name"] === selectedBorough).filter(d=>{
                const year = d.date.getFullYear();
                return year >= fromYear && year <= toYear;
            }).sort((a,b) => a.date - b.date);
            // const filtered = data.filter(d=>d["Geo Place Name"] === selectedBorough).sort((a,b)=>a.date-b.date);
            x.domain(d3.extent(filtered, d=>d.date));
            y.domain([0, d3.max(filtered, d=>d.value)]).nice();

            const path = svg.selectAll(".line").data([filtered]);
            path.enter().append("path").attr("class", "line").merge(path).attr("fill", "none").attr("stroke", "blue").attr("stroke-width", 2).attr("d", line);

            svg.selectAll(".x-axis").data([0]).join("g").attr("class","x-axis").attr("transform", `translate(0,${height-margin.bottom})`).call(d3.axisBottom(x));
            svg.selectAll(".y-axis").data([0]).join("g").attr("class","y-axis").attr("transform", `translate(${margin.left}, 0)`).call(d3.axisLeft(y));

            svg.selectAll(".annotation-group").remove();
            const annotations = [ {
                note: {
                    label: "This chart has the raw monthly measures (not yearly average). Set the years to be in an one year range to see the monthly breakdown.",
                    title: "Monthly NO2 Measures",
                    wrap: 200
                }, 
                x: x(new Date((x.domain()[0].getTime() + x.domain()[1].getTime())/2)),
                y: y(y.domain()[1]*0.82),
                dx: 150,
                dy: -30
            }];

            const applyannotation = d3.annotation().annotations(annotations);

            svg.append("g").attr("class", "annotation-group").call(applyannotation);
        }
        drawChart(boroughs[0]);

        dropdown.on("change", function() {
            drawChart(this.value);
        });
        fromDropdown.on("change", () => drawChart(dropdown.property("value")));
        toDropdown.on("change", () => drawChart(dropdown.property("value")));

        
        
    });
}
showScene(0);