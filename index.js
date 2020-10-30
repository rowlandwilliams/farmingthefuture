d3.csv('./bft_data.csv').then(function(data) {
    
    console.log(data)
    var group = ['NGO policy pressure group / campaign group', 'Farmers Network']
    // test with filtered
    var filtered = data.filter(x => group.includes(x.Grouping));

    var nodes = data.map((x, i) => ({
        'group': x.Grouping.substring(0,4),
        'name': x.Name,
        'id': i, 
        'loc': x.Location
    }))
    
    console.log(nodes)

    var matrix = []
    var temp = []
    var copy = nodes

    // if copy i location = nodes[i] loaction add 1 else 0
    for (var i=0; i<nodes.length; i++) {
        var temp = [];
        var key = nodes[i].name;
        for (var j=0; j< copy.length; j++) {
            if (nodes[i].loc == copy[j].loc) {
                temp.push(1)
            }
            else temp.push(0)
        }
    
        
        matrix.push(temp)
    }

    console.log(matrix)


    var links = []
    

    for (var i = 0; i< matrix.length; i++) {
        for (var j=0; j< matrix[i].length; j++) {
            var temp = {};
            if (matrix[i][j] == 1 && i != j) {
                temp['source'] = i;
                temp['target'] = j;
                temp['link_id'] = i > j ? (String(j) + String(i)) : (String(i) + String(j))
                temp['loc'] = nodes[i].loc
                links.push(temp); 
            }
            
        }
        
        
    }

    console.log(links);
    // remove dup ids
    var links = Object.values(links.reduce((acc,cur)=>Object.assign(acc,{[cur.link_id]:cur}),{}))

    var data = {'nodes': nodes, 'links': links}


    // define height
    var width = window.innerWidth;
    var height = window.innerHeight;
    var radius = 6;

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

    const svg = d3.select('body').append("svg")
      .attr("viewBox", [0, 0, width, height]);

  const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));

  const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
        .attr('class', d => d.name)
      .attr("r", 5)
      .attr("fill", 'black')
    //   .call(drag(simulation));

  node.append("title")
      .text(d => d.id);

  simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

        node.attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
  });

  invalidation.then(() => simulation.stop());

  return svg.node();


    

    
})