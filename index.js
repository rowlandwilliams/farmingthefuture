d3.csv('./bft_data.csv').then(function(data) {
    
    var nodes = data.map((x, i) => ({
        'group': x.Grouping,
        'name': x.Name,
        'id': i, 
        'loc': x.Location,
        'size': x.Scale
    }))
    
    
    function getLinks(category) {
        var matrix = [];
        var copy = nodes;
        
        for (var i=0; i<nodes.length; i++) {
            var temp = [];
            for (var j=0; j< copy.length; j++) {
                if (nodes[i][category] == copy[j][category]) {
                    temp.push(1)
                }
                else temp.push(0)
            }
        matrix.push(temp)
        }
    
        // get links from matrix
        var links = [];

        for (var i = 0; i< matrix.length; i++) {
            for (var j=0; j< matrix[i].length; j++) {
                var temp = {};
                if (matrix[i][j] == 1 && i != j) {
                    temp['source'] = i;
                    temp['target'] = j;
                    temp['link_id'] = i > j ? (String(j) + String(i)) : (String(i) + String(j))
                    temp['category'] = category,
                    temp['name'] = 
                    links.push(temp); 
                }      
            }
        }
    
        var links = Object.values(links.reduce((acc,cur)=>Object.assign(acc,{[cur.link_id]:cur}),{}))
        return links
    }

    //var links = getLinks('loc'), getLinks('Grouping'))
    var locationLinks = getLinks('loc');
    var groupLinks = getLinks('group')
    var sizeLinks = getLinks('size')

    var links = groupLinks.concat(locationLinks)

    console.log(links)
    console.log(locationLinks)
    console.log(groupLinks)
    
    var data = {'nodes': nodes, 'links': locationLinks}
    var sizes = [ ...new Set(nodes.map(x => x.size)) ]
    console.log(sizes)

    var sizes = {'very small': 1, 'small': 2, 'medium': 4, 'medium/large': 7, 'large': 10}

    // define height
    var width = window.innerWidth;
    var height = window.innerHeight;
    var radius = 6;

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id))
      .force("charge", d3.forceManyBody().distanceMax(100).distanceMin(50))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const svg = d3.select('body').append("svg")
      .attr("viewBox", [0, 0, width, height]);

    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(data.links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(data.nodes)
        .join("circle")
            .attr('class', d => d.name)
        .attr("r", d => sizes[d.size])
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

  invalidation.then(() => simulation.stop()); // work on this

  return svg.node();
   
})