function drawRadarChart(selector, data) {
    const container = d3.select(selector);
    container.selectAll("*").remove();

    const width = container.node().clientWidth;
    const height = container.node().clientHeight;
    const margin = 30;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 100]);
    const angleSlice = Math.PI * 2 / data.length;

    // Draw Grid
    const levels = 5;
    for (let i = 0; i < levels; i++) {
        const levelFactor = radius * ((i + 1) / levels);
        svg.selectAll(".levels")
            .data([1]) // dummy data
            .enter()
            .append("circle")
            .attr("class", "radar-grid")
            .attr("r", levelFactor)
            .style("fill", "none")
            .style("stroke", "#475569")
            .style("stroke-opacity", "0.5");
    }

    // Draw Axes
    const axes = svg.selectAll(".axis")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "radar-axis");

    axes.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("stroke", "#475569")
        .style("stroke-width", "1px");

    axes.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(115) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => rScale(115) * Math.sin(angleSlice * i - Math.PI / 2))
        .text(d => d.axis);

    // Draw Blob
    const radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed)
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    svg.append("path")
        .datum(data)
        .attr("class", "radar-area")
        .attr("d", radarLine)
        .style("fill", "rgba(56, 189, 248, 0.5)")
        .style("stroke", "#38bdf8")
        .style("stroke-width", 2);
}

function drawBarChart(selector, data) {
    const container = d3.select(selector);
    container.selectAll("*").remove();

    const width = container.node().clientWidth;
    const height = container.node().clientHeight;
    const margin = { top: 25, right: 15, bottom: 40, left: 15 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Define colors for each bar
    const colors = ["#38bdf8", "#a78bfa", "#34d399"];

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .range([0, chartWidth])
        .domain(data.map(d => d.label))
        .padding(0.3);

    // Draw bars with distinct colors
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar-rect")
        .attr("x", d => x(d.label))
        .attr("width", x.bandwidth())
        .attr("y", d => {
            const pct = Math.min(d.value / d.max, 1);
            return chartHeight - (chartHeight * pct);
        })
        .attr("height", d => {
            const pct = Math.min(d.value / d.max, 1);
            return Math.max(chartHeight * pct, 2);
        })
        .attr("rx", 4)
        .style("fill", (d, i) => colors[i % colors.length]);

    // Labels at bottom
    svg.selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "chart-axis")
        .attr("x", d => x(d.label) + x.bandwidth() / 2)
        .attr("y", chartHeight + 18)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", (d, i) => colors[i % colors.length])
        .text(d => d.label);

    // Values above bars
    svg.selectAll(".value")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "chart-axis")
        .attr("x", d => x(d.label) + x.bandwidth() / 2)
        .attr("y", d => {
            const pct = Math.min(d.value / d.max, 1);
            return chartHeight - (chartHeight * pct) - 8;
        })
        .attr("text-anchor", "middle")
        .style("fill", "#fff")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .text(d => d.format(d.value));
}
