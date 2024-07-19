const margin = {top: 40, right: 60, bottom: 60, left: 60},
      width = 800,
      height = 600;

// Append the svg object to the body of the page
const svg = d3.select("#scatterplot")
  .append("svg")
  .attr("width", width + margin.left + margin.right+100)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

  const watermark = svg.append("text")
  .attr("x", width /8 * 7)
  .attr("y", height/8)
  .attr("text-anchor", "middle")
  .attr("font-size", "48px")
  .attr("fill", "lightgrey")
  .attr("opacity", 0.5)
  .text("");

Promise.all([
  d3.csv('homevalue.csv'),
  d3.csv('medianincome.csv')
]).then(([homeValueData, incomeData]) => {
  const incomeLookup = {};
  incomeData.forEach(d => {
    incomeLookup[d.State.trim()] = d;
  });

  const mergedData = homeValueData.map(homeRow => {
    const stateName = homeRow.RegionName;
    const incomeRow = incomeLookup[stateName];
    if (incomeRow) {
      return {
        ...homeRow,
        income2000: parseInt(incomeRow['2000'].replace(",", "")),
        income2005: parseInt(incomeRow['2005'].replace(",", "")),
        income2010: parseInt(incomeRow['2010'].replace(",", "")),
        income2015: parseInt(incomeRow['2015'].replace(",", "")),
        income2016: parseInt(incomeRow['2016'].replace(",", "")),
        income2017: parseInt(incomeRow['2017'].replace(",", "")),
        income2018: parseInt(incomeRow['2018'].replace(",", "")),
        income2019: parseInt(incomeRow['2019'].replace(",", ""))
      };
    } else {
      return homeRow;
    }
  });

  mergedData.forEach(d => {
    if (["Alabama", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Indiana", "Kentucky", "Maine", "Maryland", "Massachusetts", "Michigan", "New Hampshire", "New Jersey", "New York", "North Carolina", "Ohio", "Pennsylvania", "Rhode Island", "South Carolina", "Tennessee", "Vermont", "Virginia", "West Virginia"].includes(d.RegionName)) {
      d.group = "East";
    } else if (["Arkansas", "Colorado", "Illinois", "Iowa", "Kansas", "Louisiana", "Minnesota", "Mississippi", "Missouri", "Nebraska", "New Mexico", "North Dakota", "Oklahoma", "South Dakota", "Texas", "Wisconsin", "Wyoming"].includes(d.RegionName)) {
      d.group = "Central";
    } else if (["Alaska", "Arizona", "California", "Hawaii", "Idaho", "Montana", "Nevada", "Oregon", "Utah", "Washington"].includes(d.RegionName)) {
      d.group = "West";
    }
  });

  const colorScale = d3.scaleOrdinal()
    .domain(["East", "Central", "West"])
    .range(["gold", "lightblue", "coral"]);

  const x = d3.scaleLinear()
    .domain([0, 620000])
    .range([0, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, 120000])
    .range([height, 0]);

  svg.append("g")
    .attr("transform", 'translate(100, 600)')
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", 'translate(100, 0)')
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", (width / 2) + margin.left)
    .attr("y", height + margin.top + 10)
    .text("Typical Home Value(Weighted average of the middle third of homes in a given region")
    .style("fill", "darkgreen")
    .style("font-weight", "bold");

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left / 4)
    .attr("x", -width / 2 + margin.bottom)
    .text("Median Household Income")
    .style("fill", "darkblue")
    .style("font-weight", "bold");

  function updateChart(year) {
    svg.selectAll("circle").remove();
    svg.select(".annotation-group").remove();
    svg.select(".annotation-group1").remove();

  
    let yearKey = '';
    let incomeKey = '';
    switch (year) {
      case 2000:
        yearKey = '2000-12-31';
        incomeKey = 'income2000';
        break;
      case 2005:
        yearKey = '2005-12-31';
        incomeKey = 'income2005';
        break;
      case 2010:
        yearKey = '2010-12-31';
        incomeKey = 'income2010';
        break;
      case 2015:
      case 2016:
      case 2017:
      case 2018:
      case 2019:
        yearKey = `${year}-12-31`;
        incomeKey = `income${year}`;
        break;
    }

    const formatCurrency = d3.format("$,");

    // Filter out data points with 'zero' or 'NaN' in x or y values
    const filteredData = mergedData.filter(d => {
      return d[yearKey] > 0 && !isNaN(d[yearKey]) && d[incomeKey] > 0 && !isNaN(d[incomeKey]);
    });    

    svg.selectAll("circle")
      .data(filteredData)
      .enter()
      .append("circle")
      .attr("cx", d => x(d[yearKey]))
      .attr("cy", d => y(d[incomeKey]))
      .attr("r", 5)
      .style("fill", d => colorScale(d.group))
      .attr("transform", 'translate(100, 0)')
      .on("mouseover", function(event, d) {
        const tooltipHtml = `<strong>${d.RegionName + " / " + d.group}</strong><br>
        
        Homevalue: ${formatCurrency(parseInt(d[yearKey]))}<br>
        Income: ${formatCurrency(d[incomeKey])}`;

        d3.select("#tooltip")
          .style("left", event.pageX + "px")
          .style("top", event.pageY + "px")
          .style("background-color", colorScale(d.group))
          .html(tooltipHtml)
          .style("display", "block");
      })
      .on("mouseout", function() {
        d3.select("#tooltip").style("display", "none");
      });

      watermark.text(`Year: ${year}`);

      // Find the state with the highest income
    const maxIncomeState = d3.max(mergedData, d => d[incomeKey]);
    const highestIncomeState = mergedData.find(d => d[incomeKey] === maxIncomeState);

    // Add d3-annotation for the highest income state
    const annotations = [
      {
        note: {
          label: `${highestIncomeState.RegionName} has the highest income of ${formatCurrency(highestIncomeState[incomeKey])}`,
          title: "Highest Income State",
          align: "middle",
          wrap: 200
        },
        x: x(highestIncomeState[yearKey])+100,
        y: y(highestIncomeState[incomeKey]),
        dx: -100,
        dy: -50
      }
    ];

    const makeAnnotations = d3.annotation()
      .type(d3.annotationLabel)
      .annotations(annotations);

    svg.append("g")
      .attr("class", "annotation-group")
      .call(makeAnnotations)
      .attr("font-family","Arial")
      .call(g=>g.select(".annotation-note-title")
      .attr("fill", "darkblue"))
      .call(g=>g.select(".annotation-note-label")
      .attr("fill", "mediumblue"));

    // Find the state with the highest income
    const maxHomevalueState = d3.max(mergedData, d => parseInt(d[yearKey]));
    const highestHomevalueState = mergedData.find(d => parseInt(d[yearKey]) === maxHomevalueState);

    // Add d3-annotation for the highest income state
    const higesthomevalueannotations = [
      {
        note: {
          label: `${highestHomevalueState.RegionName} has the highest homevalue of ${formatCurrency(parseInt(highestHomevalueState[yearKey]))}`,
          title: "Highest Home Value State",
          align: "middle",
          wrap:150
        },
        x: x(highestHomevalueState[yearKey])+100,
        y: y(highestHomevalueState[incomeKey]),
        dx: 50,
        dy: -50
      }
    ];

    const makeAnnotationforhomevalue = d3.annotation()
      .type(d3.annotationLabel)
      .annotations(higesthomevalueannotations);

    svg.append("g")
      .attr("class", "annotation-group1")
      .call(makeAnnotationforhomevalue)
      .attr("font-family","Arial")
      .call(g=>g.select(".annotation-note-title")
      .attr("fill", "darkgreen"))
      .call(g=>g.select(".annotation-note-label")
      .attr("fill", "seagreen"));;
  }


  d3.select("#year2000").on("click", () => {
    d3.select("#yearSelector").style("display", "none");
    updateChart(2000);
  });
  d3.select("#year2005").on("click", () => {
    d3.select("#yearSelector").style("display", "none");
    updateChart(2005);
  });
  d3.select("#year2010").on("click", () => {
    d3.select("#yearSelector").style("display", "none");
    updateChart(2010);
  });
  d3.select("#extraYears").on("click", () => {
    d3.select("#yearSelector").style("display", "inline");
    updateChart(parseInt(d3.select("#yearSelector").node().value));
  });

  d3.select("#yearSelector").on("change", function() {
    updateChart(parseInt(this.value));
  });


  updateChart(2000);  // Default view

  //legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width + margin.right - 80}, 500)`);

  const legendData = [
    { color: "gold", text: "East" },
    { color: "lightblue", text: "Central" },
    { color: "coral", text: "West" }
  ];

  legend.selectAll("rect")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 20)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", d => d.color);

  legend.selectAll("text")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", 24)
    .attr("y", (d, i) => i * 20 + 9)
    .attr("dy", "0.35em")
    .text(d => d.text);


});
